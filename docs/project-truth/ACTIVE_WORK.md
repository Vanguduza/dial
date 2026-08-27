# DIAL Active Work Ledger

**Purpose:** short-lived execution memory only. Permanent decisions belong in `project-truth.json`; permanent validation belongs in `evidence-registry.json`.

## Operating rules

- Keep only currently active or immediately queued work here.
- One row = one bounded outcome.
- Update checkpoint commit and exact next action before changing agent/harness/session.
- Separate engineering blockers from external credential/legal/partner gates.
- Remove completed rows after durable evidence/gate state is recorded in the registries.

| Feature | Objective | Current gate | Owner/harness | Branch/worktree | Engineering-open | External-open | Checkpoint | Exact next action |
|---|---|---|---|---|---|---|---|---|
| `TECH-FIXITNOW` | Wholesale port FixItNow application and replace donor SoRs with DIAL contracts | PLANNED | Dev Manager | `build/t4-tech-ui` or successor | Select/pin donor revision; import app; map routes/dependencies; replace auth/data/payment boundaries; preserve visual quality | Licence/permission clearance required before distributable production release | — | Create donor import manifest + route/component parity map before implementation |
| `OM-0` | Opportunity Marketplace first vertical: JobRequest → qualified interest → proposal → award → accept → canonical Job | THIN_SLICE_REQUIRED | Dev Manager | successor feature worktree | Define FRC/domain schema/API/state tests and implement thin path | None required to build/test; payment keys are not part of OM-0 | — | Create OM-0 Feature Realization Contract and test-first domain contract |
| `E5a` | Catalogue Factory initial accepted slice | THIN_SLICE_REQUIRED | Dev Manager | successor feature worktree | CSV ingest → human approval → publish projection → B2C visible → B2B informal hidden | Meili live credentials/infrastructure not required for fixture/contract slice | — | Write E5a FRC and acceptance test matrix |

## Handoff note

When a row is picked up, generate a compact context pack:

```bash
pnpm context:pack -- TECH-FIXITNOW
pnpm context:pack -- OM-0
pnpm context:pack -- E5a
```

Then work from that pack plus the relevant domain files instead of reloading the full master plan.
