# DIAL

Zimbabwean multi-trade “certainty” platform: **Dial a Spare** (parts), **Dial a Tech** (services), fleet/vehicle hub, and related products — one auth-first gateway, native Android + iOS + web + official WhatsApp Cloud API.

This repository is the DIAL ERP monorepo (apps, packages, infra, adapters). Product and compliance truth live in the plan pack, not in ad-hoc README prose.

## Authority (read in order)

1. [`DIAL_Consolidated_Plan_v4.md`](./DIAL_Consolidated_Plan_v4.md) — product, compliance, architecture, D-log  
2. [`DIAL_Development_Agent_Pack.md`](./DIAL_Development_Agent_Pack.md) — scaffolding contracts, env, RLS, trains T0–T9  
3. [`AGENTS.md`](./AGENTS.md) — Cursor / agent entrypoint  
4. Companions as needed — Blueprint, WA Flows, promotions, stitch, security toolchain, v7-2 adopted extensions  

**Do not reopen** locked decisions (C-5, D-38…D-61). UX donors are pattern-only (D-38). No Expo/RN customer shell.

Production orchestration: **Dev Manager** is the managerial authority throughout Build — use the standalone paste prompt [`docs/prompts/DIAL_DEV_MANAGER_CURSOR_PROMPT.md`](./docs/prompts/DIAL_DEV_MANAGER_CURSOR_PROMPT.md) (synced with Blueprint §8 / §8.0) **inside** a Prime Agent harness session (D-61).

## Development Prime harness (D-61)

**Build runs inside Prime Agent** (mandatory development harness). Install + configure Prime **before** thrashing T0 / pasting Dev Manager into a bare IDE session. Windows: Git Bash `shellPath` + Cursor bridge (see [Windows setup](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/windows.md)).

### Windows one-shot (preferred)

Prereqs once: `npm i -g prime-agent cursor-api-proxy`, Cursor Agent CLI (`agent login` or `CURSOR_API_KEY`). The starter applies `scripts/patch-prime-agent-windows-handshake.mjs` so Prime 0.7.2 can create sessions on Windows.

```powershell
# From repo root — starts Cursor bridge if down, then Prime with /dev-manager
powershell -ExecutionPolicy Bypass -File .\scripts\start-dial-dev-manager-prime.ps1
```

### Manual two-terminal

```powershell
# terminal A — Cursor models bridge (keep open)
powershell -File $env:USERPROFILE\.prime\agent\start-cursor-bridge.ps1

# terminal B — Prime harness on DIAL
cd C:\DIAL
prime-agent --provider cursor --model auto
# then expand /dev-manager  (or paste docs/prompts/DIAL_DEV_MANAGER_CURSOR_PROMPT.md)
```

Defaults: provider `cursor`, model **`auto`** (Auto mode — do not manually switch for Dev Manager/subagents). Project harness: [`.prime/agent/`](./.prime/agent/) (`settings.json`, `APPEND_SYSTEM.md`, `/dev-manager`). Machine: `~/.prime/agent/`. **No production data path**; not CI SoR; no prod Prime adapter (D-61); Cursor/`AGENTS.md` remain instruction SoR.

## Living docs (auto-maintained)

Update these **in the same PR** as meaningful product, process, or known-issue changes (Blueprint §8.0.2). Dev Manager rejects “docs later.”

| Doc | Role |
| --- | --- |
| [`README.md`](./README.md) | This overview |
| [`CHANGELOG.md`](./CHANGELOG.md) | Keep a Changelog / SemVer-friendly |
| [`ENHANCEMENTS.md`](./ENHANCEMENTS.md) | Planned / accepted enhancements backlog |
| [`BUGS.md`](./BUGS.md) | Known bugs, repro, status |

## Responsive web UX

Next.js web apps (gateway, spare-web, tech-web, admin, …) must be usable on **desktop and mobile** with **visual consistency** via shared [`packages/design-tokens`](./packages/design-tokens). Cross-device visual QA before Done on web tickets — Blueprint §8.0.1.

## Repository

Private GitHub: [Vanguduza/dial](https://github.com/Vanguduza/dial).

## Quick start (T0)

Requires Node ≥ 20 and [pnpm](https://pnpm.io/) 9.x.

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm dev:gateway
```

Optional: `pnpm build`, `pnpm lint`. Pre-commit (lefthook) mirrors typecheck + test; **post-commit auto-pushes** the current branch to [`Vanguduza/dial`](https://github.com/Vanguduza/dial) via `scripts/git-auto-push.ps1` / `.sh` (never force). CI under `.github/workflows/`.

### Current layout (T0 + integration spine)

| Path | Notes |
| --- | --- |
| `apps/gateway-web` | Auth-first Next.js gateway + health/OpenAPI/webhooks/admin |
| `apps/worker-temporal` | DeliveryDispatch Temporal client/SDK worker |
| `apps/worker-queues` | BullMQ FDMS day + search-indexer + money outbox workers |
| `adapters/psp` | Paynow / ContiPay / EcoCash / PayPal / COD / escrow |
| `adapters/fdms` | ZIMRA Virtual Gateway (agency receipt classes) |
| `adapters/maps` | Nominatim / OSRM / VROOM (D-44) |
| `adapters/whatsapp` | Official Cloud API only (D-40) |
| `packages/identity` | Profiles + RLS policy stub/tests (Pack T1 / §12) |
| `packages/shared` | Money types + idempotency + internal API health |
| `packages/design-tokens` | Brand tokens + validate script |
| `packages/promotions` | `@dial/promotions` (D-42) |
| `packages/catalogue` | USD cart/search + Meili client (D-57 / D-49) |
| `packages/delivery` | Delivery job SoR + maps bridge (D-45) |
| `packages/jobs` | JobClass / Trade / rate-card (T6) |
| `packages/payments` | Checkout / Job Reserve / FX / PSP admit |
| `packages/ledger` | Journal + money outbox drain |
| `packages/tax` | FDMS outbox + fiscal-day open/close |
| `packages/queues` | BullMQ queue hosts + health pings |
| `packages/search-indexer` | Meili reindex jobs |
| `packages/ai` | guidedIntake + LiteLLM + Intelligence stubs (D-61) |

**Build status:** eng spine **S90** green; product-depth through **PD36** multi-stop delivery green → next **PD37** local Playwright recon. **S99** remains human launch-only (not product-finished). OpenAPI invent paused. No liquor Build.

### Gateway integration surface (plug-in)

| URL / doc | Purpose |
| --- | --- |
| `/api/health/integrations` | `ready` / `probes` / env groups (no secrets) |
| `/admin/integrations` | Ops UI for the same snapshot (truncated health `note`) |
| `/admin/cost-health` | Cost stub + truncated health `note` parity |
| `/api/openapi` | OpenAPI 3 skeleton (health + webhooks + admin) |
| [`docs/integrations/README.md`](./docs/integrations/README.md) | Key-drop-in checklist + health group map |
| [`docs/integrations/openapi-gateway.json`](./docs/integrations/openapi-gateway.json) | Spec file SoR for the skeleton |

Env-group SoR: `INTEGRATION_ENV_GROUPS` + ordered `INTEGRATION_ENV_GROUP_LABELS` in `apps/gateway-web/src/lib/integrationsReadiness.ts` (OpenAPI `info.x-dial-sor`). Health JSON `ready` is `integrationsReady(probes)` only — independent of `groups[].configured` (`x-dial-sor.readyVsGroups`; fixture may be ready with incomplete groups; **S211**: fixture `ready=true` even when every group is `configured=false` / zero configured). Admin UIs expose `INTEGRATIONS_READY_VS_GROUPS_HINT_ID` (`x-dial-sor.readyVsGroupsHint`). Health JSON `note` is built by `buildIntegrationsHealthNote` (`x-dial-sor.healthNote`). Admin UIs truncate via `truncateIntegrationsHealthNote` / `INTEGRATIONS_HEALTH_NOTE_UI_MAX` (`x-dial-sor.healthNoteUiMax`) and expose `note-builder-sor-hint` (`INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID`) → OpenAPI + Health JSON; docs pointer `INTEGRATIONS_NOTE_BUILDER_SOR_DOCS` (`x-dial-sor.noteBuilderDocs`). Webhooks: `x-dial-sor.webhookSignature` + `webhookIdempotency`. See [`docs/integrations/README.md`](./docs/integrations/README.md) for key-drop-in checklist.

## Companions (high-signal)

| Doc | Use |
| --- | --- |
| `DIAL_Build_Blueprint_and_Cursor_Prompt.md` | Build improvements + Dev Manager Cursor prompt |
| `DIAL_WhatsApp_Flows_and_Templates.md` | Official WA Flows / templates |
| `DIAL_Promotions_Package_Design.md` | Promotions package contracts |
| `DIAL_Security_Toolchain.md` | D-48 AppSec (Semgrep, Checkov, Renovate, Strix staging) |
| `DIAL_v7_2_Adopted_Platform_Extensions.md` | D-53 / D-54 absorb only |
| `DIAL_AI_Kernel_Prime_Agent_Adopted.md` | D-61 — Dev Manager = Build manager; Prime = mandatory harness; prod capability + Temporal/BullMQ; §5.3 affirmed |
| `DIAL_Cursor_Rules_and_Skills.md` | Local rules/skills catalog |
| `docs/planning/` | Plan-phase grill, DoD backlog, tracer matrices |

## Licence / secrets

Private proprietary project unless a root licence file says otherwise. Never commit `.env*`; never put service-role / PSP / WA secrets behind `NEXT_PUBLIC_` or `VITE_`.
