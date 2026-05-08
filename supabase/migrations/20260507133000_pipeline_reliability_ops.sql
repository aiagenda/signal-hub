-- Reliability and operations layer for full-auto agency runtime.
-- Prerequisite: 20260429120000_budapest_signal_mvp.sql + 20260507110000_full_agency_content_ops.sql

create type public.pipeline_job_status as enum ('queued', 'running', 'success', 'failed', 'failed_permanent', 'cancelled');
create type public.pipeline_step_status as enum ('queued', 'running', 'success', 'failed', 'retrying', 'failed_permanent', 'skipped');

create table public.pipeline_jobs (
  id uuid primary key default gen_random_uuid(),
  workflow text not null,
  status public.pipeline_job_status not null default 'queued',
  lock_owner text,
  started_at timestamptz,
  finished_at timestamptz,
  next_run_at timestamptz,
  attempt_count int not null default 0,
  error_message text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pipeline_jobs_status_next_idx
  on public.pipeline_jobs (status, next_run_at asc nulls last, created_at asc);

create trigger pipeline_jobs_set_updated_at
  before update on public.pipeline_jobs
  for each row
  execute function public.set_updated_at();

create table public.pipeline_steps (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.pipeline_jobs (id) on delete cascade,
  step_name text not null,
  status public.pipeline_step_status not null default 'queued',
  started_at timestamptz,
  finished_at timestamptz,
  duration_ms int,
  attempt_count int not null default 0,
  error_message text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (job_id, step_name)
);

create index pipeline_steps_job_status_idx
  on public.pipeline_steps (job_id, status, created_at desc);

create table public.step_attempts (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references public.pipeline_steps (id) on delete cascade,
  attempt_no int not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms int,
  success boolean not null default false,
  error_message text,
  metadata jsonb not null default '{}',
  unique (step_id, attempt_no)
);

create index step_attempts_step_started_idx
  on public.step_attempts (step_id, started_at desc);

create table public.source_health (
  source_id uuid primary key references public.sources (id) on delete cascade,
  consecutive_failures int not null default 0,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);

create trigger source_health_set_updated_at
  before update on public.source_health
  for each row
  execute function public.set_updated_at();

create table public.newsletter_sends (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.editions (id) on delete cascade,
  status text not null default 'running' check (status in ('running', 'success', 'failed', 'cancelled')),
  sent_count int not null default 0,
  skipped_count int not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  lock_expires_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}',
  unique (edition_id, status) deferrable initially immediate
);

create index newsletter_sends_edition_started_idx
  on public.newsletter_sends (edition_id, started_at desc);

alter table public.pipeline_jobs enable row level security;
alter table public.pipeline_steps enable row level security;
alter table public.step_attempts enable row level security;
alter table public.source_health enable row level security;
alter table public.newsletter_sends enable row level security;

create policy "pipeline_jobs_all_admin"
  on public.pipeline_jobs for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "pipeline_steps_all_admin"
  on public.pipeline_steps for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "step_attempts_all_admin"
  on public.step_attempts for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "source_health_all_admin"
  on public.source_health for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "newsletter_sends_all_admin"
  on public.newsletter_sends for all
  using (public.is_admin())
  with check (public.is_admin());
