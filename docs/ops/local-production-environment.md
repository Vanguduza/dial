# Local production-like environment

Runs the whole DIAL ERP on one machine the way a host would run it: built container
images, durable Postgres, Supabase-compatible auth and REST, Redis, Meilisearch,
Temporal, the gateway and both workers.

**Deploy-agnostic by design.** Nothing here assumes Vercel, AWS, or Kubernetes. The
same images and the same environment contract run wherever the founder later chooses
to host; picking a host is a deployment decision, not a code change.

**Not a gate claim.** Running locally is engineering infrastructure. It does not by
itself satisfy G12 (remote staging cohort) or Appendix C / S99.

## One-time

```powershell
pnpm install
pnpm secrets:local     # writes .env.local (gitignored)
```

`pnpm secrets:local` generates development-only credentials: Postgres passwords, the
GoTrue/PostgREST JWT secret, matching `anon` and `service_role` tokens, the Meili
master key and `INTERNAL_API_SECRET`. Re-running preserves existing values, so a
second run will not invalidate tokens a running stack already trusts.

Vendor keys are never generated. EcoCash, Paynow, Meta, ZIMRA and escrow credentials
are added to `.env.local` by their Pack §6 names when the founder supplies them, and
every adapter stays fail-closed until then.

## Daily

```powershell
pnpm stack:up        # build + boot + apply migrations
pnpm stack:logs      # or: pnpm stack:logs gateway
pnpm stack:down      # add --volumes to discard data
```

`pnpm stack:up --maps` additionally boots the self-hosted map stack from
`docker-compose.maps.yml` (see [maps-self-hosting.md](./maps-self-hosting.md)).

## What runs

- `gateway` on `http://localhost:3000` — Next standalone image, non-root, with a
  liveness healthcheck against `/api/health/live`
- `supabase` on `http://localhost:8000` — nginx fronting GoTrue (`/auth/v1/*`) and
  PostgREST (`/rest/v1/*`), the same paths hosted Supabase exposes, so switching to a
  hosted project is a URL and key change only
- `postgres` on `5432` — durable source of record, roles `anon` / `authenticated` /
  `service_role` / `authenticator` created to match Supabase semantics including
  `service_role` RLS bypass
- `redis` on `6379`, `meilisearch` on `7700`
- `temporal` on `7233` with its UI on `8080`
- `worker-queues` and `worker-temporal` — fail closed when their secrets are unset

## Migrations

```powershell
pnpm db:migrate            # apply pending
node scripts/db-migrate.mjs --dry-run
node scripts/db-migrate.mjs --url postgres://...   # e.g. a hosted Supabase project
```

Applied files are recorded in `dial_migrations` with a checksum. Editing an already
applied migration is reported rather than silently re-run — add a new file instead.

This replaces the Supabase CLI for schema work, which is why BUG-041 (no
`supabase` CLI binary for `win32-x64`) no longer blocks migrations.

## Pointing at hosted infrastructure instead

Every service is addressed by environment variable, so any subset can be swapped for
a managed equivalent without touching code:

- Supabase project: set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
- Managed Redis / Meili / Temporal: set `REDIS_URL`, `MEILI_HOST` + `MEILI_MASTER_KEY`,
  `TEMPORAL_ADDRESS` + `TEMPORAL_NAMESPACE`

## Troubleshooting

- `run pnpm secrets:local first` from compose means `.env.local` is missing a required
  value; regenerate with `pnpm secrets:local`.
- Postgres role errors after changing passwords: role setup runs once per data volume.
  `pnpm stack:down --volumes` then `pnpm stack:up` rebuilds from scratch (destroys data).
- Port already in use: override `GATEWAY_HOST_PORT`, `SUPABASE_HOST_PORT`,
  `POSTGRES_HOST_PORT`, `MEILI_HOST_PORT`, `REDIS_HOST_PORT`, `TEMPORAL_HOST_PORT` or
  `TEMPORAL_UI_HOST_PORT` in `.env.local`.

## Related

- [`docker-compose.prod.yml`](../../docker-compose.prod.yml) — the stack
- [`docker/`](../../docker) — images and Supabase-compatible gateway config
- [`docs/ops/phase1-sandbox-dogfood.md`](./phase1-sandbox-dogfood.md) — G1 evidence path
- [`docs/integrations/key-drop-in-readiness.md`](../integrations/key-drop-in-readiness.md)
