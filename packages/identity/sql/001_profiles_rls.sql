-- T1 Identity — profiles RLS stub (Pack §12 / §15).
-- Applied to live Supabase in Phase 0; mirrored by @dial/identity in-memory RLS tests until then.
-- Service role never in mobile/web bundles.

create table if not exists public.profiles (
  user_id text primary key,
  email text not null unique,
  display_name text not null,
  role text not null check (role in ('customer', 'technician', 'supplier', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Own profile: CRUD own (customer / technician / supplier / admin as self)
create policy profiles_select_own on public.profiles
  for select using (auth.uid()::text = user_id);

create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid()::text = user_id);

create policy profiles_update_own on public.profiles
  for update using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

create policy profiles_delete_own on public.profiles
  for delete using (auth.uid()::text = user_id);

-- Admin: all rows (session role = admin; never body role)
create policy profiles_admin_all on public.profiles
  for all using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()::text and p.role = 'admin'
    )
  );
