import "dotenv/config";

import { loadEnv } from "../config/env.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import { log } from "../utils/logger.js";
import {
  parseScoutParallelArgs,
  runScoutAllParallel,
  runScoutAllSequential,
} from "./scoutAllCore.js";
import { runDraftEditionWorkflow } from "./draftWeeklyEdition.js";
import { publishEditionById } from "../lib/publishEdition.js";
import { sendNewsletterForEdition } from "./sendNewsletter.js";

const skipScout = process.argv.includes("--skip-scout");
const dryRunDraft = process.argv.includes("--dry-run-draft");
const scoutParallel = process.argv.includes("--scout-parallel");
const { concurrency: scoutConcurrency } = parseScoutParallelArgs(process.argv);
const autoPublish =
  process.argv.includes("--auto-publish") || process.argv.includes("--publish-latest-draft");
const sendNewsletter = process.argv.includes("--send-newsletter");

async function main() {
  const env = loadEnv();
  const supabase = createServiceSupabaseClient(env);

  const shouldPublish = autoPublish || env.AUTO_PUBLISH_LATEST_DRAFT;
  const shouldSend = sendNewsletter || env.SEND_NEWSLETTER_AFTER_PUBLISH;

  try {
    if (!skipScout) {
      if (scoutParallel) {
        await runScoutAllParallel(env, scoutConcurrency);
      } else {
        await runScoutAllSequential(env);
      }
    } else {
      log.info("weekly_pipeline_skip_scout", {});
    }

    const draftResult = await runDraftEditionWorkflow(env, supabase, { dryRun: dryRunDraft });

    if (dryRunDraft) {
      log.info("weekly_pipeline_dry_run_done", { draftItems: draftResult.draftItems });
      process.exitCode = 0;
      return;
    }

    let publishedEditionId: string | undefined;

    if (shouldPublish && draftResult.editionId) {
      await publishEditionById(supabase, draftResult.editionId);
      publishedEditionId = draftResult.editionId;
    } else if (shouldPublish && !draftResult.editionId) {
      log.warn("weekly_pipeline_auto_publish_skipped", { reason: "no edition id from draft" });
    }

    if (shouldSend) {
      if (!publishedEditionId) {
        log.warn("weekly_pipeline_newsletter_skipped", {
          reason:
            "newsletter runs only after publish in the same pipeline run; enable --publish-latest-draft / AUTO_PUBLISH_LATEST_DRAFT or run npm run send:newsletter",
        });
      } else {
        await sendNewsletterForEdition(env, supabase, publishedEditionId);
      }
    }

    log.info("weekly_pipeline_success", {
      editionId: draftResult.editionId,
      published: Boolean(publishedEditionId),
      newsletter: shouldSend && Boolean(publishedEditionId),
    });
    process.exitCode = 0;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.error("weekly_pipeline_fatal", { message: msg });
    process.exitCode = 1;
  }
}

main();
