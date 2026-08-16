-- Pack §7 platform, AI Factory metadata, simulation. Simulated never auto-pays (D-54).

create table if not exists public.ai_invocations (
  invocation_id text primary key,
  capability text not null,
  model text,
  cost_minor bigint,
  currency text check (currency in ('USD', 'ZWG')),
  created_at timestamptz not null default now()
);

create table if not exists public.intelligence_datasets (
  dataset_id text primary key,
  title text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.intelligence_shadow_runs (
  run_id text primary key,
  dataset_id text references public.intelligence_datasets (dataset_id),
  promptfoo_pass boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.intelligence_promotions (
  promotion_id text primary key,
  run_id text references public.intelligence_shadow_runs (run_id),
  promoted_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.simulation_scenarios (
  scenario_id text primary key,
  title text not null,
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.simulation_runs (
  run_id text primary key,
  scenario_id text not null references public.simulation_scenarios (scenario_id),
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.simulation_sensitivity_reports (
  report_id text primary key,
  run_id text not null references public.simulation_runs (run_id),
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.audit_events (
  event_id text primary key,
  actor_id text,
  action text not null,
  subject_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.feature_flags (
  flag_id text primary key,
  key text not null unique,
  enabled boolean not null default false
);

create table if not exists public.domain_module_registry (
  module_id text primary key,
  key text not null unique,
  status text not null
);

create table if not exists public.metric_contracts (
  contract_id text primary key,
  key text not null unique,
  unit text not null
);

create table if not exists public.operational_alerts (
  alert_id text primary key,
  kind text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_actor_idx on public.audit_events (actor_id, created_at desc);
create index if not exists ai_invocations_cap_idx on public.ai_invocations (capability, created_at desc);

alter table public.ai_invocations enable row level security;
alter table public.intelligence_datasets enable row level security;
alter table public.intelligence_shadow_runs enable row level security;
alter table public.intelligence_promotions enable row level security;
alter table public.simulation_scenarios enable row level security;
alter table public.simulation_runs enable row level security;
alter table public.simulation_sensitivity_reports enable row level security;
alter table public.audit_events enable row level security;
alter table public.feature_flags enable row level security;
alter table public.domain_module_registry enable row level security;
alter table public.metric_contracts enable row level security;
alter table public.operational_alerts enable row level security;

create policy platform_admin_ai on public.ai_invocations for all using (public.dial_is_admin());
create policy platform_admin_datasets on public.intelligence_datasets for all using (public.dial_is_admin());
create policy platform_admin_shadow on public.intelligence_shadow_runs for all using (public.dial_is_admin());
create policy platform_admin_promos on public.intelligence_promotions for all using (public.dial_is_admin());
create policy platform_admin_sim_scen on public.simulation_scenarios for all using (public.dial_is_admin());
create policy platform_admin_sim_runs on public.simulation_runs for all using (public.dial_is_admin());
create policy platform_admin_sim_rep on public.simulation_sensitivity_reports for all using (public.dial_is_admin());
create policy platform_admin_audit on public.audit_events for all using (public.dial_is_admin());
create policy platform_admin_flags on public.feature_flags for all using (public.dial_is_admin());
create policy platform_admin_modules on public.domain_module_registry for all using (public.dial_is_admin());
create policy platform_admin_metrics on public.metric_contracts for all using (public.dial_is_admin());
create policy platform_admin_alerts on public.operational_alerts for all using (public.dial_is_admin());
