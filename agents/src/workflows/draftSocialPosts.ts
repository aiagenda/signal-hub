import "dotenv/config";

import { loadEnv } from "../config/env.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import { SocialDraftAgent } from "../agents/SocialDraftAgent.js";
import { log } from "../utils/logger.js";

function parseArticleId(argv: string[]): string | null {
  const arg = argv.find((a) => a.startsWith("--article-id="));
  return arg ? arg.slice("--article-id=".length).trim() || null : null;
}

async function pickLatestArticleId(): Promise<string | null> {
  const env = loadEnv();
  const supabase = createServiceSupabaseClient(env);
  const { data, error } = await supabase
    .from("articles")
    .select("id")
    .in("status", ["seo_ready", "published"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`pickLatestArticleId failed: ${error.message}`);
  return data?.id ? String(data.id) : null;
}

async function main() {
  const env = loadEnv();
  const supabase = createServiceSupabaseClient(env);
  const explicitArticleId = parseArticleId(process.argv);

  try {
    const articleId = explicitArticleId ?? (await pickLatestArticleId());
    if (!articleId) {
      log.warn("social_draft_no_article", { message: "No seo_ready/published article found" });
      process.exitCode = 0;
      return;
    }
    const agent = new SocialDraftAgent(env, { supabase });
    const { inserted } = await agent.draftForArticle(articleId, env.APP_BASE_URL);
    log.info("social_draft_success", { articleId, inserted });
    process.exitCode = 0;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.error("social_draft_fatal", { message: msg });
    process.exitCode = 1;
  }
}

main();
