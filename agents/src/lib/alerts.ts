import type { AgentEnv } from "../config/env.js";
import { log } from "../utils/logger.js";

type AlertPayload = {
  title: string;
  message: string;
  severity?: "info" | "warning" | "error";
  context?: Record<string, unknown>;
};

async function postJson(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Alert webhook ${res.status}: ${txt.slice(0, 300)}`);
  }
}

export async function sendOpsAlert(env: AgentEnv, payload: AlertPayload): Promise<void> {
  const title = payload.title;
  const severity = payload.severity ?? "error";
  const message = payload.message;
  const context = payload.context ?? {};
  const fullText = `[${severity.toUpperCase()}] ${title}\n${message}`;

  try {
    if (env.ALERT_WEBHOOK_URL) {
      await postJson(env.ALERT_WEBHOOK_URL, {
        title,
        severity,
        message,
        context,
        ts: new Date().toISOString(),
      });
    }
    if (env.ALERT_TELEGRAM_WEBHOOK_URL) {
      await postJson(env.ALERT_TELEGRAM_WEBHOOK_URL, {
        text: `${fullText}\n${JSON.stringify(context)}`,
      });
    }
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    log.error("ops_alert_failed", { title, severity, message: err });
  }
}
