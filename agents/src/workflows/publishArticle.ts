import "dotenv/config";

import { loadEnv } from "../config/env.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import { evaluateArticleQuality } from "../lib/articleQualityGate.js";
import { log } from "../utils/logger.js";

function parseArgs(argv: string[]): { articleId: string | null; force: boolean } {
  const idArg = argv.find((a) => a.startsWith("--article-id="));
  return {
    articleId: idArg ? idArg.slice("--article-id=".length).trim() || null : null,
    force: argv.includes("--force"),
  };
}

async function pickLatestSeoReadyId() {
  const env = loadEnv();
  const supabase = createServiceSupabaseClient(env);
  const { data, error } = await supabase
    .from("articles")
    .select("id")
    .in("status", ["seo_ready", "draft"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id ? String(data.id) : null;
}

async function main() {
  const env = loadEnv();
  const supabase = createServiceSupabaseClient(env);
  const args = parseArgs(process.argv);

  try {
    const articleId = args.articleId ?? (await pickLatestSeoReadyId());
    if (!articleId) {
      log.warn("publish_article_no_article", { message: "No article found" });
      process.exitCode = 0;
      return;
    }

    const { data: article, error: qErr } = await supabase
      .from("articles")
      .select("title,excerpt,body_markdown,seo_title,seo_description,keywords,status")
      .eq("id", articleId)
      .maybeSingle();
    if (qErr || !article) throw new Error(`article query failed: ${qErr?.message ?? "no row"}`);

    const report = evaluateArticleQuality({
      title: String(article.title),
      excerpt: article.excerpt ? String(article.excerpt) : null,
      bodyMarkdown: String(article.body_markdown),
      seoTitle: article.seo_title ? String(article.seo_title) : null,
      seoDescription: article.seo_description ? String(article.seo_description) : null,
      keywords: Array.isArray(article.keywords) ? article.keywords.map((k) => String(k)) : [],
    });

    if (!report.passed && !args.force) {
      throw new Error(`quality gate failed (score=${report.score}): ${report.issues.join("; ")}`);
    }

    if (report.passed) {
      const { error: qPassErr } = await supabase
        .from("articles")
        .update({ status: "quality_passed" })
        .eq("id", articleId);
      if (qPassErr) throw new Error(`quality_passed update failed: ${qPassErr.message}`);
    }

    const { error: pubErr } = await supabase
      .from("articles")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", articleId);
    if (pubErr) throw new Error(pubErr.message);

    log.info("publish_article_success", {
      articleId,
      score: report.score,
      forced: args.force && !report.passed,
      issues: report.issues,
    });
    process.exitCode = 0;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.error("publish_article_fatal", { message: msg });
    process.exitCode = 1;
  }
}

main();
