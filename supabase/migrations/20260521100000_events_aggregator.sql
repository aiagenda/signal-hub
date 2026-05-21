-- Events aggregator upgrade: full structured fields, slug, categories, regions, submission queue.
-- Prerequisite: 20260507110000_full_agency_content_ops.sql (events table + event_status type exists)

-- ── 1. Extend events table ───────────────────────────────────────────────────
alter table public.events
  add column if not exists slug           text unique,
  add column if not exists ends_at        timestamptz,
  add column if not exists venue          text,
  add column if not exists city           text,
  add column if not exists region         text,
  add column if not exists country        text not null default 'HU',
  add column if not exists price_info     text,
  add column if not exists ticket_url     text,
  add column if not exists cover_image_url text,
  add column if not exists organizer_name text,
  add column if not exists organizer_email text,
  add column if not exists category       text,
  add column if not exists tags           text[] not null default '{}',
  add column if not exists is_featured    boolean not null default false,
  add column if not exists submitted_by   text;  -- email of submitter if user-generated

-- Slug auto-generation helper (uses title + id suffix to guarantee uniqueness)
create or replace function public.events_generate_slug()
returns trigger language plpgsql as $$
declare
  base text;
  candidate text;
  i int := 0;
begin
  if new.slug is not null and new.slug <> '' then
    return new;
  end if;
  -- simple slug from title: lowercase, replace non-alnum with dash, trim
  base := lower(regexp_replace(
    regexp_replace(new.title, '[^a-zA-Z0-9\u00C0-\u024F\s-]', '', 'g'),
    '\s+', '-', 'g'
  ));
  base := trim(both '-' from base);
  if base = '' then base := 'event'; end if;
  candidate := base;
  loop
    begin
      new.slug := candidate || '-' || substr(new.id::text, 1, 8);
      return new;
    exception when unique_violation then
      i := i + 1;
      candidate := base || '-' || i;
    end;
  end loop;
end;
$$;

create trigger events_auto_slug
  before insert on public.events
  for each row
  when (new.slug is null or new.slug = '')
  execute function public.events_generate_slug();

-- ── 2. Indexes ───────────────────────────────────────────────────────────────
create index if not exists events_slug_idx            on public.events (slug);
create index if not exists events_city_idx            on public.events (city, starts_at asc nulls last);
create index if not exists events_region_idx          on public.events (region, starts_at asc nulls last);
create index if not exists events_category_idx        on public.events (category, starts_at asc nulls last);
create index if not exists events_starts_featured_idx on public.events (is_featured desc, starts_at asc nulls last);
create index if not exists events_tags_gin_idx        on public.events using gin (tags);

-- ── 3. Event submissions queue (unmoderated user-submitted events) ────────────
create type public.event_submission_status as enum ('pending', 'approved', 'rejected');

create table public.event_submissions (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  starts_at      timestamptz not null,
  ends_at        timestamptz,
  venue          text,
  city           text not null,
  region         text,
  country        text not null default 'HU',
  price_info     text,
  ticket_url     text,
  cover_image_url text,
  description    text,
  organizer_name text not null,
  organizer_email text not null,
  category       text,
  tags           text[] not null default '{}',
  status         public.event_submission_status not null default 'pending',
  reviewer_note  text,
  event_id       uuid references public.events (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger event_submissions_set_updated_at
  before update on public.event_submissions
  for each row
  execute function public.set_updated_at();

create index event_submissions_status_idx on public.event_submissions (status, created_at desc);

-- ── 4. RLS ───────────────────────────────────────────────────────────────────
alter table public.event_submissions enable row level security;

-- Anyone can submit
create policy "event_submissions_insert_anon"
  on public.event_submissions for insert
  with check (true);

-- Only admin can read / update / delete
create policy "event_submissions_admin"
  on public.event_submissions for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── 5. Published events readable by anon ────────────────────────────────────
-- Already handled by existing events_select_published_or_admin policy.
-- Nothing to add.
