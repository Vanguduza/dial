# DIAL AI Development Tooling Profile

**Status:** project-level operating profile for Codex, Claude Code, Cursor and future coding harnesses.

## 1. Core rule

Coding agents are replaceable workers. DIAL Project Truth, Feature Registry, Evidence Registry, accepted designs, Git history and handoffs are durable project memory.

No plugin, proxy, context compressor, model vendor or agent-native memory may silently become the authoritative project memory.

## 2. Automatic bootstrap

Normal repository entrypoints run `scripts/dev-bootstrap.mjs` automatically:

- `pnpm install` via `postinstall`;
- `pnpm dev`;
- `pnpm dev:gateway`;
- `pnpm dev:worker`;
- `pnpm dev:queues`;
- `pnpm stack:up` / `stack:up:maps`;
- Claude Code project SessionStart hook;
- Codex project SessionStart hook where Codex hooks are enabled/trusted.

Bootstrap is idempotent and:

1. verifies mandatory Project Truth/memory assets;
2. checks Node compatibility;
3. creates `.dial/state` and `.dial/context-packs`;
4. creates development-only `.env.local` if absent without inventing live vendor credentials;
5. runs the deterministic context-drift gate;
6. installs/verifies Lefthook when dependencies are available;
7. records branch/commit/authority state;
8. writes `.dial/ACTIVE_SESSION_CONTEXT.md`;
9. injects short Project Truth context into supported SessionStart hooks.

A failed bootstrap is a development-environment error and must not be worked around by deleting Project Truth controls.

## 3. Headroom policy

Headroom is **OPTIONAL/EXPERIMENTAL**, not part of DIAL Project Truth.

### Useful DIAL roles

- compress large tool outputs, logs, JSON, search results and repetitive external documentation;
- reduce context-window pressure during repository exploration;
- reversible retrieval of original compressed content;
- optional cross-agent cache between Claude Code and Codex;
- quota/savings observability where supported.

### Forbidden roles

Headroom must not:

- replace `docs/project-truth/*` as durable project memory;
- rewrite `AGENTS.md`, `CLAUDE.md`, `project-truth.json`, Feature Registry or Evidence Registry automatically;
- compress away exact source needed for a code edit, stack trace, file path, line number, schema, migration or security finding;
- determine feature gates or accepted evidence;
- silently learn rules into shared authority files.

Do **not** run unattended `headroom learn --target CLAUDE.md` or `--target AGENTS.md`. If failure-mining is used, write suggestions to a local/review file and promote them only through normal Project Truth review.

### Recommended evaluation profile

Use Headroom first only on low-risk R0/R1 work and repository exploration. Prefer conservative compression:

- preserve user instructions;
- preserve Project Truth files completely;
- preserve recent/source code and exact errors;
- compress logs, JSON, build output, duplicated search results and verbose docs;
- keep reversible originals enabled;
- measure token savings, test success, correction rate and context-drift incidents against an uncompressed baseline.

Do not route R3 money, tax, identity, security or irreversible migration work through aggressive lossy compression until DIAL-specific evaluation proves no quality regression.

### Windows note

Native Windows support must be verified before standardizing Headroom. If the current Headroom CLI/wrapper is unstable or requires a native Rust/MSVC build, prefer WSL2/Docker or leave Headroom disabled. DIAL's repository memory/rate-limit strategy does not depend on Headroom.

## 4. Plugin admission rule

Each plugin has a context, security and rate-limit cost. Install by need, not because it exists.

Before admitting a plugin:

1. identify the exact missing DIAL capability;
2. prefer official/vendor-maintained source;
3. inspect permissions/MCP servers/hooks;
4. record whether it sends repository content to an external service;
5. avoid overlapping plugins that perform the same expensive review automatically;
6. use deferred/on-demand skills where possible;
7. benchmark context/tool-definition overhead;
8. keep Project Truth above plugin instructions.

## 5. Claude Code recommended profile

### Tier A — strongly recommended

| Plugin | DIAL role | Usage policy |
|---|---|---|
| `frontend-design` | Non-generic, production-grade frontend design | Combine with DIAL frontend skill and Figma rules; DIAL-specific bans/branch identity win on conflict. |
| `playwright` | Browser E2E, screenshots, interaction and visual verification | High value for every web surface; use as evidence tool. |
| `figma` | Design inspection, tokens, component context and design-to-code | High value because frontend quality is a founder lock. Figma is design evidence, not product SoR. |
| `feature-dev` | Structured discovery/exploration/architecture/review for complex features | Use after DIAL context pack. Do not let its generic clarifying workflow reopen locked decisions. |
| `hookify` | Fast deterministic guardrails for recurring unwanted behavior | Use for UUID/helper-text bans, secret-file protections, forbidden donor/SoR patterns and other local mistakes. |
| `security-guidance` | Continuous pattern/diff/commit security review | Useful on auth, payments, webhooks and API work. Tune model/cadence to control usage. |
| `linear` | Issue/project synchronization | Mirror execution state; Feature/Evidence Registry remains architecture/evidence SoR. |

### Tier B — targeted/on-demand

| Plugin | DIAL role | Usage policy |
|---|---|---|
| `code-review` or `pr-review-toolkit` | Independent PR review | Pick one default review path per PR; do not run multiple expensive overlapping reviewers automatically. |
| `claude-security` | Deep multi-agent security scan | Use at security milestones and staging gates, not every edit. Existing Semgrep/Checkov/Strix remain deterministic complements. |
| `context7` | Current version-specific dependency docs | Valuable for Next.js/Supabase/Temporal/etc.; verify the MCP actually loaded, especially on Windows. |
| `sentry` | Production/staging issue debugging and observability | Enable when Sentry is adopted/configured. Read operational evidence; do not make Sentry a business SoR. |
| `superpowers` | Planning/TDD/debugging methodology | Useful, but overlaps DIAL Dev Manager/Feature Realization/Tracer workflow. Enable only with explicit precedence: DIAL Project Truth and gates win. |

## 6. Codex recommended profile

### Tier A — strongly recommended

| Plugin | DIAL role | Usage policy |
|---|---|---|
| `github` | Repository/PR/issues/CI workflows | Core collaboration tool. |
| `figma` | Figma design-to-code, design-system rules, Code Connect | Core frontend quality tool for non-donor and adapted screens. |
| `codex-security` | Codex security scans, diff analysis and investigation | Use for independent R3/security-gate review. |
| `build-web-apps` | Frontend construction, browser QA and full-stack web workflows | Use under DIAL frontend/SoR rules; do not accept its generic Stripe/Supabase defaults when DIAL architecture says otherwise. |
| `linear` | Engineering work tracking | Mirror execution state; Project Truth remains durable product/architecture memory. |

### Tier B — targeted/on-demand

| Plugin | DIAL role | Usage policy |
|---|---|---|
| `superpowers` | Planning, TDD, systematic debugging and delivery | Strong methodology, but DIAL's FRC/Dev Manager/gates take precedence. Avoid duplicate planning layers. |
| `notion` | Research/spec/decision knowledge capture | Useful for stakeholder-readable knowledge; do not use Notion as the only copy of an engineering lock. |
| `sentry` | Read-only production/staging error investigation | Adopt when Sentry is configured. |
| deployment plugin (`vercel`, `render`, etc.) | Deployment/incident workflows | Install only after the actual DIAL hosting platform is selected. Avoid premature platform lock-in. |

## 7. Context/rate-limit budget

Keep the always-on plugin set small. Large MCP catalogs and many automatic reviewers consume context and/or model calls even when they are not producing value.

Recommended default session:

```text
Project Truth bootstrap
+ one feature context pack
+ GitHub/source tools
+ only the domain-specific plugin(s) required for the task
```

Examples:

- frontend task: Figma + frontend-design + Playwright;
- ordinary domain feature: feature-dev OR Superpowers, not both;
- money/security task: security-guidance + deterministic DIAL tests, deep security scan only at gate;
- production incident: Sentry + GitHub + relevant context pack.

## 8. UI guardrails remain authoritative

No plugin may override DIAL rules requiring:

- concise screens without redundant helper prose;
- meaningful human-facing names;
- no raw UUID/hash/long random identifiers in normal UI;
- short public references where useful;
- no generic AI-generated screen composition;
- visual evidence before frontend completion.
