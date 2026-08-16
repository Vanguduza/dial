#!/bin/bash
# Local Supabase-compatible role setup so PostgREST + GoTrue behave like the hosted
# project: same role names, same RLS semantics, same service_role bypass.
# Runs once on an empty data volume (Postgres entrypoint contract).
set -euo pipefail

: "${AUTHENTICATOR_PASSWORD:?AUTHENTICATOR_PASSWORD required}"
: "${AUTH_ADMIN_PASSWORD:?AUTH_ADMIN_PASSWORD required}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-SQL
	create extension if not exists pgcrypto;
	create extension if not exists "uuid-ossp";

	do \$\$
	begin
	  if not exists (select 1 from pg_roles where rolname = 'anon') then
	    create role anon nologin noinherit;
	  end if;
	  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
	    create role authenticated nologin noinherit;
	  end if;
	  if not exists (select 1 from pg_roles where rolname = 'service_role') then
	    create role service_role nologin noinherit bypassrls;
	  end if;
	  if not exists (select 1 from pg_roles where rolname = 'authenticator') then
	    create role authenticator login noinherit password '${AUTHENTICATOR_PASSWORD}';
	  else
	    alter role authenticator with login password '${AUTHENTICATOR_PASSWORD}';
	  end if;
	  if not exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
	    create role supabase_auth_admin login createrole password '${AUTH_ADMIN_PASSWORD}';
	  else
	    alter role supabase_auth_admin with login password '${AUTH_ADMIN_PASSWORD}';
	  end if;
	end
	\$\$;

	grant anon, authenticated, service_role to authenticator;

	create schema if not exists auth authorization supabase_auth_admin;
	grant usage on schema auth to anon, authenticated, service_role;

	grant usage on schema public to anon, authenticated, service_role;
	grant all on schema public to service_role;

	-- Existing objects (none on first boot) plus defaults for everything migrations add.
	grant all on all tables in schema public to service_role;
	grant all on all sequences in schema public to service_role;
	alter default privileges in schema public
	  grant all on tables to service_role;
	alter default privileges in schema public
	  grant all on sequences to service_role;
	alter default privileges in schema public
	  grant select, insert, update, delete on tables to authenticated;
	alter default privileges in schema public
	  grant select on tables to anon;
SQL
