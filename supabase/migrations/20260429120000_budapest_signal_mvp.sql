-- Budapest Signal MVP: enums, tables, RLS, admin helper
-- Apply via Supabase CLI (supabase db push) or Dashboard SQL Editor.

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists citext;

-- Enums
create type public.source_category as enum (
  'global_ai',
  'tool_radar',
  'builder_insights',
  'budapest_events',
  'weekend',
  'other'
);

create type public.content_status as enum (
  'draft',
  'review',
  'approved',
  'rejected'
);

create type public.edition_status as enum (
  'draft',
  'published',
  'archived'
);

create type public.agent_run_status as enum (
  'running',
  'success',
  'failed'
);

create type public.sponsor_lead_status as enum (
  'new',
  'contacted',
  'won',
  'lost'
);

-- Updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profiles (linked to Supabase Auth)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Optional bootstrap allowlist (JWT email) until profile.role is set
create table public.admin_emails (
  email citext primary key
);

-- Subscribers (newsletter)
create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  status text not null default 'active' check (status in ('active', 'unsubscribed')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Content sources
create table public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_url text,
  feed_url text,
  category public.source_category not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index sources_category_active_idx on public.sources (category, active);

-- Scraped / curated items
create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete cascade,
  category public.source_category not null,
  title text not null,
  canonical_url text not null,
  summary text,
  raw_excerpt text,
  status public.content_status not null default 'draft',
  score numeric(5, 2),
  external_guid text,
  content_hash text not null,
  fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, content_hash)
);

create index content_items_category_status_idx on public.content_items (category, status);
create index content_items_fetched_at_idx on public.content_items (fetched_at desc);

create trigger content_items_set_updated_at
  before update on public.content_items
  for each row
  execute function public.set_updated_at();

-- Newsletter editions
create table public.editions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  number int not null,
  title text not null,
  description text,
  intro text,
  tags text[] not null default '{}',
  edition_date date,
  status public.edition_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger editions_set_updated_at
  before update on public.editions
  for each row
  execute function public.set_updated_at();

create table public.edition_sections (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.editions (id) on delete cascade,
  section_key text not null,
  title text not null,
  sort_order int not null default 0,
  unique (edition_id, section_key)
);

create table public.edition_items (
  id uuid primary key default gen_random_uuid(),
  edition_section_id uuid not null references public.edition_sections (id) on delete cascade,
  content_item_id uuid references public.content_items (id) on delete set null,
  title text not null,
  summary text,
  source_label text,
  url text,
  sort_order int not null default 0
);

create index edition_items_content_item_id_idx on public.edition_items (content_item_id);

-- Sponsor inbound leads
create table public.sponsor_leads (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  contact_name text,
  email text not null,
  category text,
  message text,
  status public.sponsor_lead_status not null default 'new',
  created_at timestamptz not null default now()
);

-- Agent job log
create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  status public.agent_run_status not null,
  started_at timestamptz,
  finished_at timestamptz,
  items_processed int not null default 0,
  error_message text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Admin check: profiles.role = admin OR email in admin_emails (JWT)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
    or exists (
      select 1
      from public.admin_emails a
      where lower(a.email)
        = lower(coalesce((auth.jwt() ->> 'email'), ''))
        and (auth.jwt() ->> 'email') is not null
        and (auth.jwt() ->> 'email') <> ''
    ),
    false
  );
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.admin_emails enable row level security;
alter table public.subscribers enable row level security;
alter table public.sources enable row level security;
alter table public.content_items enable row level security;
alter table public.editions enable row level security;
alter table public.edition_sections enable row level security;
alter table public.edition_items enable row level security;
alter table public.sponsor_leads enable row level security;
alter table public.agent_runs enable row level security;

-- profiles: own row; admins read all
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin());

-- admin_emails: admins only (manage allowlist in SQL or future admin UI)
create policy "admin_emails_all_admin"
  on public.admin_emails for all
  using (public.is_admin())
  with check (public.is_admin());

-- subscribers: public insert; admin read
create policy "subscribers_insert_public"
  on public.subscribers for insert
  with check (true);

create policy "subscribers_select_admin"
  on public.subscribers for select
  using (public.is_admin());

-- sponsor_leads: public insert; admin read
create policy "sponsor_leads_insert_public"
  on public.sponsor_leads for insert
  with check (true);

create policy "sponsor_leads_select_admin"
  on public.sponsor_leads for select
  using (public.is_admin());

-- sources: admin-only read/write
create policy "sources_all_admin"
  on public.sources for all
  using (public.is_admin())
  with check (public.is_admin());

-- content_items: public read if linked from a published edition; admin full access
create policy "content_items_select_published_or_admin"
  on public.content_items for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.edition_items ei
      join public.edition_sections es on es.id = ei.edition_section_id
      join public.editions e on e.id = es.edition_id
      where ei.content_item_id = content_items.id
        and e.status = 'published'
    )
  );

create policy "content_items_write_admin"
  on public.content_items for insert
  with check (public.is_admin());

create policy "content_items_update_admin"
  on public.content_items for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "content_items_delete_admin"
  on public.content_items for delete
  using (public.is_admin());

-- editions
create policy "editions_select_published_or_admin"
  on public.editions for select
  using (status = 'published' or public.is_admin());

create policy "editions_insert_admin"
  on public.editions for insert
  with check (public.is_admin());

create policy "editions_update_admin"
  on public.editions for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "editions_delete_admin"
  on public.editions for delete
  using (public.is_admin());

-- edition_sections: visible when parent edition is published or admin
create policy "edition_sections_select_published_or_admin"
  on public.edition_sections for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.editions e
      where e.id = edition_sections.edition_id
        and e.status = 'published'
    )
  );

create policy "edition_sections_write_admin"
  on public.edition_sections for all
  using (public.is_admin())
  with check (public.is_admin());

-- edition_items
create policy "edition_items_select_published_or_admin"
  on public.edition_items for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.edition_sections es
      join public.editions e on e.id = es.edition_id
      where es.id = edition_items.edition_section_id
        and e.status = 'published'
    )
  );

create policy "edition_items_write_admin"
  on public.edition_items for all
  using (public.is_admin())
  with check (public.is_admin());

-- agent_runs: admin only
create policy "agent_runs_all_admin"
  on public.agent_runs for all
  using (public.is_admin())
  with check (public.is_admin());

-- Seed RSS sources for global_ai scout (optional; disable by deleting rows)
insert into public.sources (name, base_url, feed_url, category, active)
values
  (
    'OpenAI Blog',
    'https://openai.com',
    'https://openai.com/blog/rss.xml',
    'global_ai',
    true
  ),
  (
    'TechCrunch AI',
    'https://techcrunch.com',
    'https://techcrunch.com/category/artificial-intelligence/feed/',
    'global_ai',
    true
  );
