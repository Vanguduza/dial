---
name: dial-context-drift-check
description: >-
  Audits a DIAL task, branch, PR or session for drift from current project truth,
  superseded decisions, inherited evidence, feature scope and source-of-truth rules.
---

# DIAL Context Drift Check

## Use this skill when

- starting after a long pause or new agent/harness;
- migrating repositories;
- changing architecture;
- importing/replacing a donor repository;
- a requirement seems contradictory;
- an agent wants to repeat prior tests/slices;
- a feature appears to have disappeared;
- a release gate is being changed;
- before merge of a high-impact feature.

## Inputs

Read first:

1. `docs/project-truth/CONTEXT_BUNDLE.md`
2. `docs/project-truth/project-truth.json`
3. `docs/project-truth/feature-registry.json`
4. `docs/project-truth/evidence-registry.json`
5. `AGENTS.md`
6. the changed code/docs/ticket/PR

## Audit sequence

### 1. Establish task identity

Write down:

- Feature ID(s);
- current gate(s);
- claimed target gate(s);
- relevant decisions/non-negotiables;
- inherited evidence;
- domain owner/SoR.

If no Feature ID exists for a material feature, create one before continuing.

### 2. Supersession audit

Check whether the proposed work resurrects a discarded/historical decision.

High-risk examples:

- D-51 owned Spare inventory;
- v7 master replacing vNext/v4 adopted architecture;
- generic shared storefront skin;
- cheap FixItNow recreation instead of wholesale port;
- missing credentials treated as blocker;
- thin slice treated as final feature completion.

Classify every conflict:

`NO_DRIFT | STALE_DOC | STALE_CODE | STALE_TEST | NEW_DECISION_REQUIRED`

Do not silently repair a conflict by changing project truth.

### 3. Evidence/gate audit

For every affected feature:

- resolve all evidence IDs;
- verify the feature gate is not below accepted `minimumGate`;
- verify new work does not repeat an accepted slice as a milestone;
- verify fixture/sandbox/live evidence labels are honest;
- verify a production claim has production evidence when required.

If old evidence is truly invalid, create an explicit invalidation record containing:

- evidence ID;
- why it no longer represents the implementation;
- architecture/requirement change that invalidated it;
- approver;
- replacement test requirement.

### 4. Feature-loss audit

Compare the planned/accepted feature behavior with the changed implementation.

Check:

- screens/routes;
- domain commands/queries;
- workflows/states;
- applicable channels;
- integrations;
- admin controls;
- audit/analytics;
- error/offline/degraded states;
- tests/evidence.

A missing item is either:

`PRESERVED | EXPLICITLY_SUPERSEDED | OPEN_WORK | SILENT_LOSS`

`SILENT_LOSS` fails the audit.

### 5. Source-of-truth audit

For every new dependency/donor/tool, answer:

- What capability does it provide?
- What DIAL domain owns truth?
- Is this library/service only a projection/adapter?
- Does it introduce a competing ledger/job/catalogue/delivery/auth state?

Any undocumented second SoR fails the audit.

### 6. Integration drift audit

Missing live keys must result in:

- fixture/contract tests continuing;
- key-ready adapter implementation;
- fail-closed sandbox/live behavior without config;
- explicit later production evidence gate.

It must not result in deferred feature coding.

### 7. Frontend drift audit

For material UI work, verify the agent retained:

- user outcome;
- branch identity;
- approved donor/reference/Figma source;
- screen/state inventory;
- responsive/native requirements;
- visual evidence/accessibility acceptance.

A generic component-kit approximation is drift even when functionally correct.

### 8. Session-handoff audit

Use `docs/project-truth/SESSION_HANDOFF_TEMPLATE.md`.

The next agent should be able to resume from the handoff without reconstructing decisions from chat history.

## Automated check

Run:

```bash
pnpm context:check
```

Fix failures before merge.

## Output format

```markdown
# Context Drift Audit — <feature/task>

Verdict: PASS | FAIL | NEEDS_DECISION

## Truth anchors
- Feature IDs:
- Current gates:
- Decisions:
- Evidence:
- SoRs:

## Findings
| Severity | Type | Finding | Required action |
|---|---|---|---|

## Gate/evidence check
...

## Feature-loss check
...

## SoR check
...

## Handoff state
...
```

## Pass condition

PASS only when:

- no stale decision is being implemented;
- no accepted evidence is lost/downgraded;
- no feature is silently removed;
- no second SoR is introduced;
- environment/evidence claims are honest;
- context files are updated when truth changed;
- automated context check passes.
