# DIAL vNext.1 — Context Bundle

**Purpose:** mandatory first-read context for every coding/review agent and every resumed session. This file is deliberately short. Machine-readable truth lives beside it in `project-truth.json`, `feature-registry.json`, and `evidence-registry.json`.

## 1. Authority

Current authority version: **vNext.1**.

Before changing behavior, read in this order:

1. `docs/project-truth/CONTEXT_BUNDLE.md`
2. `docs/project-truth/project-truth.json`
3. `docs/project-truth/feature-registry.json`
4. `docs/project-truth/evidence-registry.json`
5. `docs/project-truth/ACTIVE_WORK.md` for current execution only
6. `AGENTS.md` / `CLAUDE.md` as tool entrypoints
7. v4/Agent Pack/companions only for detail that is not superseded by the vNext.1 truth registry.

If historical prose conflicts with this bundle/registries, **do not average the two**. Follow the current truth and record a decision if the conflict is new.

## 2. Current non-negotiables

- **M-01/M-02:** live keys come late. Missing ZIMRA, payment, WhatsApp or other production credentials never blocks engineering. Integrations must be key-drop-in complete; real keys require configuration only.
- **M-03/M-04:** accepted vertical-slice evidence survives repository migration. Green historical slices do not restart at thin slice; they continue from Integration Green.
- **M-05:** generic AI-generated frontend screens are prohibited. Significant UI requires design/reference context and visual evidence.
- **M-06/M-07:** designated wholesale donors are ported wholesale, then adapted. DIAL remains SoR for identity, money, jobs, catalogue, delivery, tax and audit.
- **M-08:** every material feature needs a Feature Realization Contract: outcome, actors, screens/states, domain owner, data/state machine, API/events, integrations, security, tests and gates.
- **M-09/M-10:** build broad, launch selectively; no silent feature loss during refactor/repo migration.
- **M-11:** **FixItNow is the wholesale Dial a Tech application donor.** Preserve its mature application/UI structure, replace donor Mongo/JWT/auth/Stripe/SSLCommerz/job/payment authority with DIAL contracts. Licence/permission remains a production release gate.
- **M-12/M-13:** Dial a Tech is hybrid: direct booking/matching/emergency plus Opportunity Marketplace. Qualified technicians can express interest/propose without a per-bid/pay-to-rank toll at launch. Post-award, every path converges into the canonical DIAL Job/Job Reserve workflow.
- **M-14:** **repository-resident project memory.** Conversation/session memory is temporary working memory only. Durable decisions, gates, evidence, active work and handoffs must live in `docs/project-truth/` so Codex, Claude Code and other approved harnesses can resume from the same truth.
- **M-15:** **concise UI + human-readable references.** Do not clutter screens with helper text that repeats obvious labels/actions. Raw UUIDs, hashes and long generated IDs are internal; normal UI uses meaningful entity names and short public references such as `JOB-02481` or `ORD-18452`.
- **D-58:** agency-only Spare model; D-51 DIAL-owned/principal stock is discarded.
- **D-50:** retain technician ITF263/WHT controls.
- **D-40:** official WhatsApp Cloud API/Flows only.
- **D-44/D-45:** approved OSS maps/routing; `packages/delivery` owns delivery truth.
- **AI-MONEY:** AI never creates binding payable amounts, ledger postings or fund release.
- **SIM-NOPAY:** Simulated/Commercial Simulation cannot mutate production money.

## 3. Superseded ideas — do not resurrect

- D-51 DIAL-owned/principal Spare stock.
- v7/v7-2 master as system architecture SoR; only adopted D-53/D-54 ideas survive.
- one generic shared DIAL customer storefront skin.
- cheap/partial recreation of FixItNow instead of the wholesale port.
- thin slice = feature complete.
- missing production credentials = engineering blocker.
- donor payment/auth/job/catalogue/delivery databases as runtime DIAL SoRs.
- conversation history as the only location of durable project decisions.
- raw UUID/long random identifiers as ordinary customer-facing names/references.
- filler helper copy added merely to make an AI-generated screen look complete.

## 4. Evidence/gate inheritance

| Feature | Current gate | Rule |
|---|---|---|
| E1a Money spine | **INTEGRATION_GREEN** | Do not repeat thin slice |
| E1b Daily ZiG FX | **INTEGRATION_GREEN** | Do not repeat thin slice |
| E2a WhatsApp Spare | **INTEGRATION_GREEN** | Do not repeat thin slice |
| E3a Delivery | **INTEGRATION_GREEN** | Do not repeat thin slice |
| E4a AI guided intake | **INTEGRATION_GREEN** | Do not repeat thin slice |
| E6a Intelligence/CC | **INTEGRATION_GREEN** | Normalize/use inherited code evidence; no slice rebuild |
| E5a Catalogue Factory | **THIN_SLICE_REQUIRED** | No accepted green run located |
| OM-0 Opportunity Marketplace | **THIN_SLICE_REQUIRED** | New feature: post -> qualified interest -> proposal -> award -> accept -> canonical Job |
| FixItNow wholesale port | **PLANNED** | Port wholesale; DIAL customization and licence/permission gates follow |

Detailed evidence is in `evidence-registry.json`. A repository migration must carry that file or an equivalent normalized store forward.

## 5. Canonical sources of truth

- money: DIAL ledger/payments;
- prices: deterministic pricing/rate versions;
- jobs: `packages/jobs`;
- delivery: `packages/delivery`;
- catalogue: approved DIAL catalogue/catalogue-factory records;
- search: Meilisearch projection only;
- identity: DIAL identity/Supabase auth boundary;
- tax: DIAL tax/FDMS outbox/gateway;
- AI: `packages/ai` capability boundary, advisory only;
- readiness: feature/evidence/certification registries;
- project memory: `docs/project-truth/` with `AGENTS.md`/`CLAUDE.md` as tool-specific entrypoints.

## 6. Context-drift and rate-limit protocol

At the **start** of work:

1. Read this bundle + JSON registries.
2. Identify the Feature ID(s) being changed.
3. State the current gate and inherited evidence.
4. List relevant non-negotiable IDs.
5. Identify whether the task changes project truth or merely implements it.
6. For substantial work, generate a compact pack with `pnpm context:pack -- <FEATURE_ID>` and avoid loading the full master unless needed.

During work:

- keep sessions bounded to one coherent outcome;
- checkpoint after major design/architecture decisions;
- do not silently reinterpret a decision to fit existing code;
- if code contradicts current truth, code is the repair target unless a new decision is explicitly approved;
- preserve requirement/evidence IDs in tickets, commits or PR notes;
- when a donor is used, record donor revision/licence/adaptation boundary;
- reserve expensive/deep reasoning for complex or critical work rather than mechanical edits;
- avoid unnecessary parallel high-cost agents.

At **handoff/end of session**:

- update the handoff using `SESSION_HANDOFF_TEMPLATE.md`;
- update `ACTIVE_WORK.md` with checkpoint and exact next action;
- record changed files/features, gate movement, new evidence, open dependencies and decisions;
- run `pnpm context:check`;
- never write “done” when an applicable gate remains open.

## 7. UI language rule

- labels and actions should be self-explanatory;
- helper text exists only when it prevents mistakes or clarifies non-obvious safety/legal/money/constraint behavior;
- do not repeat the label as a sentence underneath it;
- internal UUIDs/hashes remain internal;
- user-facing entities use meaningful titles plus short stable public references when needed;
- do not generate generic AI names such as `Item 1`, `Record 9284282`, `AI Job 3849384`, `User UUID`, or similar filler identifiers.

Detailed rule: `.cursor/rules/dial-ui-language-identifiers.mdc`.

## 8. Drift tripwires

Stop and re-read truth if any task proposes or implies:

- DIAL-owned Spare stock;
- AI-generated payable prices;
- unofficial WhatsApp;
- Fleetbase/Cal.com/Chatwoot/Meili/BI becoming transaction SoR;
- a new money/job/delivery engine;
- repeating E1a/E1b/E2a/E3a/E4a thin slices because the repo changed;
- treating fixtures as live production evidence;
- waiting for live API keys instead of continuing key-ready development;
- generic AI frontend generation without design evidence;
- replacing the FixItNow wholesale strategy with a cheap recreation;
- Opportunity Marketplace creating a second post-award job/payment workflow;
- relying on an old conversation as the only source of a project decision;
- exposing UUID-like technical IDs or filler AI naming in normal customer/staff UI.

If one appears, run the `dial-context-drift-check` skill before continuing.
