-- Full-agency content operations layer:
-- topics -> longform articles -> events -> social drafts
-- Prerequisite: 20260429120000_budapest_signal_mvp.sql

create type public.topic_idea_status as enum ('new', 'used', 'archived');
create type public.article_status as enum ('draft', 'seo_ready', 'published', 'archived');
create type public.event_status as enum ('draft', 'published', 'archived');
create type public.social_platform as enum ('linkedin', 'x', 'facebook', 'telegram');
create type public.social_post_status as enum ('draft', 'queued', 'posted', 'failed');

create table public.topic_ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  angle text not null,
  primary_keyword text not null,
  score numeric(5, 2) not null default 50,
  title_hash text not null unique,
  source_content_item_ids uuid[] not null default '{}',
  status public.topic_idea_status not null default 'new',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index topic_ideas_status_score_idx on public.topic_ideas (status, score desc, created_at desc);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  topic_idea_id uuid references public.topic_ideas (id) on delete set null,
  slug text not null unique,
  title text not null,
  excerpt text,
  body_markdown text not null,
  seo_title text,
  seo_description text,
  keywords text[] not null default '{}',
  status public.article_status not null default 'draft',
  published_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index articles_status_created_idx on public.articles (status, created_at desc);

create trigger articles_set_updated_at
  before update on public.articles
  for each row
  execute function public.set_updated_at();

create table public.events (
  id uuid primary key default gen_random_uuid(),
  source_content_item_id uuid unique references public.content_items (id) on delete set null,
  title text not null,
  starts_at timestamptz,
  location text,
  summary text,
  source_url text,
  status public.event_status not null default 'draft',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_status_starts_idx on public.events (status, starts_at asc nulls last, created_at desc);

create trigger events_set_updated_at
  before update on public.events
  for each row
  execute function public.set_updated_at();

create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.articles (id) on delete cascade,
  event_id uuid references public.events (id) on delete cascade,
  platform public.social_platform not null,
  post_text text not null,
  post_url text,
  status public.social_post_status not null default 'draft',
  scheduled_for timestamptz,
  posted_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (article_id is not null or event_id is not null)
);

create index social_posts_status_platform_idx on public.social_posts (status, platform, created_at desc);

create trigger social_posts_set_updated_at
  before update on public.social_posts
  for each row
  execute function public.set_updated_at();

alter table public.topic_ideas enable row level security;
alter table public.articles enable row level security;
alter table public.events enable row level security;
alter table public.social_posts enable row level security;

create policy "topic_ideas_all_admin"
  on public.topic_ideas for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "articles_select_published_or_admin"
  on public.articles for select
  using (status = 'published' or public.is_admin());

create policy "articles_write_admin"
  on public.articles for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "events_select_published_or_admin"
  on public.events for select
  using (status = 'published' or public.is_admin());

create policy "events_write_admin"
  on public.events for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "social_posts_all_admin"
  on public.social_posts for all
  using (public.is_admin())
  with check (public.is_admin());
