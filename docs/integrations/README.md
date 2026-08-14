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
| `@dial/adapter-psp` | Paynow / ContiPay / EcoCash / PayPal / COD / escrow + `pingPspHealth` | `PAYNOW_*`, `CONTIPAY_*`, `ECOCASH_*`, `PAYPAL_*`, `PSP_ESCROW_*` |
| `@dial/adapter-fdms` | ZIMRA Virtual Gateway open/submit/close + `pingFdmsHealth` | `FDMS_*` |
| `@dial/adapter-maps` | Nominatim / OSRM / VROOM + `pingMapsHealth` | `NOMINATIM_URL`, `OSRM_URL`, `VROOM_URL` |
| `@dial/adapter-whatsapp` | Cloud API send/verify + templates + `pingWhatsAppHealth` | `WHATSAPP_*`, optional `WA_TEMPLATE_*` |
| `@dial/catalogue` | Meili client + informal B2B leak=0 + `pingMeiliHealth` | `MEILI_*` |
| `@dial/payments` | Checkout / Job Reserve / FX / PSP admit SoR | (via PSP adapters) |
| `@dial/ledger` | Journal + `drainMoneyOutbox` → fiscal side-effects | — |
| `@dial/queues` | BullMQ search + outbox + FDMS day + `pingQueuesHealth` | `REDIS_URL`, `INTERNAL_API_SECRET` |
| `@dial/worker-temporal` | DeliveryDispatch in-process + Temporal client/SDK + `pingTemporalHealth` | `TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE` |
| `@dial/worker-queues` | BullMQ FDMS day + search-indexer + money outbox workers | `REDIS_URL` (non-fixture) |
| `@dial/search-indexer` | Meili reindex jobs via queues | `MEILI_*`, `REDIS_URL` |
| `@dial/tax` | FDMS outbox drain + fiscal-day open/close | `FDMS_*` |
| `@dial/shared` | Idempotency + `pingInternalApiHealth` | `INTERNAL_API_SECRET` (sandbox/live) |
| `@dial/ai` | Promptfoo smoke + `pingLiteLlm` | optional `LITELLM_*` |
| `@dial/gateway-web` | Health / OpenAPI / webhooks / admin readiness UI | all groups above |

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

**`ready` meaning:** aggregate of Temporal, LiteLLM, Maps, FDMS, Meili, Queues, WhatsApp, PSP, and Internal API secret health probes — not a substitute for ops credential approval.

### Health groups ↔ `.env.example` (S132 / S139 / S140)

**SoR:** `INTEGRATION_ENV_GROUPS` in `apps/gateway-web/src/lib/integrationsReadiness.ts` (via `listIntegrationEnvGroupSnapshots`). Ordered label tuple: `INTEGRATION_ENV_GROUP_LABELS` (derived — do not maintain a parallel list). Do not edit the table below without updating that constant — smoke tests assert labels + keys against OpenAPI and `.env.example`.

| Health `groups[].label` | Keys (must appear in root `.env.example`) |
| --- | --- |
| `whatsapp` | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` |
| `paynow` | `PAYNOW_INTEGRATION_ID`, `PAYNOW_INTEGRATION_KEY` |
| `contipay` | `CONTIPAY_API_KEY`, `CONTIPAY_API_SECRET`, `CONTIPAY_MERCHANT_ID` |
| `ecocash` | `ECOCASH_API_KEY`, `ECOCASH_MERCHANT_CODE`, `ECOCASH_WEBHOOK_SECRET` |
| `paypal` | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` |
| `escrow` | `PSP_ESCROW_BASE_URL`, `PSP_ESCROW_API_KEY`, `PSP_WEBHOOK_SECRET` |
| `fdms` | `FDMS_BASE_URL`, `FDMS_DEVICE_ID`, `FDMS_ACTIVATION_KEY` |
| `meili` | `MEILI_HOST`, `MEILI_MASTER_KEY` |
| `litellm` | `LITELLM_BASE_URL`, `LITELLM_API_KEY` |
| `maps` | `NOMINATIM_URL`, `OSRM_URL` (+ optional `VROOM_URL`) |
| `temporal` | `TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE` |
| `redis` | `REDIS_URL` |
| `internal` | `INTERNAL_API_SECRET` |

Template overrides (not in health groups): `WA_TEMPLATE_*` — see ENH-021 / `docs/ops/meta-wa-template-ids.md`.

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
# Admin UI (S133): http://localhost:3000/admin/integrations
# OpenAPI skeleton (S134): http://localhost:3000/api/openapi
# Spec file: docs/integrations/openapi-gateway.json
```

See root `docker-compose.yml` and `supabase/migrations/0001_core_tables.sql`.

## OpenAPI skeleton (S134)

Machine-readable outline of health + inbound webhooks + fail-closed admin routes:

- File: [`openapi-gateway.json`](./openapi-gateway.json)
- Live: `GET /api/openapi`

Schemas stay opaque for webhook bodies (signature + idempotency SoR in adapters). Expand fields when vendor contracts lock (ENH-020…022).

**Probes (S137):** OpenAPI `IntegrationsProbes` requires `temporal`, `litellm`, `maps`, `fdms`, `meili`, `queues`, `whatsapp`, `psp`, `internal` — kept in sync with `INTEGRATION_PROBE_KEYS` in gateway-web.

**Env groups (S139/S140/S147):** OpenAPI `groups[].label` enum + `info.x-dial-sor.envGroups` point at `INTEGRATION_ENV_GROUPS`; `info.x-dial-sor.envGroupLabels` points at `INTEGRATION_ENV_GROUP_LABELS` (same module).

**Health `note` (S151/S152/S153/S156/S160/S165/S166/S172):** Response JSON `note` is built by `buildIntegrationsHealthNote(mode)` and includes `groups labels=` followed by the ordered `INTEGRATION_ENV_GROUP_LABELS` tuple (comma-separated). OpenAPI `IntegrationsHealth.note` description documents the same contract — never echoes secret values. Admin UIs (`/admin/integrations`, `/admin/cost-health`) display the note via `truncateIntegrationsHealthNote` capped by `INTEGRATIONS_HEALTH_NOTE_UI_MAX` (full string remains on the element `title` / health JSON) and expose a `note-builder-sor-hint` cross-link to OpenAPI `x-dial-sor.healthNote` + Health JSON. OpenAPI `info.x-dial-sor.healthNote` → builder; `info.x-dial-sor.healthNoteUiMax` → UI max constant in `integrationsReadiness.ts`.
