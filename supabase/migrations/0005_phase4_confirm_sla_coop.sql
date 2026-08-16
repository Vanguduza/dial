-- Phase 4 prep — confirm-SLA board + co-op live offer shapes (durable).
-- Does NOT claim G4 green. amount_minor = bigint; agency MARKETPLACE only (D-58).
-- Apply after 0004 when DATABASE_URL / Supabase SQL available.

-- Supplier confirm queue (confirm SLA clock)
create table if not exists public.supplier_confirm_orders (
  order_id text primary key,
  supplier_id text not null references public.suppliers (supplier_id),
  customer_id text,
  amount_usd_minor bigint not null check (amount_usd_minor > 0),
  status text not null check (
    status in ('awaiting_confirm', 'confirmed', 'sla_breached')
  ),
  sla_deadline_at timestamptz not null,
  confirmed_at timestamptz,
  payable_from_ai boolean not null default false check (payable_from_ai = false),
  created_at timestamptz not null default now()
);

create index if not exists supplier_confirm_orders_supplier_status_idx
  on public.supplier_confirm_orders (supplier_id, status);

create index if not exists supplier_confirm_orders_sla_deadline_idx
  on public.supplier_confirm_orders (sla_deadline_at)
  where status = 'awaiting_confirm';

-- Co-op live offers (mirror of @dial/promotions SUPPLIER_COOP — integer bps only)
create table if not exists public.supplier_coop_offers (
  campaign_id text primary key,
  supplier_id text not null references public.suppliers (supplier_id),
  offer_ids jsonb not null default '[]'::jsonb,
  supplier_fund_share_bps int not null check (
    supplier_fund_share_bps >= 0 and supplier_fund_share_bps <= 10000
  ),
  dial_fund_share_bps int not null check (
    dial_fund_share_bps >= 0 and dial_fund_share_bps <= 10000
  ),
  floor_net_minor bigint,
  status text not null check (
    status in (
      'proposed',
      'supplier_accepted',
      'ops_approved',
      'live',
      'ended',
      'rejected'
    )
  ),
  payable_from_ai boolean not null default false check (payable_from_ai = false),
  liquor_allowed boolean not null default false check (liquor_allowed = false),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint supplier_coop_shares_sum_10000 check (
    supplier_fund_share_bps + dial_fund_share_bps = 10000
  )
);

create index if not exists supplier_coop_offers_supplier_status_idx
  on public.supplier_coop_offers (supplier_id, status);

alter table public.supplier_confirm_orders enable row level security;
alter table public.supplier_coop_offers enable row level security;

drop policy if exists supplier_confirm_orders_select_own on public.supplier_confirm_orders;
create policy supplier_confirm_orders_select_own on public.supplier_confirm_orders
  for select using (
    auth.uid()::text = supplier_id
    or exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );

drop policy if exists supplier_coop_offers_select_own on public.supplier_coop_offers;
create policy supplier_coop_offers_select_own on public.supplier_coop_offers
  for select using (
    auth.uid()::text = supplier_id
    or exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );
