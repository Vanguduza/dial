-- Phase 4 prep — supplier costs/stock, heartbeats, Factory queues, take-rate.
-- Does NOT claim G4 green. amount_minor = bigint; agency MARKETPLACE only (D-58).
-- No DIAL_OWNED / liquor tables. Apply via Supabase CLI when DATABASE_URL is set.

-- suppliers (agency profiles)
create table if not exists public.suppliers (
  supplier_id text primary key,
  display_name text not null,
  formality text not null check (formality in ('formal', 'informal')),
  tier text not null check (tier in ('bronze', 'silver', 'gold', 'platinum')),
  offer_source text not null default 'MARKETPLACE' check (offer_source = 'MARKETPLACE'),
  onboarded_at timestamptz not null default now()
);

-- supplier_costs (PD6) — batch header + jsonb rows (USD minor integers)
create table if not exists public.supplier_costs (
  batch_id text primary key,
  supplier_id text not null references public.suppliers (supplier_id),
  currency text not null default 'USD' check (currency = 'USD'),
  status text not null check (status in ('received', 'pending_review')),
  rows jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- supplier stock uploads (PD84) → pending_review (never auto-publish)
create table if not exists public.supplier_stock (
  batch_id text primary key,
  supplier_id text not null references public.suppliers (supplier_id),
  currency text not null default 'USD' check (currency = 'USD'),
  status text not null check (status in ('pending_review', 'published', 'rejected')),
  offer_source text not null default 'MARKETPLACE' check (offer_source = 'MARKETPLACE'),
  payable_from_ai boolean not null default false check (payable_from_ai = false),
  rows jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- heartbeats (PD38)
create table if not exists public.heartbeats (
  heartbeat_id text primary key,
  supplier_id text not null references public.suppliers (supplier_id),
  channel text not null check (channel in ('dashboard', 'whatsapp')),
  note text not null default 'ok',
  created_at timestamptz not null default now()
);

create index if not exists heartbeats_supplier_created_idx
  on public.heartbeats (supplier_id, created_at desc);

-- SLA escalations (heartbeat stale/missing + confirm breach) — ops only, not money
create table if not exists public.sla_escalations (
  escalation_id text primary key,
  supplier_id text not null references public.suppliers (supplier_id),
  kind text not null check (kind in ('confirm_sla_breach', 'heartbeat_stale')),
  order_id text,
  status text not null check (status in ('open', 'acked')),
  payable_from_ai boolean not null default false check (payable_from_ai = false),
  created_at timestamptz not null default now()
);

create index if not exists sla_escalations_supplier_status_idx
  on public.sla_escalations (supplier_id, status);

-- Catalogue Factory (Pack §15 / D-53) — human approve before Meili
create table if not exists public.master_products (
  id text primary key,
  title text not null,
  brand text,
  created_at timestamptz not null default now()
);

create table if not exists public.catalogue_ingest_batches (
  batch_id text primary key,
  status text not null check (
    status in ('pending_review', 'approved', 'rejected', 'published')
  ),
  row_count int not null check (row_count >= 1),
  vertical text not null default 'spare' check (vertical in ('spare', 'grocery')),
  published_offer_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.catalogue_review_queue (
  review_id text primary key,
  batch_id text not null references public.catalogue_ingest_batches (batch_id),
  offer_id text not null,
  status text not null check (
    status in ('queued', 'claimed', 'approved', 'rejected')
  ),
  vertical text not null default 'spare' check (vertical in ('spare', 'grocery')),
  claimed_by text,
  claimed_at timestamptz,
  draft jsonb,
  created_at timestamptz not null default now()
);

-- Ops take-rate ladder (integer bps only — AI never writes payable)
create table if not exists public.take_rate_ladders (
  ladder_id text primary key,
  vertical text not null check (vertical = 'grocery'),
  label text not null,
  tiers jsonb not null,
  status text not null check (status in ('draft', 'published')),
  published_at timestamptz,
  set_by text not null,
  payable_from_ai boolean not null default false check (payable_from_ai = false),
  liquor_allowed boolean not null default false check (liquor_allowed = false),
  created_at timestamptz not null default now()
);

-- RLS (service role bypasses; authenticated supplier/admin policies)
alter table public.suppliers enable row level security;
alter table public.supplier_costs enable row level security;
alter table public.supplier_stock enable row level security;
alter table public.heartbeats enable row level security;
alter table public.sla_escalations enable row level security;
alter table public.catalogue_ingest_batches enable row level security;
alter table public.catalogue_review_queue enable row level security;
alter table public.take_rate_ladders enable row level security;
alter table public.master_products enable row level security;

drop policy if exists suppliers_select_own on public.suppliers;
create policy suppliers_select_own on public.suppliers
  for select using (
    auth.uid()::text = supplier_id
    or exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );

drop policy if exists supplier_costs_select_own on public.supplier_costs;
create policy supplier_costs_select_own on public.supplier_costs
  for select using (
    auth.uid()::text = supplier_id
    or exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );

drop policy if exists supplier_stock_select_own on public.supplier_stock;
create policy supplier_stock_select_own on public.supplier_stock
  for select using (
    auth.uid()::text = supplier_id
    or exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );

drop policy if exists heartbeats_select_own on public.heartbeats;
create policy heartbeats_select_own on public.heartbeats
  for select using (
    auth.uid()::text = supplier_id
    or exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );

drop policy if exists sla_escalations_admin on public.sla_escalations;
create policy sla_escalations_admin on public.sla_escalations
  for all using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );

drop policy if exists catalogue_batches_admin on public.catalogue_ingest_batches;
create policy catalogue_batches_admin on public.catalogue_ingest_batches
  for all using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );

drop policy if exists catalogue_review_admin on public.catalogue_review_queue;
create policy catalogue_review_admin on public.catalogue_review_queue
  for all using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );

drop policy if exists take_rate_admin on public.take_rate_ladders;
create policy take_rate_admin on public.take_rate_ladders
  for all using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );

drop policy if exists master_products_admin on public.master_products;
create policy master_products_admin on public.master_products
  for all using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );
