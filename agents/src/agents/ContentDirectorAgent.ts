import type OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createOpenAIClient } from "../config/openai.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import type { AgentEnv } from "../config/env.js";
import { log } from "../utils/logger.js";
import type { SourceCategory } from "../types/index.js";

const DAYS_WINDOW = 7;
const MAX_PER_BUCKET = 5;

/** Display order and persisted `edition_sections.section_key` values. */
export const SECTION_ORDER = [
  "global_ai",
  "tool_radar",
  "builder",
  "budapest",
  "weekend",
] as const;

export type SectionKey = (typeof SECTION_ORDER)[number];

/** Maps DB content_items.category → edition section_key */
export const CATEGORY_TO_SECTION: Partial<
  Record<SourceCategory, SectionKey | null>
> = {
  global_ai: "global_ai",
  tool_radar: "tool_radar",
  builder_insights: "builder",
  budapest_events: "budapest",
  weekend: "weekend",
  other: null,
};

export type CandidateItem = {
  id: string;
  title: string;
  canonical_url: string;
  summary: string | null;
  score: number | null;
  category: SourceCategory;
  source_label: string;
};

export type DraftPlan = {
  edition_title: string;
  edition_intro: string;
  edition_description: string | null;
  tags: string[];
  sections: Array<{
    section_key: SectionKey;
    title: string;
    body: string;
    items: Array<{
      content_item_id: string;
      title: string;
      summary: string;
      source_label: string | null;
    }>;
  }>;
};

export type StyleRuleMeta = {
  id: string | null;
  version: number | null;
};

const SYSTEM_PROMPT = `Te a "Budapest Signal" főszerkesztő-asszisztensed — prémium, éles, inteligens hang: budapesti és közép-európai builder/founder/operator közönségnek készülő heti tech/MI/üzleti briefing.

TILOS: sablonos ChatGPT-stílus, üres közhelyek ("ez egy izgalmas fejlesztés"), túlzó marketingnyelv, angol szó szerinti fordítás furcsán.

KÖTELEZŐ:
- Magyar nyelv. Rövid, követhető mondatok. Konkrét hatás: mit jelent ez annak, aki terméket épít vagy üzletet futtat?
- Címek és intro: olyan hang, mint egy okos városi/tech lap vezércikke — szűk, fókuszált, nem sablonos.
- Szekció-címek: szerkesztőségi minőség (nem nyers fordítás).
- Szekció "body": 2–4 mondatos keretezés: miért számít ez a blokk most, mi a közös szál.
- Minden tételhez: egy rövid "summary" (1–2 mondat), újságírós stílus, nem bullet spam.

A válasz KIZÁRÓLAG JSON legyen a felhasználó által megadott sémának megfelelően.`;

function buildStyleAppendix(params: {
  version: number;
  prompt_snippet: string;
  rules_json: Record<string, unknown>;
}): string {
  const compact = JSON.stringify(params.rules_json).slice(0, 3500);
  return `

--- Aktív stílus-szabály (verzió ${params.version}) ---
${params.prompt_snippet}

rules_json (tömör):
${compact}`;
}

function scoreValue(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

function sinceIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export class ContentDirectorAgent {
  private readonly supabase: SupabaseClient;
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(env: AgentEnv, options?: { supabase?: SupabaseClient; openai?: OpenAI }) {
    this.supabase = options?.supabase ?? createServiceSupabaseClient(env);
    this.openai = options?.openai ?? createOpenAIClient(env);
    this.model = env.OPENAI_MODEL;
  }

  private async loadActiveStyleRule(): Promise<{
    id: string;
    version: number;
    prompt_snippet: string;
    rules_json: Record<string, unknown>;
  } | null> {
    const { data, error } = await this.supabase
      .from("style_rules")
      .select("id,version,prompt_snippet,rules_json")
      .eq("active", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      log.warn("content_director_style_rules_query", { message: error.message });
      return null;
    }
    if (!data) {
      return null;
    }

    const rules = data.rules_json;
    const rules_json =
      typeof rules === "object" && rules !== null && !Array.isArray(rules)
        ? (rules as Record<string, unknown>)
        : {};

    return {
      id: data.id as string,
      version: data.version as number,
      prompt_snippet: String(data.prompt_snippet ?? ""),
      rules_json,
    };
  }

  /**
   * Loads candidates (last N days), picks top per bucket, asks OpenAI for a full draft plan.
   */
  async buildDraft(): Promise<{
    plan: DraftPlan;
    stats: { considered: number; buckets: Record<string, number> };
    styleRuleMeta: StyleRuleMeta;
  }> {
    const since = sinceIso(DAYS_WINDOW);

    const { data: rows, error } = await this.supabase
      .from("content_items")
      .select("id,source_id,title,canonical_url,summary,score,category,status,created_at")
      .gte("created_at", since)
      .in("status", ["approved", "review"])
      .order("score", { ascending: false, nullsFirst: false });

    if (error) {
      throw new Error(`content_items query failed: ${error.message}`);
    }

    const sourceIds = [
      ...new Set((rows ?? []).map((r) => r.source_id as string).filter(Boolean)),
    ];
    const sourceNameById = new Map<string, string>();
    if (sourceIds.length > 0) {
      const { data: srcRows, error: srcErr } = await this.supabase
        .from("sources")
        .select("id,name")
        .in("id", sourceIds);
      if (srcErr) {
        throw new Error(`sources query failed: ${srcErr.message}`);
      }
      for (const s of srcRows ?? []) {
        sourceNameById.set(s.id as string, String(s.name));
      }
    }

    const candidates: CandidateItem[] = [];
    for (const row of rows ?? []) {
      const cat = row.category as SourceCategory;
      const sectionKey = CATEGORY_TO_SECTION[cat];
      if (!sectionKey) continue;

      const sid = row.source_id as string;
      const sourceLabel =
        (sid && sourceNameById.get(sid)?.trim()) || "Forrás";

      candidates.push({
        id: row.id as string,
        title: String(row.title),
        canonical_url: String(row.canonical_url),
        summary: row.summary ? String(row.summary) : null,
        score: scoreValue(row.score as string | number | null),
        category: cat,
        source_label: sourceLabel,
      });
    }

    const buckets: Record<SectionKey, CandidateItem[]> = {
      global_ai: [],
      tool_radar: [],
      builder: [],
      budapest: [],
      weekend: [],
    };

    for (const c of candidates) {
      const key = CATEGORY_TO_SECTION[c.category];
      if (!key) continue;
      buckets[key].push(c);
    }

    for (const key of SECTION_ORDER) {
      buckets[key].sort((a, b) => {
        const sa = a.score ?? -1;
        const sb = b.score ?? -1;
        if (sb !== sa) return sb - sa;
        return a.title.localeCompare(b.title);
      });
      buckets[key] = buckets[key].slice(0, MAX_PER_BUCKET);
    }

    let considered = 0;
    const bucketCounts: Record<string, number> = {};
    const payload: Record<
      string,
      Array<{
        content_item_id: string;
        title: string;
        summary: string | null;
        url: string;
        score: number | null;
        source_label: string;
      }>
    > = {};

    for (const key of SECTION_ORDER) {
      const list = buckets[key];
      bucketCounts[key] = list.length;
      considered += list.length;
      payload[key] = list.map((i) => ({
        content_item_id: i.id,
        title: i.title,
        summary: i.summary,
        url: i.canonical_url,
        score: i.score,
        source_label: i.source_label,
      }));
    }

    if (considered === 0) {
      throw new Error(
        `Nincs felhasználható tartalom az elmúlt ${DAYS_WINDOW} napból (approved/review). Futtass scout workflow-kat vagy állíts át státuszokat.`
      );
    }

    const allowedIds = new Set(candidates.map((c) => c.id));

    const userPayload = {
      window_days: DAYS_WINDOW,
      buckets: payload,
      output_schema: {
        edition_title: "string",
        edition_intro: "string",
        edition_description: "string | null — egy soros deck a cím alá",
        tags: "string[] — 3-6 rövid címke magyarul",
        sections:
          "array ordered: global_ai, tool_radar, builder, budapest, weekend — csak nem üres bucket-ekre",
        section_shape: {
          section_key: "global_ai | tool_radar | builder | budapest | weekend",
          title: "string — szekció megjelenített címe",
          body: "string — szekció keretező szöveg",
          items:
            "array — csak a bucketben kapott content_item_id-k, title/summary újraírható szerkesztői hangra",
        },
      },
    };

    const styleRule = await this.loadActiveStyleRule();
    const systemContent =
      SYSTEM_PROMPT +
      (styleRule
        ? buildStyleAppendix({
            version: styleRule.version,
            prompt_snippet: styleRule.prompt_snippet,
            rules_json: styleRule.rules_json,
          })
        : "");

    log.info("content_director_llm_request", {
      considered,
      bucketCounts,
      style_rule_version: styleRule?.version ?? null,
    });

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      temperature: 0.65,
      max_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemContent },
        {
          role: "user",
          content: JSON.stringify(userPayload),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      throw new Error("OpenAI üres választ adott");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`JSON parse hiba: ${raw.slice(0, 400)}`);
    }

    const plan = this.validateAndNormalizePlan(parsed, allowedIds);

    return {
      plan,
      stats: { considered, buckets: bucketCounts },
      styleRuleMeta: styleRule
        ? { id: styleRule.id, version: styleRule.version }
        : { id: null, version: null },
    };
  }

  private validateAndNormalizePlan(parsed: unknown, allowedIds: Set<string>): DraftPlan {
    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("Érvénytelen válasz: nem objektum");
    }

    const o = parsed as Record<string, unknown>;
    const edition_title = String(o.edition_title ?? "").trim();
    const edition_intro = String(o.edition_intro ?? "").trim();
    const edition_descriptionRaw = o.edition_description;
    const edition_description =
      edition_descriptionRaw === null || edition_descriptionRaw === undefined
        ? null
        : String(edition_descriptionRaw).trim() || null;

    if (!edition_title || !edition_intro) {
      throw new Error("Hiányzó edition_title vagy edition_intro");
    }

    const tagsRaw = o.tags;
    const tags = Array.isArray(tagsRaw)
      ? tagsRaw.map((t) => String(t).trim()).filter(Boolean).slice(0, 12)
      : [];

    const sectionsRaw = o.sections;
    if (!Array.isArray(sectionsRaw)) {
      throw new Error("Hiányzó sections tömb");
    }

    const sections: DraftPlan["sections"] = [];
    const seenKeys = new Set<SectionKey>();

    for (const sec of sectionsRaw) {
      if (typeof sec !== "object" || sec === null) continue;
      const s = sec as Record<string, unknown>;
      const section_key = String(s.section_key ?? "").trim() as SectionKey;
      if (!SECTION_ORDER.includes(section_key)) {
        continue;
      }
      if (seenKeys.has(section_key)) {
        log.warn("content_director_duplicate_section_skipped", { section_key });
        continue;
      }
      const title = String(s.title ?? "").trim();
      const body = String(s.body ?? "").trim();
      if (!title || !body) {
        throw new Error(`Hiányzó szekció cím vagy body: ${section_key}`);
      }

      const itemsRaw = s.items;
      if (!Array.isArray(itemsRaw)) {
        throw new Error(`Hiányzó items a szekcióban: ${section_key}`);
      }

      const items: DraftPlan["sections"][0]["items"] = [];
      for (const it of itemsRaw) {
        if (typeof it !== "object" || it === null) continue;
        const row = it as Record<string, unknown>;
        const cid = String(row.content_item_id ?? "").trim();
        if (!allowedIds.has(cid)) {
          log.warn("content_director_unknown_item_id", { section_key, cid });
          continue;
        }
        const tit = String(row.title ?? "").trim();
        const summ = String(row.summary ?? "").trim();
        if (!tit || !summ) {
          throw new Error(`Üres tétel a szekcióban ${section_key}`);
        }
        const sl =
          row.source_label === null || row.source_label === undefined
            ? null
            : String(row.source_label).trim() || null;
        items.push({
          content_item_id: cid,
          title: tit,
          summary: summ,
          source_label: sl,
        });
      }

      if (items.length === 0) {
        continue;
      }

      seenKeys.add(section_key);
      sections.push({ section_key, title, body, items });
    }

    sections.sort(
      (a, b) =>
        SECTION_ORDER.indexOf(a.section_key) - SECTION_ORDER.indexOf(b.section_key)
    );

    if (sections.length === 0) {
      throw new Error("A modell nem adott vissza egyetlen érvényes szekciót sem");
    }

    return {
      edition_title,
      edition_intro,
      edition_description,
      tags,
      sections,
    };
  }
}
