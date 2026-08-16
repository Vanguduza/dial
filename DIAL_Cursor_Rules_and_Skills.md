# DIAL Cursor Rules & Skills Catalog (D-47 / D-55 / D-56)

**Locked by D-47** (Cursor pack) **+ D-48** (AppSec toolchain pointers) **+ D-55** (external skills utilization) **+ D-56** (plan-phase grill + AI capability merge gate). Indexes the applied Cursor pack. Architecture authority: `DIAL_Consolidated_Plan_v4.md` → `DIAL_Development_Agent_Pack.md` → companions. Rationale: `DIAL_Lazy_Developer_Playbook_Adaptations.md`, `DIAL_AIHero_Adaptations.md`, `DIAL_External_Skills_Repos_Utilization.md`. Security tools: `DIAL_Security_Toolchain.md`. AI Kernel/Prime absorb (**D-61**): `DIAL_AI_Kernel_Prime_Agent_Adopted.md` (not proposal archive as SoR).

## How agents should use this

1. Workspace root = this repo — **alwaysApply** `.mdc` rules inject automatically.
2. Glob-scoped rules attach when matching files are in context.
3. Read `AGENTS.md` for authority order (Codex / other harnesses too).
4. Invoke `.cursor/skills/dial-*` for **audit-then-fix** (money, IDOR, PspAdapter, AI capabilities) and process skills (grill-locks, tracer-slice, diagram-editorial, webapp-recon).
5. Paste `docs/agent-audits/*` for report-only security passes before fix PRs.

Do **not** vendor full [ECC](https://github.com/affaan-m/everything-claude-code), [Ruflo](https://github.com/ruvnet/ruflo), agency-agents, or anthropics/skills trees into proprietary core — **habits only**.

---

## Skill anatomy standard (all `dial-*`) — D-55

Inspired by [anthropics/skills](https://github.com/anthropics/skills) **Apache-2.0** `skill-creator` progressive disclosure — **DIAL-owned** text.

| Rule | Requirement |
| --- | --- |
| Frontmatter | `name` (kebab-case ≤64) + third-person `description` with WHAT + WHEN + trigger terms |
| Body | Prefer &lt;500 lines; workflow + checklists + anti-patterns + Authority |
| Progressive disclosure | Heavy detail → optional `references/`; scripts as black boxes |
| Attribution | Licence + upstream link in Authority and `.cursor/rules/SOURCES.md` |
| Eval | Process skills: 3 golden prompts; AI paths: Promptfoo (**D-54**) — not Claude-only eval scripts as SoR |
| Forbidden | Vendoring anthropics `docx`/`pdf`/`pptx`/`xlsx` (ToS); dumping entire upstream `skills/` trees |

---

## `.cursorignore`

Ignores `.env*`, keys/certs, `node_modules`, build artifacts, large binaries, offline map packs, agent-tools dumps. Starter names: `.env.example` (public vs secret classified).

---

## Rules (`.cursor/rules/*.mdc`)

| File | Apply | Purpose |
| --- | --- | --- |
| `dial-agent-authority.mdc` | always | Doc authority + reading order |
| `dial-non-negotiables.mdc` | always | Money/AI/WA/maps/SoR locks (D-38…D-61) |
| `dial-security-idor.mdc` | always | IDOR, no body identity, webhooks, secrets |
| `dial-security-toolchain.mdc` | always | D-48 Threat Dragon / Semgrep / Checkov / Renovate / Strix pointers |
| `dial-key-drop-in.mdc` | always | Founder standing — adapters key-ready; zero code after secrets; D-47 hygiene |
| `dial-autonomous-completion.mdc` | always | Founder standing — auto-continue Completion Plan; secret phases honestly open; no fixture-only gate claims |
| `dial-donor-identity.mdc` | always | D-38 clarified — per-branch donor look (Tech=FixItNow); ban shared DIAL storefront brand |
| `dial-credentials-after-testing.mdc` | always | Live payment/WA/tax keys only after production-ready |
| `dial-api-webhooks.mdc` | globs API / webhooks | Fail-closed internals, signature + idempotency, Zod at boundary |
| `dial-money-fiscal.mdc` | globs payments/ledger/pricing/… | Integer minor units, outbox, FDMS virtual |
| `dial-promotions.mdc` | globs `packages/promotions` | `computeActions` via pricing only |
| `dial-delivery-maps.mdc` | globs delivery / admin delivery | D-45 SoR + MapLibre |
| `dial-web-bundles.mdc` | globs web apps | Customer vs admin JS split; SEO only on public Spare/Tech |
| `SOURCES.md` | — | Attribution |

---

## D-48 AppSec toolchain (CI companions)

Does **not** replace dial-* skills or Appendix A.1. Detail: `DIAL_Security_Toolchain.md`, `docs/security/README.md`.

| Artefact | Role |
| --- | --- |
| `ThreatDragonModels/**/*.json` | Starter STRIDE models (Job Reserve, Spare, Tech, Delivery, WA Flows, FDMS, RLS/IDOR) |
| `semgrep.yml` + `semgrep/rules/` | Custom `dial.*` rules — CI **`semgrep-dial` hard-fail** |
| `.github/workflows/checkov.yml` | IaC — hard-fail HIGH/CRITICAL |
| `renovate.json` | Primary dependency updates; Dependabot alerts-only |
| `docs/security/strix-runbook.md` | Strix staging-only BYOK procedure + `strix-staging` workflow |

---

## Skills (`.cursor/skills/`)

| Skill | When |
| --- | --- |
| `dial-money-path-review` | Payments, Job Reserve, pricing, fiscal — audit before fix; webhook-as-truth / idempotency (**D-55**) |
| `dial-rls-idor-audit` | Routes with object ids; RLS/IDOR reviews |
| `dial-psp-adapter-completeness` | PspAdapter / D-43 webhook completeness |
| `dial-grill-locks` | **D-56** — design-tree interview in Plan before scaffold; hard-stops on C-5 / D-38…D-61 |
| `dial-tracer-slice` | **D-52** — Plan→Build→Expand→DoD 100% + Reality Checker evidence (**D-55**); ban stub-as-MVP |
| `dial-ai-capability-review` | **D-56** — `packages/ai` merge gate: Zod, D-32, no money writes, Promptfoo/Langfuse |
| `dial-diagram-editorial` | **D-55** — DIAL diagram type→domain map (layer stack, delivery swimlane, JR state machine, Factory loop, dual capacity, CC Actual vs Simulated) |
| `dial-webapp-recon` | **D-55** — Playwright recon-then-action for admin/customer web smoke (Apache-2.0 pattern) |

Optional personal install (not required in-repo): ECC Cursor adapter via upstream `install.sh --profile minimal --target cursor`, or [cminn10/ecc2cursor](https://github.com/cminn10/ecc2cursor); or `npx skills add mattpocock/skills` (MIT); or personal diagram-design / Agency with deny-list — keep DIAL rules authoritative on conflicts.

---

## Audit prompts (`docs/agent-audits/`)

- `endpoint-audit.md` — Auth gaps on mutating / side-effect routes  
- `idor-audit.md` — Object-level AuthZ  
- `secrets-audit.md` — Env radioactivity + bundle leakage  

---

## GitHub research findings

### ECC (Everything Claude Code)

- **Repo:** [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) (also `affaan-m/ECC`) — **MIT**
- Large multi-harness pack (agents, skills, hooks, AgentShield). Cursor adapter populates `.cursor/` via `./install.sh --profile minimal --target cursor`.
- **DIAL took:** concise always-on security/secrets fail-closed tone; plan → audit → fix skill shape. **Not taken:** full 29+ rule dump, swarm agents, hooks runtime as SoR.

### Ruflow / Ruflo

- User term “Ruflow” maps to **[ruvnet/ruflo](https://github.com/ruvnet/ruflo)** (Claude Flow lineage; plugins include `ruflo-workflows`) — **MIT**
- Stateful MCP workflows + native `.claude/workflows/*.js` fan-out — Claude Code–centric.
- **DIAL took:** named audit-then-fix / human-gated review workflows as **skills**. **Not taken:** swarm/federation harness inside the monorepo.

### Other high-signal public packs (reference only)

| Repo | Licence | Relevance | DIAL use |
| --- | --- | --- | --- |
| [vibestackdev/vibe-stack](https://github.com/vibestackdev/vibe-stack) | MIT | Next.js 15 + Supabase RLS / `getUser()` vs `getSession()` | Pattern inspiration for API AuthN; DIAL still uses Pack RLS + `assertResourceAccess` |
| [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) | CC0-1.0 | Index of community `.mdc` / cursorrules | Index only |
| [kinopeee/cursorrules](https://github.com/kinopeee/cursorrules) | MIT | Short alwaysApply vs glob rules | Structure |
| [sanjeed5/awesome-cursor-rules-mdc](https://github.com/sanjeed5/awesome-cursor-rules-mdc) | CC0-1.0 | Curated `.mdc` list | Index only |
| [jesseoue/cursor-rules](https://github.com/jesseoue/cursor-rules) | (check LICENSE) | Next/TS/Supabase rule set | Not vendored |
| [instructa/ai-prompts](https://github.com/instructa/ai-prompts) | MIT | Prompt library | Not vendored |

**Domain gaps filled by DIAL-authored rules/skills (not upstream):** Temporal money/dispatch workflows, WhatsApp Cloud API (no Baileys), MapLibre courier maps, PspAdapter multi-PSP webhooks, `@dial/promotions`, Android Compose `delivery-android`.

### Lazy Developer

- [thelazydeveloper.org](https://www.thelazydeveloper.org/) — secrets radioactivity, IDOR, webhook/idempotency, ship-less-JS, cost alerts — see playbook companion.

### AI Hero (Matt Pocock)

- [aihero.dev](https://www.aihero.dev/) + [mattpocock/skills](https://github.com/mattpocock/skills) (**MIT**) — grilling, tracer bullets, AGENTS.md progressive disclosure, evals teaching, structured-output/guardrail patterns.
- **DIAL took:** process skills `dial-grill-locks` (**D-56** Plan), `dial-tracer-slice` (**D-52** Plan→Build→Expand→DoD), `dial-ai-capability-review` (**D-56** merge gate); slim-entrypoint habit. **Not taken:** Evalite/Braintrust as SoR, full skills tree vendor, Vercel AI SDK/Effect as mandatory runtime, AFK money paths, stub-as-MVP. Detail: `DIAL_AIHero_Adaptations.md`.

### External skills / agents (**D-55** locked adopted)

Full utilization + lock conflicts: **`DIAL_External_Skills_Repos_Utilization.md`**. Summary:

| Repo | Licence | DIAL stance |
| --- | --- | --- |
| [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) | MIT | **Adopted** thin `dial-diagram-editorial` — no full asset dump |
| [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) | MIT | **Adopted** habits into money-path + tracer — **not** full Cursor roster; reject Rapid Prototyper vs D-52, RN/Expo vs C-5 |
| [anthropics/skills](https://github.com/anthropics/skills) | Mixed (Apache-2.0 examples; ToS on docx/pdf/pptx/xlsx) | **Adopted** skill-anatomy standard + `dial-webapp-recon` — **never** vendor document skills or entire tree |

---

## Map: top-10 Lazy adaptations → local artifacts

| # | Adaptation | Where enforced |
| --- | --- | --- |
| 1 | Cursor rules + `.cursorignore` | This pack + `.cursorignore` |
| 2 | Audit-then-fix | `docs/agent-audits/*` + dial-* skills |
| 3 | Object AuthZ + IDOR CI | `dial-security-idor.mdc`, Pack Appendix A.1 / T9 |
| 4 | Fail-closed internal secret | `INTERNAL_API_SECRET`, `dial-api-webhooks.mdc` |
| 5 | Never trust body identity | `dial-security-idor.mdc`, Pack §2 #14 |
| 6 | Env public vs secret | Pack §6.0, `.env.example` |
| 7 | Webhook sig + idempotency | Appendix A.1, `dial-api-webhooks.mdc` |
| 8 | Headers / CORS / rate limits | Pack §2.1 + T9 |
| 9 | Cost/health dashboard | Pack §2.1 + T9 stub |
| 10 | Customer-web route split | `dial-web-bundles.mdc` |

## Map: top AI Hero adaptations → local artifacts

| # | Adaptation | Where enforced |
| --- | --- | --- |
| 1 | Grill before scaffold (locks hard-stop) | `dial-grill-locks` (**D-56**) |
| 2 | Tracer sequencing + feature DoD (D-52) | `dial-tracer-slice` |
| 3 | AI capability Zod/privacy/money audit | `dial-ai-capability-review` (**D-56** merge gate) |
| 4 | Slim AGENTS.md + progressive disclosure | `AGENTS.md` + Pack §2.2 (**D-47 / D-56**) |
| 5 | Evals via Promptfoo/Langfuse (not Evalite SoR) | v4 §5.9 / §6.10; adaptations doc; **D-54** Factory promote gates |

## Map: D-55 external adaptations → local artifacts

| # | Adaptation | Where enforced |
| --- | --- | --- |
| 1 | Editorial diagram type map | `dial-diagram-editorial` |
| 2 | Payments idempotency / webhooks-as-truth | `dial-money-path-review` |
| 3 | Reality Checker evidence before Done | `dial-tracer-slice` |
| 4 | Skill anatomy / progressive disclosure | This catalog § + all new dial-* |
| 5 | Playwright recon-then-action | `dial-webapp-recon` |

---

*Keep this catalog short; live enforcement = rules/skills. Re-verify upstream licences before copying more text.*
