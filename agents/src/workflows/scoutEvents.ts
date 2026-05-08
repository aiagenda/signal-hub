import "dotenv/config";

import { loadEnv } from "../config/env.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import { EventScoutAgent } from "../agents/EventScoutAgent.js";
import { log } from "../utils/logger.js";

function parseArgs(argv: string[]): { lookbackDays: number; limit: number } {
  const dRaw = argv.find((a) => a.startsWith("--days="));
  const lRaw = argv.find((a) => a.startsWith("--limit="));
  const lookbackDays = Math.max(3, Number.parseInt(dRaw?.slice("--days=".length) ?? "14", 10) || 14);
  const limit = Math.max(20, Math.min(300, Number.parseInt(lRaw?.slice("--limit=".length) ?? "150", 10) || 150));
  return { lookbackDays, limit };
}

async function main() {
  const env = loadEnv();
  const supabase = createServiceSupabaseClient(env);
  const { lookbackDays, limit } = parseArgs(process.argv);

  try {
    const agent = new EventScoutAgent(env, { supabase });
    const { upserted } = await agent.run({ lookbackDays, limit });
    log.info("scout_events_success", { upserted, lookbackDays, limit });
    process.exitCode = 0;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.error("scout_events_fatal", { message: msg });
    process.exitCode = 1;
  }
}

main();
