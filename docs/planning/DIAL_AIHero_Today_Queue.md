# DIAL AI Hero — today queue

**Date:** 2026-08-11  
**Phase:** **3 — Build orchestration** (Dev Manager + first thin vertical). Plan diligence (Phase 1–2) complete.

| Tool / step | Status |
| --- | --- |
| Grill / diagrams / capability plan review / Promptfoo outline / tracer Plan matrices | **Done** (Phase 1–2) |
| Doc hygiene (v4 status D-60 + grill/matrices/DoD align) | **Done** |
| Session handoff | **Done** |
| **T0 monorepo** (pnpm + turbo + typecheck/test + lefthook + CI) | **Done** — see below |
| T0 gateway shell + design-tokens | **Done** — `apps/gateway-web`, `packages/design-tokens` |
| `@dial/shared` money types + tests | **Done** |
| **Ticket hygiene (E1a / E2a owned ticket)** | **Done** — [E2a #1](https://github.com/Vanguduza/dial/issues/1) (prefer applied; autonomous) |
| **Autonomous runbook** | **Active** — `docs/planning/DIAL_Dev_Manager_Autonomous_Runbook.md` (no founder wait on prefer/locks) |
| First thin vertical Build | **In progress** — E2a green path (Flow USD cart → EcoCash\|COD → payment_intent) |
| `dial-webapp-recon` | Blocked (no staging) |
| Promptfoo CI / runtime money-path / `packages/ai` review | Blocked until those packages/routes exist |

---

## T0 delivered

```text
apps/gateway-web          Next.js auth-first shell (tokens)
packages/shared           amountMinor + currency
packages/design-tokens    brand tokens + validate script
packages/promotions       wired into workspace + smoke tests
pnpm + turbo + lefthook   typecheck/test on pre-commit
.github/workflows/ci.yml  mirrors typecheck/test/build
```

Commands: `pnpm typecheck` · `pnpm test` · `pnpm dev:gateway`

---

## Phase 3 — active (Dev Manager autonomous)

**Owner:** Dev Manager — runbook `DIAL_Dev_Manager_Autonomous_Runbook.md`.  
**Active ticket:** E2a [#1](https://github.com/Vanguduza/dial/issues/1). Prefer E2a = confirmed (no manual gate).

1. Build E2a thin vertical → expand in-ticket to DoD 100% + Matrix B evidence.  
2. On Done, auto-open **E1a** next (runbook §3) — do not wait for founder.  
3. Phase 0 ops stay in `ENHANCEMENTS.md` ENH-020… — stubs only in eng.

Do not claim Done until feature DoD + matrix cells have evidence (`dial-tracer-slice`).

---

## T0 checklist (closed)

- [x] Root `package.json` / turbo with `typecheck`  
- [x] Per-package `tsc --noEmit` green  
- [x] Test runner with smoke tests  
- [x] Pre-commit (lefthook) typecheck + test  
- [x] CI mirrors local scripts  
- [x] No money/WA/maps product code beyond stubs until thin vertical ticket  
