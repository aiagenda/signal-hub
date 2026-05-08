import "dotenv/config";

import { createHmac } from "node:crypto";
import { loadEnv } from "../config/env.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import { log } from "../utils/logger.js";
import { withRetry } from "../lib/retry.js";
import { sendOpsAlert } from "../lib/alerts.js";

type Platform = "linkedin" | "x" | "facebook" | "telegram";

function parseArgs(argv: string[]): { limit: number; includeDrafts: boolean } {
  const lRaw = argv.find((a) => a.startsWith("--limit="));
  const limit = Math.max(1, Math.min(200, Number.parseInt(lRaw?.slice("--limit=".length) ?? "30", 10) || 30));
  return {
    limit,
    includeDrafts: argv.includes("--include-drafts"),
  };
}

function getPlatformWebhook(env: ReturnType<typeof loadEnv>, platform: Platform): string | undefined {
  return platform === "linkedin"
    ? env.SOCIAL_LINKEDIN_WEBHOOK_URL
    : platform === "x"
      ? env.SOCIAL_X_WEBHOOK_URL
      : platform === "facebook"
        ? env.SOCIAL_FACEBOOK_WEBHOOK_URL
        : env.SOCIAL_TELEGRAM_WEBHOOK_URL;
}

function shouldRetrySocialPost(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /HTTP 429|HTTP 5\d\d|network|timeout/i.test(msg);
}

function validatePostText(platform: Platform, text: string): string | null {
  const maxLen = platform === "x" ? 280 : platform === "telegram" ? 4000 : 3000;
  if (text.trim().length === 0) return "Post text is empty";
  if (text.length > maxLen) return `Post text too long for ${platform} (${text.length}/${maxLen})`;
  return null;
}

async function main() {
  const env = loadEnv();
  const supabase = createServiceSupabaseClient(env);
  const args = parseArgs(process.argv);

  try {
    if (args.includeDrafts) {
      await supabase.from("social_posts").update({ status: "queued" }).eq("status", "draft");
    }

    const { data: posts, error } = await supabase
      .from("social_posts")
      .select("id,article_id,event_id,platform,post_text,post_url,status,metadata")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(args.limit);

    if (error) throw new Error(error.message);

    let posted = 0;
    let failed = 0;

    for (const p of posts ?? []) {
      const platform = String(p.platform) as Platform;
      const webhook = getPlatformWebhook(env, platform);

      try {
        const validationErr = validatePostText(platform, String(p.post_text ?? ""));
        if (validationErr) {
          throw new Error(validationErr);
        }

        if (env.PIPELINE_DISABLE_EXTERNAL_POSTS || env.SOCIAL_POST_DRY_RUN) {
          await supabase
            .from("social_posts")
            .update({
              status: "posted",
              posted_at: new Date().toISOString(),
              error_message: null,
              metadata: {
                ...(p.metadata ?? {}),
                dry_run: env.SOCIAL_POST_DRY_RUN,
                external_posts_disabled: env.PIPELINE_DISABLE_EXTERNAL_POSTS,
              },
            })
            .eq("id", p.id);
          posted += 1;
          continue;
        }

        if (!webhook) {
          throw new Error(`Missing webhook URL for platform=${platform}`);
        }

        const idempotencyKey = `social:${String(p.id)}`;
        const payload = {
          idempotency_key: idempotencyKey,
          text: p.post_text,
          url: p.post_url,
          platform,
          article_id: p.article_id,
          event_id: p.event_id,
        };
        const payloadStr = JSON.stringify(payload);
        const signature = env.SOCIAL_WEBHOOK_SECRET
          ? createHmac("sha256", env.SOCIAL_WEBHOOK_SECRET).update(payloadStr).digest("hex")
          : undefined;

        await withRetry(
          async () => {
            const res = await fetch(webhook, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Idempotency-Key": idempotencyKey,
                ...(signature ? { "X-Signature-Sha256": signature } : {}),
              },
              body: payloadStr,
            });

            if (!res.ok) {
              const body = await res.text();
              throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
            }
          },
          {
            retries: 2,
            baseDelayMs: 400,
            maxDelayMs: 4000,
            shouldRetry: shouldRetrySocialPost,
            onRetry: async (error, attempt, waitMs) => {
              log.warn("social_queue_retry", {
                postId: p.id,
                platform,
                attempt,
                waitMs,
                message: error instanceof Error ? error.message : String(error),
              });
            },
          },
        );

        await supabase
          .from("social_posts")
          .update({
            status: "posted",
            posted_at: new Date().toISOString(),
            error_message: null,
          })
          .eq("id", p.id);
        posted += 1;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await supabase
          .from("social_posts")
          .update({
            status: "failed",
            error_message: msg.slice(0, 1000),
          })
          .eq("id", p.id);
        failed += 1;

        await sendOpsAlert(env, {
          title: "Social post failed",
          message: msg,
          severity: "warning",
          context: { post_id: p.id, platform },
        });
      }
    }

    log.info("social_queue_done", {
      posted,
      failed,
      dryRun: env.SOCIAL_POST_DRY_RUN,
      includeDrafts: args.includeDrafts,
    });
    process.exitCode = 0;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.error("social_queue_fatal", { message: msg });
    process.exitCode = 1;
  }
}

main();
