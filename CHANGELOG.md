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
- S105 Paynow ConfirmPayment/poll fixture + escrow `wait_for_hold` / `instructRelease` stub evidence.
- S106 Meta WA template registry (`resolveWaTemplate` / `WA_TEMPLATE_*`) + `sendRegisteredTemplate` fixture path.
- S107 FDMS `submitReceipt` agency-class live-shape fixtures + FDMS day queue drain→process evidence.
- S108 PayPal Orders checkoutnow fixture + escrow capture webhook → paid status evidence.
- S109 Delivery VROOM plan fixture (`planDeliveryWithVroom`) + `createDeliveryJobWithMaps` ETA from OSRM duration.
- S110 Catalogue `countInformalB2bLeaks` regression + integrations health `search` snapshot (D-49).
- S111 Chatwoot handoff id contract (`chatwootContactId`/`inboxId`/`erpTicketId`) + `flowSupportTicket` (Chatwoot ≠ status SoR).
- S112 Consent centre audit trail + referral home wired to `@dial/promotions` promo_credit-only guard (D-42).
- S113 Returns claim ERP stub (`ReturnClaim` / `resolveReturnClaim`) with `refund_or_replace` path; resolution amounts stay null (AI never writes money).
- S114 Money outbox drain (`drainMoneyOutbox`): `ledger_posted` → queue side-effects; `fiscal_queued` → `@dial/tax` `drainFdmsOutbox` (FiscalReceiptQueued link).
- S115 Gateway `GET/POST /api/admin/money/outbox` (fail-closed `INTERNAL_API_SECRET`) + integrations health `moneyOutbox.depth`.
- S116 Worker-queues money outbox drain hook (`runMoneyOutboxDrain`) + `startOutboxSideEffectsWorker` for `dial-outbox-side-effects`.
- S117 ContiPay/EcoCash gateway webhooks use durable idempotency; smoke covers accept, duplicate, sandbox bad-signature 401.
- S118 PayPal/FDMS gateway webhooks use durable idempotency; smoke covers accept, duplicate, sandbox fail-closed.
- S119 Paynow gateway webhook uses durable idempotency and fixtures bridge `reference` → `admitPspWebhookEvent` capture when intent exists.
- S120 WhatsApp gateway webhook uses durable idempotency; smoke covers hub challenge, secret fail-closed, HMAC admit/duplicate/401.
- S121 Escrow PSP gateway webhook (`POST /api/webhooks/escrow`) durable idempotency + sandbox bad-sig / secret fail-closed.
- S122 Maps health ping (`pingMapsHealth`) on `/api/health/integrations` — fixture Nominatim/OSRM ok; sandbox fail-closed without URLs.
- S123 FDMS Gateway health ping (`pingFdmsHealth`) on integrations health — fixture open-day stub; sandbox fail-closed without keys.
- S124 Meili search health ping (`pingMeiliHealth`) under integrations `search.meili` — fixture ensure index; sandbox fail-closed without host/key.
- S125 Redis/queues health ping (`pingQueuesHealth`) under integrations `queues.health` — fixture enqueue/drain; sandbox fail-closed without REDIS_URL.
- S126 Temporal health expand (`pingTemporalHealth`) — namespace/taskQueue fixture; sandbox fail-closed without TEMPORAL_ADDRESS.
- S127 LiteLLM health expand (`pingLiteLlm`) — fixture model list incl. Flash-Lite; sandbox fail-closed without base URL/key.
- S128 Integration readiness checklist (`docs/integrations/README.md`) + health aggregate `ready`/`probes` on `/api/health/integrations`.
- S129 WhatsApp Cloud health ping (`pingWhatsAppHealth`) on integrations — fixture ok; sandbox fail-closed without `WHATSAPP_*`.
- S130 PSP health ping aggregate (`pingPspHealth`) — per-rail configured flags; sandbox fail-closed with no paid rail.
- S131 Internal API secret health (`pingInternalApiHealth`) — fixture ok; sandbox fail-closed without `INTERNAL_API_SECRET`.
- S132 `.env.example` sync with health groups + `WA_TEMPLATE_*` + checklist cross-links in `docs/integrations/README.md`.
- S133 Admin integrations readiness UI (`/admin/integrations`) — ready/probes/groups snapshot from health API.
- S134 Gateway OpenAPI skeleton (`docs/integrations/openapi-gateway.json` + `GET /api/openapi`) for health + webhooks.
- S135 Wire OpenAPI + readiness links into admin cost-health, integrations UI, and root README gateway table.
- S136 Refresh root README layout/build-status + integrations package table (ledger/payments/gateway + health pings).
- S137 Expand OpenAPI `IntegrationsProbes` required enum + sync with `INTEGRATION_PROBE_KEYS`.
- S138 Health route builds `probes`/`ready` via `buildIntegrationsProbes` + `integrationsReady` (single SoR).
- S139 Deduplicate health env groups into `INTEGRATION_ENV_GROUPS` + `listIntegrationEnvGroupSnapshots`.
- S140 Document `INTEGRATION_ENV_GROUPS` SoR in integrations README + OpenAPI `info.x-dial-sor`.
- S141 Admin integrations UI: env-group SoR hint + primary OpenAPI skeleton control.
- S142 Cost-health stub mirrors OpenAPI primary CTA + `INTEGRATION_ENV_GROUPS` SoR hint.
- S143 Fixture health smoke: `groups[].label` order/set only from `INTEGRATION_ENV_GROUPS`.
- S144 Sandbox health smoke: same label order lock under `DIAL_INTEGRATION_MODE=sandbox`.
- S145 Live health smoke: same label order lock under `DIAL_INTEGRATION_MODE=live`.
- S146 Export `INTEGRATION_ENV_GROUP_LABELS` helper derived from env groups SoR.
- S147 Document `INTEGRATION_ENV_GROUP_LABELS` in integrations README + OpenAPI `x-dial-sor.envGroupLabels`.
- S148 Admin SoR hints mention `INTEGRATION_ENV_GROUP_LABELS` (integrations + cost-health).
- S149 Root README documents `INTEGRATION_ENV_GROUPS` + `INTEGRATION_ENV_GROUP_LABELS` SoR.
- S150 `.env.example` header points at `INTEGRATION_ENV_GROUP_LABELS` SoR.
- S151 Health `/api/health/integrations` `note` includes ordered `INTEGRATION_ENV_GROUP_LABELS`.
- S152 OpenAPI `IntegrationsHealth.note` description documents groups-labels SoR.
- S153 Integrations README documents health `note` `groups labels=` contract.
- S154 Admin integrations readiness UI surfaces truncated health `note` (`INTEGRATIONS_HEALTH_NOTE_UI_MAX`).
- S155 Cost-health stub surfaces the same truncated health `note` (parity with integrations UI).
- S156 Integrations README documents admin UI note truncation (`INTEGRATIONS_HEALTH_NOTE_UI_MAX`).
- S157 OpenAPI `x-dial-sor.healthNoteUiMax` + `IntegrationsHealth.note` describe admin truncation SoR.
- S158 Root README documents admin health note truncation (`INTEGRATIONS_HEALTH_NOTE_UI_MAX`).
- S159 Admin SoR hints cite `INTEGRATIONS_HEALTH_NOTE_UI_MAX` (integrations + cost-health).
- S160 Integrations README cites OpenAPI `x-dial-sor.healthNoteUiMax`.
- S161 `.env.example` header cites `INTEGRATIONS_HEALTH_NOTE_UI_MAX` / `healthNoteUiMax`.
- S162 Smoke: served OpenAPI `healthNoteUiMax` fragment locks to `INTEGRATIONS_HEALTH_NOTE_UI_MAX`.
- S163 Export `buildIntegrationsHealthNote` (mode + `INTEGRATION_ENV_GROUP_LABELS`) as note SoR.
- S164 Health `/api/health/integrations` builds `note` via `buildIntegrationsHealthNote`.
- S165 OpenAPI + integrations README document `buildIntegrationsHealthNote`.
- S166 OpenAPI `x-dial-sor.healthNote` points at `buildIntegrationsHealthNote`.
- S167 Root README cites `buildIntegrationsHealthNote` / `x-dial-sor.healthNote`.
- S168 `.env.example` header cites `buildIntegrationsHealthNote` / `healthNote` SoR.
- S169 Admin SoR hints cite `buildIntegrationsHealthNote` (integrations + cost-health).
- S170 Smoke: served OpenAPI `healthNote` fragment locks to `buildIntegrationsHealthNote`.
- S171 Admin UI copy cross-links note-builder SoR (`note-builder-sor-hint` → OpenAPI + Health JSON).
- S172 Integrations README documents admin `note-builder-sor-hint` cross-link.
- S173 OpenAPI `info.description` mentions `buildIntegrationsHealthNote` / `x-dial-sor.healthNote`.
- S174 Root README cites admin `note-builder-sor-hint` cross-link.
- S175 Smoke: S135 parity includes `note-builder-sor-hint` on integrations + cost-health.
- S176 Export `INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID` + `INTEGRATIONS_NOTE_BUILDER_SOR_DOCS`.
- S177 `.env.example` cites `note-builder-sor-hint` / HINT_ID + DOCS contract.
- S178 OpenAPI `x-dial-sor.noteBuilderHint` points at `INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID`.
- S179 Admin UI imports `INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID` for `data-testid`.
- S180 Smoke: served OpenAPI `noteBuilderHint` fragment locks to HINT_ID export.
- S181 Integrations README cites `INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID` + `_DOCS`.
- S182 Root README cites `INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID` + `_DOCS`.
- S183 OpenAPI `x-dial-sor.noteBuilderDocs` points at `INTEGRATIONS_NOTE_BUILDER_SOR_DOCS`.
- S184 Smoke: served OpenAPI `docs` equals `INTEGRATIONS_NOTE_BUILDER_SOR_DOCS` path.
- S185 Admin UI cites `INTEGRATIONS_NOTE_BUILDER_SOR_DOCS` in note-builder hint copy.
- S186 `.env.example` cites OpenAPI `noteBuilderDocs` / DOCS SoR.
- S187 Integrations README cites `x-dial-sor.noteBuilderDocs`.
- S188 Root README cites `x-dial-sor.noteBuilderDocs`.
- S189 OpenAPI `info.description` mentions `noteBuilderDocs` / DOCS constant.
- S190 Smoke: sandbox health `ready=false` when queues probe fails (no REDIS_URL).
- S191 Smoke: live health `ready=false` when queues probe fails (no REDIS_URL).
- S192 Smoke: served OpenAPI `x-dial-sor` includes `noteBuilderHint` + `noteBuilderDocs`.
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
