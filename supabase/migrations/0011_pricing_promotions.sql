-- Pack §7 pricing + promotions. Promo credit is never cash-out (D-42). amount_minor bigint.

create table if not exists public.rate_cards (
  rate_card_id text primary key,
  job_class_id text,
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.rate_card_versions (
  version_id text primary key,
  rate_card_id text not null references public.rate_cards (rate_card_id),
  amount_minor bigint not null,
  currency text not null check (currency in ('USD', 'ZWG')),
  effective_at timestamptz not null,
  set_by text not null
);

create table if not exists public.delivery_bands (
  band_id text primary key,
  zone_id text,
  amount_minor bigint not null,
  currency text not null check (currency in ('USD', 'ZWG'))
);

create table if not exists public.price_quotes (
  quote_id text primary key,
  subject_id text not null,
  amount_minor bigint not null,
  currency text not null check (currency in ('USD', 'ZWG')),
  source text not null check (source in ('rate_card', 'human')),
  payable_from_ai boolean not null default false check (payable_from_ai = false),
  created_at timestamptz not null default now()
);

create table if not exists public.promo_campaigns (
  campaign_id text primary key,
  title text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.promo_campaign_budgets (
  budget_id text primary key,
  campaign_id text not null references public.promo_campaigns (campaign_id),
  amount_minor bigint not null,
  currency text not null check (currency = 'USD')
);

create table if not exists public.promo_budget_usages (
  usage_id text primary key,
  budget_id text not null references public.promo_campaign_budgets (budget_id),
  amount_minor bigint not null,
  currency text not null check (currency = 'USD'),
  created_at timestamptz not null default now()
);

create table if not exists public.promo_promotions (
  promotion_id text primary key,
  campaign_id text references public.promo_campaigns (campaign_id),
  title text not null,
  status text not null
);

create table if not exists public.promo_application_methods (
  method_id text primary key,
  promotion_id text not null references public.promo_promotions (promotion_id),
  kind text not null
);

create table if not exists public.promo_rules (
  rule_id text primary key,
  promotion_id text not null references public.promo_promotions (promotion_id),
  kind text not null
);

create table if not exists public.promo_rule_values (
  value_id text primary key,
  rule_id text not null references public.promo_rules (rule_id),
  value_text text
);

create table if not exists public.promo_segments (
  segment_id text primary key,
  title text not null,
  filter jsonb not null default '{}'::jsonb
);

create table if not exists public.promo_buyget_rules (
  buyget_id text primary key,
  promotion_id text not null references public.promo_promotions (promotion_id),
  buy_qty integer not null,
  get_qty integer not null
);

create table if not exists public.promo_redemptions (
  redemption_id text primary key,
  promotion_id text not null references public.promo_promotions (promotion_id),
  customer_id text not null references public.profiles (user_id),
  order_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.promo_credit_ledger (
  entry_id text primary key,
  credit_id text not null references public.promo_credits (credit_id),
  amount_minor bigint not null,
  currency text not null check (currency = 'USD'),
  memo text,
  created_at timestamptz not null default now()
);

create table if not exists public.promo_validation_traces (
  trace_id text primary key,
  promotion_id text,
  customer_id text,
  result text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.referral_programs (
  program_id text primary key,
  title text not null,
  status text not null
);

create table if not exists public.referral_codes (
  code_id text primary key,
  program_id text not null references public.referral_programs (program_id),
  customer_id text not null references public.profiles (user_id),
  code text not null unique
);

create table if not exists public.referral_edges (
  edge_id text primary key,
  code_id text not null references public.referral_codes (code_id),
  referred_customer_id text not null references public.profiles (user_id),
  created_at timestamptz not null default now()
);

create table if not exists public.supplier_coop_agreements (
  agreement_id text primary key,
  supplier_id text not null references public.suppliers (supplier_id),
  share_bps integer not null check (share_bps >= 0 and share_bps <= 10000),
  status text not null,
  created_at timestamptz not null default now()
);

create index if not exists promo_redemptions_customer_idx on public.promo_redemptions (customer_id);
create index if not exists rate_card_versions_card_idx on public.rate_card_versions (rate_card_id, effective_at desc);

alter table public.rate_cards enable row level security;
alter table public.rate_card_versions enable row level security;
alter table public.delivery_bands enable row level security;
alter table public.price_quotes enable row level security;
alter table public.promo_campaigns enable row level security;
alter table public.promo_campaign_budgets enable row level security;
alter table public.promo_budget_usages enable row level security;
alter table public.promo_promotions enable row level security;
alter table public.promo_application_methods enable row level security;
alter table public.promo_rules enable row level security;
alter table public.promo_rule_values enable row level security;
alter table public.promo_segments enable row level security;
alter table public.promo_buyget_rules enable row level security;
alter table public.promo_redemptions enable row level security;
alter table public.promo_credit_ledger enable row level security;
alter table public.promo_validation_traces enable row level security;
alter table public.referral_programs enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referral_edges enable row level security;
alter table public.supplier_coop_agreements enable row level security;

create policy rate_cards_select on public.rate_cards for select using (auth.uid() is not null);
create policy rate_cards_admin on public.rate_cards for all using (public.dial_is_admin());
create policy promo_admin on public.promo_campaigns for all using (public.dial_is_admin());
create policy promo_redemptions_own on public.promo_redemptions
  for select using (auth.uid()::text = customer_id);
create policy promo_credit_ledger_admin on public.promo_credit_ledger for all using (public.dial_is_admin());
create policy referral_codes_own on public.referral_codes
  for select using (auth.uid()::text = customer_id);
create policy coop_admin on public.supplier_coop_agreements for all using (public.dial_is_admin());
