# DIAL ← AI Hero — Adaptations

**Source studied:** [aihero.dev](https://www.aihero.dev/) (homepage, `/llms.txt`, `/sitemap.md`, `/api` discovery, `/skills` catalogue + skill guides, posts on AGENTS.md, evals, feedback loops, tracer bullets, guardrails, MCP, 7-phase flow, LLM improvement staircase) — research pass 2026-08-11.  
**Promoted GitHub:** [mattpocock/skills](https://github.com/mattpocock/skills) — **MIT** (Copyright 2026 Matt Pocock). Install path: `npx skills@latest add mattpocock/skills` (optional personal; **not** required as monorepo SoR).  
**Authority:** Companion only. Does **not** reopen locked decisions (C-5, D-38…D-56, Gemini/LiteLLM, Promptfoo, Langfuse, official WhatsApp, MapLibre, AI never writes money, D-32 privacy, dual capacity, tracer-as-stub, etc.).  
**Where it plugs in:** Agent Pack §2.2, Blueprint §8.2, catalog `DIAL_Cursor_Rules_and_Skills.md`, skills `dial-grill-locks` (**D-56**), `dial-ai-capability-review` (**D-56**), `dial-tracer-slice` (**D-52**).

---

## 0. How the site is organised

| Hub | What it is | DIAL relevance |
| --- | --- | --- |
| **Skills catalogue** (`/skills`) | Matt Pocock “AI Skills for Real Engineers” — grilling → spec → tickets → TDD → review spine | Highest signal for Cursor/devex; MIT repo |
| **AI Coding Dictionary** | Shared vocabulary (context budget, progressive disclosure, handoff, harness, …) | Aligns agent docs language with D-47 |
| **Posts / lists** | AGENTS.md, evals, feedback loops, deep modules, tracer bullets, guardrails, MCP, Vercel AI SDK tutorials | Map practices → `packages/ai` + monorepo hygiene |
| **Workshops / tutorials / cohorts / products** | Paid + free lessons (AI SDK, MCP, agent coding) | Patterns only; do not swap locked AI stack |
| **Agent discovery** | `/llms.txt`, `/sitemap.md`, `/api`, `.md` twins | Model for DIAL public docs / optional `llms.txt` later |

**Main build chain (site):**  
`grill-with-docs` → `to-spec` → `to-tickets` → `implement` → `code-review`  
(with `tdd`, `prototype`, `handoff`, `triage` as side tools).

---

## 1. What AI Hero teaches (by section)

### 1.1 Agent skills & process spine

**Principles**
- Agents have **no memory** — encode process in short, invocable skills, not mega-prompts.
- **Grill before build:** walk a design tree in rounds; explore the codebase for facts; only ask humans for decisions.
- **Spec ≠ tickets:** destination first (`to-spec`), then vertical-slice tickets with blockers (`to-tickets`).
- **TDD / red-green-refactor** is the most consistent quality lever for agent code.
- **Handoff** = portable file when work *travels* (harness/dir/colleague/fork); otherwise compact/clear.
- **Writing for agents:** prune no-ops; progressive disclosure; leading words; completion criteria.

**Tools they push:** Claude Code plugins, Cursor-compatible skills via `npx skills`, optional Ralph/AFK loops.  
**Anti-patterns:** vibe-only mega-features; auto-`/init` AGENTS.md balls of mud; skills that interview *and* implement in one breath.

### 1.2 Codebases agents love

**Principles**
- Codebase design beats prompt craft: **deep modules**, thin public interfaces, grey-box (human owns interface + tests; AI owns insides).
- Progressive disclosure on disk (folder = capability) beats documenting every path in `AGENTS.md`.
- Stale path docs in always-on context **poison** agents — prefer capabilities + discoverable SoR docs.

**Anti-patterns:** webs of shallow modules; “extract every pure function for testability” that hides integration bugs; Effect-as-mandatory (site preference — DIAL keeps TS monorepo conventions, not Effect SoR).

### 1.3 AGENTS.md / instruction budget

**Principles**
- Keep root `AGENTS.md` **tiny**: project one-liner, package manager, non-obvious globals; point elsewhere.
- Progressive disclosure → nested docs / package `AGENTS.md` / **skills**.
- Never auto-generate `AGENTS.md`/`CLAUDE.md` via init scripts.
- Domain vocabulary is stabler than file trees (site: `CONTEXT.md` glossary + gated ADRs via `grill-with-docs`).

**Anti-patterns:** dumping all scripts/architecture/file maps into always-on context; conflicting personal opinions stacked forever.

### 1.4 Feedback loops (TypeScript)

**Principles**
- Agents need fast fail: `typecheck`, tests (Vitest), pre-commit (Husky + lint-staged + Prettier/ESLint).
- AFK/Ralph only works when loops exist — agents don’t get tired of retries.

**Anti-patterns:** hoping browser QA alone catches agent regressions; skipping typecheck for “speed.”

### 1.5 Evals & LLM-app improvement

**Principles**
- Evals are the AI unit tests: deterministic assertions, human feedback, LLM-as-judge (smoke, not gospel).
- Data flywheel: production corrections → golden cases → re-eval → ship.
- Staircase of complexity: prompt/schema/tools before fine-tune/train.
- Structured outputs + Zod `.describe()`; prefer nullable over optional for model reliability.
- Fast guardrail model (single-token safe/unsafe) before expensive brain — maps cleanly to Gemini Flash-Lite.

**Tools they push:** Evalite (Vitest-local), Braintrust, autoevals templates, Vercel AI SDK tutorials.  
**DIAL note:** **Promptfoo + Langfuse remain locked** (v4 §6.10 / D-33); Evalite/Braintrust = optional personal/local experiments only.

### 1.6 Tracer bullets & 7 phases — **locked interpretation (D-52)**

**Founder lock:** Tracer = **implementation sequencing inside a fully planned feature** — **not** permission to ship stubs as MVP.

**Principles**
- **Planning diligence first:** near-complete ACs / DoD before code. Tracer does not replace the PRD/spec step.
- Sequence: **Plan → Build (thin vertical first green path) → Expand in-ticket → Done (DoD 100%)**.
- Vertical end-to-end slice before horizontal layer sprawl; expand remaining DoD on the same ticket/epic (fresh context OK for large chunks — ticket still open until DoD complete).
- Site phases (Idea → Research → Prototype → PRD/spec → Kanban → Execution → QA) map to DIAL as: grill/locks + Pack ACs **before** scaffold; tracer only after that.
- Prototype/throwaway answers design questions; don’t pollute production packages — and don’t call a stub “MVP done.”

**Anti-forget (D-52 / D-56):** feature DoD checklist in the ticket (from Pack ACs); `dial-grill-locks` in Plan on money/WA/maps/AI/dual-capacity/Catalogue Factory/Intelligence (**D-56**); ticket incomplete until DoD 100%; completion matrix ACs × channels (web/WA/native) — no merge if blanks; no “Phase 2 dump” for MVP-locked items (D-37, D-41, D-51, etc.).

**Anti-patterns:** “MVP = stub”; closing after first green path while DoD/matrix open; outrunning headlights (full CRUD + auth + rate-limit before DB connection works).

### 1.7 MCP & tooling hygiene

**Principles**
- stdio MCP: **don’t `console.log` on stdout** — file logger or stderr/sse.
- Prefer discoverable skills over stuffing MCP with always-on noise.

**Anti-patterns:** logging that corrupts MCP framing; stateful MCP as SoR for DIAL product data.

### 1.8 AI SDK / TypeScript patterns (tutorials)

**Principles**
- `generateObject` / Zod schemas, tool calling, streaming, embeddings — patterns DIAL already targets via Gemini + Zod in `packages/ai`.
- Hot-swap models behind a gateway (site: AI SDK providers; DIAL: **LiteLLM aliases**).

**Anti-patterns:** making Vercel AI SDK *required* SoR when LiteLLM + provider-native structured output already locked; local-model-as-production-brain.

---

## 2. Mapped adaptations for DIAL

Aligned with: Gemini/LiteLLM, Promptfoo, Langfuse, Cursor D-47, TypeScript monorepo, AI never writes money, D-32 privacy.

| # | AI Hero idea | DIAL adaptation | Status |
| --- | --- | --- | --- |
| 1 | Grill → shared understanding before code | Skill **`dial-grill-locks`**: interview against **locked** D-log / non-negotiables; explore repo for facts; **mandatory in Plan** | **Locked D-56** |
| 2 | Progressive disclosure / slim AGENTS.md | Keep `AGENTS.md` as entrypoint + pointers; detail in Pack/rules/skills — avoid init bloat | **Affirmed D-47 / D-56** |
| 3 | Tracer bullets / vertical slices | Skill **`dial-tracer-slice`** + **D-52**: Plan→Build thin vertical→Expand in-ticket→Done; DoD 100% before merge; **not** stub-as-MVP | **Locked D-52** |
| 4 | Structured outputs + Zod describe/nullable | Already v4 §5.x; skill **`dial-ai-capability-review`** checks Zod/privacy/money gates — **mandatory before `packages/ai` merge** | **Locked D-56** (skill + merge gate; complements D-54) |
| 5 | Three eval types + flywheel | Promptfoo deterministic CI + Langfuse traces + human `AiInvocation` corrections (v4 §5.8–5.9); Factory promote **D-54** | **Locked** (v4 / D-33 / D-36 / D-54) |
| 6 | Fast Flash-Lite guardrail token | Optional organ in `packages/ai` Policy layer (safe-self-help / abuse) before Gemini brain | **P1 backlog** (not locked) |
| 7 | Typecheck/test/pre-commit loops | T0 monorepo scripts + Husky/lint-staged when scaffolded | **Pack T0 AC** (affirm at scaffold) |
| 8 | Deep modules / package boundaries | Honour `packages/*` public surfaces; grey-box tests at package boundary | **Pack soft habit** |
| 9 | Handoff artifact (secrets redacted) | Use for Cursor↔colleague/session forks; never paste `.env`; prefer paths to specs | **P2 habit** |
| 10 | grill-with-docs glossary | DIAL already has v4/Pack vocabulary — **do not** fork a second `CONTEXT.md` SoR; optional ADR only for *new* reversible decisions outside D-log | **Adopt lightly** |
| 11 | `.md` / `llms.txt` discovery | Optional later for public Spare/Tech SEO/AEO; not Phase-0 blocker | **P2** |
| 12 | Writing-for-agents prune | Apply when editing rules/skills: no-op test, leading words, completion criteria | **Habit** (catalog) |

---

## 3. Adopt vs reject

### Adopt (habits / patterns)

- Grilling + design-tree interviews **bounded by locks**
- Spec → vertical tickets → implement → review spine (mapped to trains T0–T9 / issues)
- Tracer-bullet **sequencing** (D-52) — first green path, then in-ticket expand to full DoD
- Slim always-on agent entry + skills for steering
- Deterministic evals + human correction flywheel (via **Promptfoo/Langfuse**, not new SaaS)
- Zod structured outputs, `.describe()`, nullable fields
- Fast cheap-model guardrail organ (Gemini Flash-Lite) inside existing Policy layer
- TS feedback loops (tsc / Vitest / pre-commit)
- MCP stdout logging discipline if DIAL ships stdio MCP later
- Optional personal install of `mattpocock/skills` (MIT) — **DIAL rules win on conflict**

### Reject (conflicts with locks)

| Temptation | Why reject |
| --- | --- |
| **Evalite or Braintrust as primary eval SoR** | Promptfoo locked (D-36 / §6.10); DeepEval already rejected |
| **Vercel AI SDK as mandatory runtime SoR** | Patterns OK; gateway = LiteLLM; Gemini sole brain |
| **Effect as required modularity framework** | Nice blog preference; not DIAL stack |
| **Ralph / AFK unattended money or fiscal paths** | AI never writes money; human + pricing engine |
| **AI drafting payable prices / refunds** | Non-negotiable |
| **Baileys / unofficial WA, Expo customer shell, Make.com core, second ledger, Google/Mapbox SoR** | C-5 / D-40 / D-44 / automation locks |
| **Vendoring full mattpocock/skills tree into proprietary core** | Habits + 1–3 DIAL skills only (same stance as ECC/Ruflo) |
| **Auto-init AGENTS.md replacing D-47 pack** | Keep curated entrypoint |
| **Parallel “CONTEXT.md glossary” as architecture SoR** | v4 + Pack + D-log remain vocabulary SoR; avoid drift |
| **LLM-as-judge as sole CI gate for checklists/money** | Human approve + deterministic Promptfoo; judge = smoke only |
| **Local open models as production brain** | Gemini via LiteLLM; HF later narrow only |

---

## 4. Prioritized backlog

### P0 — do soon (devex / agent quality)

1. Honour **`dial-grill-locks`** / **D-56** in **Plan** before scaffolding features that touch money, WA, maps, promotions, dual capacity, Catalogue Factory, or Intelligence.  
2. Honour **`dial-tracer-slice`** / **D-52** on multi-layer features: full plan first, thin vertical build order, expand in-ticket until DoD 100% (never stub-as-MVP).  
3. Scaffold monorepo **`typecheck` + `test` + pre-commit** loops (AI Hero feedback-loop post) in T0.  
4. Keep **`AGENTS.md` slim** — add companions by pointer only (AI Hero / Lazy already); no init dumps.  
5. Run **`dial-ai-capability-review`** / **D-56** before merge when touching `packages/ai` capabilities.

### P1 — plan / `packages/ai`

6. Promptfoo suite: expand **deterministic** assertions (schema shape, no-money fields, D-32 omit list); Langfuse for traces; human corrections → golden set (Factory promote remains **D-54**).  
7. Optional **Flash-Lite guardrail** organ (0/1 safety) before Gemini on public chat-like surfaces (safe-self-help allowlist).  
8. Package-boundary “deep module” habit: public `index` + integration tests; avoid shallow cross-imports.

### P2 — nice later

9. Session **handoff** markdown habit (redact secrets; path-reference specs).  
10. Optional personal `npx skills add mattpocock/skills` for engineers who want `/tdd` etc.  
11. Public `llms.txt` / markdown twins for Spare/Tech marketing only.  
12. MCP file-logger pattern if/when DIAL publishes an MCP server.

---

## 5. Skills added in-repo (this pass)

| Skill | Inspired by (MIT) | DIAL-specific |
| --- | --- | --- |
| `dial-grill-locks` | `/grill-me` + `/grilling` ([mattpocock/skills](https://github.com/mattpocock/skills)) | **D-56** plan-phase design-tree interview that **cannot reopen** C-5 / D-38…D-56 |
| `dial-tracer-slice` | [Tracer bullets](https://www.aihero.dev/tracer-bullets) post | **D-52** sequencing: Plan→Build thin path→Expand in-ticket→DoD 100%; ban stub-as-MVP |
| `dial-ai-capability-review` | Evals + structured outputs + guardrails posts | **D-56** audit `packages/ai` before merge — Zod, D-32, Promptfoo/Langfuse, no money writes |

---

## 6. Licence / attribution

- Site content: studied for patterns; DIAL docs are original summaries/mappings.  
- [mattpocock/skills](https://github.com/mattpocock/skills): **MIT** — DIAL skills are **rewritten** for locks, not a verbatim vendor of the upstream tree.  
- Evalite / Braintrust / Vercel AI SDK: referenced as upstream teaching tools; **not** adopted as SoR.

---

*Companion only. Architecture SoR remains `DIAL_Consolidated_Plan_v4.md` → Agent Pack → Blueprint / this file for AI Hero rationale.*
