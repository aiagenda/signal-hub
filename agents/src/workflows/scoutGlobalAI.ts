import "dotenv/config";

import { loadEnv } from "../config/env.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import { log } from "../utils/logger.js";
import { runRssScoutWorkflow } from "./runRssScout.js";

/** Backward-compatible entry: same as `scout:rss --category=global_ai`. */
async function main() {
  const env = loadEnv();
  const supabase = createServiceSupabaseClient(env);

  try {
    await runRssScoutWorkflow(env, supabase, "global_ai");
    process.exitCode = 0;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    log.error("scout_global_ai_fatal", { message });
    process.exitCode = 1;
  }
}

main();
