-- Pack §7 payments, ledger payouts, fx versions, tax. amount_minor bigint. IMTT is opex (D-60).

create table if not exists public.psp_events (
  event_id text primary key,
  intent_id text,
  source text not null,
  action text not null,
  signature_valid boolean not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.cod_attempts (
  attempt_id text primary key,
  order_id text not null,
  courier_id text,
  amount_minor bigint not null,
  currency text not null check (currency in ('USD', 'ZWG')),
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.payouts (
  payout_id text primary key,
  subject_id text not null,
  amount_minor bigint not null,
  currency text not null check (currency in ('USD', 'ZWG')),
  status text not null,
  simulated boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.fx_rate_versions (
  version_id text primary key,
  fx_rate_id text not null references public.fx_daily_rates (fx_rate_id),
  zig_minor_per_usd bigint not null,
  effective_at timestamptz not null,
  set_by text not null
);

create table if not exists public.fx_conversions (
  conversion_id text primary key,
  fx_rate_id text not null,
  from_currency text not null check (from_currency in ('USD', 'ZWG')),
  to_currency text not null check (to_currency in ('USD', 'ZWG')),
  from_minor bigint not null,
  to_minor bigint not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tax_treatments (
  treatment_id text primary key,
  code text not null unique,
  receipt_class text not null,
  notes text
);

create table if not exists public.fiscal_days (
  fiscal_day_id text primary key,
  device_id text,
  status text not null,
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.withholding_balances (
  balance_id text primary key,
  technician_id text not null,
  amount_minor bigint not null,
  currency text not null check (currency in ('USD', 'ZWG')),
  period text not null
);

create table if not exists public.itf263_records (
  record_id text primary key,
  technician_id text not null,
  job_id text,
  amount_minor bigint not null,
  currency text not null check (currency in ('USD', 'ZWG')),
  created_at timestamptz not null default now()
);

create index if not exists psp_events_intent_idx on public.psp_events (intent_id, created_at desc);
create index if not exists cod_attempts_order_idx on public.cod_attempts (order_id);
create index if not exists payouts_subject_idx on public.payouts (subject_id, created_at desc);
create index if not exists withholding_tech_idx on public.withholding_balances (technician_id, period);

alter table public.psp_events enable row level security;
alter table public.cod_attempts enable row level security;
alter table public.payouts enable row level security;
alter table public.fx_rate_versions enable row level security;
alter table public.fx_conversions enable row level security;
alter table public.tax_treatments enable row level security;
alter table public.fiscal_days enable row level security;
alter table public.withholding_balances enable row level security;
alter table public.itf263_records enable row level security;
alter table public.payment_intents enable row level security;
alter table public.wht_remittance_batches enable row level security;

create policy psp_events_admin on public.psp_events for all using (public.dial_is_admin());
create policy cod_attempts_admin on public.cod_attempts for all using (public.dial_is_admin());
create policy payouts_admin on public.payouts for all using (public.dial_is_admin());
create policy fx_versions_select on public.fx_rate_versions for select using (auth.uid() is not null);
create policy fx_versions_admin on public.fx_rate_versions for all using (public.dial_is_admin());
create policy tax_admin on public.tax_treatments for all using (public.dial_is_admin());
create policy fiscal_days_admin on public.fiscal_days for all using (public.dial_is_admin());
create policy withholding_admin on public.withholding_balances for all using (public.dial_is_admin());
create policy itf263_admin on public.itf263_records for all using (public.dial_is_admin());
create policy payment_intents_admin on public.payment_intents for all using (public.dial_is_admin());
create policy wht_batches_admin on public.wht_remittance_batches for all using (public.dial_is_admin());
