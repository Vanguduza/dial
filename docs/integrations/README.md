# Integration readiness (API-key drop-in)

**Goal:** Eng shapes match Pack §6 / Stitch §2 so filling `.env` (from `.env.example`) enables sandbox/live without redesign.

**Default:** `DIAL_INTEGRATION_MODE=fixture` — recorded/fixture paths, **no outbound vendor HTTP**, CI green without secrets.

| Mode | Behaviour |
| --- | --- |
| `fixture` | Deterministic adapters; fail-open for missing keys |
| `sandbox` | Vendor sandbox URLs; **fail closed** if required secrets missing |
| `live` | Production endpoints; **fail closed** if required secrets missing |

## Packages

| Package | Covers | Env (see `.env.example`) |
| --- | --- | --- |
| `@dial/adapter-psp` | Paynow / ContiPay / EcoCash / PayPal / COD / escrow | `PAYNOW_*`, `CONTIPAY_*`, `ECOCASH_*`, `PAYPAL_*`, `PSP_ESCROW_*` |
| `@dial/adapter-fdms` | ZIMRA Virtual Gateway open/submit/close | `FDMS_*` |
| `@dial/adapter-maps` | Nominatim / OSRM / VROOM | `NOMINATIM_URL`, `OSRM_URL`, `VROOM_URL` |
| `@dial/adapter-whatsapp` Cloud API | Graph send template/text + GET verify | `WHATSAPP_*` |
| `@dial/catalogue` Meili client | Index settings + upsert | `MEILI_*` |
| `@dial/queues` | BullMQ search + outbox + FDMS day queues | `REDIS_URL`, `INTERNAL_API_SECRET` |
| `@dial/worker-temporal` | DeliveryDispatch in-process + Temporal client/SDK worker | `TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE` |
| `@dial/worker-queues` | BullMQ FDMS day + search-indexer + money outbox workers | `REDIS_URL` (non-fixture) |
| `@dial/search-indexer` | Meili reindex jobs via queues | `MEILI_*`, `REDIS_URL` |
| `@dial/tax` | FDMS outbox drain + fiscal-day open/close | `FDMS_*` |
| `@dial/shared` idempotency | `claimProcessedEvent` (→ SQL `processed_events`) | — |
| `@dial/ai` Promptfoo smoke | `pnpm eval:smoke` / CI guidedIntake no-money | optional `LITELLM_*` |

## Gateway webhook routes

| Route | Adapter |
| --- | --- |
| `POST /api/webhooks/paynow` | Paynow SHA512 |
| `POST /api/webhooks/contipay` | ContiPay HMAC |
| `POST /api/webhooks/ecocash` | EcoCash HMAC |
| `POST /api/webhooks/paypal` | PayPal verify |
| `POST /api/webhooks/escrow` | Escrow hold/capture HMAC |
| `POST /api/webhooks/fdms` | FDMS acknowledge / submit |
| `GET\|POST /api/webhooks/whatsapp` | Meta challenge + HMAC |
| `POST /api/webhooks/psp` | Generic escrow shim (legacy) |
| `GET\|POST /api/admin/fdms/day` | Fiscal-day open/close (fail-closed `INTERNAL_API_SECRET`) |
| `GET\|POST /api/admin/money/outbox` | Money outbox depth + drain (fail-closed `INTERNAL_API_SECRET`) |

## Pre-key-drop checklist (S128)

Before switching `DIAL_INTEGRATION_MODE` to `sandbox` or `live`:

1. Copy `.env.example` → `.env` (never commit secrets).
2. Fill vendor groups you intend to exercise (PSP, WA, FDMS, Meili, maps, Redis, Temporal, LiteLLM).
3. `docker compose up -d redis meilisearch` (+ Temporal profile if needed).
4. `curl -s http://localhost:3000/api/health/integrations | jq '{ready,mode,probes}'`
   - Fixture: expect `"ready": true` with all probes green (no secrets required).
   - Sandbox/live: expect probes green only when required env is set; otherwise probe `ok: false`.
5. Smoke each webhook you enabled (Paynow / ContiPay / EcoCash / PayPal / Escrow / FDMS / WhatsApp) with sig+idempotency.
6. Confirm ops-only items remain tracked: Meta template IDs (ENH-021), escrow contract (ENH-020), ZIMRA field-map (ENH-022).

**`ready` meaning:** aggregate of Temporal, LiteLLM, Maps, FDMS, Meili, Queues, WhatsApp, and PSP health probes — not a substitute for ops credential approval.

## Still ops / credentials (eng continues either way)

- Meta template IDs (`docs/ops/meta-wa-template-ids.md`, ENH-021)
- Escrow partner contract (ENH-020)
- ZIMRA device credentials field-map refine (ENH-022)

## Local compose (S92+)

```bash
docker compose up -d redis meilisearch
docker compose --profile temporal up -d   # optional Temporal + UI
pnpm --filter @dial/worker-temporal start  # in-process DeliveryDispatchWorkflow
pnpm --filter @dial/worker-queues start    # BullMQ workers (fixture exits OK)
pnpm eval:smoke                            # Promptfoo CI golden no-money
curl -s http://localhost:3000/api/health/integrations | jq .
```

See root `docker-compose.yml` and `supabase/migrations/0001_core_tables.sql`.
