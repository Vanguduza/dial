# DIAL ← External Skills & Agents — Locked Utilization (D-55)

**Status:** **Locked adopted** — founder decision **D-55** (v4 §0.2 + D-log).  
**Research date:** 2026-08-11 · **Lock date:** 2026-08-11  
**Companion role:** Full technical utilization for selective external skills/agents. Architecture SoR remains `DIAL_Consolidated_Plan_v4.md` → Agent Pack → companions. Cursor pack SoR: `AGENTS.md` + `.cursor/rules` + `dial-*` skills.

**Repos evaluated:**

| Repo | Stars (approx) | Licence (verified) | Default branch | D-55 stance |
| --- | --- | --- | --- | --- |
| [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) | ~6.3k | **MIT** (`LICENSE`) | `main` | **Adopt** thin `dial-diagram-editorial` — no asset gallery vendor |
| [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) | ~143k | **MIT** (`LICENSE`) | `main` | **Adopt habits only** into money-path + tracer — no full roster |
| [anthropics/skills](https://github.com/anthropics/skills) | ~168k | **Mixed** — Apache-2.0 examples vs Anthropic ToS for doc skills | `main` | **Adopt** skill anatomy + thin `dial-webapp-recon` — never docx/pdf/pptx/xlsx |

**Does not reopen:** C-5 / D-38…D-56 / money SoR / D-52 stub-as-MVP ban / D-56 plan-phase grill skip.

**Fit tiers** (Blueprint §3 / §6.11 doctrine):

| Tier | Meaning |
| --- | --- |
| **Tier 1 habit (locked)** | In-repo `.cursor/skills/` or catalog standard with attribution; DIAL locks win |
| **Optional personal** | Clone/symlink/plugin outside proprietary core; not monorepo SoR |
| **Reference-only** | Study patterns; do not vendor trees |
| **Reject** | Conflicts with locks, licence, or instruction-budget hygiene |

---

## 0. D-55 lock summary

| Adopt | Artefact | Reject |
| --- | --- | --- |
| Editorial diagram type map for DIAL domains | `.cursor/skills/dial-diagram-editorial/SKILL.md` | Full diagram-design `assets/` / example HTML dump |
| Payments idempotency, webhooks-as-truth, Reality Checker evidence | `dial-money-path-review`, `dial-tracer-slice` | Full agency-agents Cursor install as SoR; Rapid Prototyper; RN/Expo defaults |
| Skill anatomy / progressive disclosure + Playwright recon | Catalog § skill anatomy; `dial-webapp-recon` | anthropics `docx`/`pdf`/`pptx`/`xlsx`; full `skills/` tree |

---

## 1. diagram-design (MIT) — locked technical adoption

### 1.1 What it is

Claude Code / Codex **skill** that generates **editorial HTML+SVG diagrams** (27 types × light/dark/full-editorial). Progressive disclosure: lean `SKILL.md` + `references/type-*.md` loaded on demand. Explicit anti-Mermaid-slop design system (one accent, density 4/10, 4px grid, no shadows).

### 1.2 Licence

**MIT** — study, symlink, or selectively copy with copyright notice. DIAL ships a **thin wrapper only**.

### 1.3 When to trigger

| Trigger | Action |
| --- | --- |
| Planning ERP / package boundaries after grill | `dial-diagram-editorial` → Layer stack / Architecture |
| Temporal delivery or Job Reserve design | Sequence / Swimlane / State machine |
| Intelligence Factory or Command Centre explainer | Loop / Quadrant |
| D-51 dual capacity or D-49 B2B filter docs | Venn / Nested / Data flow / DP security matrix |
| PR needs a quick visual only | Mermaid fallback — not a substitute for DoD |

### 1.4 Inputs / outputs

**Inputs:** domain intent, audience, output sink (`docs/diagrams/` vs architecture MD vs Mermaid), optional brand tokens from design-tokens/site.

**Outputs:** type pick + node/edge inventory + HTML (if upstream installed) or Mermaid/prose + lock callouts on the figure.

### 1.5 DIAL type map (normative)

See skill `dial-diagram-editorial` for the live table. Canonical subjects:

1. **Layer stack** — apps → packages → infra; accent money/ledger  
2. **Sequence / Swimlane** — D-45 delivery; no Fleetbase SoR  
3. **State machine** — Job Reserve; webhooks as truth  
4. **Loop** — Factory: outcomes → datasets → Promptfoo → human promote  
5. **Quadrant** — CC Actual vs Simulated; *Simulated never auto-pays*  
6. **Venn / Nested** — D-51 agency vs `DIAL_OWNED`  
7. **Data flow / DP security matrix** — D-49 informal filter  

### 1.6 Anti-patterns

- Vendoring 27×3 example HTML into the monorepo  
- Diagram replaces grill / tracer DoD / money-path audit  
- Pretty figure as Threat Dragon STRIDE SoR (D-48) or map SoR (D-44)  
- Whimsy/sketchy skin on fiscal/WHT/escrow runbooks  
- Reopening C-5 via “frontend taste” in diagrams  

### 1.7 Optional personal

Clone/symlink upstream for HTML export quality; save outputs under `docs/diagrams/` if versioned. Brand onboarding stays personal until public site tokens stabilize.

---

## 2. agency-agents (MIT) — locked technical adoption

### 2.1 What it is

Large **persona library**. DIAL **does not** install the roster as monorepo SoR. Selective habits only.

### 2.2 Licence

**MIT** — rewrite under `dial-*` with attribution.

### 2.3 When to trigger (habits)

| Habit source | DIAL trigger | Destination |
| --- | --- | --- |
| Payments & Billing Engineer | Any PSP / Job Reserve / webhook / refund PR | `dial-money-path-review` |
| Reality Checker | Claiming tracer **Done** | `dial-tracer-slice` evidence bullets |
| Identity / AppSec (reference) | IDOR/OIDC language | Prefer `dial-rls-idor-audit` + D-47/D-48 |
| Search Relevance (reference) | Meili ranking work | Enforce **D-49** informal filter |

### 2.4 Inputs / outputs

**Money-path inputs:** list of mutating routes/workflows.  
**Money-path outputs:** Critical/High/Medium audit report (no auto-fix).

**Tracer Done inputs:** DoD checklist + channel matrix.  
**Tracer Done outputs:** evidence pack (tests, screenshots/`dial-webapp-recon`, webhook replay note, Promptfoo cite for AI).

### 2.5 Normative checklist bullets (payments)

Already encoded in `dial-money-path-review`:

- Idempotency key from **business operation**  
- Signature + dedupe **before** mutate  
- **Webhooks as truth** (redirect ≠ SoR)  
- Duplicate event = no-op  
- Reconcile path or ticketed ops mismatch  
- Integer `amountMinor` + currency; AI never writes payable amounts  
- PspAdapter rails only (not Stripe-persona stack as SoR)

### 2.6 Normative evidence bullets (Reality Checker → DoD)

Already encoded in `dial-tracer-slice` Done step 9.

### 2.7 Reject / conflicts (locks)

| Agency vibe | Conflict |
| --- | --- |
| Rapid Prototyper / stub-MVP | **D-52** |
| RN/Expo customer shell | **C-5** |
| Voice AI as product UX | Non-negotiable no voice |
| Stripe/Adyen-first as SoR | Keep PspAdapter (D-43) |
| Float / AI sets price | Money locks |
| Unofficial messaging | **D-40** |
| Google Maps distance SoR | **D-44** |
| Auto-certify fantasy A+ | Still need Promptfoo + human (**D-54**) |
| Marketplace-wide principal / informal→B2B | **D-49** / **D-51** |
| Full roster / agency swarm as Cursor SoR | Instruction-budget poison; Ruflo swarm already rejected |

### 2.8 Optional personal

`./scripts/install.sh --tool cursor --division engineering,security,testing` with **deny-list**: rapid-prototyper, mobile-app-builder (RN defaults), voice-ai, WeChat/WP/Drupal carts. Never commit that roster as project SoR.

---

## 3. anthropics/skills — locked technical adoption

### 3.1 What it is

Public Agent Skills examples + anatomy (progressive disclosure). Domain examples include `frontend-design`, `webapp-testing`, `mcp-builder`, `skill-creator`, and document skills.

### 3.2 Licence (critical)

| Bucket | Examples | DIAL policy |
| --- | --- | --- |
| **Apache-2.0** | `skill-creator`, `frontend-design`, `webapp-testing`, `mcp-builder`, most example-skills | Patterns OK with attribution |
| **Anthropic ToS / source-available** | `docx`, `pdf`, `pptx`, `xlsx` | **Never** extract, copy, or derivative into monorepo |

Repo root may lack SPDX; **always** read per-skill `LICENSE.txt` before any copy.

### 3.3 Skill anatomy standard (normative for all `dial-*`)

When authoring or revising any `.cursor/skills/dial-*/SKILL.md`:

| Rule | Detail |
| --- | --- |
| YAML frontmatter | `name` (≤64, kebab-case) + pushy `description` (WHAT + WHEN, third person, trigger terms) |
| Body length | Prefer **&lt;500 lines**; push detail to `references/` if growing |
| Progressive disclosure | SKILL.md = workflow + checklists; heavy examples/scripts optional and loaded on demand |
| Scripts | Treat as black boxes (`--help` first); do not paste huge scripts into context |
| Ownership | DIAL-authored text; cite upstream licence in skill Authority + `SOURCES.md` |
| Eval pass | For process skills: 3 golden prompts mentally/manual; for AI: Promptfoo (**D-54**) — skill-creator Claude eval scripts are **not** Promptfoo SoR |
| Forbidden | Vendoring anthropics document-skill trees; dumping entire `skills/` into `.cursor/` |

### 3.4 `dial-webapp-recon` (optional thin skill — adopted)

| | |
| --- | --- |
| **Trigger** | UI smoke / selector discovery / tracer Done evidence for admin or customer web |
| **Inputs** | Base URL (local/staging), scenario, auth path without printing secrets |
| **Outputs** | Recon notes, screenshots, optional Playwright stub, pass/fail vs DoD |
| **Pattern** | Wait `networkidle` → screenshot/DOM → selectors → actions |
| **Runtime** | Prefer Node Playwright; do not require upstream Python `with_server.py` |
| **Anti-patterns** | Browser-driving money SoR; production pentest; copying ToS doc skills |

### 3.5 Reject / conflicts

- Document skills licence forbids repo vendoring  
- `frontend-design` must not override C-5, MapLibre courier UX, or integer money display  
- Skill-creator eval ≠ Promptfoo + Langfuse + human promote (**D-54**)  
- Creative skills (`algorithmic-art`, `slack-gif-creator`) out of core platform scope  
- Full marketplace install of anthropic-agent-skills into `.cursor/` — reject  

### 3.6 MCP note

If DIAL adds internal MCP (e.g. read-only MetricContract registry), study `mcp-builder` checklists. Money mutations stay fail-closed HTTP with `INTERNAL_API_SECRET` — not casual MCP write tools.

---

## 4. Map onto DIAL agent surface

| DIAL artefact | diagram-design | agency-agents | anthropics/skills |
| --- | --- | --- | --- |
| `AGENTS.md` | Pointer + D-55 | Habits only — no roster | Skill anatomy + webapp-recon |
| `dial-diagram-editorial` | **Locked skill** | — | — |
| `dial-money-path-review` | After JR diagrams | **Idempotency / webhook truth** | — |
| `dial-tracer-slice` | Optional Plan diagram | **Evidence before Done** | webapp-recon for UI evidence |
| `dial-webapp-recon` | — | — | **Locked thin skill** |
| `dial-grill-locks` | **D-56** Plan (before Build) | Reject Rapid Prototyper | Reject doc skill vendor |
| D-48 Threat Dragon | Complementary visuals | AppSec complements Semgrep | N/A |
| Catalog / SOURCES | Attribution | Attribution | Apache vs ToS split |

---

## 5. Cross-cutting lock checklist

Any utilization must preserve:

1. Money = `amountMinor` + `currency`; AI never writes payable amounts  
2. Ledger / Job Reserve / promotions SoR = DIAL packages  
3. WhatsApp Cloud API only; MapLibre + OSRM/VROOM  
4. Delivery = `packages/delivery` + Temporal  
5. AuthZ object-level + webhook sig/idempotency  
6. D-49 / D-50 / D-51 / D-52 / D-53 / D-54 / **D-55** / **D-56** as in `dial-non-negotiables.mdc`  
7. No full upstream skill/agent tree dump; selective port + attribution  

---

## 6. Prioritized actions (post-lock)

### Done under D-55

1. `dial-diagram-editorial` skill (type→domain map)  
2. Payments + Reality Checker habits in `dial-money-path-review` / `dial-tracer-slice`  
3. Skill anatomy standard in catalog + this companion  
4. `dial-webapp-recon` thin skill  
5. Licence split recorded in catalog / `SOURCES.md`  
6. v4 §0.2 + D-log **D-55**; AGENTS / Pack / Blueprint / non-negotiables / grill range  

### Still optional (personal / later)

1. Personal diagram-design install + brand onboarding when site tokens stabilize  
2. Personal Agency install with deny-list (never monorepo SoR)  
3. `mcp-builder` study when first internal MCP is scheduled  

### Explicit non-actions

- Do **not** merge anthropics/skills or agency-agents trees into `.cursor/`  
- Do **not** vendor diagram-design asset galleries  
- Do **not** treat any persona as able to reopen locks  

---

## 7. Attribution

| Source | Took | Licence |
| --- | --- | --- |
| cathrynlavery/diagram-design | Editorial type selection; progressive disclosure shape → `dial-diagram-editorial` | MIT |
| msitarzewski/agency-agents | Payments/webhook/idempotency + evidence-before-ship → money-path + tracer | MIT |
| anthropics/skills | Skill anatomy + Playwright recon (`webapp-testing`) → catalog standard + `dial-webapp-recon` | Apache-2.0 (examples); ToS (document skills — **not** copied) |

See also: `DIAL_Cursor_Rules_and_Skills.md`, `.cursor/rules/SOURCES.md`, `DIAL_AIHero_Adaptations.md`.
