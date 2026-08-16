-- Admin helper used by later RLS policies. Profiles exist from 0001/0002.

create or replace function public.dial_is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()::text and p.role = 'admin'
  );
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'grant execute on function public.dial_is_admin() to anon, authenticated, service_role';
  end if;
end $$;
