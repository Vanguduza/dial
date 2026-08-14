-- PD1 Identity — profiles + RLS (Pack §12 / §15 / D-47).
-- Aligns auth.uid() policies with DialSession user_id text.
-- Service role never in mobile/web bundles.
-- Apply via Supabase CLI when DATABASE_URL / local Supabase is configured.

create table if not exists public.profiles (
  user_id text primary key,
  email text not null unique,
  display_name text not null,
  role text not null default 'customer'
    check (role in ('customer', 'technician', 'supplier', 'admin')),
  buyer_segment text not null default 'b2c'
    check (buyer_segment in ('b2c', 'b2b')),
  created_at timestamptz not null default now()
);

-- Backfill columns if 0001_core_tables stub already created a thinner table
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists buyer_segment text not null default 'b2c';

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_delete_own on public.profiles;
drop policy if exists profiles_admin_all on public.profiles;

create policy profiles_select_own on public.profiles
  for select using (auth.uid()::text = user_id);

create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid()::text = user_id);

create policy profiles_update_own on public.profiles
  for update using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

create policy profiles_delete_own on public.profiles
  for delete using (auth.uid()::text = user_id);

create policy profiles_admin_all on public.profiles
  for all using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );
