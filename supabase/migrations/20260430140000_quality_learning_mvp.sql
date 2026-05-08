-- Quality / style learning: sources, observations, distilled rules, editor reviews

-- Curated URLs for style scout (non-aggressive fetch in agents worker)
create table public.style_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  category text,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create index style_sources_active_idx on public.style_sources (active);

-- Versioned rules; exactly one row may have active = true
create table public.style_rules (
  id uuid primary key default gen_random_uuid(),
  version int not null,
  rules_json jsonb not null default '{}',
  prompt_snippet text not null default '',
  active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (version)
);

create unique index style_rules_one_active
  on public.style_rules ((true))
  where active = true;

-- Raw observations per fetch (dedup-friendly via hash)
create table public.style_observations (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.style_sources (id) on delete cascade,
  raw_excerpt_hash text not null,
  observation_json jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index style_observations_source_created_idx
  on public.style_observations (source_id, created_at desc);

-- Human quality scores (optional edition link)
create table public.content_quality_reviews (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items (id) on delete cascade,
  edition_id uuid references public.editions (id) on delete set null,
  agent_name text,
  rule_version int,
  score_relevance smallint,
  score_tone smallint,
  score_accuracy smallint,
  score_clarity smallint,
  needs_rewrite boolean not null default false,
  editor_notes text,
  reviewed_at timestamptz not null default now(),
  check (
    score_relevance is null or (score_relevance between 1 and 5)
  ),
  check (
    score_tone is null or (score_tone between 1 and 5)
  ),
  check (
    score_accuracy is null or (score_accuracy between 1 and 5)
  ),
  check (
    score_clarity is null or (score_clarity between 1 and 5)
  )
);

create index content_quality_reviews_content_item_idx
  on public.content_quality_reviews (content_item_id);

-- RLS
alter table public.style_sources enable row level security;
alter table public.style_rules enable row level security;
alter table public.style_observations enable row level security;
alter table public.content_quality_reviews enable row level security;

create policy "style_sources_all_admin"
  on public.style_sources for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "style_rules_all_admin"
  on public.style_rules for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "style_observations_all_admin"
  on public.style_observations for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "content_quality_reviews_all_admin"
  on public.content_quality_reviews for all
  using (public.is_admin())
  with check (public.is_admin());

-- Seed sources (optional first run)
insert into public.style_sources (name, url, category, active)
values
  ('TechCrunch', 'https://techcrunch.com/', 'tech_news', true),
  ('The Verge', 'https://www.theverge.com/', 'tech_news', true),
  ('Axios Tech', 'https://www.axios.com/', 'tech_news', true);
