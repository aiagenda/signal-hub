# Budapest Signal — agent worker

Node.js + TypeScript workers that talk to Supabase with the **service role** key (server/VPS only — never expose this key in the browser).

## Prerequisites

- Node.js 20+
- Supabase migrations applied: base MVP + [`20260430100000_edition_sections_body.sql`](../supabase/migrations/20260430100000_edition_sections_body.sql) + [`20260430120000_sponsor_leads_sales_prep.sql`](../supabase/migrations/20260430120000_sponsor_leads_sales_prep.sql) + [`20260430140000_quality_learning_mvp.sql`](../supabase/migrations/20260430140000_quality_learning_mvp.sql) + [`20260507110000_full_agency_content_ops.sql`](../supabase/migrations/20260507110000_full_agency_content_ops.sql) + [`20260507133000_pipeline_reliability_ops.sql`](../supabase/migrations/20260507133000_pipeline_reliability_ops.sql) (`pipeline_jobs`, `pipeline_steps`, `step_attempts`, `source_health`, `newsletter_sends`)
- OpenAI API key

## Setup

You can run worker scripts from the **repo root** as well (`npm run style:scout` delegates to `agents/`), or `cd agents` and run the same commands — `.env` must live in **`agents/.env`**.

```bash
cd agents
cp .env.example .env
# Edit .env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, OPENAI_MODEL (optional)
npm install
```

## Commands

| Script | Description |
|--------|-------------|
| `npm run scout:global-ai` | Same as single-category scout for `global_ai` (legacy alias). |
| `npm run scout:rss` | RSS scout for one category (`--category=`, default `global_ai`). |
| `npm run scout:tool-radar` / `scout:builder` / `scout:budapest` / `scout:weekend` | Per-category scouts (see `package.json`). |
| `npm run scout:all` | Runs all RSS buckets **sequentially** (`global_ai` → … → `weekend`). |
| `npm run scout:all:parallel` | Same with `--parallel` and optional `--concurrency=2` (max 5). |
| `npm run scout:topics` | **TrendTopicScoutAgent**: builds `topic_ideas` from recent `content_items` (score + angle + keyword + source IDs). |
| `npm run write:article` | **ArticleWriterAgent + SeoOptimizerAgent**: writes a full longform article from top topic (or `--topic-id=`), then marks it `seo_ready`. |
| `npm run article:publish` | Publishes one article (`--article-id=` or latest), with quality gate check. Add `--force` to bypass gate. |
| `npm run scout:events` | **EventScoutAgent**: maps recent `budapest_events/weekend` items into `events` table for event editorial workflows. |
| `npm run social:draft` | **SocialDraftAgent**: creates platform-specific social drafts (`linkedin/x/facebook/telegram`) for latest article or `--article-id=`. |
| `npm run social:queue` | Posts queued social drafts (`status=queued`) via webhooks, or dry-run marks as posted. Use `--include-drafts` to queue all drafts first. |
| `npm run agency:cycle` | Full run: RSS scout (optional) → topic scout → article+SEO → event scout, with optional `--publish-article` and `--draft-social`. |
| `npm run agency:tech` | Csak **tech stack** RSS → `tech_stack` téma → longform + SEO; flag-ek: `--skip-rss`, `--parallel-rss`, `--publish-article`, `--draft-social`. |
| `npm run write:city-brief` | Napi **Budapest / esemény** összeállító cikk az `events` táblából + SEO; `--skip-event-scout`, `--date=YYYY-MM-DD`, `--publish-article`, `--draft-social`. |
| `npm run scout:topics:tech` | `scout:topics --categories=global_ai,tool_radar,builder_insights` (gyors teszt). |
| `npm run weekly:pipeline` | **Scout all** → **`draft:edition`**. Flags: `--skip-scout`, `--dry-run-draft`, `--scout-parallel`, `--publish-latest-draft` / `--auto-publish`, `--send-newsletter`. Env: `AUTO_PUBLISH_LATEST_DRAFT`, `SEND_NEWSLETTER_AFTER_PUBLISH` (see `.env.example`). |
| `npm run send:newsletter` | Resend: e-mail from latest **published** edition (or `--edition-id=`). Needs `RESEND_*` + `NEWSLETTER_WEB_BASE_URL` or `APP_BASE_URL`. |
| `npm run draft:edition` | **ContentDirectorAgent**: loads top `content_items` from the last **7 days** (`status` ∈ `approved`, `review`), calls OpenAI for a weekly draft (Hungarian editorial tone), writes **`editions` + `edition_sections` + `edition_items`** with **`status = draft`**. Logs **`agent_runs`**. |
| `npm run draft:edition -- --dry-run` | Same pipeline, but **does not insert** editions/sections/items; prints JSON to stdout and stores the full draft in **`agent_runs.metadata`** (`dry_run: true`). Still requires DB + OpenAI. |
| `npm run sales:prepare-leads` | **SalesLeadAgent**: loads **`sponsor_leads`** with **`status` ∈ `new` or `lead`**, **`outreach_prepared_at` is null** (még nem készült el ajánlás), optionally GETs **`website_url`**, OpenAI → **`recommendations`** + **`outreach_prepared_at`**. **Does not send email.** Logs **`agent_runs`**. |
| `npm run style:scout` | **StyleScoutAgent**: aktív **`style_sources`** → egy GET / URL, plain szöveg excerpt + hash → **`style_observations`**. Duplikátum azonos hash-nél kihagyva. |
| `npm run style:distill` | **StyleDistillerAgent**: utolsó megfigyelések (14 nap, különben fallback utolsó N sor) → OpenAI → új **`style_rules`** sor **`active = false`** (következő `version`). Aktiválás kézzel a Dashboardban. |
| `npm run typecheck` | TypeScript check only. |

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Project URL (`https://xxx.supabase.co`). |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (bypasses RLS; keep secret). |
| `OPENAI_API_KEY` | Yes | OpenAI API key. |
| `OPENAI_MODEL` | No | Default `gpt-4o-mini`. |
| `APP_BASE_URL` | No | Optional; metadata / newsletter links. |
| `AUTO_PUBLISH_LATEST_DRAFT` | No | If `true`, `weekly:pipeline` publishes the draft created in that run (no human review in the same run — use only if you accept that). |
| `SEND_NEWSLETTER_AFTER_PUBLISH` | No | If `true`, sends Resend **after** a successful publish in the **same** `weekly:pipeline` run (requires publish + Resend env). |
| `RESEND_API_KEY` | For newsletter | Resend API key (server only). |
| `RESEND_FROM` | For newsletter | From header, e.g. `Budapest Signal <newsletter@domain>`. |
| `NEWSLETTER_WEB_BASE_URL` | For newsletter | Public site URL for archive links in e-mail (no trailing slash). Falls back to `APP_BASE_URL`. |
| `NEWSLETTER_BATCH_PAUSE_MS` | No | Delay between recipients (default `120`). |
| `SOCIAL_POST_DRY_RUN` | No | Default `true`; social queue marks posts as posted without external API call. Set `false` for real posting. |
| `SOCIAL_LINKEDIN_WEBHOOK_URL` | For real posting | Webhook/API endpoint for LinkedIn posting bridge. |
| `SOCIAL_X_WEBHOOK_URL` | For real posting | Webhook/API endpoint for X posting bridge. |
| `SOCIAL_FACEBOOK_WEBHOOK_URL` | For real posting | Webhook/API endpoint for Facebook posting bridge. |
| `SOCIAL_TELEGRAM_WEBHOOK_URL` | For real posting | Webhook/API endpoint for Telegram posting bridge. |
| `SOCIAL_WEBHOOK_SECRET` | No | Optional HMAC secret (`X-Signature-Sha256`) for signed social webhooks. |
| `PIPELINE_DISABLE_EXTERNAL_POSTS` | No | Emergency brake: if `true`, social/newsletter external sends are disabled. |
| `RSS_SOURCE_FAIL_DISABLE_THRESHOLD` | No | Circuit breaker threshold for auto-deactivating RSS sources (default `3`). |
| `NEWSLETTER_SEND_LOCK_MINUTES` | No | Newsletter lock TTL in minutes to avoid duplicate sends (default `30`). |
| `ALERT_WEBHOOK_URL` | No | Generic ops alert webhook. |
| `ALERT_TELEGRAM_WEBHOOK_URL` | No | Telegram-compatible alert webhook endpoint. |

### RSS források (seed + karbantartás)

- Többkategóriás seed: [`20260501100000_more_rss_sources.sql`](../supabase/migrations/20260501100000_more_rss_sources.sql) a `tool_radar`, `builder_insights`, `budapest_events`, `weekend` bucketekhez.
- Ha egy feed 403/404 vagy bot-blokk: **Supabase → `sources`**: `active = false`, vagy cseréld a `feed_url`-t.
- Az admin UI (**Források**) csak olvasásra listáz; szerkesztéshez Table Editor / SQL.

### GitHub Actions

- **Teljes aktiválás (manuális, egyszeri „minden menjen”):** [`.github/workflows/full-agency-activation.yml`](../.github/workflows/full-agency-activation.yml) — `workflow_dispatch`: **agency:cycle** (publish + social draft) → **agency:tech** → **write:city-brief** (esemény scout kihagyva) → **weekly:pipeline** (`--skip-scout --publish-latest-draft`). Helyben ugyanez: `npm run agents:full-activation` a repo gyökeréből (`agents/.env` kell).
- **Weekly agents:** [`.github/workflows/weekly-agents.yml`](../.github/workflows/weekly-agents.yml) — hetente (hétfő 05:00 UTC): **RSS scout + heti kiadás vázlat** (`draft:edition`, szekciókkal — nem a napi longform `articles` pipeline).
- **Daily city brief:** [`.github/workflows/daily-city-brief.yml`](../.github/workflows/daily-city-brief.yml) — **minden nap**: eseményscout + **1 városi/program cikk** (`write:city-brief`). Variables: `CITY_DAILY_PUBLISH`, `CITY_DAILY_SOCIAL_DRAFT`, `CITY_DAILY_SOCIAL_LIVE`.
- **Tech agency (~3 nap):** [`.github/workflows/tech-agency-three-day.yml`](../.github/workflows/tech-agency-three-day.yml) — **havonta 1.,4.,7.,… (~3 nap)**: csak **global_ai / tool_radar / builder_insights** RSS + `tech_stack` témák + **1 longform** (`agency:tech`). Variables: `TECH_3DAY_PUBLISH`, `TECH_3DAY_SOCIAL_DRAFT`, `TECH_3DAY_SOCIAL_LIVE`.
- Secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`. Opcionális: `RESEND_API_KEY`; repository **Variables**: pl. `APP_BASE_URL`, `NEWSLETTER_WEB_BASE_URL`, `RESEND_FROM`, `OPENAI_MODEL`.
- **Ütemezett futásoknál** alapból sok pipeline csak vázlatot készít. Ha **minden ütemben** publikálást és social draftot akarsz, állítsd a repo **Variables** értékeit: `CITY_DAILY_PUBLISH=true`, `TECH_3DAY_PUBLISH=true`, `CITY_DAILY_SOCIAL_DRAFT=true`, `TECH_3DAY_SOCIAL_DRAFT=true` (és óvatosan `CITY_DAILY_SOCIAL_LIVE` / `TECH_3DAY_SOCIAL_LIVE` + `SOCIAL_*` secrets az éles queue-hoz).
- Alap futás: **scout + draft only**. `AUTO_PUBLISH_LATEST_DRAFT` / `SEND_NEWSLETTER_AFTER_PUBLISH` csak tudatosan (workflow `env` blokkban uncomment).

## Deduplication

`content_items` are deduped per source using **`content_hash` = SHA-256 of the normalized canonical URL** (see `src/utils/url.ts` + `src/utils/hash.ts`). The unique constraint is `(source_id, content_hash)`.

If an item already has a non-empty `summary`, the scout only refreshes `fetched_at` and does not call OpenAI again.

## Applying the database migration

From the repo root (with [Supabase CLI](https://supabase.com/docs/guides/cli) linked to your project):

```bash
supabase db push
```

Or paste the SQL file into **Supabase Dashboard → SQL Editor** and run it once.

After migration, you should see seed rows in `sources` (OpenAI blog + TechCrunch AI feeds).

### Weekly draft selection rules

- **Window:** `created_at` within the last **7 days**.
- **Statuses:** `approved` or `review` (excludes `draft` / `rejected`).
- **Buckets:** `global_ai`, `tool_radar`, `builder_insights`, `budapest_events`, `weekend` → newsletter sections **Globális MI / Tool Radar / Builder / Budapest / Hétvégi jel** (`section_key`: `global_ai`, `tool_radar`, `builder`, `budapest`, `weekend`).
- **Cap:** up to **5** items per bucket, ordered by **`score`** (desc).

You need at least some `content_items` across scouts (not only `global_ai`) if you want every section filled.

## What to expect when `draft:edition` runs

1. **`agent_runs`**: `ContentDirectorAgent`, `running` → `success` or `failed`.
2. **Real mode:** new **`editions`** row (`draft`), child **`edition_sections`** (with **`body`** per section), **`edition_items`** linking **`content_item_id`** and snapshot fields; URLs come from the DB, not the model.
3. **Dry-run:** stdout JSON `{ plan, stats, styleRuleMeta }`; DB **`metadata`** tartalmazza **`style_rule_id`** és **`style_rule_version`**, ha van aktív **`style_rules`** sor (`active = true`).

## What to expect when scout runs

1. A new row in `agent_runs` with `status = running`, then `success` or `failed`.
2. On success: new rows in `content_items` with `category = global_ai`, `status = review`, Hungarian `summary`, and `score` between 0 and 100.
3. On failure: `agent_runs.status = failed` and `error_message` populated (OpenAI/RSS/DB errors are not swallowed).

## Quality / style learning loop

1. **Migráció** után seed **`style_sources`** (TechCrunch, Verge, Axios — szerkeszthető).
2. **`npm run style:scout`** → **`style_observations`** töltése (nem agresszív: egy HTML GET / forrás).
3. **`npm run style:distill`** → új **`style_rules`** verzió, alapból **`active = false`**.
4. **Promotion:** Table Editor → **`style_rules`**: először minden más sor **`active = false`**, majd egy sor **`active = true`** (az egyedi részindex miatt egyszerre csak egy aktív lehet — különben mentés hibázik).
5. **`npm run draft:edition`** / **`draft:edition --dry-run`**: a **`ContentDirectorAgent`** behúzza az aktív szabályt a rendszer promptba; **`agent_runs.metadata`** kap **`style_rule_version`** / **`style_rule_id`**.
6. **Emberi mérés:** **`content_quality_reviews`** — pontszámok 1–5 (`score_*`), `needs_rewrite`, `editor_notes`, opcionális **`rule_version`** snapshot.

Suggested cadence: tartalom scout → heti draft → (havonta / igény szerint) style scout → distill → manuális rule aktiválás.

## Sponsor / sales prep (`sales:prepare-leads`)

1. **Apply migration** so **`outreach_prepared_at`** (and optional **`website_url`**) exist. **Dashboard → `sponsor_leads`:** new row = default **`status` = `new`** is enough; or use **`lead`**. Fill **`website_url`** if you have it.
2. Run `npm run sales:prepare-leads`. Rows already processed ( **`outreach_prepared_at` set** ) are skipped — clear that timestamp if you want a full re-run.
3. Results in **`recommendations`** JSON; **`outreach_prepared_at`** set. No automatic email.

## Cron on Hetzner (later)

Run on your VPS with env injected (systemd unit, Docker, or `cron` + `.env`):

```bash
cd /path/to/signal-hub/agents && /usr/bin/npm run scout:global-ai
```

Use a dedicated OS user, restrict file permissions on `.env`, and rotate keys if leaked.
