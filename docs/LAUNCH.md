# Budapest Signal — első heti láthatóság és publish checklist

Operatív playbook a nyilvános webhez és hírlevélhez. A technikai rész (Supabase, TanStack, agent worker) a repo többi dokumentációjában van.

## Publish checklist (adatbázis)

1. Futtasd a tartalom-pipelinet: `npm run scout:all` (vagy `npm run weekly:pipeline` a repó gyökeréből) → opcionálisan `style:scout` / `style:distill` → `draft:edition` (a `weekly:pipeline` ezt egyben futtatja).
2. Ellenőrizd a draftot Supabase-ben vagy az **admin** felületen (`/admin`, bejelentkezés után): `editions`, `edition_sections`, `edition_items`.
3. Állítsd a kiadást **`published`** státuszra, és töltsd ki a **`published_at`** időbélyeget (UTC vagy konzisztens TZ) — kézzel a Dashboardon, vagy **csak ha tudatosan**: `weekly:pipeline` + `--publish-latest-draft` / env `AUTO_PUBLISH_LATEST_DRAFT=true` (nincs emberi review ugyanabban a futásban).
4. Ellenőrizd a nyilvános oldalon: `/archive`, `/archive/<slug>` — csak publikált sorok látszanak (RLS).
5. Hírlevél: `npm run send:newsletter` (agents: Resend, lásd `agents/.env.example`) **vagy** a pipeline `--send-newsletter` / `SEND_NEWSLETTER_AFTER_PUBLISH=true` **csak publish után** ugyanabban a futásban. Élesben Resend domain verifikáció szükséges.

## Ütemezés (CI)

- GitHub Actions: `.github/workflows/weekly-agents.yml` — repository secrets: Supabase service + OpenAI; opcionálisan Resend.
- Alternatíva: VPS cron ugyanazokkal a parancsokkal (`cd agents && npm run weekly:pipeline`), lásd `agents/README.md`.

## Admin bejelentkezés

- Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Supabase Auth: magic link az admin e-mailre; **admin jog** ha `profiles.role = 'admin'` **vagy** az e-mail szerepel a `admin_emails` táblában (lásd MVP migráció + `is_admin()` RPC).
- Migráció: `20260502100000_is_admin_rpc_grant.sql` — `authenticated` szerepkör hívhatja az `is_admin` RPC-t a böngésző kapunál.

## SEO gyorslista

- **Google Search Console:** tulajdon hozzáadása, **`sitemap.xml`** beküldése (`https://<domain>/sitemap.xml`).
- **`VITE_PUBLIC_SITE_URL`:** éles domain, perjel nélkül — canonical, OG, sitemap ugyanezt használja.
- **Megosztás előnézet:** `/public/og-default.svg` vagy saját kép (`VITE_OG_IMAGE_PATH`).

## Első hét — terjesztés (nem automatizálható varázslat)

1. **Pre-launch lista:** 50–200 releváns e-mail / DM (founder, operator, közösség admin).
2. **Indulás napja:** 2–3 LinkedIn poszt (érték + egy snippet a kiadásból); egy szándékos cross-promo (podcast / meetup / coworking), ha illeszkedik.
3. **Magyar tech csatornák:** csak ahol szabályos a megosztás — ne tömeges spam.
4. **Metrika:** nem csak pageview — feliratkozások száma, válasz DM-ek, egy rövid visszajelző hívás.

## Analytics env (opcionális)

- `VITE_PLAUSIBLE_DOMAIN` — Plausible script betöltése.
- `VITE_GA4_MEASUREMENT_ID` — GA4 + anonymized IP a kódban.

Ha egyik sincs beállítva, nem töltődik külső analitika script.

## Demó tartalom lokálisan

`.env`: `VITE_USE_MOCK_EDITIONS=true` — a mock kiadások a [`src/lib/mock-data.ts`](../src/lib/mock-data.ts) fájlból jönnek, Supabase nélkül.
