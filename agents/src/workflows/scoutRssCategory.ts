import "dotenv/config";

import { loadEnv } from "../config/env.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import { log } from "../utils/logger.js";
import { isRssScoutCategory } from "../agents/rssScoutPrompts.js";
import { runRssScoutWorkflow } from "./runRssScout.js";

function parseCategoryArg(): string | null {
  const raw = process.argv.find((a) => a.startsWith("--category="));
  if (!raw) return null;
  return raw.slice("--category=".length).trim();
}

async function main() {
  const cat = parseCategoryArg();
  if (!cat) {
    // eslint-disable-next-line no-console
    console.error('Usage: npm run scout:rss -- --category=global_ai  (or tool_radar, builder_insights, budapest_events, weekend)');
    process.exitCode = 1;
    return;
  }

  if (!isRssScoutCategory(cat)) {
    // eslint-disable-next-line no-console
    console.error(`Invalid category: ${cat}. Expected one of: global_ai, tool_radar, builder_insights, budapest_events, weekend`);
    process.exitCode = 1;
    return;
  }

  const env = loadEnv();
  const supabase = createServiceSupabaseClient(env);

  try {
    await runRssScoutWorkflow(env, supabase, cat);
    process.exitCode = 0;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    log.error("scout_rss_category_fatal", { category: cat, message });
    process.exitCode = 1;
  }
}

main();
