---
name: Production grade ERP environment
overview: "Take DIAL from \"broad surface, memory-backed foundations\" to a production-grade, locally-runnable ERP: Postgres as the real source of record, hardened APIs, real self-hosted MapLibre maps using the GTR blank-map lessons, buildable/releasable native apps, and containerised deploy-agnostic packaging with ops runbooks — so that plugging in keys and choosing a host requires zero further coding."
todos:
  - id: w5-stack
    content: "W5: Dockerfiles for gateway-web and both workers, docker-compose.prod.yml, one-command bootstrap script, env contract fixes (DIAL_GATEWAY_BASE_URL, INTEGRATION_ENV_GROUPS alignment), Checkov clean, local-production-environment runbook"
    status: completed
  - id: w1-migrations
    content: "W1a: Migrations 0007+ closing the Pack §7 gap with RLS and indexes (customers, technicians, jobs, checklists, pricing, promotions, psp_events/cod_attempts, payouts, fx versions, fiscal_days/withholding/itf263, delivery zones/pod_media/runs/stops, disputes, legal, trust, simulation, audit_events) plus naming reconciliation"
    status: completed
  - id: w1-reads
    content: "W1b: Flip read paths to Postgres in sandbox/live for ledger, payments, catalogue, delivery, jobs, promotions, tax; move sessions to Redis-backed store; add compose-backed integration CI job"
    status: completed
  - id: w2-authz
    content: "W2a: Fix IDOR on grocery/track, spare/garage, spare/returns, grocery/slot and wire assertResourceAccess across id-bearing routes; add Semgrep rule and audit coverage"
    status: completed
  - id: w2-validation
    content: "W2b: Shared Zod request layer on all mutating routes, uniform error envelope with request IDs, Redis rate limiting, role-based admin auth with step-up, health endpoint split, middleware HSTS/CSP/prod origins, route integration tests"
    status: completed
  - id: w3-web-map
    content: "W3a: Add maplibre-gl and build DialMap with raster fallback, style watchdog, resize observer; replace all stub map canvases (admin track/dispatch, delivery track/courier, grocery track, address picker)"
    status: completed
  - id: w3-selfhost
    content: "W3b: infra/maps with Planetiler Zimbabwe extract, tileserver-gl, Nominatim, OSRM, VROOM compose profile; wire MAP_TILES_STYLE_URL/NOMINATIM_URL/OSRM_URL/VROOM_URL and prove maps health green (closes ENH-013 locally)"
    status: completed
  - id: w3-native-map
    content: "W3c: Android MapLibre module carrying the GTR blank-map prevention rules (textureMode, no setStyle at 0x0, keep GL warm on tab switch, resume repaint vs reload, stall retry, loopback fallback to OpenFreeMap) with unit tests"
    status: completed
  - id: w4-build-blockers
    content: "W4a: Fix Modifier.Modifier compile errors; commit a real iOS Xcode project (XcodeGen) wiring DialCustomerApp with assets, entitlements, archive/export config"
    status: completed
  - id: w4-release
    content: "W4b: Release plumbing on all four apps (flavors, signingConfig from vault env names, R8/ProGuard, icons, versioning), secure session persistence, retry, misconfigured-gateway state, crash hook, mobile CI jobs"
    status: completed
  - id: w4-depth
    content: "W4c: Deepen technician (job inbox, checklist, CameraX evidence, ITF263, take-home) and delivery (offer inbox, native map nav, POD capture, COD reconcile, foreground location) beyond single debug screens with real permissions"
    status: completed
  - id: w6-ops
    content: "W6: Structured logging with correlation IDs, error reporting hook, /metrics endpoint, backup scripts plus executed timed restore drill with evidence, incident and degradation runbooks, retention job"
    status: completed
  - id: w7-gates
    content: "W7: Log the stub-map BUG, retract and re-take G5/G7 map evidence against the real GL map, re-evidence G4/G8/G11 on durable Postgres, update STATE, Completion Plan boards, key-drop-in matrix and living docs, commit per workstream"
    status: completed
isProject: false
---

## Production grade ERP environment

### Assumptions from your answers

- Environment runs **locally first**, packaged deploy-agnostic (Dockerfiles + compose + docs). No Vercel/AWS/k8s commitment; a host can be chosen later without code changes.
- Maps are **self-hosted** (Planetiler + tileserver-gl + Nominatim + OSRM + VROOM), closing ENH-013 locally rather than waiting on ops.
- Work is committed to GitHub in reviewable batches per workstream.
- Map degradation surfaces a neutral status only (for example "Raster basemap"), never instructional helper text.

### What the audits found (the honest baseline)

- **Persistence:** `@dial/ledger`, `payments`, `jobs`, `promotions`, `tax`, and most of `catalogue`/`delivery` read from `globalThis` maps. `durableCommerce.ts` / `durableDelivery.ts` / `durableFactory.ts` only *write through*; nothing reads Postgres back. Gateway sessions are a `globalThis` Map, so a restart or a second instance loses every login.
- **Schema:** ~32 tables across [0001–0006](supabase/migrations); Pack §7 needs 100+. Entirely missing: technicians, jobs, projects, pricing, promotions suite, disputes, legal, trust, checklists, simulation, `psp_events`, `cod_attempts`, `fiscal_days`, `withholding_balances`, `itf263_records`, `audit_events`.
- **APIs:** 81 route handlers, zero schema validation (`as` casts). `api/grocery/track`, `api/spare/garage`, `api/spare/returns`, `api/grocery/slot` have no session at all — the caller supplies the identity. `assertResourceAccess` is wired in exactly one route. No rate limiting anywhere.
- **Maps:** `maplibre-gl` is not a dependency. [admin/delivery/track/page.tsx](apps/gateway-web/src/app/admin/delivery/track/page.tsx) fakes pins with `((loc.lng - 30.9) / 0.4) * 100`. The G5/G7 "MapLibre recon" screenshots are therefore stub evidence.
- **Native:** technician and delivery apps fail to compile (`import androidx.compose.ui.Modifier.Modifier`), are single debug screens, and claim Bluetooth/camera/GPS/MapLibre they do not have. iOS has **no Xcode project** — `App/DialCustomerApp.swift` is orphaned from `Package.swift`, so no `.ipa` can exist. No signing, icons, crash sink, or mobile CI in any app.
- **Deploy/ops:** no Dockerfile, no IaC, no backups, restore drill is a 4-step stub, no incident or degradation runbooks, health endpoint is public and leaks integration state.

### Sequencing

```mermaid
flowchart TD
  W5[W5 Local prod-like stack and images] --> W1[W1 Durable Postgres core]
  W1 --> W2[W2 API hardening]
  W1 --> W6[W6 Observability and resilience]
  W5 --> W3[W3 Real maps self-hosted]
  W3 --> W4[W4 Native apps production grade]
  W2 --> W6
  W4 --> W7[W7 Gate re-evidence and docs]
  W6 --> W7
```



W5 comes first because W1's integration tests need real Postgres/Redis/Meili in one command.

### W5 — Local production-like stack and images

- `Dockerfile` for [apps/gateway-web](apps/gateway-web) using Next standalone output (`output: "standalone"` in [next.config.ts](apps/gateway-web/next.config.ts)), plus Dockerfiles for `apps/worker-temporal` and `apps/worker-queues`.
- `docker-compose.prod.yml` (deploy-agnostic): postgres, gateway, both workers, redis, meili, temporal + UI, and the maps profile from W3. Existing [docker-compose.yml](docker-compose.yml) stays the light dev path.
- `scripts/dev-up.ps1` / `.sh`: one command to boot infra, apply migrations, seed, and print health.
- Env contract fixes: add `DIAL_GATEWAY_BASE_URL` to [.env.example](.env.example); align `INTEGRATION_ENV_GROUPS` in [integrationsReadiness.ts](apps/gateway-web/src/lib/integrationsReadiness.ts) with `VROOM_URL`, `GEMINI_API_KEY`, `DATABASE_URL`, `WHATSAPP_WABA_ID`, `FDMS_DEVICE_SERIAL`.
- Checkov now has real IaC to scan and must stay HIGH/CRITICAL clean (non-root user, pinned digests, no secrets in build args).
- Runbook `docs/ops/local-production-environment.md`.

### W1 — Durable Postgres core

- Migrations `0007`–`00xx` closing the Pack §7 gap, each with RLS and indexes, grouped by area: customers/addresses/consents; technicians + trades_config; jobs + checklists; pricing; promotions suite; payments `psp_events`/`cod_attempts`; ledger `payouts`; fx versions/conversions; tax `fiscal_days`/`withholding_balances`/`itf263_records`/`tax_treatments`; delivery `zones`/`pod_media`/`runs`/`stops`/`assignment_events`; guarantee, disputes, legal, trust, simulation; platform `audit_events`/`feature_flags`/`metric_contracts`/`operational_alerts`.
- Reconcile naming drift with Pack §7 (`supplier_stock` → `stock_signals`, coop tables) via renaming migrations so the canonical inventory is the schema.
- Flip **read** paths per package: when `integrationMode()` is `sandbox|live`, read Postgres; keep memory strictly for fixture/CI. Order: `ledger` → `payments` → `catalogue` orders/carts/returns → `delivery` → `jobs` → `promotions` → `tax`.
- Session store out of process memory: Redis-backed sessions (or Supabase JWT verification) in [session.ts](apps/gateway-web/src/lib/auth/session.ts), so restart and multi-instance survive.
- CI: new job that boots compose Postgres/Redis/Meili, applies every migration, and runs integration tests against them — durability regressions fail the build.

### W2 — API hardening

- Shared Zod request layer in `packages/shared` (`parseJsonBody(schema)`), applied to all mutating routes, rejecting unknown fields, returning one error envelope `{ error, code, requestId }`.
- Close the IDOR set: session + object-level `assertResourceAccess` on `grocery/track`, `spare/garage`, `spare/returns`, `grocery/slot`, and every `:id`/order/job/vehicle route. Extend `dial-rls-idor-audit` and add a Semgrep rule so a route reading `customerId` from query fails CI.
- Redis token-bucket rate limiting on auth, checkout, search, and webhooks (in-memory fallback in fixture).
- Admin authorization: role-based admin session plus step-up for money operations; `INTERNAL_API_SECRET` narrows to machine-to-machine callers only.
- Health split: public `/api/health/live` (liveness only) versus protected `/api/health/integrations`.
- [middleware.ts](apps/gateway-web/src/middleware.ts): HSTS, Permissions-Policy, nonce-based CSP dropping prod `unsafe-inline`, and production origins from env instead of the localhost allowlist.
- Route-level integration tests for auth, checkout, webhook replay/bad-signature, and each fixed IDOR route.

### W3 — Real maps, self-hosted, blank-map-proof

Adopting the GTR implementation notes you asked for.

- Add `maplibre-gl`; build `DialMap` in `apps/gateway-web/src/components/map/` with: style URL from `MAP_TILES_STYLE_URL`, inline **raster fallback style** if the vector style JSON fails, a **10 s style watchdog**, `isStyleLoadError` classification, `ResizeObserver` → `map.resize()`, and re-apply of sources on `style.load` — mirroring `C:\Nissan GTR auto\apps\web\lib\map-basemap.ts` and `staff-delivery-live-map.tsx`.
- Replace every stub canvas with real GL: admin delivery [track](apps/gateway-web/src/app/admin/delivery/track/page.tsx) and [dispatch](apps/gateway-web/src/app/admin/delivery/dispatch/page.tsx), customer [delivery/track](apps/gateway-web/src/app/delivery/track/page.tsx), [delivery/courier](apps/gateway-web/src/app/delivery/courier/page.tsx), grocery track, and an address pin picker on [account/addresses](apps/gateway-web/src/app/account/addresses/page.tsx).
- `infra/maps/`: Planetiler prepare scripts producing a Zimbabwe `basemap.mbtiles` (~130 MB, z0–14, gitignored, simplified water), tileserver-gl on 8081, plus Nominatim, OSRM, and VROOM services in a compose profile. This closes **ENH-013** locally and makes `pingMapsHealth` genuinely green.
- Android native map module (`bridges/android/maps` style) carrying the GTR prevention rules verbatim, with unit tests for each decision function: `textureMode(true)`; never `setStyle` at 0×0 (`shouldWaitForMapLayout`, `shouldCommitStyleCallback`); tab hide keeps GL warm and never reloads style; after real `ON_STOP` resume repaints unless `getStyle()==null`, with ~120 ms deferred GL rebind; 2.5 s stall retry plus `addOnDidFailLoadingMapListener`; loopback/RFC1918 style URLs fall back to OpenFreeMap Liberty, never demotiles; MapLibre Android ≥ 11.8.5.

### W4 — Native apps to production grade

- Fix the compile blockers in [technician](apps/technician-android/app/src/main/java/zw/co/dial/technician/ui/TechnicianApp.kt) and [delivery](apps/delivery-android/app/src/main/java/zw/co/dial/delivery/ui/DeliveryApp.kt) (`Modifier.Modifier`).
- iOS: commit a real Xcode project (XcodeGen `project.yml` so it is reviewable and reproducible) wiring `App/DialCustomerApp.swift` + `DialCustomerCore`, asset catalog, entitlements, archive/export options — currently no `.ipa` is possible at all.
- Release plumbing on all four apps: `local` / `staging` / `prod` flavors (cleartext only in `local`), `signingConfig` reading the vault env names, R8 + ProGuard rules, launcher icons, real `versionCode`/`versionName`.
- Depth where the audit found single debug screens: technician gets job inbox → checklist → evidence capture (CameraX) → ITF263 → take-home, with real permissions; delivery gets offer inbox → native map navigation → POD capture → COD reconcile with a foreground-service location pipeline instead of button-triggered HTTP.
- Shared hardening: Keychain / EncryptedSharedPreferences session persistence, retry with backoff, an explicit misconfigured-gateway error state (not a silent empty base URL), and a crash-reporting hook that no-ops until a DSN is dropped in.
- Mobile CI jobs: Gradle assemble + unit tests; Swift build/test on a macOS runner.

### W6 — Observability, resilience, ops

- Structured logging (pino) with request correlation IDs threaded through routes and workers; OpenTelemetry-shaped so a collector is a config change.
- Error reporting behind env (no-op without DSN), plus a Prometheus text `/metrics` endpoint.
- Backup and restore for real: `pg_dump` + Meili dump scripts on a schedule, then execute a **timed restore drill** and record RTO/RPO evidence, replacing the stub at [restore-drill.md](docs/security/restore-drill.md).
- Write the runbooks G12 requires and the repo lacks: incident response, and degradation paths (§6.22) for Auth, Meili, PSP, WhatsApp, and maps outages.
- Data retention job plus Resend/Brevo consent path proven locally.

### W7 — Gate re-evidence, honesty, and docs

- Retract map-derived evidence: the G5 "admin MapLibre pin updates" and G7 Module E map cells were screenshots of a placeholder. Log a BUG, re-run the recon against the real GL map, and re-claim only then. G4/G8/G11 need re-evidence after W1 flips reads to Postgres, since their green rests partly on in-memory spines.
- Update [STATE](docs/planning/DIAL_Build_Workplan_STATE.md), the [Completion Plan](docs/planning/DIAL_Full_ERP_Completion_Plan.md) evidence boards, [key-drop-in-readiness.md](docs/integrations/key-drop-in-readiness.md) (its footer is stale), and living root docs in the same batches.
- Commit per workstream to GitHub.

### What stays blocked on you (no coding left after these arrive)

Real store signing (Play upload keystore, Apple distribution cert) and a public staging URL for G3/G6 device evidence; live EcoCash/Paynow portal keys; ENH-020 escrow partner; ENH-021 Meta WABA and approved template IDs; ENH-022 ZIMRA credentials; live Langfuse/Promptfoo keys; and Appendix C / S99, which remains yours alone. Everything above is built so these plug in without further code.