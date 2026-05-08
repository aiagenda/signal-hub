import "dotenv/config";

import { StyleDistillerAgent } from "../agents/StyleDistillerAgent.js";
import { loadEnv } from "../config/env.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import { log } from "../utils/logger.js";

async function main() {
  const env = loadEnv();
  const supabase = createServiceSupabaseClient(env);

  const startedAt = new Date().toISOString();
  const { data: runRow, error: insertErr } = await supabase
    .from("agent_runs")
    .insert({
      agent_name: "StyleDistillerAgent",
      status: "running",
      started_at: startedAt,
      metadata: { workflow: "style:distill" },
    })
    .select("id")
    .single();

  if (insertErr || !runRow) {
    log.error("agent_run_insert_failed", { message: insertErr?.message });
    throw new Error(`Could not create agent_runs row: ${insertErr?.message}`);
  }

  const runId = runRow.id as string;

  try {
    const agent = new StyleDistillerAgent(env, { supabase });
    const { newVersion, ruleId } = await agent.run();

    const finishedAt = new Date().toISOString();
    const { error: doneErr } = await supabase
      .from("agent_runs")
      .update({
        status: "success",
        finished_at: finishedAt,
        items_processed: 1,
        error_message: null,
        metadata: {
          workflow: "style:distill",
          new_rule_version: newVersion,
          rule_id: ruleId,
          note: "Új szabály inaktív (active=false). Aktiválás: Table Editor → style_rules.",
        },
      })
      .eq("id", runId);

    if (doneErr) {
      throw new Error(doneErr.message);
    }

    log.info("style_distill_success", { runId, newVersion, ruleId });
    process.exitCode = 0;
  } catch (e) {
    const message = e instanceof Error ? e.stack ?? e.message : String(e);
    const finishedAt = new Date().toISOString();

    await supabase
      .from("agent_runs")
      .update({
        status: "failed",
        finished_at: finishedAt,
        error_message: message.slice(0, 8000),
      })
      .eq("id", runId);

    log.error("style_distill_failed", { runId, message });
    process.exitCode = 1;
  }
}

main().catch((e) => {
  log.error("style_distill_fatal", { message: e instanceof Error ? e.message : String(e) });
  process.exitCode = 1;
});
