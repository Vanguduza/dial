# DIAL AI Hero — today queue

**Date:** 2026-09-05
**Phase:** **3 — Build orchestration**. Original D-60 Plan diligence/T0 scaffold complete; **D-61 master integration now adds a required Hermes foundation grill/tracer before its code.**

| Tool / step | Status |
| --- | --- |
| Grill / diagrams / capability plan review / Promptfoo outline / tracer Plan matrices | **Done** (Phase 1–2) |
| Master/Pack/rules D-61 consolidation | **Done** — D-61 lives in master §6.24, not a standalone feature doc |
| D-61 plan-grill + E7a matrix confirmation | **Next for Hermes work** |
| Session handoff | **Done** |
| **T0 monorepo scaffold** (pnpm + turbo + lefthook + CI) | **Exists** — historical green recorded; fresh verification required on next dev runner |
| T0 gateway shell + design-tokens | **Done** — `apps/gateway-web`, `packages/design-tokens` |
| `@dial/shared` money types + tests | **Done** |
| **Ticket hygiene (E1a / E2a / E7a owned tracer)** | **Assigned → Dev Manager** (Blueprint §8.0/§9) — **Next** |
| First thin vertical Build | Blocked on current-state verification + owned ticket; do not mass-scaffold |
| `dial-webapp-recon` | Blocked (no staging) |
| Promptfoo CI / runtime money-path / `packages/ai` review | Blocked until those packages/routes exist |

---

## T0 scaffold delivered (fresh verification still required)

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

1. Reconstruct current Git/code state and rerun local verification; then close **ticket hygiene** on the next owned tracer (E2a/E1a business path and E7a D-61 foundation in dependency-safe order).
2. For Hermes work, run D-61 Topic 7 grill and attach Matrix E before code. Then Build the owned thin vertical:
   - **E1a** — OfferSnapshot USD → one PSP webhook stub → ledger → `FiscalReceiptQueued` (agency / D-59), **or**
   - **E2a** — Spare WA Flow USD cart → EcoCash/COD buttons → same `fdms_outbox`, **or**
   - **E7a** — Supervisor + provider policy + opaque context + one H0 tool + R2 manifest/archive fake + audited insight contract

Do not claim Done until feature DoD + matrix cells have evidence (`dial-tracer-slice`).

---

## T0 checklist (closed)

- [x] Root `package.json` / turbo with `typecheck`
- [x] Per-package `tsc --noEmit` green
- [x] Test runner with smoke tests
- [x] Pre-commit (lefthook) typecheck + test
- [x] CI mirrors local scripts
- [x] No money/WA/maps product code beyond stubs until thin vertical ticket
