-- T2 Catalogue — offers / factory stubs (Pack §15 T2, D-49, D-53, D-58).
-- No owned-inventory / DIAL_OWNED tables (D-58 agency only).

create table if not exists public.master_products (
  id text primary key,
  title text not null,
  brand text,
  created_at timestamptz not null default now()
);

create table if not exists public.offers (
  offer_id text primary key,
  master_product_id text not null references public.master_products(id),
  title text not null,
  unit_price_usd_minor bigint not null,
  currency text not null default 'USD' check (currency = 'USD'),
  quality_tier text not null,
  offer_source text not null check (offer_source = 'MARKETPLACE'),
  supplier_formality text not null check (supplier_formality in ('formal', 'informal')),
  created_at timestamptz not null default now()
);

create table if not exists public.catalogue_ingest_batches (
  batch_id text primary key,
  status text not null,
  row_count int not null,
  created_at timestamptz not null default now()
);

create table if not exists public.catalogue_review_queue (
  review_id text primary key,
  batch_id text not null references public.catalogue_ingest_batches(batch_id),
  offer_id text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.search_no_result_events (
  event_id text primary key,
  query text not null,
  session_role text not null check (session_role in ('b2c', 'b2b')),
  created_at timestamptz not null default now()
);
