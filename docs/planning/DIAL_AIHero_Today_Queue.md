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
| **Ticket hygiene (E1a / E2a owned ticket)** | **Assigned → Dev Manager** (Blueprint §8.0) — **Next** |
| First thin vertical Build | Blocked on ticket hygiene |
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

## Phase 3 — next (Dev Manager)

**Owner:** Dev Manager agent — paste `DIAL_Build_Blueprint_and_Cursor_Prompt.md` §8.

1. Close **ticket hygiene**: open owned **E2a** (prefer) or **E1a** with DoD + matrix + named owner.  
2. Then Build that thin vertical:
   - **E1a** — OfferSnapshot USD → one PSP webhook stub → ledger → `FiscalReceiptQueued` (agency / D-59), **or**
   - **E2a** — Spare WA Flow USD cart → EcoCash/COD buttons → same `fdms_outbox`

Do not claim Done until feature DoD + matrix cells have evidence (`dial-tracer-slice`).

---

## T0 checklist (closed)

- [x] Root `package.json` / turbo with `typecheck`  
- [x] Per-package `tsc --noEmit` green  
- [x] Test runner with smoke tests  
- [x] Pre-commit (lefthook) typecheck + test  
- [x] CI mirrors local scripts  
- [x] No money/WA/maps product code beyond stubs until thin vertical ticket  
