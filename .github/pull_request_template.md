# DIAL Pull Request

## Feature / requirement

- Feature ID(s):
- Current gate(s):
- Target gate(s):
- Relevant decision/non-negotiable IDs:

## Project truth impact

- [ ] No project-truth change; this PR implements existing truth.
- [ ] Project truth changes and `docs/project-truth/*` is updated in this PR.
- [ ] No superseded decision is being reintroduced.
- [ ] No accepted feature/evidence is silently removed or downgraded.

If truth changes, explain the approved decision and what it supersedes:


## Evidence inheritance

List inherited evidence IDs used by this work. Do not rerun an accepted thin-slice stage merely because implementation moved.

- Evidence IDs:

If evidence is being invalidated, link the explicit invalidation decision and replacement test requirement:


## Source-of-truth check

- [ ] Money remains DIAL ledger/payments SoR.
- [ ] Jobs remain DIAL jobs SoR.
- [ ] Delivery remains DIAL delivery SoR.
- [ ] Catalogue remains approved DIAL catalogue SoR; Meili is projection only.
- [ ] Donor/tool integration does not introduce a second business SoR.

New donor/tool/adaptor and its boundary:


## Integration/credentials

- [ ] Missing live credentials did not block engineering-safe implementation.
- [ ] Fixture/sandbox/live evidence is labelled honestly.
- [ ] Key insertion is configuration-only for any integration claimed key-ready.

## Frontend/design impact

- [ ] N/A
- [ ] Design/reference/Figma context is linked.
- [ ] Required loading/empty/error/degraded states are implemented.
- [ ] Responsive/native evidence is attached.
- [ ] Visual/accessibility verification is attached.
- [ ] Generic AI-generated screen patterns were not substituted for intentional design.

## Tests / evidence

- [ ] Unit/domain tests
- [ ] Integration tests
- [ ] E2E / screenshots where applicable
- [ ] Webhook/idempotency replay where applicable
- [ ] Security/audit where applicable
- [ ] Prompt/model eval where applicable
- [ ] `pnpm context:check`

Evidence links / notes:


## Handoff

- [ ] The next action/open dependency is explicit.
- [ ] Engineering-open work is separated from credential/partner/legal-open work.
