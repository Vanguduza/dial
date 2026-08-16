-- Pack §7 technicians, trades, jobs, projects, checklists. No AI-written payable amounts.

create table if not exists public.technicians (
  technician_id text primary key references public.profiles (user_id),
  display_name text not null,
  trade_id text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.credentials (
  credential_id text primary key,
  technician_id text not null references public.technicians (technician_id),
  kind text not null,
  issued_at timestamptz,
  expires_at timestamptz
);

create table if not exists public.availability (
  slot_id text primary key,
  technician_id text not null references public.technicians (technician_id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'open'
);

create table if not exists public.managers_choice (
  choice_id text primary key,
  technician_id text not null references public.technicians (technician_id),
  week_start date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.score_profiles (
  profile_id text primary key,
  technician_id text not null references public.technicians (technician_id),
  value_score integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.technician_score_snapshots (
  snapshot_id text primary key,
  technician_id text not null references public.technicians (technician_id),
  value_score integer not null,
  captured_at timestamptz not null default now()
);

create table if not exists public.technician_score_events (
  event_id text primary key,
  technician_id text not null references public.technicians (technician_id),
  kind text not null,
  delta integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.job_class_definitions (
  job_class_id text primary key,
  trade_id text,
  title text not null,
  emergency boolean not null default false
);

create table if not exists public.trade_definitions (
  trade_id text primary key,
  title text not null,
  active boolean not null default true
);

create table if not exists public.trade_lifecycle_events (
  event_id text primary key,
  trade_id text not null references public.trade_definitions (trade_id),
  kind text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  job_id text primary key,
  customer_id text not null references public.profiles (user_id),
  technician_id text,
  job_class_id text,
  status text not null,
  slot_id text,
  emergency boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.job_media (
  media_id text primary key,
  job_id text not null references public.jobs (job_id),
  kind text not null,
  payload_ref text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.job_assessments (
  assessment_id text primary key,
  job_id text not null references public.jobs (job_id),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.quotes (
  quote_id text primary key,
  job_id text not null references public.jobs (job_id),
  amount_minor bigint not null,
  currency text not null check (currency in ('USD', 'ZWG')),
  source text not null check (source in ('rate_card', 'human')),
  payable_from_ai boolean not null default false check (payable_from_ai = false),
  created_at timestamptz not null default now()
);

create table if not exists public.variations (
  variation_id text primary key,
  job_id text not null references public.jobs (job_id),
  amount_minor bigint not null,
  currency text not null check (currency in ('USD', 'ZWG')),
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.assignments (
  assignment_id text primary key,
  job_id text not null references public.jobs (job_id),
  technician_id text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.evidence (
  evidence_id text primary key,
  job_id text not null references public.jobs (job_id),
  technician_id text,
  kind text not null,
  payload_ref text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  project_id text primary key,
  customer_id text not null references public.profiles (user_id),
  title text not null,
  status text not null,
  client_visibility boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.milestones (
  milestone_id text primary key,
  project_id text not null references public.projects (project_id),
  title text not null,
  due_at timestamptz,
  status text not null
);

create table if not exists public.project_team (
  row_id text primary key,
  project_id text not null references public.projects (project_id),
  technician_id text not null,
  role text not null
);

create table if not exists public.project_budgets (
  budget_id text primary key,
  project_id text not null references public.projects (project_id),
  amount_minor bigint not null,
  currency text not null check (currency in ('USD', 'ZWG'))
);

create table if not exists public.diagnostic_checklists (
  checklist_id text primary key,
  title text not null,
  steps jsonb not null default '[]'::jsonb,
  catalog_id text
);

create table if not exists public.checklist_step_outcomes (
  outcome_id text primary key,
  job_id text not null references public.jobs (job_id),
  checklist_id text not null references public.diagnostic_checklists (checklist_id),
  step_index integer not null,
  answer text,
  created_at timestamptz not null default now()
);

create index if not exists jobs_customer_idx on public.jobs (customer_id, created_at desc);
create index if not exists jobs_technician_idx on public.jobs (technician_id, status);
create index if not exists quotes_job_idx on public.quotes (job_id);
create index if not exists evidence_job_idx on public.evidence (job_id);

alter table public.technicians enable row level security;
alter table public.credentials enable row level security;
alter table public.availability enable row level security;
alter table public.managers_choice enable row level security;
alter table public.score_profiles enable row level security;
alter table public.technician_score_snapshots enable row level security;
alter table public.technician_score_events enable row level security;
alter table public.job_class_definitions enable row level security;
alter table public.trade_definitions enable row level security;
alter table public.trade_lifecycle_events enable row level security;
alter table public.jobs enable row level security;
alter table public.job_media enable row level security;
alter table public.job_assessments enable row level security;
alter table public.quotes enable row level security;
alter table public.variations enable row level security;
alter table public.assignments enable row level security;
alter table public.evidence enable row level security;
alter table public.projects enable row level security;
alter table public.milestones enable row level security;
alter table public.project_team enable row level security;
alter table public.project_budgets enable row level security;
alter table public.diagnostic_checklists enable row level security;
alter table public.checklist_step_outcomes enable row level security;

create policy technicians_own on public.technicians
  for all using (auth.uid()::text = technician_id) with check (auth.uid()::text = technician_id);
create policy technicians_admin on public.technicians for all using (public.dial_is_admin());
create policy jobs_customer on public.jobs
  for select using (auth.uid()::text = customer_id or auth.uid()::text = technician_id);
create policy jobs_admin on public.jobs for all using (public.dial_is_admin());
create policy quotes_admin on public.quotes for all using (public.dial_is_admin());
create policy quotes_party on public.quotes for select using (
  exists (select 1 from public.jobs j where j.job_id = quotes.job_id and (j.customer_id = auth.uid()::text or j.technician_id = auth.uid()::text))
);
create policy evidence_party on public.evidence for select using (
  exists (select 1 from public.jobs j where j.job_id = evidence.job_id and (j.customer_id = auth.uid()::text or j.technician_id = auth.uid()::text))
);
create policy projects_own on public.projects
  for select using (auth.uid()::text = customer_id or public.dial_is_admin());
create policy checklists_select on public.diagnostic_checklists for select using (auth.uid() is not null);
create policy trades_select on public.trade_definitions for select using (auth.uid() is not null);
create policy job_class_select on public.job_class_definitions for select using (auth.uid() is not null);
create policy remaining_tech_admin on public.credentials for all using (public.dial_is_admin());
create policy availability_own on public.availability
  for all using (auth.uid()::text = technician_id) with check (auth.uid()::text = technician_id);
