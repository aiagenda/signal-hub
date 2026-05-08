import type OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createOpenAIClient } from "../config/openai.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import type { AgentEnv } from "../config/env.js";
import type { RssScoutCategory } from "./rssScoutPrompts.js";
import { sha256Hex } from "../utils/hash.js";
import { log } from "../utils/logger.js";

export type TopicIdea = {
  title: string;
  angle: string;
  primary_keyword: string;
  score: number;
  source_content_item_ids: string[];
};

export class TrendTopicScoutAgent {
  private readonly supabase: SupabaseClient;
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(env: AgentEnv, options?: { supabase?: SupabaseClient; openai?: OpenAI }) {
    this.supabase = options?.supabase ?? createServiceSupabaseClient(env);
    this.openai = options?.openai ?? createOpenAIClient(env);
    this.model = env.OPENAI_MODEL;
  }

  async run(options?: {
    lookbackDays?: number;
    limit?: number;
    /** Ha megadod, csak ezekbol a tartalom-bucketekbol gyujt temaotleteket (pl. tech stack). */
    categories?: readonly RssScoutCategory[];
  }): Promise<{ inserted: number }> {
    const lookbackDays = Math.max(1, options?.lookbackDays ?? 4);
    const limit = Math.max(20, Math.min(200, options?.limit ?? 120));
    const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

    let q = this.supabase
      .from("content_items")
      .select("id,title,summary,score,category,canonical_url,created_at,status")
      .in("status", ["review", "approved"])
      .gte("created_at", since)
      .order("score", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (options?.categories?.length) {
      q = q.in("category", [...options.categories]);
    }

    const { data: rows, error } = await q;

    if (error) {
      throw new Error(`TrendTopicScoutAgent content_items query failed: ${error.message}`);
    }

    const items = (rows ?? []).map((r) => ({
      id: String(r.id),
      title: String(r.title),
      summary: r.summary ? String(r.summary) : null,
      score: r.score == null ? null : Number(r.score),
      category: String(r.category),
      url: String(r.canonical_url),
    }));

    if (items.length === 0) {
      log.warn("topic_scout_no_items", { since, lookbackDays, categories: options?.categories ?? null });
      return { inserted: 0 };
    }

    const includeCategories = (
      options?.categories?.length
        ? [...options.categories]
        : ["global_ai", "tool_radar", "builder_insights", "budapest_events", "weekend"]
    ) as string[];
    const scoutKind = options?.categories?.length ? "tech_stack" : "mixed";

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      temperature: 0.45,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Te egy senior szerkesztosegi trendfigyelo vagy. Feladat: a bemeneti hirekbol 5-8 eros tartalomotletet javasolj magyar nyelven. Csak JSON-t adj vissza: {topics:[{title,angle,primary_keyword,score,source_content_item_ids}]}. score 0-100. source_content_item_ids mindig a bemeneti listabol.',
        },
        {
          role: "user",
          content: JSON.stringify({
            objective: "weekly longform + quick content ideas",
            items,
            constraints: {
              topics_min: 5,
              topics_max: 8,
              include_categories: includeCategories,
            },
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) throw new Error("TrendTopicScoutAgent got empty OpenAI content");

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`TrendTopicScoutAgent JSON parse failed: ${raw.slice(0, 300)}`);
    }

    const topicsRaw =
      typeof parsed === "object" && parsed !== null && Array.isArray((parsed as { topics?: unknown }).topics)
        ? ((parsed as { topics: unknown[] }).topics ?? [])
        : [];

    const allowedIds = new Set(items.map((i) => i.id));
    const normalized: TopicIdea[] = [];

    for (const t of topicsRaw) {
      if (typeof t !== "object" || t === null) continue;
      const o = t as Record<string, unknown>;
      const title = String(o.title ?? "").trim();
      const angle = String(o.angle ?? "").trim();
      const primary_keyword = String(o.primary_keyword ?? "").trim();
      const scoreNum = Number(o.score ?? 0);
      const sourceIds = Array.isArray(o.source_content_item_ids)
        ? o.source_content_item_ids.map((x) => String(x)).filter((id) => allowedIds.has(id))
        : [];

      if (!title || !angle || !primary_keyword || !Number.isFinite(scoreNum) || sourceIds.length === 0) {
        continue;
      }

      normalized.push({
        title,
        angle,
        primary_keyword,
        score: Math.max(0, Math.min(100, Math.round(scoreNum))),
        source_content_item_ids: [...new Set(sourceIds)],
      });
    }

    if (normalized.length === 0) {
      throw new Error("TrendTopicScoutAgent: model did not return valid topics");
    }

    let inserted = 0;
    for (const topic of normalized) {
      const titleHash = sha256Hex(`${topic.title}::${topic.primary_keyword}`);
      const { error: upsertErr } = await this.supabase.from("topic_ideas").upsert(
        {
          title: topic.title,
          angle: topic.angle,
          primary_keyword: topic.primary_keyword,
          score: topic.score,
          title_hash: titleHash,
          source_content_item_ids: topic.source_content_item_ids,
          status: "new",
          metadata: {
            generated_by: "TrendTopicScoutAgent",
            scout_kind: scoutKind,
            categories_used: includeCategories,
          },
        },
        {
          onConflict: "title_hash",
          ignoreDuplicates: false,
        },
      );
      if (upsertErr) {
        throw new Error(`TrendTopicScoutAgent upsert failed: ${upsertErr.message}`);
      }
      inserted += 1;
    }

    log.info("topic_scout_complete", { inserted, consideredItems: items.length });
    return { inserted };
  }
}
