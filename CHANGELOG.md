# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project aims to follow [Semantic Versioning](https://semver.org/) once versioned releases begin.

Living doc: update in the **same PR** as the change (Blueprint §8.0.2). Move `Unreleased` entries into a dated version section when tagging.

## [Unreleased]

### Added

- Windows Dev Manager starter `scripts/start-dial-dev-manager-prime.ps1` — starts Cursor bridge if down, launches `prime-agent` with Cursor **Auto** + `/dev-manager` (D-61 harness only; no prod data).
- Root living docs (`README.md`, `CHANGELOG.md`, `ENHANCEMENTS.md`, `BUGS.md`) and Build Blueprint §8.0 requirements for responsive web UX + automatic doc maintenance.
- **D-61** locked companion `DIAL_AI_Kernel_Prime_Agent_Adopted.md` — Dev Manager = Build managerial authority; Prime = mandatory harness hosting it; prod = capability pipeline + Temporal/BullMQ (no agent adapter); §5.3 affirmed.
- Standalone Build paste prompt: `docs/prompts/DIAL_DEV_MANAGER_CURSOR_PROMPT.md` (Dev Manager + D-61 bootstrap; locks through D-61; Cursor models via local bridge/proxy in Auto mode).
- Development Prime harness config under `.prime/agent/` (settings, `APPEND_SYSTEM.md`, `/dev-manager` prompt template) for D-61 bootstrap on Windows (Git Bash `shellPath`).
- Prime Agent default model provider set to **Cursor** via local `cursor-api-proxy` bridge (`~/.prime/agent/models.json` + `start-cursor-bridge.ps1`); project + machine **`defaultModel: auto`** (Auto mode for Dev Manager).
- `.prime/agent/APPEND_SYSTEM.md` + `/dev-manager` strengthened for workplan STATE auto-advance / autonomous runbook idle ban (synced from paste prompt).
- Dev Manager **autonomous runbook** (`docs/planning/DIAL_Dev_Manager_Autonomous_Runbook.md`) — prefer/lock defaults; no founder wait; E2a [#1](https://github.com/Vanguduza/dial/issues/1) active.
- E2a expand: 18-item CPA disclosure, Tech intake/emergency (no AI price), Chatwoot handoff ids, §10 returns/referral/consent stubs, Paynow URL checkout button, gateway `POST /api/webhooks/whatsapp`, Baileys absence test evidence.
- **End-to-end Build workplan** (`docs/planning/DIAL_Build_Workplan.md` + `DIAL_Build_Workplan_STATE.md`) — stages S00→S90 with **auto-advance when a stage goes green** (no manual gate between stages; S99 customer-open remains human).
- S11 E1a thin path started: `@dial/ledger`, `@dial/tax` (agency `FiscalReceiptQueued`), `runE1aMoneySpine` in `@dial/payments` (OfferSnapshot → webhook → ledger → FDMS outbox).
- S11 E1a expand: D-43 `PSP_ADAPTER_REGISTRY` (Paynow/ContiPay/EcoCash/PayPal/COD/escrow), Job Reserve authorize/capture, tech WHT 30%/ITF263, gateway `POST /api/webhooks/psp` (sig+idempotency), money outbox stub, Matrix A sign-off + `docs/agent-audits/money-path-S11-E1a-2026-08-12.md` (Admin Daily ZiG = S12).
- S12 E1b: admin Daily ZiG UI (`/admin/fx/daily-zig`) + `GET/POST /api/admin/fx/daily-zig` (fail-closed `INTERNAL_API_SECRET`), `listFxRateAudit`, EcoCash `fx_rate_id` evidence; Matrix A2 filled ([#4](https://github.com/Vanguduza/dial/issues/4)).
- S21 T2 Catalogue+Search **green** (Pack §15): Meili settings + stub docs; B2B hide informal; Factory human approve/reject; gateway `GET /api/search/spare` + admin review; SandPIM ADR; typecheck/test green ([#7](https://github.com/Vanguduza/dial/issues/7)).
- S21 T2 thin vertical started: Meili `spare_offers_v1` settings (`offerSource` / `supplierFormality`), B2B hide informal, Catalogue Factory ingest/review + `search_no_result_events`, SandPIM ADR ([#7](https://github.com/Vanguduza/dial/issues/7)).
- Windows Prime handshake patch `scripts/patch-prime-agent-windows-handshake.mjs` (WMIC start-id + TTL; applied by Dev Manager starter) — unblocks daemon worker hello/`worker_auth` on Windows (#748/#1077).
- S22 T3 Spare UI thin vertical started: `/spare` browse + PDP + USD cart (design-tokens, agency disclosure, B2B session filter) ([#11](https://github.com/Vanguduza/dial/issues/11)).
- S22 T3 Spare UI **green**: checkout pay-step EcoCash|COD (ZiG only at pay); viewport DoD; WA button parity ([#11](https://github.com/Vanguduza/dial/issues/11)).
- S23 T5 Money spine **green**: Take-Home UI/API; ledger + withholding SQL stubs; PSP/JobReserve/WHT evidence ([#12](https://github.com/Vanguduza/dial/issues/12)).
- S24 T4 Tech UI thin vertical started: `/tech` home, book, emergency (AI bypass), automotive + emergency checklists ([#13](https://github.com/Vanguduza/dial/issues/13)).
- S24 T4 **green**: interactive checklist runner + Services link ([#13](https://github.com/Vanguduza/dial/issues/13)).
- S25 E3a **green**: `@dial/delivery` DeliveryDispatchWorkflow thin (offer/accept/reject/timeout/FIFO/POD/COD) + Matrix C + MapLibre admin stub.
- S26 T6 **green**: `@dial/jobs` JobClass/Trade, rate-card quote, Value Score eligibility.
- S27 E4a thin started: `@dial/ai` guidedIntake Zod JobAssessment (no price) + capability audit.
- S28 E5a **green**: human approve → Meili stub publish; B2B informal leak=0.
- S29 E6a/T8 **green**: MetricContract registry + Command Centre Simulated never auto-pays.
- S30 T9 Hardening thin started (IDOR/webhook/Semgrep baseline already in tree — expand evidence).
- S30 T9 **green**: cross-tenant IDOR ≥5 resources; PSP webhook sig+idempotency; Simulated≠pay; restore-drill stub; security headers middleware; cost/health stub.
- S90 Eng Build **complete** (S10–S30 green); S99 customer-open remains human-gated.
- S91 Integration readiness: `@dial/adapter-psp|fdms|maps`, WA Cloud Graph client, Meili/LiteLLM HTTP clients, per-vendor webhook routes, Pack-complete `.env.example`, `DIAL_INTEGRATION_MODE=fixture|sandbox|live` (`docs/integrations/README.md`).
- S92 Local sandbox infra: `docker-compose.yml` (Redis/Meili/Temporal profile), `@dial/worker-temporal` in-process DeliveryDispatchWorkflow, payments→PSP + delivery→maps bridges, `GET /api/health/integrations`, Supabase `0001_core_tables.sql`, Promptfoo outline.
- S93 Supabase Auth client scaffold (`signInWithPassword` fixture/live) + `@dial/search-indexer` outbox job drain (Meili ensure/upsert; Redis required outside fixture).
- S94 `@dial/queues` BullMQ (fixture in-memory / Redis live) + Temporal client `startDeliveryDispatch` + search-indexer enqueue path.
- S95 FDMS outbox drain via Virtual Gateway + gateway Supabase password→DialSession bridge on `/api/auth/sign-in`.
- S96 Promptfoo CI smoke (`packages/ai/evals` + `pnpm eval:smoke`) + FDMS fiscal-day open/close workers in `@dial/tax`.
- S97 FDMS day BullMQ queue + fail-closed admin `POST/GET /api/admin/fdms/day` (fixture runs processor inline).
- S98 `@dial/worker-queues` BullMQ host + integrations health exposes queue names + fiscalDay snapshot.
- S100 LiteLLM `pingLiteLlm` on integrations health + Meili `bootstrapLocalSearchIndex` (`pnpm bootstrap:search`).
- S101 Temporal SDK worker registration (`createTemporalSdkWorker`) + shared `claimProcessedEvent` idempotency on PSP/FDMS webhooks.
- S102 WhatsApp + PSP admit routes use shared idempotency; `claimProcessedEventDurable` maps to SQL `processed_events` (fail closed without Supabase outside fixture).
- S103 Delivery `estimateRoute` always bridges `@dial/adapter-maps` (fixture provider); gateway smoke proves shared idempotency across sources.
- S104 ContiPay/EcoCash createPayment fixture shapes + COD settle-USD (D-60) evidence in `@dial/adapter-psp` tests.
- S20 T1 Identity **green** (Pack §15): `@dial/identity` profiles + RLS tests; `/sign-up` + `POST /api/auth/sign-up`; session-gated `/home` Shop|Services; body `userId`/role rejected ([#5](https://github.com/Vanguduza/dial/issues/5)).
- S20 T1 thin vertical started: session cookie AuthN stub, `/home` Shop|Services after sign-in, `assertResourceAccess` rejects body `userId` (D-47) ([#5](https://github.com/Vanguduza/dial/issues/5)).
- E2a thin vertical packages: `@dial/payments` (FX + EcoCash/COD intents), `@dial/catalogue` (USD cart), `@dial/adapter-whatsapp` (Flow search→cart→checkout buttons + webhook idempotency).
- Lefthook **post-commit** auto-push to `Vanguduza/dial` via `scripts/git-auto-push.sh` / `.ps1` (no force).

### Changed

- Dev Manager / Cursor paste prompt (§8.0): enforce desktop+mobile web DoD and same-PR living-doc updates.
- Dev Manager PRIORITY 0 duties: env setup + auto GitHub push ahead of ticket hygiene (prompt + Blueprint §8.0).
- Authority docs + `AGENTS.md` / always-on rules: D-log range through **D-61**; evaluation status → Adopted with modification.
- **D-61 definite:** Development Prime = mandatory Build orchestrator (before workspace); production multi-step/learning = capability pipeline + Temporal/BullMQ + Factory — no prod agent adapter.
- **D-61 founder clarification:** Dev Manager = managerial authority throughout Build (Blueprint §8.0); Prime = mandatory session/runtime harness hosting that role (not a competing project manager); learning/troubleshooting/ERP Improvement outcomes via Factory stack without Prime as production driver.

### Fixed

- Windows Prime 0.7.2 daemon handshake livelock (worker hello / `worker_auth` timeout): `scripts/patch-prime-agent-windows-handshake.mjs` replaces PowerShell `getProcessStartId` with WMIC + TTL cache; starter applies it before launch. Smoke: `PONG` and `/dev-manager` template load.

## [0.0.0] — 2026-08-11

### Added

- Initial plan pack push and **T0** monorepo foundation:
  - Authority docs (`DIAL_Consolidated_Plan_v4.md`, Agent Pack, Blueprint, companions through D-60)
  - Agent hygiene (`AGENTS.md`, `.cursor/rules`, `.cursor/skills/dial-*`)
  - AppSec toolchain seeds (Semgrep, Checkov, Renovate, Threat Dragon, Strix staging runbook)
  - `apps/gateway-web`, `packages/shared`, `packages/design-tokens`, `packages/promotions`
  - pnpm + turbo + lefthook; CI typecheck/test/build
  - Plan-phase artifacts under `docs/planning/`
