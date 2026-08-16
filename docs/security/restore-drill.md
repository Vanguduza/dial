# Restore drill (executed locally)

**Purpose:** Pack §15 T9 — restore from backup without production secrets in git.

## Procedure

1. `pnpm secrets:local` then `pnpm stack:up` so Postgres/Meili exist.
2. `bash scripts/backup-local.sh backups/drill` — `pg_dump` custom format + Meili dump request.
3. `pnpm stack:down --volumes` then `pnpm stack:up` (empty data volume).
4. `pg_restore --clean --if-exists --dbname "$DATABASE_URL" backups/drill/postgres.dump`
5. `pnpm db:migrate` (no-op if schema already in the dump).
6. Verify: `node scripts/check-pack7-schema.mjs`; sample `orders` / `journal_entries` row counts; Meili `/health`.

## Timed evidence (engineering drill)

| Step | Target RPO/RTO | Notes |
| --- | --- | --- |
| Dump | RPO ≤ 24h (ops schedule) | Custom `pg_dump`; Meili dump is best-effort until keys exist |
| Restore | RTO ≤ 60 min on this machine | Dominated by image pull + `pg_restore` |
| Money check | amount_minor bigint ledgers reconcile | Never invent PSP events; replay outbox only |

This replaces the previous 4-step stub. Evidence JSON: `docs/ops/evidence/restore-drill/latest.json` (from `pnpm restore:drill`). A **staging** timed drill with production-sized data remains an ops Appendix C item.

## Related

- `docs/ops/local-production-environment.md`
- `scripts/backup-local.sh`
- `docs/security/strix-runbook.md`
