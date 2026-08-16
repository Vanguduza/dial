-- Pack §7 remaining catalogue tables. Agency MARKETPLACE only (D-58). No DIAL_OWNED.

create table if not exists public.part_numbers (
  part_number_id text primary key,
  master_product_id text references public.master_products (master_product_id),
  oem text not null,
  normalised_oem text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cross_refs (
  cross_ref_id text primary key,
  from_oem text not null,
  to_oem text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.quality_tier_rules (
  rule_id text primary key,
  quality_tier text not null check (quality_tier in ('OEM', 'OES', 'Aftermarket')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.fitment_claims (
  claim_id text primary key,
  offer_id text,
  chassis_code text,
  engine_code text,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicle_master (
  vehicle_master_id text primary key,
  make text not null,
  model text not null,
  year_from integer,
  year_to integer,
  chassis_code text,
  engine_code text
);

create table if not exists public.catalog_nodes (
  node_id text primary key,
  parent_id text references public.catalog_nodes (node_id),
  vertical text not null check (vertical in ('spare', 'grocery')),
  name text not null
);

create table if not exists public.restricted_sku_rules (
  rule_id text primary key,
  kind text not null check (kind in ('liquor', 'age_gate', 'informal_b2b')),
  pattern text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.catalogue_ingest_rows (
  row_id text primary key,
  batch_id text not null references public.catalogue_ingest_batches (batch_id),
  line_no integer not null,
  payload jsonb not null,
  status text not null default 'queued'
);

create table if not exists public.search_no_result_events (
  event_id text primary key,
  vertical text not null check (vertical in ('spare', 'grocery')),
  query text not null,
  buyer_segment text,
  created_at timestamptz not null default now()
);

create table if not exists public.demand_gap_aggregates (
  aggregate_id text primary key,
  vertical text not null,
  query text not null,
  no_result_count integer not null default 0,
  window_start timestamptz not null,
  window_end timestamptz not null
);

create table if not exists public.catalogue_ai_candidates (
  candidate_id text primary key,
  batch_id text,
  draft jsonb not null,
  payable_from_ai boolean not null default false check (payable_from_ai = false),
  status text not null default 'shadow',
  created_at timestamptz not null default now()
);

create index if not exists part_numbers_oem_idx on public.part_numbers (normalised_oem);
create index if not exists fitment_claims_offer_idx on public.fitment_claims (offer_id);
create index if not exists search_no_result_query_idx on public.search_no_result_events (vertical, created_at desc);

alter table public.part_numbers enable row level security;
alter table public.cross_refs enable row level security;
alter table public.quality_tier_rules enable row level security;
alter table public.fitment_claims enable row level security;
alter table public.vehicle_master enable row level security;
alter table public.catalog_nodes enable row level security;
alter table public.restricted_sku_rules enable row level security;
alter table public.catalogue_ingest_rows enable row level security;
alter table public.search_no_result_events enable row level security;
alter table public.demand_gap_aggregates enable row level security;
alter table public.catalogue_ai_candidates enable row level security;

create policy part_numbers_select on public.part_numbers for select using (auth.uid() is not null);
create policy part_numbers_admin on public.part_numbers for all using (public.dial_is_admin());
create policy cross_refs_select on public.cross_refs for select using (auth.uid() is not null);
create policy quality_tier_admin on public.quality_tier_rules for all using (public.dial_is_admin());
create policy fitment_select on public.fitment_claims for select using (auth.uid() is not null);
create policy vehicle_master_select on public.vehicle_master for select using (auth.uid() is not null);
create policy catalog_nodes_select on public.catalog_nodes for select using (auth.uid() is not null);
create policy restricted_sku_admin on public.restricted_sku_rules for all using (public.dial_is_admin());
create policy ingest_rows_admin on public.catalogue_ingest_rows for all using (public.dial_is_admin());
create policy no_result_admin on public.search_no_result_events for all using (public.dial_is_admin());
create policy demand_gap_admin on public.demand_gap_aggregates for all using (public.dial_is_admin());
create policy ai_candidates_admin on public.catalogue_ai_candidates for all using (public.dial_is_admin());
