# Phase 1 sandbox dogfood (live platform foundation / G1)

**Eng SoR:** [`docs/planning/DIAL_Full_ERP_Completion_Plan.md`](../planning/DIAL_Full_ERP_Completion_Plan.md) §4 Phase 1.  
**Anti-stub:** fixture-only Auth/Meili/Temporal/Redis evidence does **not** exit G1.

## Credentials path (Pack §6 — names only; never commit values)

1. Copy root `.env.example` → `.env` (gitignored).
2. Set `DIAL_INTEGRATION_MODE=sandbox`.
3. Fill at least:

| Group | Keys (see `.env.example`) | Local source |
| --- | --- | --- |
| Core Auth | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` | `npx supabase start` (or hosted sandbox project) — apply `supabase/migrations/0001_*.sql` … `0003_*.sql` |
| Meili | `MEILI_HOST`, `MEILI_MASTER_KEY`, `MEILI_SPARE_INDEX=spare_offers_v1` | `docker compose up -d meilisearch` (default key `dev_master_key_change_me`) |
| Redis | `REDIS_URL` | `docker compose up -d redis` |
| Temporal | `TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE` | `docker compose --profile temporal up -d` |
| Internal | `INTERNAL_API_SECRET` | generate a long random string for sandbox |

Optional vendor groups (PSP/WA/FDMS/maps/LiteLLM) may stay empty for G1 — fail-closed is correct until Phase 8/9.

## Compose boot

```powershell
pnpm compose:up
# optional Temporal:
docker compose --profile temporal up -d
```

## Evidence commands (G1)

```powershell
# 1) Meili non-fixture taskUid + spare_offers_v1 (+ grocery schema)
$env:DIAL_INTEGRATION_MODE="sandbox"
$env:MEILI_HOST="http://127.0.0.1:7700"
$env:MEILI_MASTER_KEY="dev_master_key_change_me"
$env:DIAL_SANDBOX_EVIDENCE="1"
pnpm bootstrap:search
pnpm --filter @dial/search-indexer test

# 2) RLS CI (≥5 priority resources) — always in CI
pnpm --filter @dial/shared test

# 3) Workers fail closed without secrets
$env:DIAL_INTEGRATION_MODE="sandbox"
Remove-Item Env:REDIS_URL -ErrorAction SilentlyContinue
Remove-Item Env:INTERNAL_API_SECRET -ErrorAction SilentlyContinue
pnpm --filter @dial/worker-queues start   # expect exit 1 JSON fail closed
Remove-Item Env:TEMPORAL_ADDRESS -ErrorAction SilentlyContinue
pnpm --filter @dial/worker-temporal start # expect exit 1 JSON fail closed

# 4) Auth GoTrue (requires Supabase sandbox keys in .env)
$env:DIAL_INTEGRATION_MODE="sandbox"
pnpm --filter @dial/identity run dogfood:auth
# Then with gateway running:
# POST /api/auth/sign-in { email, password } → cookie
# GET  /api/auth/me
```

## Migrations

```text
supabase/migrations/0001_core_tables.sql
supabase/migrations/0002_profiles_auth_rls.sql
supabase/migrations/0003_phase1_priority_tables_rls.sql
```

Apply with Supabase CLI against local or sandbox `DATABASE_URL`. CI mirrors Pack §12 policies in `@dial/shared` `rlsPolicies` (cross-tenant deny matrix).

## Honest G1 status checklist

| Gate item | Evidence |
| --- | --- |
| Staging/local compose boots | compose up redis+meili (+ temporal profile) |
| Password → session → `/api/auth/me` | dogfood:auth + gateway recon (non-fixture GoTrue) |
| Meili real taskUid | `pnpm bootstrap:search` JSON `taskUid` ≠ `"fixture"` |
| RLS ≥5 resources | `@dial/shared` G1 RLS tests |
| Workers fail closed | exit 1 when secrets unset in sandbox |
| Pack §6 sandbox catalog | this runbook + `.env.example` |

Customer-open remains Appendix C / Phase 12 human gate — not eng-next.
