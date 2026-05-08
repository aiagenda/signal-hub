export type AgentEnv = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  APP_BASE_URL?: string;
  /** When true (env AUTO_PUBLISH_LATEST_DRAFT), pipeline publishes the draft created in the same run. */
  AUTO_PUBLISH_LATEST_DRAFT: boolean;
  /** When true (env SEND_NEWSLETTER_AFTER_PUBLISH), send Resend after a successful publish in the same run. */
  SEND_NEWSLETTER_AFTER_PUBLISH: boolean;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  /** Public site base URL for edition links in email (no trailing slash). */
  NEWSLETTER_WEB_BASE_URL?: string;
  NEWSLETTER_BATCH_PAUSE_MS: number;
  SOCIAL_POST_DRY_RUN: boolean;
  SOCIAL_LINKEDIN_WEBHOOK_URL?: string;
  SOCIAL_X_WEBHOOK_URL?: string;
  SOCIAL_FACEBOOK_WEBHOOK_URL?: string;
  SOCIAL_TELEGRAM_WEBHOOK_URL?: string;
  SOCIAL_WEBHOOK_SECRET?: string;
  PIPELINE_DISABLE_EXTERNAL_POSTS: boolean;
  ALERT_WEBHOOK_URL?: string;
  ALERT_TELEGRAM_WEBHOOK_URL?: string;
  RSS_SOURCE_FAIL_DISABLE_THRESHOLD: number;
  NEWSLETTER_SEND_LOCK_MINUTES: number;
};

function requireString(name: string): string {
  const v = process.env[name];
  if (v === undefined || v === "") {
    throw new Error(`Missing required environment variable: ${String(name)}`);
  }
  return v;
}

function truthyEnv(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

export function loadEnv(): AgentEnv {
  return {
    SUPABASE_URL: requireString("SUPABASE_URL"),
    SUPABASE_SERVICE_ROLE_KEY: requireString("SUPABASE_SERVICE_ROLE_KEY"),
    OPENAI_API_KEY: requireString("OPENAI_API_KEY"),
    OPENAI_MODEL: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    APP_BASE_URL: process.env.APP_BASE_URL?.trim() || undefined,
    AUTO_PUBLISH_LATEST_DRAFT:
      truthyEnv("AUTO_PUBLISH_LATEST_DRAFT") || truthyEnv("AUTO_PUBLISH_NEW_DRAFT"),
    SEND_NEWSLETTER_AFTER_PUBLISH: truthyEnv("SEND_NEWSLETTER_AFTER_PUBLISH"),
    RESEND_API_KEY: process.env.RESEND_API_KEY?.trim() || undefined,
    RESEND_FROM: process.env.RESEND_FROM?.trim() || undefined,
    NEWSLETTER_WEB_BASE_URL: process.env.NEWSLETTER_WEB_BASE_URL?.trim() || undefined,
    NEWSLETTER_BATCH_PAUSE_MS: Math.max(
      0,
      Number.parseInt(process.env.NEWSLETTER_BATCH_PAUSE_MS ?? "120", 10) || 120,
    ),
    SOCIAL_POST_DRY_RUN: process.env.SOCIAL_POST_DRY_RUN?.trim().toLowerCase() !== "false",
    SOCIAL_LINKEDIN_WEBHOOK_URL: process.env.SOCIAL_LINKEDIN_WEBHOOK_URL?.trim() || undefined,
    SOCIAL_X_WEBHOOK_URL: process.env.SOCIAL_X_WEBHOOK_URL?.trim() || undefined,
    SOCIAL_FACEBOOK_WEBHOOK_URL: process.env.SOCIAL_FACEBOOK_WEBHOOK_URL?.trim() || undefined,
    SOCIAL_TELEGRAM_WEBHOOK_URL: process.env.SOCIAL_TELEGRAM_WEBHOOK_URL?.trim() || undefined,
    SOCIAL_WEBHOOK_SECRET: process.env.SOCIAL_WEBHOOK_SECRET?.trim() || undefined,
    PIPELINE_DISABLE_EXTERNAL_POSTS: truthyEnv("PIPELINE_DISABLE_EXTERNAL_POSTS"),
    ALERT_WEBHOOK_URL: process.env.ALERT_WEBHOOK_URL?.trim() || undefined,
    ALERT_TELEGRAM_WEBHOOK_URL: process.env.ALERT_TELEGRAM_WEBHOOK_URL?.trim() || undefined,
    RSS_SOURCE_FAIL_DISABLE_THRESHOLD: Math.max(
      1,
      Number.parseInt(process.env.RSS_SOURCE_FAIL_DISABLE_THRESHOLD ?? "3", 10) || 3,
    ),
    NEWSLETTER_SEND_LOCK_MINUTES: Math.max(
      1,
      Number.parseInt(process.env.NEWSLETTER_SEND_LOCK_MINUTES ?? "30", 10) || 30,
    ),
  };
}
