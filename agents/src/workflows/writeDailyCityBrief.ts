import "dotenv/config";

import { loadEnv } from "../config/env.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import { EventScoutAgent } from "../agents/EventScoutAgent.js";
import { EventsBriefWriterAgent } from "../agents/EventsBriefWriterAgent.js";
import { SeoOptimizerAgent } from "../agents/SeoOptimizerAgent.js";
import { SocialDraftAgent } from "../agents/SocialDraftAgent.js";
import { log } from "../utils/logger.js";
import { evaluateArticleQuality } from "../lib/articleQualityGate.js";

function parseArgs(argv: string[]) {
  const d = argv.find((a) => a.startsWith("--date="));
  const dateIso = d ? d.slice("--date=".length).trim() : undefined;
  return {
    skipEventScout: argv.includes("--skip-event-scout"),
    publishArticle: argv.includes("--publish-article"),
    draftSocial: argv.includes("--draft-social"),
    dateIso,
  };
}

async function main() {
  const env = loadEnv();
  const supabase = createServiceSupabaseClient(env);
  const args = parseArgs(process.argv);

  try {
    if (!args.skipEventScout) {
      const scout = new EventScoutAgent(env, { supabase });
      await scout.run({ lookbackDays: 16, limit: 200 });
    }

    const writer = new EventsBriefWriterAgent(env, { supabase });
    const brief = await writer.run({
      focusDateIso: args.dateIso && /^\d{4}-\d{2}-\d{2}$/.test(args.dateIso) ? args.dateIso : undefined,
    });

    if ("skipped" in brief) {
      log.info("city_brief_skipped", { reason: brief.reason });
      process.exitCode = 0;
      return;
    }

    const seo = new SeoOptimizerAgent(env, { supabase });
    await seo.optimizeArticle(brief.articleId);

    if (args.publishArticle) {
      const { data: qArticle, error: qErr } = await supabase
        .from("articles")
        .select("title,excerpt,body_markdown,seo_title,seo_description,keywords")
        .eq("id", brief.articleId)
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
        log.warn("city_brief_blocked_publish", { articleId: brief.articleId, score: report.score, issues: report.issues });
      } else {
        await supabase.from("articles").update({ status: "quality_passed" }).eq("id", brief.articleId);
        const { error: pubErr } = await supabase
          .from("articles")
          .update({ status: "published", published_at: new Date().toISOString() })
          .eq("id", brief.articleId);
        if (pubErr) throw new Error(`publish failed: ${pubErr.message}`);
      }
    }

    if (args.draftSocial) {
      const social = new SocialDraftAgent(env, { supabase });
      await social.draftForArticle(brief.articleId, env.APP_BASE_URL);
    }

    log.info("city_brief_success", {
      slug: brief.slug,
      articleId: brief.articleId,
      published: args.publishArticle,
    });
    process.exitCode = 0;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.error("city_brief_fatal", { message: msg });
    process.exitCode = 1;
  }
}

main();
