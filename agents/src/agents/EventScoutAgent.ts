import type { SupabaseClient } from "@supabase/supabase-js";
import type OpenAI from "openai";
import { createServiceSupabaseClient } from "../config/supabase.js";
import { createOpenAIClient } from "../config/openai.js";
import type { AgentEnv } from "../config/env.js";
import { log } from "../utils/logger.js";

type ContentItem = {
  id: string;
  title: string;
  summary: string | null;
  canonical_url: string | null;
  category: string;
  status: string;
  created_at: string;
};

type ExtractedEventFields = {
  starts_at: string | null;
  ends_at: string | null;
  venue: string | null;
  city: string | null;
  region: string | null;
  price_info: string | null;
  ticket_url: string | null;
  organizer_name: string | null;
  category: string | null;
  tags: string[];
};

const CATEGORY_MAP: Record<string, string> = {
  budapest_events: "kultura",
  weekend: "buli",
  festivals: "fesztival",
  conferences: "konferencia",
};

const REGION_CITY_MAP: Record<string, string> = {
  budapest: "budapest",
  debrecen: "debrecen",
  miskolc: "miskolc",
  pécs: "pecs",
  pecs: "pecs",
  győr: "gyor",
  gyor: "gyor",
  kecskemét: "kecskemet",
  kecskemet: "kecskemet",
  székesfehérvár: "szekesfehervar",
  szekesfehervar: "szekesfehervar",
  veszprém: "veszprem",
  veszprem: "veszprem",
  eger: "eger",
  balaton: "balaton",
  siófok: "balaton",
  siofok: "balaton",
  balatonfüred: "balaton",
  balatonfured: "balaton",
  keszthely: "balaton",
  békéscsaba: "kecskemet",
  bekescsaba: "kecskemet",
};

async function extractEventFields(
  openai: OpenAI,
  model: string,
  item: ContentItem,
): Promise<ExtractedEventFields> {
  const prompt = `You are an event data extractor. Given the title and summary of a Hungarian event article, extract structured fields.

Title: ${item.title}
Summary: ${item.summary ?? "(none)"}
Source URL: ${item.canonical_url ?? "(none)"}

Return ONLY a valid JSON object with these fields (null if unknown):
{
  "starts_at": "ISO 8601 datetime or null",
  "ends_at": "ISO 8601 datetime or null",
  "venue": "venue name or null",
  "city": "city name in Hungarian or null",
  "region": "one of: budapest, pest-megye, balaton, debrecen, miskolc, gyor, pecs, kecskemet, szekesfehervar, veszprem, eger, egyeb, or null",
  "price_info": "price description or null (e.g. 'Ingyenes', '2500 Ft-tól')",
  "ticket_url": "ticket/registration URL or null",
  "organizer_name": "organizer name or null",
  "category": "one of: buli, koncert, fesztival, konferencia, meetup, workshop, sport, kultura, gasztronomia, gyerek, egyeb, or null",
  "tags": ["array", "of", "relevant", "tags", "in Hungarian"]
}`;

  try {
    const resp = await openai.chat.completions.create({
      model,
      temperature: 0,
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    const text = resp.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return {
      starts_at: typeof parsed.starts_at === "string" ? parsed.starts_at : null,
      ends_at: typeof parsed.ends_at === "string" ? parsed.ends_at : null,
      venue: typeof parsed.venue === "string" ? parsed.venue : null,
      city: typeof parsed.city === "string" ? parsed.city : null,
      region: typeof parsed.region === "string" ? parsed.region : guessRegionFromTitle(item.title),
      price_info: typeof parsed.price_info === "string" ? parsed.price_info : null,
      ticket_url: typeof parsed.ticket_url === "string" ? parsed.ticket_url : null,
      organizer_name: typeof parsed.organizer_name === "string" ? parsed.organizer_name : null,
      category:
        typeof parsed.category === "string"
          ? parsed.category
          : (CATEGORY_MAP[item.category] ?? "egyeb"),
      tags: Array.isArray(parsed.tags) ? (parsed.tags as string[]).map(String).slice(0, 8) : [],
    };
  } catch {
    return {
      starts_at: null,
      ends_at: null,
      venue: null,
      city: guessCity(item.title),
      region: guessRegionFromTitle(item.title),
      price_info: null,
      ticket_url: null,
      organizer_name: null,
      category: CATEGORY_MAP[item.category] ?? "egyeb",
      tags: [],
    };
  }
}

function guessCity(title: string): string | null {
  const lower = title.toLowerCase();
  for (const city of Object.keys(REGION_CITY_MAP)) {
    if (lower.includes(city)) return city;
  }
  if (lower.includes("budapest") || lower.includes("bp")) return "Budapest";
  return null;
}

function guessRegionFromTitle(title: string): string | null {
  const lower = title.toLowerCase();
  for (const [key, region] of Object.entries(REGION_CITY_MAP)) {
    if (lower.includes(key)) return region;
  }
  if (lower.includes("budapest") || lower.includes("bp")) return "budapest";
  return null;
}

export class EventScoutAgent {
  private readonly supabase: SupabaseClient;
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(env: AgentEnv, options?: { supabase?: SupabaseClient; openai?: OpenAI }) {
    this.supabase = options?.supabase ?? createServiceSupabaseClient(env);
    this.openai = options?.openai ?? createOpenAIClient(env);
    this.model = env.OPENAI_MODEL;
  }

  async run(options?: { lookbackDays?: number; limit?: number }): Promise<{ upserted: number }> {
    const lookbackDays = Math.max(3, options?.lookbackDays ?? 14);
    const limit = Math.max(20, Math.min(300, options?.limit ?? 150));
    const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

    const { data: rows, error } = await this.supabase
      .from("content_items")
      .select("id,title,summary,canonical_url,category,status,created_at")
      .in("category", ["budapest_events", "weekend"])
      .in("status", ["review", "approved"])
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`EventScoutAgent query failed: ${error.message}`);

    let upserted = 0;
    for (const r of (rows ?? []) as ContentItem[]) {
      try {
        const fields = await extractEventFields(this.openai, this.model, r);

        const { data: existing } = await this.supabase
          .from("events")
          .select("id, status")
          .eq("source_content_item_id", r.id)
          .maybeSingle();

        const preserveStatus =
          existing?.status === "published" || existing?.status === "archived";

        const row: Record<string, unknown> = {
          source_content_item_id: r.id,
          title: String(r.title),
          summary: r.summary ? String(r.summary) : null,
          source_url: r.canonical_url ? String(r.canonical_url) : null,
          starts_at: fields.starts_at,
          ends_at: fields.ends_at,
          venue: fields.venue,
          city: fields.city,
          region: fields.region,
          price_info: fields.price_info,
          ticket_url: fields.ticket_url,
          organizer_name: fields.organizer_name,
          category: fields.category,
          tags: fields.tags,
          metadata: { category: String(r.category), generated_by: "EventScoutAgent" },
        };
        if (!preserveStatus) row.status = "draft";

        const { error: upErr } = await this.supabase.from("events").upsert(row, {
          onConflict: "source_content_item_id",
          ignoreDuplicates: false,
        });
        if (upErr) throw new Error(`EventScoutAgent upsert failed: ${upErr.message}`);
        upserted += 1;
      } catch (e) {
        log.warn("event_scout_item_error", { id: r.id, error: e instanceof Error ? e.message : String(e) });
      }
    }

    log.info("event_scout_complete", { upserted, lookbackDays });
    return { upserted };
  }
}
