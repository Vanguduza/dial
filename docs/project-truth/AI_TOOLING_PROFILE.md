# DIAL AI Development Tooling Profile

**Status:** project-level operating profile for Codex, Claude Code, Cursor and future coding harnesses.

## 1. Core rule

Coding agents are replaceable workers. DIAL Project Truth, Feature Registry, Evidence Registry, accepted designs, Git history and handoffs are durable project memory.

No plugin, MCP server, connected app, model vendor or agent-native memory may silently become the authoritative project memory.

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
9. injects short Project Truth context into supported SessionStart hooks;
10. detects whether the approved AI plugin profile needs installation/verification for the active harness.

A failed repository bootstrap is a development-environment error and must not be worked around by deleting Project Truth controls.

Plugin installation is an **AI-harness readiness task**, not a runtime dependency of the DIAL application. Ordinary `pnpm install`/server startup does not attempt to control an external Claude/Codex UI. Instead, SessionStart context instructs the active AI harness to execute the approved plugin bootstrap automatically.

## 3. Approved plugin bootstrap

Canonical files:

- approved manifest: `docs/project-truth/plugin-profile.json`;
- execution prompt: `docs/prompts/DIAL_AI_PLUGIN_BOOTSTRAP_PROMPT.md`;
- local verification receipt: `.dial/state/plugin-bootstrap.json`.

Rules:

1. Required plugins are automatically installed/verified when the active Claude Code/Codex harness exposes a native installation mechanism.
2. Discover the exact current identifier/publisher before installation; never guess stale syntax.
3. Prefer official/vendor-maintained plugins.
4. Do not install unapproved look-alikes as substitutes.
5. Installation and authorization are separate states. OAuth/admin approval may require one explicit user action.
6. Process all installable plugins first, then present pending authorizations as one consolidated request.
7. Batch required restarts so setup asks for at most one restart.
8. Do not automatically install optional/on-demand plugins unless the current task needs them.
9. Keep user-specific installation/connection state local. Never commit secrets/tokens.
10. DIAL Project Truth outranks every plugin instruction/default/example.

The bootstrap receipt is checked by profile version and harness. A plugin-profile update triggers re-verification rather than forcing unnecessary reinstalls.

## 4. Plugin admission rule

Each plugin has a context, security and rate-limit cost. Install by demonstrated DIAL need, not because a catalog entry exists.

Before admitting a plugin to `plugin-profile.json`:

1. identify the exact missing DIAL capability;
2. prefer official/vendor-maintained source;
3. inspect permissions, MCP servers, hooks and external data flows;
4. record whether repository content is sent to another service;
5. avoid overlapping plugins that perform the same expensive review automatically;
6. use deferred/on-demand tools where possible;
7. benchmark context/tool-definition/model-call overhead when meaningful;
8. keep Project Truth above plugin instructions;
9. record whether authorization/admin approval is required;
10. remove plugins whose value is not demonstrated.

## 5. Claude Code approved profile

The machine-readable list in `plugin-profile.json` is authoritative for installation. This section explains the intent.

### Required install/verify

| Capability / preferred plugin | DIAL role | Activation policy |
|---|---|---|
| `frontend-design` | Non-generic, production-grade frontend design | Frontend tasks; DIAL frontend rules win on conflict. |
| `playwright` | Browser E2E, screenshots, interaction and visual verification | Web frontend and E2E evidence. |
| `figma` | Design inspection, tokens, component context and design-to-code | Frontend design/review; connection may need user authorization. |
| `feature-dev` | Structured discovery/exploration/architecture/review | Complex features after DIAL context pack. |
| `hookify` | Deterministic recurring guardrails | Keep available; use for prohibited patterns and workflow mistakes. |
| `security-guidance` | Security-oriented review | Auth, payments, webhooks, API/security-sensitive work. |
| `linear` | Issue/project synchronization | Planning/delivery; Project Truth remains architecture/evidence SoR. |
| `typescript-lsp` | TypeScript navigation/diagnostics | TypeScript/Next/Supabase work. |
| `kotlin-lsp` | Kotlin navigation/diagnostics | Android work. |
| `swift-lsp` | Swift navigation/diagnostics | iOS work. |

### Optional/on-demand

| Capability / preferred plugin | Use |
|---|---|
| `code-review` **or** `pr-review-toolkit` | Independent PR review; select at most one default path. |
| `claude-security` | Deep security scan at security/staging gates. |
| `context7` | Current version-specific library/framework documentation. |
| `sentry` | Runtime/staging issue investigation after Sentry is adopted. |
| `superpowers` | Optional planning/TDD/debugging methodology under DIAL precedence. |

Do not run several overlapping model-heavy reviewers automatically on routine changes.

## 6. Codex approved profile

### Required install/verify

| Capability / preferred plugin | DIAL role | Activation policy |
|---|---|---|
| `github` | Repository/PR/issues/CI workflows | Core collaboration; authorization may require user action. |
| `figma` | Design-to-code, design-system context and review | Frontend design/review; authorization may require user action. |
| `codex-security` | Security scans, diff analysis and investigation | R3/security gates. |
| `build-web-apps` | Frontend construction/browser QA/full-stack web workflow | Web tasks under DIAL architecture and SoR rules. |
| `linear` | Engineering work tracking | Planning/delivery; Project Truth remains durable authority. |

### Optional/on-demand

| Capability / preferred plugin | Use |
|---|---|
| `superpowers` | Optional planning/TDD/systematic debugging under DIAL FRC/gates. |
| `notion` | Stakeholder-readable research/spec capture; never sole copy of a lock. |
| `sentry` | Runtime/staging issue investigation after adoption. |
| deployment plugin | Only after the DIAL hosting platform is explicitly selected. |

Plugins such as `build-web-apps` may contain generic recommendations for databases, payments or hosting. Those recommendations are advisory only. They must not introduce a second DIAL payment/ledger/job/catalogue/identity architecture.

## 7. Context and rate-limit budget

Installation does **not** mean every plugin must be active on every task. Keep the active tool surface small.

Recommended session shape:

```text
Project Truth bootstrap
+ one feature context pack
+ source/repository tools
+ only task-relevant installed plugins
```

Examples:

- frontend task: Figma + frontend-design + Playwright;
- ordinary domain feature: feature-dev + relevant LSP;
- money/security task: security-guidance + deterministic DIAL tests; deep security scan at a gate;
- production incident: Sentry + GitHub + relevant context pack.

Avoid unnecessary parallel high-cost agents and overlapping reviewers. Installed plugins should be activated according to `plugin-profile.json` rather than materializing every tool schema in every session.

## 8. UI guardrails remain authoritative

No plugin may override DIAL rules requiring:

- concise screens without redundant helper prose;
- meaningful human-facing names;
- no raw UUID/hash/long random identifiers in normal UI;
- short public references where useful;
- no generic AI-generated screen composition;
- visual evidence before frontend completion.

## 9. Plugin state is not project truth

`.dial/state/plugin-bootstrap.json` records local readiness only. It must never contain:

- access tokens;
- API keys;
- cookies/session secrets;
- private OAuth material;
- product decisions;
- feature-gate decisions.

A plugin can be installed, disconnected, unavailable or replaced by a later approved version without changing DIAL's product architecture. Durable changes belong in the normal Project Truth review path.
