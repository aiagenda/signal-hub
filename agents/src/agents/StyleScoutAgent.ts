import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import type { AgentEnv } from "../config/env.js";
import { fetchHtml } from "../sources/htmlFetcher.js";
import { stripHtmlToText } from "../utils/html.js";
import { sha256Hex } from "../utils/hash.js";
import { log } from "../utils/logger.js";

export type StyleSourceRow = {
  id: string;
  name: string;
  url: string;
  category: string | null;
  active: boolean;
};

const EXCERPT_MAX = 12_000;

export class StyleScoutAgent {
  private readonly supabase: SupabaseClient;

  constructor(env: AgentEnv, options?: { supabase?: SupabaseClient }) {
    this.supabase = options?.supabase ?? createServiceSupabaseClient(env);
  }

  /**
   * Fetches active style_sources; one GET per URL; stores stripped text excerpt + hash.
   */
  async run(): Promise<{ observationsInserted: number }> {
    const { data: sources, error } = await this.supabase
      .from("style_sources")
      .select("id,name,url,category,active")
      .eq("active", true);

    if (error) {
      throw new Error(`style_sources query failed: ${error.message}`);
    }

    const list = (sources ?? []) as StyleSourceRow[];
    if (list.length === 0) {
      log.warn("style_scout_no_sources", {});
      return { observationsInserted: 0 };
    }

    let observationsInserted = 0;
    const sourceErrors: string[] = [];

    for (const src of list) {
      const url = src.url.trim();
      if (!url) continue;

      try {
        const normalized = url.startsWith("http") ? url : `https://${url}`;
        const html = await fetchHtml(normalized);
        const plain = stripHtmlToText(html, EXCERPT_MAX);
        const raw_excerpt_hash = sha256Hex(plain);

        const { data: dup } = await this.supabase
          .from("style_observations")
          .select("id")
          .eq("source_id", src.id)
          .eq("raw_excerpt_hash", raw_excerpt_hash)
          .maybeSingle();

        if (dup) {
          log.debug("style_scout_skip_duplicate_hash", { sourceId: src.id, name: src.name });
          continue;
        }

        const observation_json = {
          source_name: src.name,
          url: normalized,
          excerpt_preview: plain.slice(0, 600),
          excerpt_char_count: plain.length,
          fetched_at: new Date().toISOString(),
        };

        const { error: insErr } = await this.supabase.from("style_observations").insert({
          source_id: src.id,
          raw_excerpt_hash,
          observation_json,
        });

        if (insErr) {
          throw new Error(insErr.message);
        }

        observationsInserted += 1;
        log.info("style_scout_observation_saved", { sourceId: src.id, name: src.name });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        sourceErrors.push(`${src.name}: ${msg}`);
        log.error("style_scout_source_failed", { sourceId: src.id, name: src.name, message: msg });
      }
    }

    if (observationsInserted === 0 && sourceErrors.length > 0) {
      throw new Error(
        `Minden style_sources fetch sikertelen: ${sourceErrors.slice(0, 5).join(" | ")}`
      );
    }

    return { observationsInserted };
  }
}
