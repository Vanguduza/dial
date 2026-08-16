-- Phase 1 / G1 — Pack §7 priority tables + Pack §12 RLS (D-47).
-- Complements 0001_core_tables + 0002_profiles_auth_rls.
-- amount_minor = bigint; agency marketplace only (no dial_owned).
-- Apply via Supabase CLI when DATABASE_URL / local Supabase is configured.

create table if not exists public.orders (
  order_id text primary key,
  customer_id text not null references public.profiles (user_id),
  status text not null,
  currency text not null check (currency in ('USD', 'ZWG')),
  total_minor bigint not null,
  fx_rate_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_lines (
  line_id text primary key,
  order_id text not null references public.orders (order_id),
  offer_id text,
  title text not null,
  qty integer not null check (qty > 0),
  unit_price_minor bigint not null,
  currency text not null check (currency in ('USD', 'ZWG')),
  created_at timestamptz not null default now()
);

create table if not exists public.returns (
  return_id text primary key,
  order_id text not null references public.orders (order_id),
  customer_id text not null references public.profiles (user_id),
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  vehicle_id text primary key,
  user_id text not null references public.profiles (user_id),
  plate text,
  vin text,
  make text,
  model text,
  created_at timestamptz not null default now()
);

create table if not exists public.promo_credits (
  credit_id text primary key,
  user_id text not null references public.profiles (user_id),
  balance_minor bigint not null check (balance_minor >= 0),
  currency text not null check (currency = 'USD'),
  created_at timestamptz not null default now()
);

create table if not exists public.offer_snapshots (
  snapshot_id text primary key,
  offer_id text not null,
  customer_id text references public.profiles (user_id),
  price_minor bigint not null,
  currency text not null check (currency = 'USD'),
  offer_source text not null check (offer_source = 'MARKETPLACE'),
  supplier_formality text not null check (supplier_formality in ('formal', 'informal')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.accounts (
  account_id text primary key,
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.journal_entries (
  entry_id text primary key,
  memo text,
  created_at timestamptz not null default now()
);

create table if not exists public.journal_lines (
  line_id text primary key,
  entry_id text not null references public.journal_entries (entry_id),
  account_id text not null references public.accounts (account_id),
  amount_minor bigint not null,
  currency text not null check (currency in ('USD', 'ZWG')),
  created_at timestamptz not null default now()
);

create table if not exists public.job_reserves (
  reserve_id text primary key,
  job_or_order_id text not null,
  customer_id text not null references public.profiles (user_id),
  amount_minor bigint not null,
  currency text not null check (currency in ('USD', 'ZWG')),
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.delivery_offers (
  offer_id text primary key,
  job_id text not null,
  courier_id text,
  status text not null,
  created_at timestamptz not null default now()
);

alter table public.delivery_jobs
  add column if not exists customer_id text;

create table if not exists public.courier_locations (
  location_id text primary key,
  courier_id text not null,
  job_id text,
  lat double precision not null,
  lng double precision not null,
  recorded_at timestamptz not null default now()
);

alter table public.orders enable row level security;
alter table public.order_lines enable row level security;
alter table public.returns enable row level security;
alter table public.vehicles enable row level security;
alter table public.promo_credits enable row level security;
alter table public.offer_snapshots enable row level security;
alter table public.job_reserves enable row level security;
alter table public.delivery_jobs enable row level security;
alter table public.delivery_offers enable row level security;
alter table public.courier_locations enable row level security;
alter table public.accounts enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_lines enable row level security;
alter table public.fdms_outbox enable row level security;
alter table public.fx_daily_rates enable row level security;
alter table public.offers enable row level security;

drop policy if exists orders_select_own on public.orders;
drop policy if exists orders_insert_own on public.orders;
drop policy if exists orders_update_own on public.orders;
drop policy if exists orders_admin_all on public.orders;
create policy orders_select_own on public.orders
  for select using (auth.uid()::text = customer_id);
create policy orders_insert_own on public.orders
  for insert with check (auth.uid()::text = customer_id);
create policy orders_update_own on public.orders
  for update using (auth.uid()::text = customer_id)
  with check (auth.uid()::text = customer_id);
create policy orders_admin_all on public.orders
  for all using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );

drop policy if exists vehicles_select_own on public.vehicles;
drop policy if exists vehicles_mutate_own on public.vehicles;
drop policy if exists vehicles_admin_all on public.vehicles;
create policy vehicles_select_own on public.vehicles
  for select using (auth.uid()::text = user_id);
create policy vehicles_mutate_own on public.vehicles
  for all using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);
create policy vehicles_admin_all on public.vehicles
  for all using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );

drop policy if exists promo_credits_select_own on public.promo_credits;
drop policy if exists promo_credits_admin_all on public.promo_credits;
create policy promo_credits_select_own on public.promo_credits
  for select using (auth.uid()::text = user_id);
create policy promo_credits_admin_all on public.promo_credits
  for all using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );

drop policy if exists delivery_jobs_select_party on public.delivery_jobs;
drop policy if exists delivery_jobs_admin_all on public.delivery_jobs;
create policy delivery_jobs_select_party on public.delivery_jobs
  for select using (
    auth.uid()::text = customer_id
    or auth.uid()::text = assigned_courier_id
  );
create policy delivery_jobs_admin_all on public.delivery_jobs
  for all using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );

drop policy if exists delivery_offers_select_courier on public.delivery_offers;
drop policy if exists delivery_offers_admin_all on public.delivery_offers;
create policy delivery_offers_select_courier on public.delivery_offers
  for select using (auth.uid()::text = courier_id);
create policy delivery_offers_admin_all on public.delivery_offers
  for all using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );

drop policy if exists courier_locations_own on public.courier_locations;
drop policy if exists courier_locations_admin_all on public.courier_locations;
create policy courier_locations_own on public.courier_locations
  for all using (auth.uid()::text = courier_id)
  with check (auth.uid()::text = courier_id);
create policy courier_locations_admin_all on public.courier_locations
  for all using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );

drop policy if exists job_reserves_admin_all on public.job_reserves;
create policy job_reserves_admin_all on public.job_reserves
  for all using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );

drop policy if exists accounts_admin_all on public.accounts;
drop policy if exists journal_entries_admin_all on public.journal_entries;
drop policy if exists journal_lines_admin_all on public.journal_lines;
create policy accounts_admin_all on public.accounts
  for all using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );
create policy journal_entries_admin_all on public.journal_entries
  for all using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );
create policy journal_lines_admin_all on public.journal_lines
  for all using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );

drop policy if exists offers_select_auth on public.offers;
drop policy if exists offers_admin_all on public.offers;
create policy offers_select_auth on public.offers
  for select using (auth.uid() is not null);
create policy offers_admin_all on public.offers
  for all using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );

drop policy if exists fx_daily_rates_select_auth on public.fx_daily_rates;
drop policy if exists fx_daily_rates_admin_all on public.fx_daily_rates;
create policy fx_daily_rates_select_auth on public.fx_daily_rates
  for select using (auth.uid() is not null);
create policy fx_daily_rates_admin_all on public.fx_daily_rates
  for all using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );

drop policy if exists fdms_outbox_admin_all on public.fdms_outbox;
create policy fdms_outbox_admin_all on public.fdms_outbox
  for all using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );
