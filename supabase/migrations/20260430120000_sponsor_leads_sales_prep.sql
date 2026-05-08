-- Sponsor outreach prep: pipeline stage + website + structured agent output

alter type public.sponsor_lead_status add value if not exists 'lead';

alter table public.sponsor_leads
  add column if not exists website_url text;

alter table public.sponsor_leads
  add column if not exists recommendations jsonb;

alter table public.sponsor_leads
  add column if not exists outreach_prepared_at timestamptz;

comment on column public.sponsor_leads.website_url is 'Optional company site URL for lightweight fetch + LLM context (no aggressive scraping).';
comment on column public.sponsor_leads.recommendations is 'Structured JSON from SalesLeadAgent: fit_score, summaries, outreach email draft, placement copy.';
comment on column public.sponsor_leads.outreach_prepared_at is 'When the agent last wrote recommendations for this row.';
