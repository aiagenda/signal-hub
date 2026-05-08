import "dotenv/config";

import { loadEnv } from "../config/env.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import { runScoutAllParallel, runScoutAllSequential } from "./scoutAllCore.js";
import { TrendTopicScoutAgent } from "../agents/TrendTopicScoutAgent.js";
import { ArticleWriterAgent } from "../agents/ArticleWriterAgent.js";
import { SeoOptimizerAgent } from "../agents/SeoOptimizerAgent.js";
import { EventScoutAgent } from "../agents/EventScoutAgent.js";
import { SocialDraftAgent } from "../agents/SocialDraftAgent.js";
import { log } from "../utils/logger.js";
import { evaluateArticleQuality } from "../lib/articleQualityGate.js";
import {
  createPipelineJob,
  createPipelineStep,
  finishPipelineJob,
  finishPipelineStep,
  recordStepAttempt,
} from "../lib/pipelineRun.js";
import { withRetry } from "../lib/retry.js";
import { sendOpsAlert } from "../lib/alerts.js";

function parseArgs(argv: string[]) {
  return {
    skipRss: argv.includes("--skip-rss"),
    parallelRss: argv.includes("--parallel-rss"),
    publishArticle: argv.includes("--publish-article"),
    draftSocial: argv.includes("--draft-social"),
  };
}

async function pickTopTopicId(supabase: ReturnType<typeof createServiceSupabaseClient>): Promise<string | null> {
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
  const args = parseArgs(process.argv);

  let jobId: string | null = null;
  try {
    jobId = await createPipelineJob(supabase, "agency:cycle", {
      skip_rss: args.skipRss,
      parallel_rss: args.parallelRss,
      publish_article: args.publishArticle,
      draft_social: args.draftSocial,
    });

    if (!args.skipRss) {
      const stepStart = Date.now();
      const stepId = await createPipelineStep(supabase, jobId, "rss_scout");
      if (args.parallelRss) {
        await withRetry(
          () => runScoutAllParallel(env, 2),
          {
            retries: 1,
            onRetry: async (error, attempt, waitMs) => {
              await recordStepAttempt(
                supabase,
                stepId,
                attempt,
                false,
                stepStart,
                error instanceof Error ? error.message : String(error),
                { wait_ms: waitMs },
              );
            },
          },
        );
      } else {
        await withRetry(
          () => runScoutAllSequential(env),
          {
            retries: 1,
            onRetry: async (error, attempt, waitMs) => {
              await recordStepAttempt(
                supabase,
                stepId,
                attempt,
                false,
                stepStart,
                error instanceof Error ? error.message : String(error),
                { wait_ms: waitMs },
              );
            },
          },
        );
      }
      await recordStepAttempt(supabase, stepId, 1, true, stepStart, undefined, { mode: args.parallelRss ? "parallel" : "sequential" });
      await finishPipelineStep(supabase, stepId, "success", stepStart, undefined, {});
    }

    {
      const stepStart = Date.now();
      const stepId = await createPipelineStep(supabase, jobId, "topic_scout");
      const topicScout = new TrendTopicScoutAgent(env, { supabase });
      await withRetry(() => topicScout.run({ lookbackDays: 4, limit: 120 }), {
        retries: 1,
        onRetry: async (error, attempt, waitMs) => {
          await recordStepAttempt(
            supabase,
            stepId,
            attempt,
            false,
            stepStart,
            error instanceof Error ? error.message : String(error),
            { wait_ms: waitMs },
          );
        },
      });
      await recordStepAttempt(supabase, stepId, 1, true, stepStart);
      await finishPipelineStep(supabase, stepId, "success", stepStart);
    }

    const topicId = await pickTopTopicId(supabase);
    let articleId: string | null = null;

    if (topicId) {
      {
        const stepStart = Date.now();
        const stepId = await createPipelineStep(supabase, jobId, "article_write");
        const writer = new ArticleWriterAgent(env, { supabase });
        const write = await writer.writeFromTopic(topicId);
        articleId = write.articleId;
        await recordStepAttempt(supabase, stepId, 1, true, stepStart, undefined, { topic_id: topicId, article_id: articleId });
        await finishPipelineStep(supabase, stepId, "success", stepStart, undefined, { topic_id: topicId, article_id: articleId });
      }

      {
        const stepStart = Date.now();
        const stepId = await createPipelineStep(supabase, jobId, "seo_optimize");
        const seo = new SeoOptimizerAgent(env, { supabase });
        await seo.optimizeArticle(articleId);
        await recordStepAttempt(supabase, stepId, 1, true, stepStart, undefined, { article_id: articleId });
        await finishPipelineStep(supabase, stepId, "success", stepStart, undefined, { article_id: articleId });
      }

      if (args.publishArticle) {
        const stepStart = Date.now();
        const stepId = await createPipelineStep(supabase, jobId, "publish_article");
        const { data: qArticle, error: qErr } = await supabase
          .from("articles")
          .select("title,excerpt,body_markdown,seo_title,seo_description,keywords")
          .eq("id", articleId)
          .maybeSingle();
        if (qErr || !qArticle) {
          throw new Error(`quality gate article query failed: ${qErr?.message ?? "no row"}`);
        }
        const report = evaluateArticleQuality({
          title: String(qArticle.title),
          excerpt: qArticle.excerpt ? String(qArticle.excerpt) : null,
          bodyMarkdown: String(qArticle.body_markdown),
          seoTitle: qArticle.seo_title ? String(qArticle.seo_title) : null,
          seoDescription: qArticle.seo_description ? String(qArticle.seo_description) : null,
          keywords: Array.isArray(qArticle.keywords) ? qArticle.keywords.map((k) => String(k)) : [],
        });
        if (!report.passed) {
          log.warn("full_cycle_quality_gate_blocked_publish", {
            articleId,
            score: report.score,
            issues: report.issues,
          });
          await recordStepAttempt(
            supabase,
            stepId,
            1,
            false,
            stepStart,
            `quality gate failed (score=${report.score})`,
            { score: report.score, issues: report.issues },
          );
          await finishPipelineStep(
            supabase,
            stepId,
            "skipped",
            stepStart,
            `quality gate failed (score=${report.score}): ${report.issues.join("; ")}`,
            { score: report.score, issues: report.issues },
          );
        } else {
          const { error: qPassErr } = await supabase
            .from("articles")
            .update({ status: "quality_passed" })
            .eq("id", articleId);
          if (qPassErr) throw new Error(`quality pass status update failed: ${qPassErr.message}`);

          const { error: pubErr } = await supabase
            .from("articles")
            .update({ status: "published", published_at: new Date().toISOString() })
            .eq("id", articleId);
          if (pubErr) throw new Error(`publish article failed: ${pubErr.message}`);
          await recordStepAttempt(supabase, stepId, 1, true, stepStart, undefined, { article_id: articleId, score: report.score });
          await finishPipelineStep(supabase, stepId, "success", stepStart, undefined, { article_id: articleId, score: report.score });
        }
      }

      if (args.draftSocial) {
        const stepStart = Date.now();
        const stepId = await createPipelineStep(supabase, jobId, "social_draft");
        const social = new SocialDraftAgent(env, { supabase });
        await social.draftForArticle(articleId, env.APP_BASE_URL);
        await recordStepAttempt(supabase, stepId, 1, true, stepStart, undefined, { article_id: articleId });
        await finishPipelineStep(supabase, stepId, "success", stepStart, undefined, { article_id: articleId });
      }
    }

    {
      const stepStart = Date.now();
      const stepId = await createPipelineStep(supabase, jobId, "event_scout");
      const events = new EventScoutAgent(env, { supabase });
      await events.run({ lookbackDays: 14, limit: 150 });
      await recordStepAttempt(supabase, stepId, 1, true, stepStart);
      await finishPipelineStep(supabase, stepId, "success", stepStart);
    }

    log.info("full_agency_cycle_success", {
      articleCreated: Boolean(articleId),
      articleId,
      publishArticle: args.publishArticle,
      draftSocial: args.draftSocial,
    });
    if (jobId) {
      await finishPipelineJob(supabase, jobId, "success", undefined, {
        article_id: articleId,
      });
    }
    process.exitCode = 0;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (jobId) {
      try {
        await finishPipelineJob(supabase, jobId, "failed", msg);
      } catch {
        /* noop */
      }
    }
    await sendOpsAlert(env, {
      title: "Agency cycle failed",
      message: msg,
      severity: "error",
      context: { workflow: "agency:cycle", job_id: jobId ?? null },
    });
    log.error("full_agency_cycle_fatal", { message: msg });
    process.exitCode = 1;
  }
}

main();
