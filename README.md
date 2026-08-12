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

Install **Prime Agent** on the developer machine **before** thrashing T0 / pasting Dev Manager into a bare IDE session. Windows uses the release tarball + Git Bash (see [Windows setup](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/windows.md)).

```bash
# already installed on this machine as prime-agent@0.7.2 (npm global)
cd /path/to/DIAL
prime-agent
```

On first launch for Cursor-backed models: keep `~/.prime/agent/start-cursor-bridge.ps1` running (after `agent login` or `CURSOR_API_KEY`). Defaults are provider `cursor` / model `composer-2.5`. In the DIAL repo session, expand `/dev-manager` (project prompt under `.prime/agent/prompts/`) or paste the Dev Manager fence from `docs/prompts/DIAL_DEV_MANAGER_CURSOR_PROMPT.md`.

Project harness config lives in [`.prime/agent/`](./.prime/agent/) (`settings.json`, `APPEND_SYSTEM.md`, prompts). Global machine config: `~/.prime/agent/`. **No production data path**; not CI SoR; Cursor/`AGENTS.md` remain instruction SoR.

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

### Current T0 layout (expanding)

| Path | Notes |
| --- | --- |
| `apps/gateway-web` | Auth-first Next.js gateway shell |
| `packages/shared` | Shared types (e.g. `amountMinor` + `currency`) |
| `packages/design-tokens` | Brand tokens + validate script |
| `packages/promotions` | `@dial/promotions` package (D-42) |

Further apps/packages land on Pack trains T1–T9 and tracer epics E1–E6.

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
