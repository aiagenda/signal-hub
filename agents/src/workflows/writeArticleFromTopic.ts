import "dotenv/config";

import { loadEnv } from "../config/env.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import { ArticleWriterAgent } from "../agents/ArticleWriterAgent.js";
import { SeoOptimizerAgent } from "../agents/SeoOptimizerAgent.js";
import { SocialDraftAgent } from "../agents/SocialDraftAgent.js";
import { log } from "../utils/logger.js";

function parseTopicId(argv: string[]): string | null {
  const arg = argv.find((a) => a.startsWith("--topic-id="));
  return arg ? arg.slice("--topic-id=".length).trim() || null : null;
}

async function pickTopTopicId(): Promise<string | null> {
  const env = loadEnv();
  const supabase = createServiceSupabaseClient(env);
  const { data, error } = await supabase
    .from("topic_ideas")
    .select("id")
    .eq("status", "new")
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`pickTopTopicId failed: ${error.message}`);
  return data?.id ? String(data.id) : null;
}

async function main() {
  const env = loadEnv();
  const supabase = createServiceSupabaseClient(env);
  const explicitTopicId = parseTopicId(process.argv);
  const shouldPublish = process.argv.includes("--publish");
  const shouldDraftSocial = process.argv.includes("--draft-social");

  try {
    const topicId = explicitTopicId ?? (await pickTopTopicId());
    if (!topicId) {
      log.warn("write_article_no_topic", { message: "No topic_ideas with status=new" });
      process.exitCode = 0;
      return;
    }

    const writer = new ArticleWriterAgent(env, { supabase });
    const { articleId, slug } = await writer.writeFromTopic(topicId);

    const seo = new SeoOptimizerAgent(env, { supabase });
    await seo.optimizeArticle(articleId);

    if (shouldPublish) {
      await supabase
        .from("articles")
        .update({ status: "published", published_at: new Date().toISOString() })
        .eq("id", articleId);
    }

    if (shouldDraftSocial) {
      const social = new SocialDraftAgent(env, { supabase });
      await social.draftForArticle(articleId, env.APP_BASE_URL);
    }

    log.info("write_article_success", {
      topicId,
      articleId,
      slug,
      published: shouldPublish,
      socialDrafted: shouldDraftSocial,
    });
    process.exitCode = 0;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.error("write_article_fatal", { message: msg });
    process.exitCode = 1;
  }
}

main();
