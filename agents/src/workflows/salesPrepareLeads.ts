import "dotenv/config";

import { SalesLeadAgent } from "../agents/SalesLeadAgent.js";
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
      agent_name: "SalesLeadAgent",
      status: "running",
      started_at: startedAt,
      metadata: { workflow: "sales:prepare-leads" },
    })
    .select("id")
    .single();

  if (insertErr || !runRow) {
    log.error("agent_run_insert_failed", { message: insertErr?.message });
    throw new Error(`Could not create agent_runs row: ${insertErr?.message}`);
  }

  const runId = runRow.id as string;

  try {
    const agent = new SalesLeadAgent(env, { supabase });
    const { processed, errors } = await agent.run();

    const finishedAt = new Date().toISOString();
    const { error: doneErr } = await supabase
      .from("agent_runs")
      .update({
        status: "success",
        finished_at: finishedAt,
        items_processed: processed,
        error_message:
          errors.length > 0
            ? `Részleges hibák (${errors.length}): ${errors.map((e) => `${e.lead_id}:${e.message}`).join("; ").slice(0, 7500)}`
            : null,
        metadata: {
          workflow: "sales:prepare-leads",
          processed,
          error_row_count: errors.length,
          errors,
        },
      })
      .eq("id", runId);

    if (doneErr) {
      log.error("agent_run_success_update_failed", { runId, message: doneErr.message });
      throw new Error(doneErr.message);
    }

    log.info("sales_prepare_leads_success", { runId, processed, errorCount: errors.length });
    process.exitCode = 0;
  } catch (e) {
    const message = e instanceof Error ? e.stack ?? e.message : String(e);
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
      log.error("agent_run_failed_update_failed", { runId, message: failErr.message });
    }

    log.error("sales_prepare_leads_failed", { runId, message });
    process.exitCode = 1;
  }
}

main().catch((e) => {
  const msg = e instanceof Error ? e.message : String(e);
  log.error("sales_prepare_leads_fatal", { message: msg });
  process.exitCode = 1;
});
