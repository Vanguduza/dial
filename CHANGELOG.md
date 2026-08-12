# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project aims to follow [Semantic Versioning](https://semver.org/) once versioned releases begin.

Living doc: update in the **same PR** as the change (Blueprint §8.0.2). Move `Unreleased` entries into a dated version section when tagging.

## [Unreleased]

### Added

- `tooling/cursor-portable/` — sanitized portable Cursor User settings, user/`skills-cursor` skill trees, optional Claude skills, hooks/MCP templates + `RESTORE.md` (machine move; does not replace project `.cursor/` / `dial-*`).
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
- S21 T2 thin vertical started: Meili `spare_offers_v1` settings (`offerSource` / `supplierFormality`), B2B hide informal, Catalogue Factory ingest/review + `search_no_result_events`, SandPIM ADR ([#7](https://github.com/Vanguduza/dial/issues/7)).
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

## [0.0.0] — 2026-08-11

### Added

- Initial plan pack push and **T0** monorepo foundation:
  - Authority docs (`DIAL_Consolidated_Plan_v4.md`, Agent Pack, Blueprint, companions through D-60)
  - Agent hygiene (`AGENTS.md`, `.cursor/rules`, `.cursor/skills/dial-*`)
  - AppSec toolchain seeds (Semgrep, Checkov, Renovate, Threat Dragon, Strix staging runbook)
  - `apps/gateway-web`, `packages/shared`, `packages/design-tokens`, `packages/promotions`
  - pnpm + turbo + lefthook; CI typecheck/test/build
  - Plan-phase artifacts under `docs/planning/`
