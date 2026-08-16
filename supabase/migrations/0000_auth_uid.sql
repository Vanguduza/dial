-- Stub auth.uid() so Pack §12 RLS compiles on plain Postgres (CI / first boot).
-- Hosted Supabase / GoTrue already provide this; we only create it when missing.

create schema if not exists auth;

do $$
begin
  if to_regprocedure('auth.uid()') is null then
    execute $fn$
      create function auth.uid()
      returns uuid
      language sql
      stable
      as $body$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $body$
    $fn$;
  end if;
end $$;
