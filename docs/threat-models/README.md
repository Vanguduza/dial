# Threat models (D-48)

Index for OWASP Threat Dragon models used in DIAL planning.

## Storage rule

Threat Dragon’s GitHub/desktop storage provider expects:

```text
ThreatDragonModels/<model-folder>/<Model Title>.json
```

at the **repository root**. That path is the editable SoR for TD JSON. This folder is the human index and review notes.

## How to open models

| Client | Steps |
| --- | --- |
| **Desktop** | Install Threat Dragon → Open Model → pick `ThreatDragonModels/**/*.json` |
| **Docker** | `docker run -d -p 8080:3000 owasp/threat-dragon:latest` → http://localhost:8080 → open/import JSON or GitHub sync |

See also [`ThreatDragonModels/README.md`](../../ThreatDragonModels/README.md).

## Models (starter STRIDE — in-repo)

| Model folder | File | Scope | Owners (default) |
| --- | --- | --- | --- |
| `job-reserve` | `JobReservePaymentsWebhooks.json` | Job Reserve, ledger, Paynow/ContiPay/EcoCash/PayPal webhooks | Eng / Money |
| `spare-checkout` | `SpareOrderCheckout.json` | Spare cart/checkout, pricing SoR, `@dial/promotions` | Eng / Spare |
| `tech-dispatch` | `TechDispatch.json` | Tech jobs, assignment eligibility | Eng / Tech |
| `delivery-dispatch` | `DeliveryDispatch.json` | `packages/delivery` + Temporal `DeliveryDispatchWorkflow` (D-45) | Eng / Delivery |
| `whatsapp-flows` | `WhatsAppFlowsDataExchange.json` | Meta Cloud API + Flows `data_exchange` (D-40) | Eng / Messaging |
| `fdms-outbox` | `FdmsOutbox.json` | Virtual FDMS outbox + webhooks (D-40a) | Eng / Fiscal |
| `rls-idor` | `RlsIdorAuthZ.json` | AuthN≠AuthZ, RLS, no body identity (D-47) | Eng / Security |

Optional later: `ai-privacy` (packages/ai — no payable amounts), `customer-gateway` deep-dive (may fold into `rls-idor`).

## Review

Update when adding payment methods, webhook providers, or Temporal workflows. Mitigations should cite Agent Pack AC / `.cursor/rules` / Semgrep `dial.*` rule IDs where applicable.

Cadence: at least each money-train milestone (T5, T9) and before customer-open Appendix C.

Full toolchain: [`DIAL_Security_Toolchain.md`](../../DIAL_Security_Toolchain.md).
