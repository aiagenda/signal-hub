# 7-day staging soak + phased prod rollout

## Staging soak checklist (7 days)
- Run `.github/workflows/staging-soak.yml` daily with `SOCIAL_POST_DRY_RUN=true`.
- Verify each day in `/admin/pipeline`:
  - no permanent pipeline failures,
  - no source with `consecutive_failures >= threshold`,
  - social `failed` ratio below 5%.
- Validate quality gate trend:
  - `hard fail` count should go down over time,
  - rewrite pass should reduce forced publish requirement.
- Validate newsletter lock:
  - no duplicate running lock rows for the same edition,
  - telemetry rows are written with sent/skipped counters.

## Phased production rollout
1. **Phase A**: Full auto ingest + writing + SEO + quality, publish still manual fallback.
2. **Phase B**: Enable auto publish (quality-pass only), social stays dry-run.
3. **Phase C**: Enable live social + newsletter auto + alerts webhooks.

## Rollback switches
- Set `PIPELINE_DISABLE_EXTERNAL_POSTS=true` to instantly stop social/newsletter external sends.
- Set `SOCIAL_POST_DRY_RUN=true` to simulate queue processing without posting.
- Disable scheduled workflows in GitHub Actions if broader incident appears.
