# Plan-phase → Build handoff

**Date:** 2026-09-05
**Redact:** no secrets / `.env` / live keys.

## Where we are

- Original Plan Phase 1–2 (D-57…D-60) **done**. **D-61 has now been consolidated into master §6.24 + Agent Pack/rules** and requires a focused Topic-7 grill/matrix confirmation before Hermes code.
- **T0 scaffold exists:** gateway-web + shared/design-tokens/promotions + CI/planning/security. Historical docs recorded typecheck/test/build green at T0. A later control-host re-run was blocked by that host’s pnpm/Corepack shim, so the next development session must perform its own fresh verification before relying on the old green record.

## Next — Dev Manager (current-state verification + D-61-aware ticket hygiene)

**Owner:** DIAL **Dev Manager** agent (paste prompt in `DIAL_Build_Blueprint_and_Cursor_Prompt.md` §8 / §8.0).

1. Inspect `git status`, recent log, actual workspace tree and tests. Do not infer implementation from planning docs.
2. Run D-61 `dial-grill-locks` Topic 7 and confirm E7a Matrix E/DoD.
3. Open **one** owned tracer Build ticket for the next dependency-safe slice: E2a/E1a business path or E7a Hermes foundation.
4. Attach DoD from `DIAL_Plan_Phase_DoD_Backlog.md` + matching matrix rows from `DIAL_Tracer_DoD_Completion_Matrices.md`.
5. Name an owner (human or executing agent); state stub ≠ Done; merge blocked until `Y` + evidence.
6. Only then queue T1+ / sibling epics.
7. Run `dial-money-path-review` when payment/FDMS paths land.

## Pointers

| Artifact | Path |
| --- | --- |
| Dev Manager Cursor prompt | `DIAL_Build_Blueprint_and_Cursor_Prompt.md` **§9 current-state D-61 resume prompt** (supersedes stale provider lines in §8) |
| Today queue | `docs/planning/DIAL_AIHero_Today_Queue.md` |
| DoD backlog | `docs/planning/DIAL_Plan_Phase_DoD_Backlog.md` |
| Matrices | `docs/planning/DIAL_Tracer_DoD_Completion_Matrices.md` |
| Dev | `pnpm install` → `pnpm typecheck` → `pnpm test` → `pnpm dev:gateway` |
