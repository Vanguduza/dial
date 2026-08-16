# Workers — Temporal + Redis (fail-closed wiring)

**Purpose:** Eng-safe prep for later phases (G5 delivery Temporal, G4/G8 queue drains). Does **not** claim Phase 5+ gates green.

**Pack §6 env (names only):** `TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE`, `REDIS_URL`, `INTERNAL_API_SECRET`.

## Compose

```powershell
pnpm compose:up
# Temporal UI / server (profile):
docker compose --profile temporal up -d
```

Defaults: Redis `REDIS_URL=redis://127.0.0.1:6379`, Temporal `TEMPORAL_ADDRESS=127.0.0.1:7233`, namespace `default` — see root `.env.example`.

## Fail-closed (sandbox / live)

| Worker | Required | Behaviour without secrets |
| --- | --- | --- |
| `@dial/worker-queues` | `REDIS_URL` + `INTERNAL_API_SECRET` | Exit 1 JSON `{ ok:false }` |
| `@dial/worker-temporal` | `TEMPORAL_ADDRESS` + `INTERNAL_API_SECRET` | Exit 1 JSON `{ ok:false }` |
| `@dial/search-indexer` jobs | `REDIS_URL` + `MEILI_*` | Throw fail-closed (bootstrap Meili-only OK without Redis) |

Fixture mode (`DIAL_INTEGRATION_MODE=fixture`) stays CI-safe: in-process DeliveryDispatch + fixture queue drain — **not** phase-exit evidence.

## Smoke (no secret values echoed)

```powershell
$env:DIAL_INTEGRATION_MODE="sandbox"
Remove-Item Env:REDIS_URL -ErrorAction SilentlyContinue
pnpm --filter @dial/worker-queues start   # expect exit 1

Remove-Item Env:TEMPORAL_ADDRESS -ErrorAction SilentlyContinue
pnpm --filter @dial/worker-temporal start # expect exit 1
```

With compose up + Pack §6 filled: workers poll Redis / Temporal — use for Phase 5 dogfood, not Phase 2 G2 exit.

**Phase 5 dogfood runbook:** [`phase5-delivery-temporal-dogfood.md`](./phase5-delivery-temporal-dogfood.md) · maps Tier-2 stubs: [`maps-tier2-compose.md`](./maps-tier2-compose.md).

## Phase 4 / G4 (green 2026-08-16)

- REST two-supplier dogfood: `scripts/phase4-sandbox-factory-dogfood.mjs` (PostgREST persist + B2B shape check).
- REST → Meili: `listCatalogueReviewsDurable` + `publishRestApprovedFactoryOffersViaIndexer` + `packages/search-indexer/scripts/phase4-sandbox-rest-meili-publish.mjs` (approved formal → live index; `waitForMeiliTask`; search by offerId).
- Confirm-SLA: `phase4PrepOps.test.ts` + `/admin/suppliers/confirm-sla`.
- Admin recon: `apps/gateway-web/scripts/g4-admin-factory-recon.mts` → `docs/ops/evidence/g4/`.
- Phase 5 delivery recon: `g5-admin-delivery-recon.mts` + `g5-maps-tier2-probe.mts` → `docs/ops/evidence/g5/`; start gateway with `dev-with-root-env.mts` for root `.env`.

## Phase 4 prep (historical — absorbed into G4)

- Factory → Meili (in-memory path): `publishFactoryOfferViaIndexer` + `phase4-sandbox-meili-publish.mjs`.

## Related

- Phase 1 runbook: [`phase1-sandbox-dogfood.md`](./phase1-sandbox-dogfood.md)
- Key-drop-in matrix: [`docs/integrations/key-drop-in-readiness.md`](../integrations/key-drop-in-readiness.md)
- Factory → Meili via indexer: `publishFactoryOfferViaIndexer` in `@dial/search-indexer` (Phase 4 prep)
