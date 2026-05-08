import "dotenv/config";

import { loadEnv } from "../config/env.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import { TrendTopicScoutAgent } from "../agents/TrendTopicScoutAgent.js";
import { isRssScoutCategory } from "../agents/rssScoutPrompts.js";
import type { RssScoutCategory } from "../agents/rssScoutPrompts.js";
import { log } from "../utils/logger.js";

function parseArgs(argv: string[]): {
  lookbackDays: number;
  limit: number;
  categories?: readonly RssScoutCategory[];
} {
  const dRaw = argv.find((a) => a.startsWith("--days="));
  const lRaw = argv.find((a) => a.startsWith("--limit="));
  const cRaw = argv.find((a) => a.startsWith("--categories="));
  const lookbackDays = Math.max(1, Number.parseInt(dRaw?.slice("--days=".length) ?? "4", 10) || 4);
  const limit = Math.max(20, Math.min(200, Number.parseInt(lRaw?.slice("--limit=".length) ?? "120", 10) || 120));

  let categories: RssScoutCategory[] | undefined;
  if (cRaw) {
    const csv = cRaw.slice("--categories=".length);
    categories = csv
      .split(",")
      .map((s) => s.trim())
      .filter(isRssScoutCategory);
    if (categories.length === 0) categories = undefined;
  }

  return { lookbackDays, limit, categories };
}

async function main() {
  const env = loadEnv();
  const supabase = createServiceSupabaseClient(env);
  const { lookbackDays, limit, categories } = parseArgs(process.argv);

  try {
    const agent = new TrendTopicScoutAgent(env, { supabase });
    const { inserted } = await agent.run({ lookbackDays, limit, categories });
    log.info("scout_topics_success", { inserted, lookbackDays, limit, categories: categories ?? "all" });
    process.exitCode = 0;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.error("scout_topics_fatal", { message: msg });
    process.exitCode = 1;
  }
}

main();
