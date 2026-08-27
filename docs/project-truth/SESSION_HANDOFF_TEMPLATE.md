# DIAL Session Handoff Template

Use this at the end of any substantial agent/developer session and before switching harnesses, repositories, branches or long-running contexts.

## Session identity

- Date/time:
- Agent/harness:
- Repository/ref:
- Objective:
- Feature IDs:

## Context preflight used

- [ ] Read `CONTEXT_BUNDLE.md`
- [ ] Read `project-truth.json`
- [ ] Read `feature-registry.json`
- [ ] Read `evidence-registry.json`
- [ ] Read relevant domain/companion specs
- Non-negotiable IDs applied:

## Work completed

| Feature ID | Before gate | After gate | What changed | Evidence |
|---|---|---|---|---|
| | | | | |

## Decisions made

Only record decisions actually made. Do not rewrite old decisions as new.

| Decision | Status | Authority/approver | Supersedes? | Files/requirements affected |
|---|---|---|---|---|
| | | | | |

## Evidence created

- Tests:
- Integration evidence:
- Screenshots/visual diff:
- Security/audit:
- Webhook/idempotency replay:
- Prompt/model eval:
- Other:

## Open work / dependencies

Distinguish code work from external dependencies.

### Engineering-open

- 

### Credential/partner/legal-open

- 

**Reminder:** live API keys/partner credentials do not block engineering-safe work. Keep the corresponding live gate open instead.

## Known risks / assumptions

- 

## Files most important for the next session

1. 
2. 
3. 

## Exact next action

Write one concrete next action that can be resumed without reconstructing the previous session:

> 

## Drift check

- [ ] No superseded decision was reintroduced.
- [ ] No accepted evidence/gate was downgraded without an invalidation record.
- [ ] No donor became a DIAL SoR.
- [ ] No fixture/sandbox evidence was mislabeled live.
- [ ] No feature disappeared from scope silently.
- [ ] `pnpm context:check` passed.
