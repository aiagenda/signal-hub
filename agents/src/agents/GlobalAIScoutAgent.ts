import type OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createOpenAIClient } from "../config/openai.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import type { AgentEnv } from "../config/env.js";
import { fetchRssFeed } from "../sources/rssFetcher.js";
import { sha256Hex } from "../utils/hash.js";
import { log } from "../utils/logger.js";
import { normalizeCanonicalUrl } from "../utils/url.js";
import type { SourceRow } from "../types/index.js";
import { getRssScoutSystemPrompt, type RssScoutCategory } from "./rssScoutPrompts.js";

type EnrichResult = { summary: string; score: number };

export class GlobalAIScoutAgent {
  private readonly supabase: SupabaseClient;
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly appBaseUrl: string | undefined;
  private readonly maxItemsPerFeed: number;
  private readonly sourceFailDisableThreshold: number;

  constructor(
    env: AgentEnv,
    options?: { supabase?: SupabaseClient; openai?: OpenAI; maxItemsPerFeed?: number },
  ) {
    this.supabase = options?.supabase ?? createServiceSupabaseClient(env);
    this.openai = options?.openai ?? createOpenAIClient(env);
    this.model = env.OPENAI_MODEL;
    this.appBaseUrl = env.APP_BASE_URL;
    this.maxItemsPerFeed = options?.maxItemsPerFeed ?? 25;
    this.sourceFailDisableThreshold = env.RSS_SOURCE_FAIL_DISABLE_THRESHOLD;
  }

  /**
   * Fetch RSS for all active sources in `category`, enrich new items with OpenAI, upsert `content_items`.
   */
  async run(options: { category: RssScoutCategory }): Promise<{ itemsProcessed: number }> {
    const { category } = options;

    const { data: sources, error: sourcesError } = await this.supabase
      .from("sources")
      .select("id,name,base_url,feed_url,category,active,created_at")
      .eq("active", true)
      .eq("category", category)
      .not("feed_url", "is", null);

    if (sourcesError) {
      log.error("rss_scout_sources_failed", { category, message: sourcesError.message });
      throw new Error(`Failed to load sources: ${sourcesError.message}`);
    }

    const list = (sources ?? []) as SourceRow[];
    if (list.length === 0) {
      log.warn("rss_scout_no_sources", { category });
      return { itemsProcessed: 0 };
    }

    const systemPrompt = getRssScoutSystemPrompt(category);
    let itemsProcessed = 0;
    let failedFeeds = 0;

    for (const source of list) {
      const feedUrl = source.feed_url?.trim();
      if (!feedUrl) continue;

      try {
        log.info("rss_scout_feed_start", { category, sourceId: source.id, name: source.name, feedUrl });

        const items = await fetchRssFeed(feedUrl);
        const slice = items.slice(0, this.maxItemsPerFeed);

        for (const item of slice) {
          const canonicalUrl = normalizeCanonicalUrl(item.link);
          const contentHash = sha256Hex(canonicalUrl);
          const fetchedAt = new Date().toISOString();

          const { data: existing, error: selErr } = await this.supabase
            .from("content_items")
            .select("id,summary")
            .eq("source_id", source.id)
            .eq("content_hash", contentHash)
            .maybeSingle();

          if (selErr) {
            throw new Error(`Lookup content_items failed: ${selErr.message}`);
          }

          const hasSummary =
            typeof existing?.summary === "string" && existing.summary.trim().length > 0;

          if (existing && hasSummary) {
            const { error: updErr } = await this.supabase
              .from("content_items")
              .update({ fetched_at: fetchedAt })
              .eq("id", existing.id);

            if (updErr) {
              throw new Error(`Update fetched_at failed: ${updErr.message}`);
            }
            itemsProcessed += 1;
            continue;
          }

          const enriched = await this.enrichItem(
            { title: item.title, excerpt: item.excerpt },
            systemPrompt,
          );

          const row = {
            source_id: source.id,
            category,
            title: item.title,
            canonical_url: canonicalUrl,
            summary: enriched.summary,
            raw_excerpt: item.excerpt,
            status: "review" as const,
            score: enriched.score,
            external_guid: item.guid,
            content_hash: contentHash,
            fetched_at: fetchedAt,
          };

          const { error: upsertErr } = await this.supabase.from("content_items").upsert(row, {
            onConflict: "source_id,content_hash",
            ignoreDuplicates: false,
          });

          if (upsertErr) {
            throw new Error(`Upsert content_items failed: ${upsertErr.message}`);
          }

          itemsProcessed += 1;
        }

        await this.supabase.from("source_health").upsert(
          {
            source_id: source.id,
            consecutive_failures: 0,
            last_success_at: new Date().toISOString(),
            last_error: null,
          },
          { onConflict: "source_id", ignoreDuplicates: false },
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        failedFeeds += 1;

        const { data: healthRow } = await this.supabase
          .from("source_health")
          .select("consecutive_failures")
          .eq("source_id", source.id)
          .maybeSingle();
        const nextFailures = ((healthRow?.consecutive_failures as number | undefined) ?? 0) + 1;

        await this.supabase.from("source_health").upsert(
          {
            source_id: source.id,
            consecutive_failures: nextFailures,
            last_failure_at: new Date().toISOString(),
            last_error: message.slice(0, 2000),
          },
          { onConflict: "source_id", ignoreDuplicates: false },
        );

        if (nextFailures >= this.sourceFailDisableThreshold) {
          await this.supabase.from("sources").update({ active: false }).eq("id", source.id);
        }

        log.error("rss_scout_feed_failed_soft", {
          category,
          sourceId: source.id,
          sourceName: source.name,
          feedUrl,
          message,
          consecutiveFailures: nextFailures,
          autoDisabled: nextFailures >= this.sourceFailDisableThreshold,
        });
        continue;
      }
    }

    log.info("rss_scout_complete", {
      category,
      itemsProcessed,
      failedFeeds,
      baseUrl: this.appBaseUrl,
    });

    return { itemsProcessed };
  }

  private async enrichItem(
    input: { title: string; excerpt: string | null },
    systemPrompt: string,
  ): Promise<EnrichResult> {
    const user = [
      `Title: ${input.title}`,
      input.excerpt ? `Excerpt: ${input.excerpt}` : "Excerpt: (none)",
    ].join("\n");

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: user },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      throw new Error("OpenAI returned empty content");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`OpenAI JSON parse failed: ${raw.slice(0, 200)}`);
    }

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("summary" in parsed) ||
      !("score" in parsed)
    ) {
      throw new Error("OpenAI JSON missing summary or score");
    }

    const summary = String((parsed as { summary: unknown }).summary).trim();
    const scoreNum = Number((parsed as { score: unknown }).score);
    if (!summary) {
      throw new Error("OpenAI returned empty summary");
    }
    if (!Number.isFinite(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      throw new Error(`OpenAI returned invalid score: ${String(scoreNum)}`);
    }

    return { summary, score: Math.round(scoreNum) };
  }
}
