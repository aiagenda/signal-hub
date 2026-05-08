import "dotenv/config";

import { loadEnv } from "../config/env.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import { runRssScoutWorkflow } from "./runRssScout.js";
import { runScoutCategoriesParallel } from "./scoutAllCore.js";
import { TECH_STACK_SCOUT_CATEGORIES } from "../agents/rssScoutPrompts.js";
import { TrendTopicScoutAgent } from "../agents/TrendTopicScoutAgent.js";
import { ArticleWriterAgent } from "../agents/ArticleWriterAgent.js";
import { SeoOptimizerAgent } from "../agents/SeoOptimizerAgent.js";
import { SocialDraftAgent } from "../agents/SocialDraftAgent.js";
import { log } from "../utils/logger.js";
import { evaluateArticleQuality } from "../lib/articleQualityGate.js";

function parseArgs(argv: string[]) {
  const r = argv.find((a) => a.startsWith("--concurrency="));
  const cn = Number.parseInt(r?.slice("--concurrency=".length) ?? "2", 10);
  return {
    skipRss: argv.includes("--skip-rss"),
    parallelRss: argv.includes("--parallel-rss"),
    publishArticle: argv.includes("--publish-article"),
    draftSocial: argv.includes("--draft-social"),
    concurrency: Number.isFinite(cn) && cn >= 1 ? Math.min(cn, 5) : 2,
  };
}

async function pickTopTechTopicId(supabase: ReturnType<typeof createServiceSupabaseClient>): Promise<string | null> {
  const { data, error } = await supabase
    .from("topic_ideas")
    .select("id")
    .eq("status", "new")
    .contains("metadata", { scout_kind: "tech_stack" })
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`pickTopTechTopicId failed: ${error.message}`);
  return data?.id ? String(data.id) : null;
}

async function main() {
  const env = loadEnv();
  const supabase = createServiceSupabaseClient(env);
  const args = parseArgs(process.argv);

  try {
    if (!args.skipRss) {
      if (args.parallelRss) {
        await runScoutCategoriesParallel(env, TECH_STACK_SCOUT_CATEGORIES, args.concurrency);
      } else {
        for (const category of TECH_STACK_SCOUT_CATEGORIES) {
          await runRssScoutWorkflow(env, supabase, category);
        }
      }
    }

    const topicScout = new TrendTopicScoutAgent(env, { supabase });
    await topicScout.run({
      lookbackDays: 7,
      limit: 160,
      categories: [...TECH_STACK_SCOUT_CATEGORIES],
    });

    const topicId = await pickTopTechTopicId(supabase);
    if (!topicId) {
      log.warn("tech_agency_no_topic", { message: "No tech_stack topic_ideas with status=new" });
      process.exitCode = 0;
      return;
    }

    const writer = new ArticleWriterAgent(env, { supabase });
    const { articleId } = await writer.writeFromTopic(topicId);
    const seo = new SeoOptimizerAgent(env, { supabase });
    await seo.optimizeArticle(articleId);

    if (args.publishArticle) {
      const { data: qArticle, error: qErr } = await supabase
        .from("articles")
        .select("title,excerpt,body_markdown,seo_title,seo_description,keywords")
        .eq("id", articleId)
        .maybeSingle();
      if (qErr || !qArticle) throw new Error(`quality gate query failed: ${qErr?.message ?? "no row"}`);
      const report = evaluateArticleQuality({
        title: String(qArticle.title),
        excerpt: qArticle.excerpt ? String(qArticle.excerpt) : null,
        bodyMarkdown: String(qArticle.body_markdown),
        seoTitle: qArticle.seo_title ? String(qArticle.seo_title) : null,
        seoDescription: qArticle.seo_description ? String(qArticle.seo_description) : null,
        keywords: Array.isArray(qArticle.keywords) ? qArticle.keywords.map((k) => String(k)) : [],
      });
      if (!report.passed) {
        log.warn("tech_cycle_quality_blocked_publish", { articleId, score: report.score, issues: report.issues });
      } else {
        await supabase.from("articles").update({ status: "quality_passed" }).eq("id", articleId);
        const { error: pubErr } = await supabase
          .from("articles")
          .update({ status: "published", published_at: new Date().toISOString() })
          .eq("id", articleId);
        if (pubErr) throw new Error(`publish failed: ${pubErr.message}`);
      }
    }

    if (args.draftSocial) {
      const social = new SocialDraftAgent(env, { supabase });
      await social.draftForArticle(articleId, env.APP_BASE_URL);
    }

    log.info("tech_agency_cycle_success", { topicId, articleId, publishArticle: args.publishArticle });
    process.exitCode = 0;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.error("tech_agency_cycle_fatal", { message: msg });
    process.exitCode = 1;
  }
}

main();
