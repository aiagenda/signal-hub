import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import type { AgentEnv } from "../config/env.js";
import { log } from "../utils/logger.js";

export class EventScoutAgent {
  private readonly supabase: SupabaseClient;

  constructor(env: AgentEnv, options?: { supabase?: SupabaseClient }) {
    this.supabase = options?.supabase ?? createServiceSupabaseClient(env);
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
    for (const r of rows ?? []) {
      const { error: upErr } = await this.supabase.from("events").upsert(
        {
          source_content_item_id: r.id,
          title: String(r.title),
          summary: r.summary ? String(r.summary) : null,
          source_url: r.canonical_url ? String(r.canonical_url) : null,
          status: "draft",
          metadata: { category: String(r.category), generated_by: "EventScoutAgent" },
        },
        {
          onConflict: "source_content_item_id",
          ignoreDuplicates: false,
        },
      );
      if (upErr) throw new Error(`EventScoutAgent upsert failed: ${upErr.message}`);
      upserted += 1;
    }

    log.info("event_scout_complete", { upserted, lookbackDays });
    return { upserted };
  }
}
