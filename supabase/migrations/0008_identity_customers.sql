-- Pack §7 identity + customers. amount_minor is bigint; pin/landmark/phone on addresses.

create table if not exists public.roles (
  role_id text primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions_meta (
  session_id text primary key,
  user_id text not null references public.profiles (user_id),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  user_agent text
);

create table if not exists public.devices (
  device_id text primary key,
  user_id text not null references public.profiles (user_id),
  platform text not null check (platform in ('android', 'ios', 'web')),
  push_token_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  customer_id text primary key references public.profiles (user_id),
  display_name text,
  phone_e164 text,
  buyer_segment text not null default 'b2c' check (buyer_segment in ('b2c', 'b2b')),
  created_at timestamptz not null default now()
);

create table if not exists public.addresses (
  address_id text primary key,
  customer_id text not null references public.customers (customer_id),
  label text,
  pin_lat double precision,
  pin_lng double precision,
  landmark text,
  phone_e164 text,
  line1 text,
  city text,
  created_at timestamptz not null default now()
);

create table if not exists public.consents (
  consent_id text primary key,
  customer_id text not null references public.customers (customer_id),
  purpose text not null,
  granted boolean not null,
  granted_at timestamptz not null default now()
);

create table if not exists public.vehicle_events (
  event_id text primary key,
  vehicle_id text not null references public.vehicles (vehicle_id),
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.expiry_reminders (
  reminder_id text primary key,
  vehicle_id text not null references public.vehicles (vehicle_id),
  kind text not null,
  due_at timestamptz not null,
  sent_at timestamptz
);

create index if not exists sessions_meta_user_idx on public.sessions_meta (user_id);
create index if not exists devices_user_idx on public.devices (user_id);
create index if not exists addresses_customer_idx on public.addresses (customer_id);
create index if not exists consents_customer_idx on public.consents (customer_id);

alter table public.roles enable row level security;
alter table public.sessions_meta enable row level security;
alter table public.devices enable row level security;
alter table public.customers enable row level security;
alter table public.addresses enable row level security;
alter table public.consents enable row level security;
alter table public.vehicle_events enable row level security;
alter table public.expiry_reminders enable row level security;

create policy roles_admin_all on public.roles for all using (public.dial_is_admin());
create policy sessions_meta_own on public.sessions_meta
  for all using (auth.uid()::text = user_id) with check (auth.uid()::text = user_id);
create policy devices_own on public.devices
  for all using (auth.uid()::text = user_id) with check (auth.uid()::text = user_id);
create policy customers_own on public.customers
  for all using (auth.uid()::text = customer_id) with check (auth.uid()::text = customer_id);
create policy addresses_own on public.addresses
  for all using (auth.uid()::text = customer_id) with check (auth.uid()::text = customer_id);
create policy consents_own on public.consents
  for all using (auth.uid()::text = customer_id) with check (auth.uid()::text = customer_id);
create policy vehicle_events_own on public.vehicle_events
  for select using (
    exists (select 1 from public.vehicles v where v.vehicle_id = vehicle_events.vehicle_id and v.user_id = auth.uid()::text)
  );
create policy expiry_reminders_own on public.expiry_reminders
  for select using (
    exists (select 1 from public.vehicles v where v.vehicle_id = expiry_reminders.vehicle_id and v.user_id = auth.uid()::text)
  );
