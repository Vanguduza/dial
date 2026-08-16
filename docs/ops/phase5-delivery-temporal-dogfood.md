# Phase 5 prep — Delivery Temporal dogfood (not G5)

**Status:** Temporal compose stable; sandbox dogfood script proves workflow history + courier POD/COD durable rows; **admin MapLibre T+S+A recon green** (`g5-admin-delivery-recon.mts`). **Do not claim G5** until ENH-013 maps hosting + courier Android device POD evidence.

**Pack §6 env (names only):** `TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE`, `INTERNAL_API_SECRET`, `REDIS_URL`, `NOMINATIM_URL`, `OSRM_URL`, `VROOM_URL`, `MAP_OFFLINE_PACK_BASE_URL`.

## Compose

```powershell
docker compose up -d redis meilisearch
docker compose --profile temporal up -d
# Optional maps Tier-2 profile (ENH-013 hosting still ops):
# docs/ops/maps-tier2-compose.md
```

Set in `.env`: `DIAL_INTEGRATION_MODE=sandbox`, `TEMPORAL_ADDRESS=127.0.0.1:7233`, `TEMPORAL_NAMESPACE=dial`, `INTERNAL_API_SECRET=…`.

## Smoke (eng-safe)

1. `pnpm --filter @dial/worker-temporal test` — fixture in-process + sandbox fail-closed + Phase5-prep options when address+secret set (no live dial required for CI).
2. With Temporal up: `pnpm --filter @dial/worker-temporal start` (sandbox mode) then `apps/gateway-web/scripts/g5-sandbox-delivery-dogfood.mts` → expect `path: "temporal"` + `historyLength` ≥ 2.
3. Open Temporal UI (`http://127.0.0.1:8080`) — `dial` namespace + `DeliveryDispatchWorkflow` history = sandbox evidence.
4. Admin MapLibre recon: start gateway with root `.env` (`scripts/dev-with-root-env.mts`) then `g5-admin-delivery-recon.mts` → `docs/ops/evidence/g5/`.
5. Maps Tier-2 probe: `g5-maps-tier2-probe.mts` — requires `NOMINATIM_URL` + `OSRM_URL` (ENH-013 ops hosting; not default compose).

## Offline packs (MapLibre)

`@dial/delivery` `listOfflinePackDefinitions` / `activateOfflinePack` emit `packUrl` + `styleUrl` when `MAP_OFFLINE_PACK_BASE_URL` is set; otherwise fixture metadata only. Never Google/Mapbox SoR (D-44).

## Explicit non-claims

- In-process fixture worker ≠ G5
- Maps URLs unset ⇒ ENH-013 still open
- G5 depends on G2 (orders to deliver)

## Related

- `docs/ops/workers-temporal-redis.md`
- `docs/ops/maps-tier2-compose.md`
- Completion Plan Phase 5 / G5
