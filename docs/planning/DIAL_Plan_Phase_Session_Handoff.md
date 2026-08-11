# Plan-phase → Build handoff

**Date:** 2026-08-11  
**Redact:** no secrets / `.env` / live keys.

## Where we are

- Plan Phase 1–2 (grill, DoD, matrices, D-57…D-60) **done**. Doc hygiene aligned to D-60.
- **T0 monorepo booted:** `pnpm typecheck` / `pnpm test` / gateway build green; lefthook + `.github/workflows/ci.yml`.

## Next — Dev Manager (ticket hygiene)

**Owner:** DIAL **Dev Manager** agent (paste prompt in `DIAL_Build_Blueprint_and_Cursor_Prompt.md` §8 / §8.0).

1. Open **one** owned tracer Build ticket for **E2a** (default) or **E1a** (if founder directs money spine first).  
2. Attach DoD from `DIAL_Plan_Phase_DoD_Backlog.md` + matching matrix rows from `DIAL_Tracer_DoD_Completion_Matrices.md`.  
3. Name an owner (human or executing agent); state stub ≠ Done; merge blocked until `Y` + evidence.  
4. Only then queue T1+ / sibling epics.  
5. Run `dial-money-path-review` when payment/FDMS paths land.

## Pointers

| Artifact | Path |
| --- | --- |
| Dev Manager Cursor prompt | `DIAL_Build_Blueprint_and_Cursor_Prompt.md` §8 / §8.0 |
| Today queue | `docs/planning/DIAL_AIHero_Today_Queue.md` |
| DoD backlog | `docs/planning/DIAL_Plan_Phase_DoD_Backlog.md` |
| Matrices | `docs/planning/DIAL_Tracer_DoD_Completion_Matrices.md` |
| Dev | `pnpm install` → `pnpm typecheck` → `pnpm test` → `pnpm dev:gateway` |
