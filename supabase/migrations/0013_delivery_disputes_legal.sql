-- Pack §7 delivery remainder, guarantee, disputes, legal, trust.

create table if not exists public.zones (
  zone_id text primary key,
  name text not null,
  geom jsonb
);

create table if not exists public.shipments (
  shipment_id text primary key,
  order_id text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.pod_media (
  media_id text primary key,
  job_id text not null,
  payload_ref text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.delivery_assignment_events (
  event_id text primary key,
  job_id text not null,
  courier_id text,
  kind text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.delivery_runs (
  run_id text primary key,
  courier_id text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.delivery_stops (
  stop_id text primary key,
  run_id text not null references public.delivery_runs (run_id),
  job_id text,
  seq integer not null,
  status text not null
);

create table if not exists public.guarantee_claims (
  claim_id text primary key,
  order_id text,
  job_id text,
  customer_id text not null references public.profiles (user_id),
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.guarantee_provisions (
  provision_id text primary key,
  claim_id text not null references public.guarantee_claims (claim_id),
  amount_minor bigint not null,
  currency text not null check (currency in ('USD', 'ZWG'))
);

create table if not exists public.disputes (
  dispute_id text primary key,
  subject_id text not null,
  customer_id text references public.profiles (user_id),
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.dispute_evidence (
  evidence_id text primary key,
  dispute_id text not null references public.disputes (dispute_id),
  payload_ref text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.terms_versions (
  version_id text primary key,
  body_hash text not null,
  effective_at timestamptz not null
);

create table if not exists public.terms_acceptances (
  acceptance_id text primary key,
  version_id text not null references public.terms_versions (version_id),
  user_id text not null references public.profiles (user_id),
  accepted_at timestamptz not null default now()
);

create table if not exists public.compliance_checklist_runs (
  run_id text primary key,
  checklist_key text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.media_fingerprints (
  fingerprint_id text primary key,
  payload_ref text not null,
  hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.fraud_signals (
  signal_id text primary key,
  subject_id text not null,
  kind text not null,
  created_at timestamptz not null default now()
);

create index if not exists delivery_stops_run_idx on public.delivery_stops (run_id, seq);
create index if not exists disputes_customer_idx on public.disputes (customer_id);
create index if not exists pod_media_job_idx on public.pod_media (job_id);

alter table public.zones enable row level security;
alter table public.shipments enable row level security;
alter table public.pod_media enable row level security;
alter table public.delivery_assignment_events enable row level security;
alter table public.delivery_runs enable row level security;
alter table public.delivery_stops enable row level security;
alter table public.guarantee_claims enable row level security;
alter table public.guarantee_provisions enable row level security;
alter table public.disputes enable row level security;
alter table public.dispute_evidence enable row level security;
alter table public.terms_versions enable row level security;
alter table public.terms_acceptances enable row level security;
alter table public.compliance_checklist_runs enable row level security;
alter table public.media_fingerprints enable row level security;
alter table public.fraud_signals enable row level security;

create policy zones_select on public.zones for select using (auth.uid() is not null);
create policy zones_admin on public.zones for all using (public.dial_is_admin());
create policy pod_admin on public.pod_media for all using (public.dial_is_admin());
create policy runs_courier on public.delivery_runs
  for select using (auth.uid()::text = courier_id or public.dial_is_admin());
create policy guarantee_own on public.guarantee_claims
  for select using (auth.uid()::text = customer_id or public.dial_is_admin());
create policy disputes_own on public.disputes
  for select using (auth.uid()::text = customer_id or public.dial_is_admin());
create policy terms_select on public.terms_versions for select using (auth.uid() is not null);
create policy terms_accept_own on public.terms_acceptances
  for all using (auth.uid()::text = user_id) with check (auth.uid()::text = user_id);
create policy trust_admin on public.fraud_signals for all using (public.dial_is_admin());
create policy fingerprints_admin on public.media_fingerprints for all using (public.dial_is_admin());
create policy compliance_admin on public.compliance_checklist_runs for all using (public.dial_is_admin());
create policy assignment_events_admin on public.delivery_assignment_events for all using (public.dial_is_admin());
create policy shipments_admin on public.shipments for all using (public.dial_is_admin());
create policy stops_admin on public.delivery_stops for all using (public.dial_is_admin());
create policy provisions_admin on public.guarantee_provisions for all using (public.dial_is_admin());
create policy dispute_evidence_admin on public.dispute_evidence for all using (public.dial_is_admin());
