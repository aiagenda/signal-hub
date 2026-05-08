import "dotenv/config";

import type { SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import type { AgentEnv } from "../config/env.js";
import { loadEnv } from "../config/env.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import { log } from "../utils/logger.js";
import { withRetry } from "../lib/retry.js";
import { sendOpsAlert } from "../lib/alerts.js";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const editionSelect = `
  id,
  slug,
  number,
  title,
  description,
  intro,
  tags,
  edition_date,
  published_at,
  edition_sections (
    id,
    section_key,
    title,
    body,
    sort_order,
    edition_items (
      id,
      title,
      summary,
      source_label,
      url,
      sort_order
    )
  )
`;

type EditionRow = {
  id: string;
  slug: string;
  number: number;
  title: string;
  description: string | null;
  intro: string | null;
  edition_sections: Array<{
    title: string;
    body: string | null;
    sort_order: number | null;
    edition_items: Array<{
      title: string;
      summary: string | null;
      source_label: string | null;
      url: string | null;
      sort_order: number | null;
    }> | null;
  }> | null;
};

function sortNum(a: number | null | undefined, b: number | null | undefined): number {
  return (a ?? 0) - (b ?? 0);
}

function buildNewsletterHtml(
  edition: EditionRow,
  webBase: string,
): { subject: string; html: string } {
  const path = `/archive/${edition.slug}`;
  const editionUrl = `${webBase.replace(/\/+$/, "")}${path}`;
  const subject = `Budapest Signal — № ${String(edition.number).padStart(3, "0")}: ${edition.title}`;

  const sections = [...(edition.edition_sections ?? [])].sort((a, b) =>
    sortNum(a.sort_order, b.sort_order),
  );

  const blocks = sections.map((sec) => {
    const items = [...(sec.edition_items ?? [])].sort((a, b) =>
      sortNum(a.sort_order, b.sort_order),
    );
    const bodyBlock = sec.body?.trim()
      ? `<p style="margin:0 0 12px;color:#64748b;font-size:15px;line-height:1.5;">${escapeHtml(sec.body.trim()).replace(/\n/g, "<br/>")}</p>`
      : "";
    const itemBlocks = items
      .map((it) => {
        const link =
          it.url && it.url !== "#"
            ? `<a href="${escapeHtml(it.url)}" style="color:#10b981;">${escapeHtml(it.source_label || "forrás")}</a>`
            : "";
        return `<div style="margin-bottom:16px;">
  <h3 style="margin:0 0 6px;font-size:17px;color:#0f172a;">${escapeHtml(it.title)}</h3>
  <p style="margin:0;color:#334155;font-size:15px;line-height:1.55;">${escapeHtml(it.summary ?? "")}</p>
  ${link ? `<p style="margin:8px 0 0;font-size:13px;">${link}</p>` : ""}
</div>`;
      })
      .join("");
    return `<div style="margin-bottom:28px;">
  <h2 style="margin:0 0 12px;font-size:20px;color:#0f172a;border-bottom:2px solid #10b981;padding-bottom:6px;display:inline-block;">${escapeHtml(sec.title)}</h2>
  ${bodyBlock}
  ${itemBlocks}
</div>`;
  });

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px 48px;">
    <p style="font-size:12px;color:#64748b;margin:0 0 8px;">Budapest Signal</p>
    <h1 style="margin:0 0 12px;font-size:26px;line-height:1.2;color:#0f172a;">${escapeHtml(edition.title)}</h1>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.5;color:#475569;">${escapeHtml(edition.intro ?? "")}</p>
    <p style="margin:0 0 24px;"><a href="${escapeHtml(editionUrl)}" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">Teljes kiadás a weben</a></p>
    ${blocks.join("\n")}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;" />
    <p style="font-size:12px;color:#94a3b8;line-height:1.5;">
      Heti briefing — Budapest Signal.<br/>
      Leiratkozás: válaszolj „leiratkozás” tárggyal vagy írj a szerkesztőségnek (MVP; később egy kattintásos link).
    </p>
  </div>
</body>
</html>`;

  return { subject, html };
}

export async function sendNewsletterForEdition(
  env: AgentEnv,
  supabase: SupabaseClient,
  editionId: string,
): Promise<{ sent: number; skipped: number }> {
  const apiKey = env.RESEND_API_KEY;
  const from = env.RESEND_FROM;
  const webBase = env.NEWSLETTER_WEB_BASE_URL || env.APP_BASE_URL;

  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY and RESEND_FROM are required to send newsletter");
  }
  if (!webBase) {
    throw new Error("NEWSLETTER_WEB_BASE_URL or APP_BASE_URL is required for links in the email");
  }

  const lockExpiry = new Date(Date.now() + env.NEWSLETTER_SEND_LOCK_MINUTES * 60 * 1000).toISOString();
  const { data: lockRow, error: lockErr } = await supabase
    .from("newsletter_sends")
    .insert({
      edition_id: editionId,
      status: "running",
      lock_expires_at: lockExpiry,
      metadata: { workflow: "send:newsletter" },
    })
    .select("id")
    .single();
  if (lockErr || !lockRow) {
    throw new Error(`sendNewsletter: cannot acquire lock: ${lockErr?.message ?? "no row"}`);
  }
  const sendRunId = String(lockRow.id);
  try {
    const { data: edition, error: eErr } = await supabase
      .from("editions")
      .select(editionSelect)
      .eq("id", editionId)
      .eq("status", "published")
      .maybeSingle();

    if (eErr) {
      throw new Error(`sendNewsletter: edition load failed: ${eErr.message}`);
    }
    if (!edition) {
      throw new Error(`sendNewsletter: edition ${editionId} not found or not published`);
    }

    const { subject, html } = buildNewsletterHtml(edition as EditionRow, webBase);

    const { data: subs, error: sErr } = await supabase
      .from("subscribers")
      .select("email")
      .eq("status", "active");

    if (sErr) {
      throw new Error(`sendNewsletter: subscribers failed: ${sErr.message}`);
    }

    const emails = (subs ?? []).map((r) => String(r.email).trim().toLowerCase()).filter(Boolean);
    if (emails.length === 0) {
      log.warn("send_newsletter_no_subscribers", { editionId });
      await supabase
        .from("newsletter_sends")
        .update({
          status: "success",
          sent_count: 0,
          skipped_count: 0,
          finished_at: new Date().toISOString(),
          error_message: null,
          metadata: { workflow: "send:newsletter", total: 0 },
        })
        .eq("id", sendRunId);
      return { sent: 0, skipped: 0 };
    }

    const resend = new Resend(apiKey);
    let sent = 0;
    let skipped = 0;

    if (env.PIPELINE_DISABLE_EXTERNAL_POSTS) {
      await supabase
        .from("newsletter_sends")
        .update({
          status: "success",
          sent_count: 0,
          skipped_count: emails.length,
          finished_at: new Date().toISOString(),
          error_message: null,
          metadata: { workflow: "send:newsletter", total: emails.length, external_posts_disabled: true },
        })
        .eq("id", sendRunId);
      return { sent: 0, skipped: emails.length };
    }

    for (const to of emails) {
      try {
        const { error: sendErr } = await withRetry(
          () =>
            resend.emails.send({
              from,
              to: [to],
              subject,
              html,
            }),
          {
            retries: 2,
            baseDelayMs: 500,
            maxDelayMs: 5000,
            shouldRetry: (error) => {
              const msg = error instanceof Error ? error.message : String(error);
              return /rate|429|timeout|network|5\d\d/i.test(msg);
            },
            onRetry: async (error, attempt, waitMs) => {
              log.warn("newsletter_retry", {
                to,
                attempt,
                waitMs,
                message: error instanceof Error ? error.message : String(error),
              });
            },
          },
        );
        if (sendErr) {
          log.error("resend_send_failed", { to, message: JSON.stringify(sendErr) });
          skipped += 1;
        } else {
          sent += 1;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.error("resend_send_exception", { to, message: msg });
        skipped += 1;
      }
      if (env.NEWSLETTER_BATCH_PAUSE_MS > 0) {
        await new Promise((r) => setTimeout(r, env.NEWSLETTER_BATCH_PAUSE_MS));
      }
    }

    log.info("send_newsletter_complete", { editionId, sent, skipped, total: emails.length });
    await supabase
      .from("newsletter_sends")
      .update({
        status: "success",
        sent_count: sent,
        skipped_count: skipped,
        finished_at: new Date().toISOString(),
        error_message: null,
        metadata: { workflow: "send:newsletter", total: emails.length },
      })
      .eq("id", sendRunId);
    return { sent, skipped };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase
      .from("newsletter_sends")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: msg.slice(0, 2000),
      })
      .eq("id", sendRunId);
    throw e;
  }
}

function parseEditionIdArg(): string | null {
  const raw = process.argv.find((a) => a.startsWith("--edition-id="));
  if (!raw) return null;
  return raw.slice("--edition-id=".length).trim() || null;
}

async function loadLatestPublishedEditionId(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase
    .from("editions")
    .select("id")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return (data?.id as string) ?? null;
}

async function main() {
  const env = loadEnv();
  const supabase = createServiceSupabaseClient(env);
  const dryRun = process.argv.includes("--dry-run");

  try {
    let editionId = parseEditionIdArg();
    if (!editionId) {
      editionId = await loadLatestPublishedEditionId(supabase);
    }
    if (!editionId) {
      log.error("send_newsletter_no_edition", {
        message: "No published edition found. Pass --edition-id=<uuid> or publish an edition first.",
      });
      process.exitCode = 1;
      return;
    }

    if (dryRun) {
      log.info("send_newsletter_dry_run", { editionId });
      process.exitCode = 0;
      return;
    }

    await sendNewsletterForEdition(env, supabase, editionId);
    process.exitCode = 0;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await sendOpsAlert(env, {
      title: "Newsletter send failed",
      message: msg,
      severity: "error",
      context: { workflow: "send:newsletter" },
    });
    log.error("send_newsletter_fatal", { message: msg });
    process.exitCode = 1;
  }
}

main();
