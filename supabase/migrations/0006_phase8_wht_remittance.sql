-- Phase 8 prep (not G8): WHT remittance durable shape (D-50).
-- Apply when DATABASE_URL / SQL editor available. Do not claim G8 without sandbox dogfood.

create table if not exists public.wht_remittance_batches (
  batch_id text primary key,
  year_of_assessment integer not null,
  status text not null check (status in ('draft', 'submitted', 'acknowledged')),
  total_withheld_minor bigint not null check (total_withheld_minor >= 0),
  currency text not null default 'USD' check (currency = 'USD'),
  submitted_by text,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  payable_from_ai boolean not null default false check (payable_from_ai = false),
  lines_json jsonb not null default '[]'::jsonb
);

alter table public.wht_remittance_batches enable row level security;

-- Service-role / ops only for remittance mutations (Pack §12 posture).
create policy wht_remittance_batches_service_all
  on public.wht_remittance_batches
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
