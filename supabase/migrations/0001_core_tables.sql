-- DIAL core tables stub (Pack §7) — S92 scaffold.
-- Apply via Supabase CLI / migrate when DATABASE_URL is set.
-- amountMinor columns are bigint; never float money.

-- identity
create table if not exists profiles (
  user_id text primary key,
  email text not null unique,
  display_name text,
  role text not null default 'customer',
  buyer_segment text not null default 'b2c',
  created_at timestamptz not null default now()
);

-- catalogue / offers (agency only — no dial_owned)
create table if not exists offers (
  offer_id text primary key,
  master_product_id text,
  title text not null,
  price_minor bigint not null,
  currency text not null check (currency in ('USD')),
  offer_source text not null check (offer_source = 'MARKETPLACE'),
  supplier_formality text not null check (supplier_formality in ('formal', 'informal')),
  created_at timestamptz not null default now()
);

-- payments
create table if not exists payment_intents (
  intent_id text primary key,
  method text not null,
  amount_minor bigint not null,
  currency text not null,
  status text not null,
  order_id text not null,
  idempotency_key text not null unique,
  fx_rate_id text,
  created_at timestamptz not null default now()
);

create table if not exists fx_daily_rates (
  fx_rate_id text primary key,
  zig_minor_per_usd bigint not null,
  effective_at timestamptz not null,
  set_by text not null,
  created_at timestamptz not null default now()
);

-- fiscal / FDMS outbox
create table if not exists fdms_outbox (
  id text primary key,
  order_id text not null,
  receipt_class text not null,
  amount_minor bigint not null,
  currency text not null,
  channel text not null,
  status text not null,
  gateway text not null default 'zimra_virtual_in_house',
  created_at timestamptz not null default now()
);

-- delivery
create table if not exists delivery_jobs (
  job_id text primary key,
  order_id text not null,
  status text not null,
  assigned_courier_id text,
  distance_meters integer,
  eta_minutes integer,
  created_at timestamptz not null default now()
);

-- platform
create table if not exists processed_events (
  event_id text primary key,
  source text not null,
  processed_at timestamptz not null default now()
);

create table if not exists outbox (
  id text primary key,
  topic text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  published_at timestamptz
);
