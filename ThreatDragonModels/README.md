# ThreatDragonModels

OWASP Threat Dragon (Apache-2.0) native storage path for DIAL (**D-48**).

Layout (required for GitHub/GitLab storage provider):

```text
ThreatDragonModels/<model-folder>/<ModelTitle>.json
```

## Models in this repo

| Folder | File | Scope |
| --- | --- | --- |
| `job-reserve` | `JobReservePaymentsWebhooks.json` | Job Reserve, ledger, PSP webhooks |
| `spare-checkout` | `SpareOrderCheckout.json` | Spare order / checkout / promotions |
| `tech-dispatch` | `TechDispatch.json` | Tech jobs & assignment |
| `delivery-dispatch` | `DeliveryDispatch.json` | D-45 delivery + Temporal |
| `whatsapp-flows` | `WhatsAppFlowsDataExchange.json` | WA Cloud API + Flows `data_exchange` |
| `fdms-outbox` | `FdmsOutbox.json` | Virtual FDMS outbox (D-40a) |
| `rls-idor` | `RlsIdorAuthZ.json` | RLS / IDOR / body-identity |

Human index & review cadence: [`docs/threat-models/README.md`](../docs/threat-models/README.md).

## How to open

### Desktop (recommended offline)

1. Install [OWASP Threat Dragon](https://www.threatdragon.com/docs/install/install-desktop.html) (Windows/macOS/Linux).  
2. **File → Open Model** (or Welcome → Open) and select any `ThreatDragonModels/**/*.json`.  
3. Edit STRIDE threats/mitigations; save back into the same path.

### Docker web UI

```bash
docker run -d -p 8080:3000 --name threatdragon owasp/threat-dragon:latest
```

Then open http://localhost:8080 — use local file open/import, or configure GitHub provider so models under `ThreatDragonModels/` sync from this repo ([getting started](https://www.threatdragon.com/docs/usage/getting-started.html)).

Models are Threat Dragon **v2** JSON (`version: "2.0.0"`, `diagramType: STRIDE`). Starter quality — expand before money go-live (T5/T9).

Toolchain: [`DIAL_Security_Toolchain.md`](../DIAL_Security_Toolchain.md).
