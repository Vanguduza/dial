# DIAL — Claude Code project memory

@docs/project-truth/CONTEXT_BUNDLE.md

## Automatic session bootstrap

Project `.claude/settings.json` runs `scripts/dev-bootstrap.mjs` at SessionStart and checkpoints around compaction/session end. The bootstrap validates Project Truth, creates development-only local stack credentials if absent, runs the context-drift gate, verifies Lefthook when available and writes `.dial/ACTIVE_SESSION_CONTEXT.md`.

If a Claude host/version does not fire project hooks correctly, run `pnpm dev:bootstrap` before material work. Do not continue after a failed bootstrap by deleting or bypassing Project Truth controls.

Tool/plugin policy: `docs/project-truth/AI_TOOLING_PROFILE.md`.

## Mandatory preflight

Before material design, architecture, implementation, refactor or review:

1. Read `docs/project-truth/project-truth.json`.
2. Read `docs/project-truth/feature-registry.json`.
3. Read `docs/project-truth/evidence-registry.json`.
4. Identify affected Feature ID(s), current gate(s), inherited evidence and non-negotiable IDs.
5. Read only the domain/companion specifications required for the task.

Do not reconstruct current truth from old chat/session history. Repository Project Truth is the durable memory.

## Context efficiency

- Keep sessions task-bounded rather than using one endless conversation.
- Use `pnpm context:pack -- <FEATURE_ID>` to generate a compact task context before complex work.
- Prefer a fresh session with the compact context bundle at feature boundaries instead of carrying a bloated conversation indefinitely.
- Use `/status` to watch usage and context pressure.
- Before switching session, model, harness or developer, write a handoff using `docs/project-truth/SESSION_HANDOFF_TEMPLATE.md`.
- Never spend premium context re-reading the entire master plan when the Context Bundle + relevant Feature/Evidence records are sufficient.
- Treat Headroom/plugin/model-native memory as optional cache only; never let it silently edit Project Truth or evidence gates.

## Rate-limit discipline

- Reserve highest-cost/deepest reasoning for architecture, security, money, difficult debugging and final review.
- Use the cheapest capable model for mechanical edits, tests, migrations, documentation and bounded refactors.
- Avoid multiple expensive parallel agents unless the tasks are genuinely independent.
- Checkpoint work in Git and the handoff file before approaching usage limits.
- If a subscription limit is reached, another approved harness may resume from repository memory; do not rebuild context from conversation transcripts.
- Keep the always-on plugin set small; load Figma/Playwright/security/docs tools when the task needs them instead of materializing every MCP/tool schema in every session.

## UI copy and identifiers

- Screens must be concise. Do not add explanatory/helper text that merely repeats a label, heading or obvious action.
- Helper text is allowed only when it prevents a likely mistake, explains a non-obvious constraint, states safety/legal consequences, clarifies money/FX/tax, or explains a required unusual input.
- Never expose raw UUIDs, database IDs, hashes, trace IDs or long generated identifiers as normal user-facing names/references.
- Use human-readable public references such as `JOB-02481`, `ORD-18452`, `REQ-00641`, `PAY-10482`, while retaining UUIDs internally.
- Do not invent generic AI labels such as `Item 1`, `Record 239843`, `User UUID`, `AI Generated Job`, `Smart Insight #4827`, or long random-number names when a meaningful domain label can be derived.
- Prefer the real entity name/title plus a short public reference only when disambiguation is useful.

## Completion

Run `pnpm context:check` before merge/sign-off and follow the applicable DIAL frontend, money, security and evidence skills.
