import type OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createOpenAIClient } from "../config/openai.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import type { AgentEnv } from "../config/env.js";
import { slugifyTitle } from "../utils/slug.js";
import { log } from "../utils/logger.js";

type EventPick = {
  id: string;
  title: string;
  starts_at: string | null;
  location: string | null;
  summary: string | null;
  source_url: string | null;
};

export class EventsBriefWriterAgent {
  private readonly supabase: SupabaseClient;
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(env: AgentEnv, options?: { supabase?: SupabaseClient; openai?: OpenAI }) {
    this.supabase = options?.supabase ?? createServiceSupabaseClient(env);
    this.openai = options?.openai ?? createOpenAIClient(env);
    this.model = env.OPENAI_MODEL;
  }

  private async allocateSlugPreferring(kebabBase: string): Promise<string> {
    let suffix = 0;
    while (suffix < 30) {
      const slug = suffix === 0 ? kebabBase : `${kebabBase}-${suffix + 1}`;
      const { data, error } = await this.supabase.from("articles").select("id").eq("slug", slug).maybeSingle();
      if (error) throw new Error(`events brief slug lookup failed: ${error.message}`);
      if (!data) return slug;
      suffix += 1;
    }
    throw new Error("could not allocate unique city brief slug");
  }

  /**
   * Napi város / program cikk konkrét eseményekből. Ugyanez a napos slug már létezik → skip.
   */
  async run(options?: {
    /** YYYY-MM-DD; alapból UTC szerinti „mai” nap eleje. */
    focusDateIso?: string;
    maxEvents?: number;
  }): Promise<{ articleId: string; slug: string } | { skipped: true; reason: string }> {
    const maxEvents = Math.max(6, Math.min(28, options?.maxEvents ?? 18));
    const focusDateIso =
      options?.focusDateIso && /^\d{4}-\d{2}-\d{2}$/.test(options.focusDateIso)
        ? options.focusDateIso
        : new Date().toISOString().slice(0, 10);

    const baseSlug = slugifyTitle(`budapest-programok-${focusDateIso}`, 96);
    const { data: dup } = await this.supabase.from("articles").select("id").eq("slug", baseSlug).maybeSingle();
    if (dup) {
      log.warn("events_brief_skip_duplicate", { slug: baseSlug, focusDateIso });
      return { skipped: true, reason: `article_exists_slug:${baseSlug}` };
    }

    const horizonEnd = new Date(`${focusDateIso}T12:00:00.000Z`);
    horizonEnd.setUTCDate(horizonEnd.getUTCDate() + 21);
    const fromIso = `${focusDateIso}T00:00:00.000Z`;

    const { data: datedRows, error: evErr } = await this.supabase
      .from("events")
      .select("id,title,starts_at,location,summary,source_url")
      .not("starts_at", "is", null)
      .gte("starts_at", fromIso)
      .lte("starts_at", horizonEnd.toISOString())
      .order("starts_at", { ascending: true })
      .limit(maxEvents);

    if (evErr) throw new Error(`EventsBriefWriterAgent events query: ${evErr.message}`);

    let list: EventPick[] = (datedRows ?? []) as unknown as EventPick[];

    if (list.length < 5) {
      const { data: recent } = await this.supabase
        .from("events")
        .select("id,title,starts_at,location,summary,source_url")
        .order("updated_at", { ascending: false })
        .limit(maxEvents);
      const merged = [...list];
      const seen = new Set(merged.map((e) => e.id));
      for (const r of (recent ?? []) as unknown as EventPick[]) {
        if (!seen.has(r.id)) {
          merged.push(r);
          seen.add(r.id);
        }
      }
      list = merged;
    }

    if (list.length < 5) {
      log.warn("events_brief_skip_too_few_events", { count: list.length, focusDateIso });
      return { skipped: true, reason: "not_enough_events" };
    }

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      temperature: 0.52,
      max_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "Te a Budapest Signal város- és kultúrarovatának szerzője vagy.",
            `Írj 1 szerkesztett magyar nyelvű közönségcikket a mellékelt lista alapján: közeljövő programok (${focusDateIso} körül, Budapest és környék).`,
            "KÖTELEZO: Legalább 4 ## alcím markdownban; tényállításokat csak az eseménycím/leírás/dátum alapján, ne fantáziálj helyettes dátumot.",
            "Hossz: kb. 550–950 szó.",
            'JSON kulcsok: title, excerpt, seo_title, seo_description, tags (max 12), body_markdown.',
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            focus_date: focusDateIso,
            events: list.map((e) => ({
              title: e.title,
              starts_at: e.starts_at,
              location: e.location,
              summary: e.summary,
              url: e.source_url,
              id: e.id,
            })),
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) throw new Error("EventsBriefWriterAgent empty completion");

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const title = String(parsed.title ?? "").trim();
    const excerpt = String(parsed.excerpt ?? "").trim();
    const body = String(parsed.body_markdown ?? "").trim();
    const seoTitle = String(parsed.seo_title ?? "").trim() || null;
    const seoDesc = String(parsed.seo_description ?? "").trim() || null;
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags.map((x) => String(x).trim()).filter(Boolean).slice(0, 12)
      : ["Budapest", "programok"];

    if (!title || !body) throw new Error("EventsBriefWriterAgent invalid JSON output");

    const slug = await this.allocateSlugPreferring(baseSlug);

    const { data: ins, error: insErr } = await this.supabase
      .from("articles")
      .insert({
        topic_idea_id: null,
        slug,
        title,
        excerpt: excerpt || null,
        body_markdown: body,
        seo_title: seoTitle,
        seo_description: seoDesc,
        keywords: tags,
        status: "draft",
        metadata: {
          generated_by: "EventsBriefWriterAgent",
          article_focus: "city_events_daily",
          focus_date: focusDateIso,
          source_event_ids: list.map((e) => e.id),
        },
      })
      .select("id,slug")
      .single();

    if (insErr || !ins) throw new Error(`EventsBriefWriterAgent insert: ${insErr?.message ?? "no row"}`);
    log.info("events_brief_inserted", { articleId: ins.id, slug: ins.slug, focusDateIso, eventCount: list.length });

    return { articleId: String(ins.id), slug: String(ins.slug) };
  }
}
