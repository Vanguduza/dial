# DIAL — Persistent Project Memory & Rate-Limit Operating Strategy

**Purpose:** keep long-running DIAL development coherent and productive across Codex, Claude Code, Cursor/Prime and future coding agents without depending on any one conversation history.

## 1. Core principle

**Conversation history is working memory. The repository is project memory.**

The durable memory hierarchy is:

```text
Project Truth
  ├── CONTEXT_BUNDLE.md           short high-priority truth
  ├── project-truth.json          decisions / supersessions / SoRs
  ├── feature-registry.json       feature state + next work
  ├── evidence-registry.json      accepted tests/evidence + minimum gates
  ├── ACTIVE_WORK.md              current bounded work queue
  └── SESSION_HANDOFF_TEMPLATE.md cross-session transfer
        ↓
Agent entrypoints
  ├── AGENTS.md                   Codex / compatible harnesses
  └── CLAUDE.md                   Claude Code
        ↓
Task context pack
        ↓
Current agent session
```

No agent memory feature, chat transcript or model-specific session is allowed to become the sole holder of an important DIAL decision.

## 2. Why this saves rate limits

Long conversations repeatedly carry old messages/tool traces. Instead, DIAL externalizes stable context into compact files and only loads the subset needed for the current feature.

The pattern is:

```text
FULL MASTER (rare reference)
        ↓
PROJECT TRUTH (persistent compact memory)
        ↓
FEATURE + EVIDENCE records
        ↓
TASK CONTEXT PACK
        ↓
BOUNDED SESSION
        ↓
CODE / TEST / EVIDENCE / HANDOFF
        ↓
FRESH SESSION WHEN NEEDED
```

A fresh session is safe because Project Truth survives it.

## 3. Tool-neutral memory

### Codex

`AGENTS.md` is the entrypoint. It points to the same Project Truth files used by every other agent.

### Claude Code

`CLAUDE.md` imports the short Context Bundle and instructs Claude to read the relevant registries before work.

### Cursor / Prime / other harnesses

They use the same files and must not maintain an incompatible parallel memory.

## 4. Active work ledger

Use `ACTIVE_WORK.md` only for current work, not permanent architecture.

Each active item records:

- Feature ID;
- objective;
- owner/harness;
- source branch/worktree;
- current gate;
- exact next action;
- blockers classified as engineering vs external;
- checkpoint commit;
- handoff reference.

Completed facts that matter long-term move into the Feature/Evidence registries. This keeps the active context small.

## 5. Context Pack

Before a substantial task, generate a compact pack:

```bash
pnpm context:pack -- OM-0
pnpm context:pack -- E1a
```

The pack contains:

- authority version;
- only the selected feature record;
- its evidence records;
- current non-negotiables;
- key SoRs;
- the short Context Bundle;
- current active-work entry when present.

It intentionally does **not** paste the 800KB+ master plan into every model turn.

## 6. Session sizing

Default rule: one session should own one coherent bounded outcome.

Good examples:

- implement OM-0 proposal domain model + tests;
- wire E1a PSP sandbox adapter;
- port one FixItNow route family and replace its data boundary;
- perform one security audit;
- implement one migration set.

Bad examples:

- “finish DIAL”;
- keep one conversation alive for weeks;
- ask one session to work across unrelated branches and domains;
- repeatedly paste the entire master architecture.

## 7. Rate-limit governor

Use a simple workload classification:

| Tier | Work | Model policy |
|---|---|---|
| **R0 Mechanical** | formatting, renames, generated migrations, simple tests, docs sync | cheapest capable coding model |
| **R1 Standard** | normal feature implementation, routine debugging, API wiring | normal/default coding model |
| **R2 Complex** | difficult cross-domain debugging, donor adaptation, concurrency, performance | stronger reasoning model |
| **R3 Critical** | money, tax, security, authorization, architecture, irreversible migrations, final acceptance | strongest appropriate model + independent verification |

Do not spend R3 capacity on R0/R1 tasks.

## 8. Concurrency budget

Parallel agents multiply rate-limit consumption and can also create conflicting state.

Default:

- maximum **1 R3** agent at a time;
- maximum **2 R2** agents when their worktrees/domains are independent;
- R0/R1 parallelism may be higher only when changes cannot overlap;
- one Dev Manager/coordinator owns task leases and merge order.

Do not start parallel agents merely because the tool supports it.

## 9. Checkpoint before exhaustion

At regular milestones and whenever usage warnings appear:

1. commit or stash coherent work;
2. run the relevant tests;
3. update `ACTIVE_WORK.md`;
4. create session handoff;
5. record new evidence/gate movement;
6. run `pnpm context:check`;
7. stop cleanly if necessary.

Another approved agent can resume without reconstructing the session.

## 10. Rate-limit fallback

When Codex or Claude Code reaches a subscription usage limit:

```text
current agent
  → checkpoint
  → handoff
  → repository memory updated
  → optional alternate approved harness
  → read Project Truth + context pack
  → resume exact next action
```

The fallback agent does not repeat discovery already captured in the repository.

## 11. API/gateway option

If DIAL later uses API-billed coding agents rather than only subscription sessions, an LLM gateway can provide centralized budget/rate controls, usage tracking and routing. This is an infrastructure option, not a requirement for the current repo-memory pattern.

Do not route subscription-authenticated Codex/Claude Code through an unapproved workaround merely to evade plan limits.

## 12. Prompt discipline

Every implementation prompt should provide:

1. Feature ID;
2. exact outcome;
3. relevant current gate;
4. context pack path;
5. files/domain boundary in scope;
6. acceptance tests/evidence required;
7. explicit non-goals;
8. stop condition.

Avoid long narrative prompts that duplicate Project Truth.

## 13. UI copy discipline

Screen text is product UI, not an AI explanation channel.

### Default

Use:

- concise labels;
- short action-oriented button text;
- direct status text;
- meaningful empty/error messages;
- progressive disclosure for details.

### Helper text is justified only when it

- prevents a likely costly mistake;
- explains a non-obvious field/constraint;
- explains legal/safety/compliance consequences;
- clarifies money, tax, FX or irreversible behavior;
- explains why required information is needed when not self-evident.

### Helper text must not

- repeat the label;
- narrate obvious UI behavior;
- tell the user what a clearly named button does;
- add generic marketing filler;
- explain internal architecture;
- pad cards/forms because the layout looks empty.

Example:

Bad:
`Vehicle registration`  
`Enter your vehicle registration number in the field below.`

Better:
`Registration number`

Useful exception:
`VIN`  
`17 characters. Used to verify compatible parts.`

## 14. Public identifier policy

Internal UUIDs remain valid database identifiers. They are **not user-facing names**.

Use a separate public reference:

- `JOB-02481`
- `REQ-00641`
- `ORD-18452`
- `PAY-10482`
- `RET-00317`
- `PRJ-00128`
- `SUP-00843`

Rules:

- short enough to read aloud/type into support;
- stable/immutable;
- unique within its namespace;
- not security-sensitive;
- never use sequential public codes as authorization;
- raw UUID may appear only in developer/admin diagnostic tooling where technically necessary and visually secondary.

Entity titles should be meaningful:

- `Alternator replacement — 2018 Toyota Hilux`
- `Kitchen DB board fault`
- `Brake pads — front axle`

Not:

- `Job 8c7d9b82-5720-4ad7-9722-...`
- `Request_0099284882`
- `AI Job 4488339201`

## 15. Acceptance

A long-running task is context-safe when:

- the next agent can resume from repository state alone;
- Project Truth contains every durable decision;
- active work contains the exact next action;
- evidence/gates survive session/repo change;
- prompts load only relevant context;
- rate-limit exhaustion causes a checkpoint, not lost work;
- UI never leaks implementation identifiers or unnecessary explanatory prose.
