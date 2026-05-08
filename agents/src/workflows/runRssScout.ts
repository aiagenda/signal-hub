import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentEnv } from "../config/env.js";
import { GlobalAIScoutAgent } from "../agents/GlobalAIScoutAgent.js";
import { log } from "../utils/logger.js";
import type { RssScoutCategory } from "../agents/rssScoutPrompts.js";

const AGENT_NAME = "RssScoutAgent";

export async function runRssScoutWorkflow(
  env: AgentEnv,
  supabase: SupabaseClient,
  category: RssScoutCategory,
): Promise<{ runId: string; itemsProcessed: number }> {
  const startedAt = new Date().toISOString();
  const workflow = `scout:rss:${category}`;

  const { data: runRow, error: insertErr } = await supabase
    .from("agent_runs")
    .insert({
      agent_name: AGENT_NAME,
      status: "running",
      started_at: startedAt,
      metadata: { workflow, category },
    })
    .select("id")
    .single();

  if (insertErr || !runRow) {
    log.error("rss_scout_agent_run_insert_failed", { category, message: insertErr?.message });
    throw new Error(`Could not create agent_runs row: ${insertErr?.message}`);
  }

  const runId = runRow.id as string;

  try {
    const agent = new GlobalAIScoutAgent(env, { supabase });
    const { itemsProcessed } = await agent.run({ category });

    const finishedAt = new Date().toISOString();
    const { error: doneErr } = await supabase
      .from("agent_runs")
      .update({
        status: "success",
        finished_at: finishedAt,
        items_processed: itemsProcessed,
        error_message: null,
      })
      .eq("id", runId);

    if (doneErr) {
      log.error("rss_scout_agent_run_success_update_failed", { runId, message: doneErr.message });
      throw new Error(doneErr.message);
    }

    log.info("rss_scout_success", { runId, category, itemsProcessed });
    return { runId, itemsProcessed };
  } catch (e) {
    const message = e instanceof Error ? (e.stack ?? e.message) : String(e);
    const finishedAt = new Date().toISOString();

    const { error: failErr } = await supabase
      .from("agent_runs")
      .update({
        status: "failed",
        finished_at: finishedAt,
        error_message: message.slice(0, 8000),
      })
      .eq("id", runId);

    if (failErr) {
      log.error("rss_scout_agent_run_failed_update_failed", { runId, message: failErr.message });
    }

    log.error("rss_scout_failed", { runId, category, message });
    throw e;
  }
}
