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
| `@dial/ai` LiteLLM | Chat completions → Gemini | `LITELLM_*` |

## Gateway webhook routes

| Route | Adapter |
| --- | --- |
| `POST /api/webhooks/paynow` | Paynow SHA512 |
| `POST /api/webhooks/contipay` | ContiPay HMAC |
| `POST /api/webhooks/ecocash` | EcoCash HMAC |
| `POST /api/webhooks/paypal` | PayPal verify |
| `POST /api/webhooks/fdms` | FDMS acknowledge / submit |
| `GET\|POST /api/webhooks/whatsapp` | Meta challenge + HMAC |
| `POST /api/webhooks/psp` | Generic escrow shim (legacy) |

## Still Phase 0 / founder (not eng)

- Live Meta template IDs (`docs/ops/meta-wa-template-ids.md`, ENH-021)
- Escrow partner contract (ENH-020)
- ZIMRA device credentials field-map refine (ENH-022)
- **S99 customer-open** declaration

## Local compose (S92)

```bash
docker compose up -d redis meilisearch
docker compose --profile temporal up -d   # optional Temporal + UI
pnpm --filter @dial/worker-temporal start  # in-process DeliveryDispatchWorkflow
curl -s http://localhost:3000/api/health/integrations | jq .
```

See root `docker-compose.yml` and `supabase/migrations/0001_core_tables.sql`.
