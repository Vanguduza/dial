# DIAL Development Agent Pack — v1.0

**Mandatory companion to `DIAL_Consolidated_Plan_v4.md`.** Locked by founder decision **D-39** / Part 9. Cursor agents (and human engineers) must read this pack **before scaffolding** so base research is not repeated in the development phase.

**Authority order when documents conflict:** `DIAL_Consolidated_Plan_v4.md` wins on product, compliance, and architecture decisions. This pack wins on **scaffolding contracts** (env names, index schemas, screen inventories, adapter stubs, acceptance checks) unless a later D-log row supersedes it. Companion UX/checklist detail: `DIAL_Build_Blueprint_and_Cursor_Prompt.md`, `DIAL_Diagnostic_Checklist_Library.md`. Deep OSS/payment/delivery stitch: `DIAL_Deep_Engineering_and_OSS_Stitch.md` (D-43 / D-44 / **D-45** / **D-46** / **D-53** §8). Cursor engineering hygiene (**D-47**): `AGENTS.md` + `.cursor/rules/` + `.cursor/skills/` + `DIAL_Cursor_Rules_and_Skills.md`; rationale companions `DIAL_Lazy_Developer_Playbook_Adaptations.md`, `DIAL_AIHero_Adaptations.md`. Security toolchain (**D-48**): `DIAL_Security_Toolchain.md` + `docs/security/README.md`. Agency + B2B hide informal (**D-49**), tech-hire 30% WHT (**D-50**), DIAL-owned stock dual capacity (**D-51 discarded by D-58**), tracer sequencing + feature DoD (**D-52**), v7-2 platform extensions (**D-53**), Intelligence Factory + Command Centre metrics (**D-54**), external skills utilization (**D-55**), plan-phase grill + AI capability merge gate (**D-56**), Spare USD browse + ZiG-at-checkout + WA EcoCash/COD buttons (**D-57**), AI Kernel/Prime absorb (**D-61**): v4 §0.2 / D-log / `DIAL_v7_2_Adopted_Platform_Extensions.md` / `DIAL_External_Skills_Repos_Utilization.md` / `DIAL_AI_Kernel_Prime_Agent_Adopted.md`.

---

## 0. Hand-off verdict (for founders)

| Dimension | Status for development |
| --- | --- |
| Strategy, trades, gateway UX, AI rules, money spine, compliance research | **Strong in v4** — do not re-research |
| Monorepo map, events, state machines, workflows, admin modules | **Strong in v4 §6.11–6.23** — implement, do not redesign |
| UX donor repos (Mercur, FixItNow, CoolMall, etc.) | **Locked D-38 / §6.2.1** — pattern UI only |
| Checklists for launch trades | **Authored** in `DIAL_Diagnostic_Checklist_Library.md` (42) |
| Env catalog, Meili schema, screen inventory, adapter stubs, RLS matrix, scaffold AC | **This pack** — was the main gap; now filled |
| Phase 0 legal/commercial blockers (escrow contract, POTRAZ licence, tax opinion, FDMS device) | **Still BLOCK launch**, not BLOCK scaffolding of non-money UI/modules with stubs |

**Go for scaffolding / internal build trains:** YES, with stubs for PSP/FDMS/WhatsApp until Phase 0 contracts land.  
**Go for customer-open launch:** NO until Appendix C bold items + Gates in §8.1 are green.  
**Before you start (D-61 bootstrap):** Install + configure **Prime Agent** as the project **development orchestrator** **before** Dial ecosystem workspace / monorepo bootstrap; then open the repo; then paste Blueprint §8 / §8.0 **Dev Manager** **inside** that Prime session (Prime may host/attach Dev Manager; Cursor/`AGENTS.md` remain instruction SoR).  
**Dev Manager:** Owns **ticket hygiene** (open one E1a or E2a owned thin-vertical ticket with DoD + owner) before parallel product trains; enforces **responsive web UX** (§8.0.1) and **living root docs** (`README` / `CHANGELOG` / `ENHANCEMENTS` / `BUGS`, §8.0.2) in the same PR — reject “docs later.”

---

## 1. Mandatory reading order (do not skip)

1. v4 **Part 0** (C-1…C-5, C-6) — founder conflicts already resolved  
2. v4 **§1.4** — auth-first gateway; no anonymous Shop|Services; no voice  
3. v4 **§4.1–4.2** — deterministic pricing; Job Reserve ledger rules; **§4.1.1 promotions & referrals (D-41a)**  
4. v4 **§5.1, §5.15, §5.16** — AI seven rules; composition; launch enhancers  
5. v4 **§6.2.1 + §6.10 + D-38** — UX stitch kit + tool picks  
6. v4 **§6.11–6.23** — ERP doctrine, packages, events, machines, workflows  
7. v4 **Part 7** — compliance constraints that shape data model  
8. **This pack** (all sections)  
9. `DIAL_Diagnostic_Checklist_Library.md` when implementing `packages/checklists`  
10. `DIAL_WhatsApp_Flows_and_Templates.md` (D-40 / **D-41** full MVP catalog / D-41a promo Flows)  
11. `DIAL_Promotions_Package_Design.md` + `packages/promotions` (**D-42** Medusa+OfferKit stitch)  
12. `DIAL_Deep_Engineering_and_OSS_Stitch.md` (**D-43** payment adapters; **D-44** delivery-android + MapLibre/OSRM/VROOM; **D-45** dispatch SoR + FIFO queue; **D-45a** AWS Last Mile donor bake-off; **D-46** complementary ERP/ops stitch §7)  
13. `DIAL_Build_Blueprint_and_Cursor_Prompt.md` §8 only when pasting a scaffold prompt  
14. **D-47** — `AGENTS.md`, `.cursor/rules/*.mdc`, `.cursorignore`, `docs/agent-audits/*`, `.cursor/skills/dial-*`; catalog `DIAL_Cursor_Rules_and_Skills.md`  
15. `DIAL_Lazy_Developer_Playbook_Adaptations.md` — rationale + P0–P2 backlog behind D-47; do not treat as architecture SoR  
15a. `DIAL_AIHero_Adaptations.md` — AI Hero / mattpocock skills habits (grill, tracer slices, AI capability eval discipline); do not treat as architecture SoR  

16. **D-48** — `DIAL_Security_Toolchain.md` (Threat Dragon → Semgrep → Checkov → Renovate → Strix staging); `docs/security/README.md`; do not treat as money SoR  
17. **D-49 / D-50 / D-51 / D-52 / D-58** — v4 §0.2: marketplace **agency** (D-49); B2B **hide** informal; tech WHT 30% (D-50); **D-51 owned-stock discarded (D-58)** — no `DIAL_OWNED` principal SKUs; tracer DoD (D-52); **D-2 = agency**  
18. **D-53** — `DIAL_v7_2_Adopted_Platform_Extensions.md` Part I (Catalogue Factory, JobClass/TradeDefinition, Value Score, Commercial Sim, WHT UI; modified Kernel + Intelligence Factory summary + CERTIFIED–DORMANT→§8.1). Eval classifier only: `DIAL_v7-2_Adjustment_Expansion_Evaluation.md`. **Do not** treat v7-2 master doc as SoR or renumber trains  
19. **D-54** — same companion Part II §§13–15: Intelligence Factory continuous learning (checklist wrap, outcome-weighted datasets, shadow→Promptfoo→human promote); Command Centre MetricContract + Actual vs Simulated (Simulated never auto-pays)
20. **D-55** — `DIAL_External_Skills_Repos_Utilization.md` (locked adopted): `dial-diagram-editorial`; agency payments/webhook/evidence habits in money-path + tracer; anthropics skill anatomy + `dial-webapp-recon` — no full tree vendors / no ToS doc skills
21. **D-56** — plan-phase `dial-grill-locks` mandatory before scaffold of money/WA/maps/AI/dual-capacity/Catalogue Factory/Intelligence; `dial-ai-capability-review` before `packages/ai` merge; Pack §2.2 how-to  
22. **D-57** — Spare `displayCurrency = USD` browse/cart; ZiG conversion only at checkout from ops daily rate (`fx_daily_rates` / `fx_rate_id`); admin **Daily ZiG rate**; WA EcoCash + COD checkout buttons required (v4 §0.2 / §4.3 / D-log)
23. **D-58** — **D-2 agency confirmed**; **discard D-51** owned-stock principal track; FDMS on agency receipt model; no `DIAL_OWNED` offers/inventory
24. **D-59** — Agency FDMS receipt types (`DIAL_FEE` / `GOODS_FORMAL` / `GOODS_INFORMAL`); **in-house** ZIMRA Virtual Gateway default; CloudESD optional `FdmsSigner` only; e-invoices + WA share outbox
25. **D-60** — IMTT = DIAL opex (not customer price); COD settle USD; B2C informal visible; Flash-Lite P1; C-4 Paynow-first; WA templates §12
26. **D-61** — `DIAL_AI_Kernel_Prime_Agent_Adopted.md`: **Dev Manager** = Build managerial authority throughout (Blueprint §8.0); **Development Prime** = mandatory **harness** hosting that role (before workspace); production multi-step = `packages/ai` + LiteLLM→Gemini + Temporal/BullMQ (**no** prod agent host/adapter); learning **outcomes** on Factory/Langfuse/Promptfoo (**no** agent host as production driver); §5.3 affirmed. Eval archive: `DIAL_AI_Kernel_Prime_Agent_Feasibility_Evaluation.md`

**Do not** re-open: Expo/RN customer apps, Lottie, Inngest, Typesense, imgproxy, agentic Spare shop, AI customer prices before §5.9 gates, SandPIM as runtime SoR, Mercur/Medusa as money ledger, **OfferKit/Medusa as live promotion SoR** (pattern into `@dial/promotions` only — D-42), cash-out of promo credit, deferring §10 WA Flows past open launch, **Google Maps / Mapbox as sole distance or courier-map SoR** (MapLibre + OSRM/VROOM — D-44), Fleetbase/Navigator as delivery runtime SoR (AGPL pattern-only — **D-45** job SoR is `packages/delivery`), skipping D-47 Cursor hygiene for multi-agent scaffolds, replacing D-47 IDOR/RLS CI with Semgrep/Strix alone, dual Dependabot+Renovate *version* bots (**D-48** = Renovate primary), **marketplace-wide principal/reseller** or informal→B2B **visibility/sales** (**D-49**), designing tech payouts as if **30% WHT disappears** (**D-50**), reintroducing discarded D-51 `DIAL_OWNED` principal SKUs without new D-log (**D-58**), treating tracer/stub as MVP-complete or merging without feature DoD / channel matrix (**D-52**), **v7-2 as plan SoR**, Train 0–10 replacing **T0–T9**, Unleash/OR-Tools as SoR, CERTIFIED–DORMANT as public multi-phase MVP, or AI/`pricing-intelligence` writing payable amounts (**D-53**), auto-publish checklist/AI without human+Promptfoo, Command Centre Simulated as live money control, or ad-hoc KPIs without MetricContract (**D-54**), full agency-agents / anthropics/skills / diagram-design asset tree dumps or Anthropic ToS document-skill vendoring (**D-55**), skipping plan-phase grill or merging `packages/ai` without capability review (**D-56**), dual-displaying ZiG on Spare browse/cart or converting without ops-audited daily rate / skipping WA EcoCash+COD checkout buttons (**D-57**), peer AI kernel / Kernel self-host or S24 local-first inference / Prime as production or parallel Factory SoR / prod agent adapter or alternate prod agent framework (**D-61**).

---

## 2. Non-negotiables for every agent PR

Copy into PR checklist / Cursor rules:

1. Money = `amountMinor: bigint` + `currency`; never float.  
2. AI never writes payable amounts; `JobAssessment` is preliminary only.  
3. Auth-first gateway; Shop|Services only when authenticated.  
4. No voice UX anywhere.  
5. Native Android (Compose) + native iOS (SwiftUI) + Next.js web; **no Expo/RN customer shell**.  
6. Customer UI native per platform; KMP only for non-UI shared logic.  
7. Meilisearch = Spare customer search; Postgres = catalogue SoR.  
8. Outbox for money/fiscal/search/notifications/AI cost events.  
9. Omit name/phone/address/ID from AI payloads; Presidio on free text.  
10. UX donors are **screen patterns only** — DIAL APIs remain SoR (D-38).  
11. Restricted SKUs (e.g. refrigerant) never direct-to-basket.  
12. Emergency dispatch deterministic — AI must not gate it.  
13. Cite v4 section numbers in commit/PR descriptions for behaviour changes.  
14. Never trust `userId` / `email` / `role` from request body — derive identity from verified JWT/session only.  
15. Side-effect / “internal” routes fail closed without shared secret or verified webhook signature.  
16. Treat secrets as radioactive — never print `.env`; no `NEXT_PUBLIC_` / `VITE_` on service_role or PSP keys.  
17. **Agency + B2B hide informal (D-49):** marketplace default = agency; **B2B roles** must **not see or buy informal** offers — filter Meili/search/browse/offer APIs **and** checkout. Registered supplier prices **VAT-inclusive**; informal = **no goods VAT line**. Informal may remain B2C-visible if product allows.  
18. **Tech WHT 30% (D-50):** `itf263` hard preference on technician payouts; maintain `withholding_balances`; if no valid clearance and threshold met, withhold 30% of tech share, remit, certificate — do not assume WHT vanishes because of PSP escrow.  
19. **Agency only — D-51 discarded (D-58):** marketplace offers are `MARKETPLACE` agency (supplier principal; DIAL fee/commission). **Do not** scaffold `DIAL_OWNED` / `FIRST_PARTY`, owned inventory/COGS, or Sold-by-DIAL principal checkout. **D-2 = agent.** Checkout discloses “Sold by {Supplier}”.  
20. **Tracer sequencing + feature DoD (D-52):** Plan (near-complete ACs/DoD) → Build thin vertical → Expand in-ticket → Done; ticket incomplete until DoD 100%; no stub-as-MVP; completion matrix ACs × web/WA/native — no merge if blanks.  
21. **v7-2 extensions (D-53):** Catalogue Factory, Trade/JobClass config, Value Score, offline Commercial Sim, WHT economics UI per companion; Kernel money stays DIAL packages; Intelligence Factory never writes payable amounts; CERTIFIED–DORMANT = internal §8.1 only.  
22. **Intelligence Factory + Command Centre (D-54):** checklist/troubleshooting continuous learning with human+Promptfoo promote; outcome-weighted dataset versions; MetricContract registry; Actual vs Simulated — Simulated never auto-pays.  
23. **External skills utilization (D-55):** `dial-diagram-editorial` + agency payments/evidence habits + anthropics skill anatomy / `dial-webapp-recon`; no full upstream tree vendors; no ToS docx/pdf/pptx/xlsx.  
24. **Plan-phase grill + AI capability merge gate (D-56):** `dial-grill-locks` in Plan before scaffold of money/WA/maps/AI/dual-capacity/Catalogue Factory/Intelligence; `dial-ai-capability-review` before merge of `packages/ai` changes; slim `AGENTS.md` + Promptfoo/Langfuse + T0 TS loops affirmed; Flash-Lite stays P1.  
25. **Spare USD browse + ZiG-at-checkout (D-57):** Spare catalogue/cart `displayCurrency = USD` (web/native/WA); ZiG only at checkout pay step from ops daily rate; admin **Daily ZiG rate** with audit; WA EcoCash + COD via required buttons/CTAs — not free-text only. Ledger still `amountMinor`+`currency` (does not reopen D-5).
26. **D-2 agency + discard owned stock (D-58):** DIAL is **agent**; no DIAL-owned principal SKUs; agency FDMS/e-invoice tax model; WA payments share ERP `fdms_outbox`.
27. **Agency FDMS + in-house Gateway (D-59):** registered goods VAT-inclusive (supplier remits); DIAL VAT on fees only; informal no goods VAT fiscal; B2B buyer TIN; build Gateway adapter; CloudESD optional only.
28. **IMTT + open locks (D-60):** never put IMTT on customer prices; GL expense; COD settle USD; B2C informal visible; Flash-Lite P1; Paynow-first escrow ask.
29. **AI Kernel + Prime Agent (D-61):** **Dev Manager** = Build manager throughout; **Development Prime** = mandatory harness hosting it (before workspace); production AI = capability pipeline + Temporal/BullMQ (**no** prod adapter / alternate agent framework); learning/ERP Improvement **outcomes** without agent host as production driver; §5.3 locked; Factory = eval SoR — companion `DIAL_AI_Kernel_Prime_Agent_Adopted.md`.

### 2.1 Lazy Developer hygiene (D-47 — mandatory)

Source: [thelazydeveloper.org](https://www.thelazydeveloper.org/) adaptations in `DIAL_Lazy_Developer_Playbook_Adaptations.md`. **Locked by D-47** — scaffold PRs must honour this table + `.cursor/rules`.

| Habit | DIAL action |
| --- | --- |
| Cursor rules + `.cursorignore` | Always-on `.cursor/rules/*.mdc` + ignore `.env*`; see `DIAL_Cursor_Rules_and_Skills.md` |
| Audit-then-fix | Before fixing auth/money/webhooks, run `docs/agent-audits/*` or `.cursor/skills/dial-*` |
| Authenticated ≠ authorized | Central `assertResourceAccess` (or equiv) on jobs/orders/vehicles/promo_credits/delivery_jobs/offers/`courier_locations` **on top of** Pack §12 RLS; CI IDOR cases |
| Never trust body identity | JWT/session only — already §2 #14 |
| Fail-closed internals | `INTERNAL_API_SECRET` (or mTLS) required for n8n/worker/Temporal side-effect HTTP |
| Env classification | §6.0 public vs secret; ban `NEXT_PUBLIC_`/`VITE_` on service_role/PSP/WA/FDMS |
| Webhook AC | Signature verify + idempotency on all `/webhooks/*` (Paynow/ContiPay/EcoCash/PayPal/WA/FDMS) |
| Headers / CORS / abuse limits | Security headers middleware + CORS allowlist per app; rate-limit auth, search proxy, WA/PSP webhooks |
| Cost/health | Admin dashboard + alerts for AI (LiteLLM) + cloud + messaging (SMS/WA) |
| Ship-less-JS | Customer-web route splitting; landing ≠ admin bundle; SEO only on public Spare/Tech |
| API cost discipline | External calls budgeted/rate-limited — align with v4 §5.11 |
| Launch metrics | Appendix C / §8.1 remain launch gates; eng checklist under T9 |

Do **not** adopt site demos that conflict with locks (Make.com as core, Baileys, Expo customer shell, Google-as-map-SoR, second money ledger).

### 2.2 AI Hero–inspired habits (devex — **D-56** lock + Pack soft habits)

Source: [aihero.dev](https://www.aihero.dev/) + [mattpocock/skills](https://github.com/mattpocock/skills) (MIT) — see `DIAL_AIHero_Adaptations.md`. Complements D-47; does **not** replace Promptfoo/Langfuse/Gemini locks.

| Habit | DIAL action | Lock / status |
| --- | --- | --- |
| Grill before build (**D-56**) | `.cursor/skills/dial-grill-locks` — design tree in **Plan**; locks are hard stops | **Locked D-56** |
| Tracer-bullet slices (**D-52**) | `.cursor/skills/dial-tracer-slice` — Plan→Build thin vertical→Expand in-ticket→Done; DoD 100%; **not** stub-as-MVP | **Locked D-52** |
| AI capability audit (**D-56**) | `.cursor/skills/dial-ai-capability-review` — D-32, Zod, no money writes, Promptfoo/Langfuse — **before merge** of `packages/ai` | **Locked D-56** (complements D-54) |
| Slim always-on context | Keep root `AGENTS.md` as entrypoint + pointers; steering in skills/rules | **Affirmed D-47 / D-56** |
| Evals flywheel | Promptfoo deterministic CI + Langfuse + human `AiInvocation` (v4 §5.8–5.9); Factory promote = **D-54** | **Locked** (v4 / D-54) |
| TS feedback loops | T0 AC: `typecheck` + tests + pre-commit **when scaffolding starts** | **Pack T0 AC** (affirm at scaffold) |
| Flash-Lite safety organ | Optional Policy-layer 0/1 guard before Gemini on public chat-like surfaces | **P1 backlog** (not locked) |
| Deep modules / grey-box | Public `packages/*` surfaces + package-boundary integration tests; avoid shallow cross-imports | **Pack soft habit** (architecture) |
| Optional personal skills | Engineers may `npx skills add mattpocock/skills`; **DIAL rules win on conflict** | Optional |

Do **not** adopt Evalite/Braintrust as eval SoR, Vercel AI SDK/Effect as mandatory runtime, AFK agents on money paths, a second glossary SoR beside v4/Pack/D-log, or treating a tracer/stub as feature-complete MVP (**D-52**).

**D-52 lock (tracer sequencing + feature DoD):** planning diligence precedes scaffold — near-complete Pack ACs / ticket DoD first. Tracer = **build order only** against that spec. Feature DoD checklist in the ticket; **D-56** grill in Plan for in-scope domains; ticket incomplete until DoD 100%; epic completion matrix (ACs × web/WA/native) — no merge if blanks; no Phase-2 dump of MVP-locked items (D-37, D-41, D-51, etc.).

**D-56 lock (plan-phase grill + AI capability merge gate):**

1. **When:** before any scaffold that touches money / Job Reserve, official WhatsApp, maps/delivery, promotions, `packages/ai`, dual-capacity (**D-51**), Catalogue Factory, Intelligence Factory / Command Centre.  
2. **How to run now (plan phase — no code required):**  
   - Open Cursor chat → invoke skill **`dial-grill-locks`** (or ask: “Grill this plan against DIAL locks”).  
   - Agent reads `AGENTS.md` + `dial-non-negotiables.mdc`, maps a design tree, asks frontier questions in rounds (numbered + recommended answer), looks up facts in-repo, refuses reopen of C-5 / D-38…D-56.  
   - Stop when frontier empty; human confirms shared understanding → then write ticket DoD / Pack ACs (**D-52** Plan complete) → only then Build.  
3. **Grill first topics (recommended order for DIAL):** (1) Job Reserve / money / WHT / dual-capacity ledger split; (2) WhatsApp Cloud API + Flows MVP; (3) MapLibre + delivery job SoR; (4) `packages/ai` capabilities + no-money + D-32; (5) Catalogue Factory + B2B hide informal; (6) Intelligence Factory / Command Centre Actual vs Simulated.  
4. **AI capability merge:** any PR changing `packages/ai` must run **`dial-ai-capability-review`** (audit report) before merge — **D-54** still owns Factory shadow→Promptfoo→human promote.

### 2.3 External skills utilization (D-55 — locked)

Companion: `DIAL_External_Skills_Repos_Utilization.md` (**locked adopted**). Selective habits only — no full upstream tree dumps.

| Habit | DIAL action |
| --- | --- |
| Editorial diagrams | `.cursor/skills/dial-diagram-editorial` — DIAL type→domain map; optional personal diagram-design install; no asset gallery vendor |
| Payments / webhook truth | Extra bullets in `dial-money-path-review` (idempotency from business op; webhooks as truth) |
| Reality Checker evidence | `dial-tracer-slice` Done requires tests/screenshots/webhook replay/Promptfoo cite as applicable |
| Skill anatomy | All new `dial-*` follow progressive disclosure (YAML description + lean body + optional `references/`) — catalog standard |
| Web recon | Optional `.cursor/skills/dial-webapp-recon` (Apache-2.0 Playwright pattern) — never Anthropic ToS doc skills |

Do **not** install full agency-agents roster as monorepo SoR; do **not** vendor anthropics `docx`/`pdf`/`pptx`/`xlsx`; do **not** reopen C-5 / D-52 via Rapid Prototyper culture.

---

## 3. Companion document map

| File | What agents take from it |
| --- | --- |
| `DIAL_Consolidated_Plan_v4.md` | Product truth, compliance, architecture, D-log |
| `DIAL_Development_Agent_Pack.md` (this file) | Scaffold contracts, env, schemas, screens, AC |
| `DIAL_Build_Blueprint_and_Cursor_Prompt.md` | Improvements I-*, alternate tools research, Cursor paste prompt; **§8.0.1** responsive web UX; **§8.0.2** living docs |
| `README.md` / `CHANGELOG.md` / `ENHANCEMENTS.md` / `BUGS.md` | Living root docs — same-PR updates (Blueprint §8.0.2) |
| `DIAL_Diagnostic_Checklist_Library.md` | 42 launch checklists → seed `packages/checklists` |
| `DIAL_Deep_Engineering_and_OSS_Stitch.md` | Feature→OSS matrix; PspAdapter methods (D-43); delivery-android (D-44); dispatch SoR (D-45); ERP gaps + D-46 (§7) |
| `DIAL_WhatsApp_Flows_and_Templates.md` | WA Flows + templates |
| `DIAL_Promotions_Package_Design.md` | `@dial/promotions` contracts |
| `DIAL_Lazy_Developer_Playbook_Adaptations.md` | Rationale + P0–P2 backlog behind **D-47** (no architecture reopen) |
| `DIAL_AIHero_Adaptations.md` | AI Hero grilling/tracer/evals habits → dial-* skills; Promptfoo stays SoR |
| `DIAL_Cursor_Rules_and_Skills.md` | Maps local rules/skills ↔ ECC/Ruflo/Lazy/AI Hero sources (**D-47**) |
| `DIAL_v7_2_Adopted_Platform_Extensions.md` | **D-53** platform extension designs + OSS picks; **D-54** Intelligence Factory + Command Centre metric contracts |
| `DIAL_v7-2_Adjustment_Expansion_Evaluation.md` | Adopt/modify/reject classifier — not SoR |
| `DIAL_External_Skills_Repos_Utilization.md` | **D-55** locked adopted — diagram-editorial, agency habits, anthropics anatomy / webapp-recon |
| `DIAL_AI_Kernel_Prime_Agent_Adopted.md` | **D-61** — Dev Manager = Build manager; Prime = mandatory harness; prod = capability + Temporal/BullMQ (no adapter); §5.3 affirmed |
| `DIAL_AI_Kernel_Prime_Agent_Feasibility_Evaluation.md` | D-61 classifier archive — not SoR |
| `docs/planning/` | **D-56 / D-52** plan-phase grill session, DoD backlog, AI Hero today queue, diagrams, Promptfoo outline, tracer matrices — not a second product SoR |

---

## 4. What can be built now vs Phase 0 blocked

| Workstream | Scaffold now? | Needs Phase 0 before production traffic |
| --- | --- | --- |
| Monorepo, apps shells, design-tokens, shadcn | Yes | — |
| Catalogue schema, SandPIM cross-check, Meili index + stub docs | Yes | Real brand feeds / supplier nets (D-1) |
| Spare/Tech/Supplier/Admin UI from UX donors → DIAL API stubs | Yes | — |
| Identity, RLS tests, consent tables | Yes | POTRAZ licence for live cross-border AI (D-19) |
| Jobs, checklists, matching eligibility (deterministic) | Yes | Live technician credentials |
| Ledger + payments **interfaces** + Paynow / ContiPay / EcoCash / PayPal / COD adapter stubs | Yes | Escrow PSP contract (D-4/D-4a); live keys |
| FDMS adapter stub + fiscal day state machine | Yes | ZIMRA virtual device credentials; **D-59** agency receipt types (field map at integrate) |
| WhatsApp Cloud adapter stub | Yes | Meta WABA + templates approved |
| Gemini via LiteLLM behind `packages/ai` (ops + intake) | Yes (omit PII) | Transfer authorisation if photos leave ZW |
| `delivery-android` shell + MapLibre + location stubs (D-44) | Yes | Live courier ops + offline packs |
| Delivery dispatch tables + `DeliveryDispatchWorkflow` stubs (D-45) | Yes | Production offer timeouts + FIFO dequeue |
| Customer-open launch | No | Appendix C bold blockers |

---

## 5. Tooling & monorepo defaults (do not re-debate)

| Choice | Locked default |
| --- | --- |
| Package manager | **pnpm** workspaces + **Turborepo** |
| Node | **20 LTS+** |
| Web | **Next.js App Router** (15/16 as scaffolded), TypeScript strict, Tailwind 4 |
| Web UI | **shadcn/ui** + Magic UI (gateway flourishes only) |
| Android | Kotlin, Jetpack Compose, Material 3 Expressive patterns; Now in Android module layout |
| iOS | SwiftUI + Pow for micro-interactions |
| Shared mobile non-UI | Kotlin Multiplatform package `packages/mobile-shared` (no customer UI) |
| DB | Supabase Postgres + RLS |
| Search | Meilisearch (self-hosted Tier 2) |
| Queues | Redis + BullMQ; Temporal for money/fiscal/project/**delivery dispatch** (D-45) |
| Ops automation | n8n |
| Auth | Supabase Auth (email/phone OTP paths as product requires) |
| Images | Sharp only |
| Motion | Rive official runtimes |
| Booking slots | Cal.com |
| Support | Chatwoot |
| Surveys | Formbricks |
| Analytics/flags | PostHog |
| BI | Metabase |
| Email | Resend (txn) + Brevo (promo) |
| AI | LiteLLM → Gemini; Promptfoo evals; Langfuse traces |

---

## 6. Environment variable catalog

Use these exact names in `.env.example`. Secrets never commit. Group by surface.

### 6.0 Classification (public vs secret) — D-47

| Class | Rule | Examples |
| --- | --- | --- |
| **public** | Safe in browser / mobile client; may use `NEXT_PUBLIC_` / `VITE_` / Compose BuildConfig public fields | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, app public URLs, PostHog project key, Meili **search-only** key |
| **secret** | Server / worker / Temporal activity / n8n only — **never** `NEXT_PUBLIC_` / `VITE_` | `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, all PSP keys, `*_WEBHOOK_SECRET`, WA token/app secret, FDMS activation, `INTERNAL_API_SECRET`, LiteLLM/Gemini keys, Meili **master** key |

CI: bundle-grep customer/admin production builds for `service_role`, `sk_live`, integration keys, `INTERNAL_API_SECRET`.

### 6.1 Core / Supabase

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server only — never ship to clients
DATABASE_URL=                       # direct Postgres for workers/migrations
```

### 6.2 Apps public URLs

```bash
NEXT_PUBLIC_GATEWAY_URL=https://dial.example
NEXT_PUBLIC_SPARE_URL=https://dialaspare.co.zw
NEXT_PUBLIC_TECH_URL=https://dialatech.co.zw
NEXT_PUBLIC_SUPPLIER_URL=
NEXT_PUBLIC_ADMIN_URL=
```

### 6.3 Meilisearch

```bash
MEILI_HOST=http://127.0.0.1:7700
MEILI_MASTER_KEY=
MEILI_SPARE_INDEX=spare_offers_v1
NEXT_PUBLIC_MEILI_HOST=             # only if using search-only key in browser
NEXT_PUBLIC_MEILI_SEARCH_KEY=       # search-only key — never master
```

### 6.4 Redis / BullMQ / Temporal / n8n

```bash
REDIS_URL=redis://127.0.0.1:6379
TEMPORAL_ADDRESS=127.0.0.1:7233
TEMPORAL_NAMESPACE=dial
# Durable: MoneyWorkflow, fiscal, project milestones, DeliveryDispatchWorkflow (D-45)
N8N_BASE_URL=
N8N_API_KEY=
# Side-effect HTTP from workers / n8n / Temporal activities — fail closed if unset (D-47)
INTERNAL_API_SECRET=
```

### 6.5 AI

```bash
LITELLM_BASE_URL=
LITELLM_API_KEY=
GEMINI_API_KEY=                     # preferably only inside LiteLLM
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=
PROMPTFOO_CONFIG=packages/ai/evals/promptfooconfig.yaml
```

### 6.6 Payments (Paynow stub → live; D-43 multi-method)

```bash
PAYNOW_INTEGRATION_ID=
PAYNOW_INTEGRATION_KEY=
PAYNOW_RESULT_URL=https://api.example/webhooks/paynow/result
PAYNOW_RETURN_URL=https://dialaspare.co.zw/checkout/return
# Escrow partner (D-4) — fill when contracted
PSP_ESCROW_BASE_URL=
PSP_ESCROW_API_KEY=
PSP_WEBHOOK_SECRET=

# ContiPay
CONTIPAY_API_KEY=
CONTIPAY_API_SECRET=
CONTIPAY_MERCHANT_ID=
CONTIPAY_MODE=dev
CONTIPAY_WEBHOOK_URL=
CONTIPAY_SUCCESS_URL=
CONTIPAY_CANCEL_URL=

# EcoCash direct (optional — ContiPay/Paynow may already cover EC)
ECOCASH_API_KEY=
ECOCASH_MERCHANT_CODE=
ECOCASH_ENVIRONMENT=sandbox
ECOCASH_WEBHOOK_SECRET=

# PayPal Orders v2
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=

# COD (D-7)
COD_MAX_ORDER_MINOR_USD=
COD_MAX_ORDER_MINOR_ZWG=
COD_COURIER_FLOAT_LIMIT_MINOR=
COD_BAN_FAILURE_THRESHOLD=3
```

**Paynow initiate (researched — do not re-fetch):**  
`POST https://www.paynow.co.zw/interface/initiatetransaction`  
Fields: `id`, `reference`, `amount` (2 dp, no symbol), `returnurl`, `resulturl`, `status=Message`, `hash` (SHA512 of concatenated values + integration key, uppercase hex). Validate hash on all inbound result posts. Poll via returned `pollurl`. Docs: https://developers.paynow.co.zw/

**ContiPay / EcoCash / PayPal:** adapter shapes and coexistence rules in `DIAL_Deep_Engineering_and_OSS_Stitch.md` §2 — do not re-research. ContiPay merchant approval required; EcoCash via https://developers.ecocash.co.zw/; PayPal Orders v2 create→approve→capture/authorize.

### 6.7 Notifications

```bash
RESEND_API_KEY=
RESEND_FROM=
BREVO_API_KEY=
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_WABA_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
```

### 6.8 Experience Tier 2

```bash
CHATWOOT_BASE_URL=
CHATWOOT_API_TOKEN=
CALCOM_BASE_URL=
CALCOM_API_KEY=
FORMBRICKS_URL=
FORMBRICKS_API_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
METABASE_SITE_URL=
METABASE_EMBED_SECRET=
```

### 6.9 Media / maps / fiscal

```bash
MEDIA_BUCKET=
SHARP_CONCURRENCY=2
NOMINATIM_URL=                      # self-hosted preferred
OSRM_URL=
VROOM_URL=                          # multi-stop / assignment (D-44)
MAP_TILES_STYLE_URL=                # self-hosted OpenMapTiles/Protomaps style for MapLibre
MAP_OFFLINE_PACK_BASE_URL=          # ZW region packs for delivery-android
FDMS_BASE_URL=
FDMS_DEVICE_ID=                 # virtual device id from ZIMRA portal (D-40a — not a physical printer)
FDMS_DEVICE_SERIAL=
FDMS_ACTIVATION_KEY=
```

### 6.10 WhatsApp (see `DIAL_WhatsApp_Flows_and_Templates.md`)

```bash
WHATSAPP_FLOWS_PRIVATE_KEY=     # Flows data_exchange crypto
WHATSAPP_FLOWS_PASSPHRASE=
```

**D-57 ACs (Spare checkout):** `FLOW_SPARE_CHECKOUT` Pay screen must present **EcoCash** and **COD** as required interactive button/CTA choices (Cloud API Flows + reply buttons per D-40/D-41) — not free-text only. Browse/cart Flow screens show **USD only**; ZiG equivalent appears on pay step when EcoCash/ZiG rail selected (and as transparency line on COD confirm).
### 6.11 Security toolchain (D-48) — CI / staging only

No product runtime env required for Threat Dragon, Semgrep CE, or Checkov. Optional / staging-runner only:

```bash
# Semgrep AppSec Platform — omit for Community Edition OSS CI
# SEMGREP_APP_TOKEN=

# Strix (usestrix) — staging / workflow_dispatch runners only; never production PSP/FDMS keys
# STRIX_LLM=gemini/gemini-2.0-flash
# LLM_API_KEY=
# Actions variable STRIX_ENABLED=true  # required before CI installs/runs Strix

# Renovate self-host — bot token or GitHub App installation; not in app .env
# RENOVATE_TOKEN=
```

In-repo: `ThreatDragonModels/`, `semgrep.yml` + `semgrep/rules/`, Checkov/Semgrep/Strix workflows, `docs/security/strix-runbook.md`, `.cursor/rules/dial-security-toolchain.mdc`.

See `DIAL_Security_Toolchain.md` and `docs/security/README.md`.

---

## 7. Logical Postgres table inventory (SoR)

Implement as migrations under `supabase/migrations` (or equivalent). Names are canonical; agents must not invent parallel tables for the same concern.

| Schema / area | Tables (minimum launch set) |
| --- | --- |
| identity | `profiles`, `roles`, `sessions_meta`, `devices` |
| customers | `customers`, `addresses` (pin+landmark+phone), `consents` |
| vehicles | `vehicles`, `vehicle_events`, `expiry_reminders` |
| catalogue | `master_products`, `part_numbers`, `cross_refs`, `quality_tier_rules`, `fitment_claims`, `vehicle_master`, `catalog_nodes`, `restricted_sku_rules`, `catalogue_ingest_batches`, `catalogue_ingest_rows`, `catalogue_review_queue`, `search_no_result_events`, `demand_gap_aggregates`, `catalogue_ai_candidates` (**D-53** Factory) |
| suppliers | `suppliers`, `supplier_costs`, `stock_signals`, `heartbeats`, `supplier_statements`, `bonds` |
| offers | `offers` (incl. `offer_source`: `MARKETPLACE` only — D-58; `supplier_formality`), `offer_snapshots` |
| dial_owned_inventory | **Do not scaffold (D-58)** — D-51 discarded; no owned title tables in MVP |
| technicians | `technicians`, `credentials`, `availability`, `managers_choice`, `score_profiles`, `technician_score_snapshots`, `technician_score_events` (**D-53** Value Score) |
| trades_config | `job_class_definitions`, `trade_definitions`, `trade_lifecycle_events` (**D-53**) |
| jobs | `jobs`, `job_media`, `job_assessments`, `quotes`, `variations`, `assignments`, `evidence` |
| projects | `projects`, `milestones`, `project_team`, `project_budgets` (+ `client_visibility`) |
| orders | `orders`, `order_lines`, `returns` |
| pricing | `rate_cards`, `rate_card_versions`, `delivery_bands`, `price_quotes` |
| promotions | `promo_campaigns`, `promo_campaign_budgets`, `promo_budget_usages`, `promo_promotions`, `promo_application_methods`, `promo_rules`, `promo_rule_values`, `promo_segments`, `promo_buyget_rules`, `promo_redemptions`, `promo_credits`, `promo_credit_ledger`, `promo_validation_traces`, `referral_programs`, `referral_codes`, `referral_edges`, `supplier_coop_agreements` |
| payments | `payment_intents` (method enum: paynow\|contipay\|ecocash_direct\|paypal\|cod_collection\|cod_delivery\|psp_escrow), `psp_events`, `cod_attempts` |
| ledger | `accounts`, `journal_entries`, `journal_lines`, `job_reserves`, `payouts` |
| fx | `fx_rate_versions`, `fx_conversions`, `fx_daily_rates` (ops daily ZiG/USD — **D-57**; store `fx_rate_id` + effective period; audit who set) |
| tax | `tax_treatments`, `fdms_outbox`, `fiscal_days`, `withholding_balances`, `itf263_records` |
| delivery | `zones`, `shipments`, `pod_media`, `delivery_jobs`, `delivery_offers`, `delivery_assignment_events`, `delivery_runs`, `delivery_stops`, `courier_locations` |
| guarantee | `guarantee_claims`, `guarantee_provisions` |
| disputes | `disputes`, `dispute_evidence` |
| legal | `terms_versions`, `terms_acceptances`, `compliance_checklist_runs` |
| trust | `media_fingerprints`, `fraud_signals` |
| ai | `ai_invocations`, `intelligence_datasets`, `intelligence_shadow_runs`, `intelligence_promotions` (**D-53/D-54** Factory metadata — no money writes) |
| checklists | `diagnostic_checklists`, `checklist_step_outcomes` (**D-54** / Blueprint §6.2) |
| simulation | `simulation_scenarios`, `simulation_runs`, `simulation_sensitivity_reports` (**D-53** — offline; no ledger FK mutators) |
| platform | `outbox`, `processed_events`, `audit_events`, `feature_flags`, `domain_module_registry`, `metric_contracts`, `operational_alerts` (**D-53** Kernel + **D-54** CC) |

**Money rule in DB:** `amount_minor bigint`, `currency text check in ('USD','ZWG')`.

**`packages/delivery` note (D-45a):** job/offer/queue SoR stays in-repo. Algorithm donor = [`aws-samples/aws-last-mile-delivery-hyperlocal`](https://github.com/aws-samples/aws-last-mile-delivery-hyperlocal) (MIT-0) — reimplement offer/accept/reject/requeue into Temporal; see stitch §3.9. Android UX donor remains foodhub-compose (§9.8).

---

## 8. Meilisearch index — `spare_offers_v1`

Configure **settings before** bulk indexing.

### 8.1 Document shape

```ts
export interface SpareOfferDocument {
  id: string                    // offerId
  masterProductId: string
  oem: string
  normalisedOem: string
  description: string
  brand: string
  qualityTier: string
  availability: 'available' | 'confirm_required' | 'sourcing'
  chassis_codes: string[]
  engine_codes: string[]
  pnc?: string
  categoryPath: string[]
  priceMinor: number
  currency: 'USD'                 // D-57: Spare browse/index displayCurrency = USD only (no ZWG on PLP/PDP/search/cart docs)
  warrantyDays: number
  deliveryBandId: string
  fitmentConfidence: number
  stockValidUntil: number       // unix ms
  hasRestrictedSku: boolean
  offerSource: 'MARKETPLACE'  // D-58: agency only; DIAL_OWNED discarded
  supplierFormality: 'formal' | 'informal'   // D-49; B2B sessions filter informal out
  // NEVER index raw supplierId for customer-facing search responses
}
```

### 8.2 Settings

```json
{
  "searchableAttributes": [
    "oem",
    "normalisedOem",
    "description",
    "brand",
    "pnc",
    "chassis_codes",
    "engine_codes"
  ],
  "filterableAttributes": [
    "brand",
    "qualityTier",
    "availability",
    "chassis_codes",
    "engine_codes",
    "currency",
    "deliveryBandId",
    "hasRestrictedSku",
    "priceMinor",
    "fitmentConfidence",
    "stockValidUntil",
    "offerSource",
    "supplierFormality"
  ],
  "sortableAttributes": ["priceMinor", "fitmentConfidence", "stockValidUntil"],
  "displayedAttributes": [
    "id", "masterProductId", "oem", "description", "brand", "qualityTier",
    "availability", "priceMinor", "currency", "warrantyDays", "deliveryBandId",
    "fitmentConfidence", "hasRestrictedSku", "categoryPath", "offerSource", "supplierFormality"
  ]
}
```

**B2B visibility (D-49):** for fleet / garage / VAT-registered buyer sessions, Meili (and offer list APIs) **must** apply `supplierFormality = formal` (or equivalent exclude informal). Do not rely on checkout-only rejection. All marketplace offers that pass formality are supplier-formal; **no DIAL_OWNED** track (D-58).

**Display currency (D-57):** Spare Meili docs and catalogue/cart APIs expose **USD only** (`displayCurrency = USD`). Do not index or return ZiG line prices for browse. ZiG conversion happens at **checkout pay step** only (load active `zig_usd_rate` from `fx_daily_rates` / active `fx_rate_versions` row set by ops; persist `fx_rate_id`).

**Correctness:** alphanumeric OEM matching stays hybrid with Postgres `pg_trgm` / normalisation for exact part numbers (v4 §5.4). Meili is customer browse/search, not the sole authority for OEM identity.

Reindex via BullMQ on `OfferInvalidated` / `MasterProductPublished` / `StockHeartbeatReceived` (v4 §6.14).

---

## 9. Screen inventory → UX donor (pattern only)

Agents implement these routes/screens against DIAL APIs. Clone UX patterns from the locked donor; do not copy donor backends.

### 9.1 `gateway-web`

| Screen | Notes |
| --- | --- |
| `/sign-in`, `/sign-up` | Pre-auth only |
| `/home` (auth) | Welcome-back + Shop \| Services; Rive optional |
| Session restore | Optional saved session if not timed out |

### 9.2 `spare-web` ← Mercur B2C (+ YNS/Nimara polish)

| Screen | Notes |
| --- | --- |
| Home / collections | Multi-vendor marketplace feel |
| Search + facets | Meili; vehicle filter (chassis) |
| Select Vehicle / Browse EPC | Dual entry §3.2 |
| PDP | Fitment confidence, quality tier, availability state — not raw qty |
| Cart / checkout | OfferSnapshotFrozen; shadow failover UX; 18-item disclosure + review step; **seller disclosure (agency D-58):** “Sold by {Supplier}”; **B2B (D-49):** informal offers hidden upstream + not sellable to fleet/garage/VAT-registered buyer roles; **D-57:** cart lines USD only; ZiG equivalent only on pay step (EcoCash/ZiG rails) or COD confirm transparency |
| Orders / tracking / returns | 7-day cancellation aware |
| Garage / Vehicle Hub | Reminders need consent |

### 9.3 `tech-web` ← **FixItNow** primary (+ NearServe/Homezy)

| Screen | Notes |
| --- | --- |
| Guide landing | Calm professional; not AI-hype |
| Emergency | Deterministic path; checklist `emergency.triage` |
| Diagnose / checklist runner | Seed from checklist library |
| Known need / book | Cal.com slots |
| Job status / evidence | Customer view |
| Technician profile cards | Manager's choice flag |

### 9.4 `supplier-web` ← Mercur vendor-panel

| Screen | Notes |
| --- | --- |
| Onboarding | Tier ladder |
| Catalog / costs upload | Appendix A columns |
| Heartbeat inbox | WhatsApp **or** dashboard |
| Orders to confirm | SLA clock |
| Co-op campaigns | Propose / accept `SUPPLIER_COOP`; see funded SKUs |
| Statements / bonds | Include co-op spend lines |

### 9.5 `admin-web`

Queue-first modules A–P in v4 §6.17 — do not invent a second IA. Include Projects toggle, legal compliance hub, AI ops, money ops, FDMS day controls, **Promotions & referrals** (create `REFERRAL` / `PLATFORM` / `FLASH` / approve `SUPPLIER_COOP`, budgets, fraud holds), **Daily ZiG rate** (**D-57** — set/activate `zig_usd_rate` in `fx_daily_rates` / `fx_rate_versions`; effective period; audit log who set; four-eyes optional for money-sensitive; never silent bank mid without audit).

**D-53 platform ops (add — do not fork IA):** Catalogue Factory queues + demand-gap KPIs; Trade/JobClass definition editor + lifecycle; Technician Value Score profiles/disputes; Technician Compliance / WHT remittance centre; Intelligence Factory shadow/promote; Commercial Simulation runs (Actual vs Simulated toggle — Simulated never auto-pays); domain module registry / feature flags (certification SoR = DB, not Unleash).

**D-54 Command Centre depth:** every KPI tile registers a `MetricContract` (id, source, calculation, thresholds, ownerRole); Data→Metrics→Alert→Decision→Action; severity→recommended permissioned actions; Simulated watermark; no ad-hoc duplicate KPI formulas.

**Cost & health (D-47):** admin (or Metabase embed) must surface AI/LiteLLM + cloud + SMS/WhatsApp spend with alert thresholds and kill-switch links to rate limits (v4 §5.11). Complements Appendix C ops dashboards — does not replace compliance gates.

**Orders & delivery (D-45):** dispatch board (`delivery_jobs` FIFO queue + live offers); order/shipment detail with **live MapLibre map** of the assigned driver’s `courier_locations` (Supabase Realtime); assignment-event timeline; manual override assign. This is the primary management live-track surface (customer track is read-only on the same channel).

**Customer vs admin bundles:** `admin-web` is a separate entry — never import into gateway/Spare/Tech customer first-load chunks (`.cursor/rules/dial-web-bundles.mdc`).

### 9.6 Customer mobile

Android ← CoolMallKotlin patterns; iOS ← tunacosgun/eCommerce. Mirror Spare+Tech critical paths; deep-link to web where needed. Offline not required for customer at launch beyond graceful network errors (technician is offline-first). Include promo code + referral share screens.

### 9.7 `technician-android` ← Now in Android

Job cache, evidence queue, camera, location, mock-location detection, Bluetooth print hooks, checklist/photo overlays.

**D-53:** **Your DIAL Take-Home** (gross → fees → ITF263 or 30% WHT → net `amountMinor`); ITF263 status/upload; withholding YTD + certificate PDF; **Value Score** + factor breakdown (explainability). No off-platform fiscal invoicing SoR until counsel (discarded/deferred from v7).

### 9.8 `delivery-android` ← foodhub-compose rider (pattern) + MapLibre (D-44) + offers (D-45)

| Screen / capability | Notes |
| --- | --- |
| Offer card | Incoming `delivery_offers` — **Accept / Reject**; countdown to timeout |
| Run inbox | Assigned `delivery_runs` |
| Active run map | **MapLibre** (not Google as SoR); stop pins + polyline |
| Navigate stop list | Ordered `delivery_stops`; request re-optimise → VROOM (post-accept) |
| Live location | FGS upload → `courier_locations` → Realtime |
| Availability | Toggle `available` / `busy` / `offline` (feeds dispatch eligibility) |
| ETA banner | Server OSRM remaining duration |
| POD capture | Photo/signature + GPS → `pod_media` |
| COD collect | Amount + failure reasons → `cod_attempts`; float limit warning |
| Offline packs | Harare/Bulawayo tile regions |

Architecture modules follow Now in Android; UX flows from [`furqanullah717/foodhub-compose`](https://github.com/furqanullah717/foodhub-compose) rider flavour (**Apache-2.0**, pattern only). **Job engine = `packages/delivery`**, not foodhub/Fleetbase. Full spec: `DIAL_Deep_Engineering_and_OSS_Stitch.md` §3 (incl. D-45 / **D-45a** bake-off §3.9).

**Dispatch algorithm donor (D-45a):** [`aws-samples/aws-last-mile-delivery-hyperlocal`](https://github.com/aws-samples/aws-last-mile-delivery-hyperlocal) (**MIT-0**) — study accept/reject/requeue + ranking; **reimplement** in Temporal/`packages/delivery` (do not adopt AWS IoT/Step Functions as SoR). Fleetbase/Witylogix = AGPL UX/lifecycle only.

**Temporal workflow name:** `DeliveryDispatchWorkflow` — offer → accept|reject|timeout → reassign → FIFO dequeue when courier becomes available.

---

## 10. HTTP / RPC surface map (minimum)

Prefix `/api/v1`. Auth via Supabase JWT unless webhook.

| Area | Methods (illustrative) |
| --- | --- |
| Identity | session, profile, step-up |
| Vehicles | CRUD garage, set active vehicle |
| Spare search | `GET /search/spare?q=&chassis=&filters=` → Meili proxy or search key; **B2B:** force `supplierFormality=formal` (D-49) |
| Offers | get offer, freeze snapshot at checkout; **hide + reject** B2B access to informal offers (D-49); expose supplier seller disclosure (agency; D-58 — no DIAL_OWNED) |
| FX | admin: set/list active daily ZiG/USD rate (`fx_daily_rates`); checkout: resolve active `fx_rate_id` for conversion (**D-57**) |
| Orders | create, pay, confirm status, failover accept, POD, return |
| Delivery | list/accept/reject offers, list runs, start/complete stop, POST locations, set availability, optimise remaining, COD confirm |
| Jobs | create intake, assessment, book, status, variation approve |
| Checklists | get by symptom/trade, submit step answers |
| Promotions | validate code, apply to cart/quote, referral status, credit balance |
| Suppliers | upload stock, heartbeat, confirm order, coop propose/ack |
| Admin queues | list/claim/resolve pending_review, disputes, four-eyes, promo approve |
| Webhooks | `/webhooks/paynow/result`, `/webhooks/contipay`, `/webhooks/ecocash`, `/webhooks/paypal`, `/webhooks/psp/*`, `/webhooks/whatsapp`, `/webhooks/fdms` |
| AI | `POST /ai/guided-intake`, `/ai/client-assessment`, `/ai/ops-draft-quote` only — no generic chat |

Idempotency-Key required on pay, payout, fiscal, failover.

---

## 11. Adapter stubs (Tier 3) — implement interfaces first

```ts
// adapters/psp/types.ts — see DIAL_Deep_Engineering_and_OSS_Stitch.md §2 for full shape
export type PaymentMethodCode =
  | 'paynow' | 'contipay' | 'ecocash_direct' | 'paypal'
  | 'cod_collection' | 'cod_delivery' | 'psp_escrow'

export interface PspAdapter {
  readonly code: PaymentMethodCode
  capabilities(): {
    supportsHold: boolean
    supportsSplitPayout: boolean
    supportsRefund: boolean
    currencies: Array<'USD'|'ZWG'>
    channels: Array<'web'|'android'|'ios'|'whatsapp'>
  }
  createPayment(input: {
    reference: string
    amountMinor: bigint
    currency: 'USD'|'ZWG'
    method: PaymentMethodCode
    returnUrl: string
    resultUrl: string
    customer?: { msisdnE164?: string; email?: string }
    escrowPreferred?: boolean
  }): Promise<{ providerRef: string; redirectUrl?: string; pollUrl?: string; customerAction?: string }>
  pollStatus(providerRefOrPollUrl: string): Promise<'paid'|'pending'|'failed'|'cancelled'|'awaiting_customer'>
  instructRelease?(input: { holdRef: string; allocations: { partyId: string; amountMinor: bigint }[] }): Promise<{ instructionId: string }>
  verifyWebhook(headers: Record<string,string>, rawBody: string): Promise<{ eventId: string; type: string; payload: unknown }>
}

// adapters/paynow/PaynowAdapter.ts — hash SHA512 uppercase; initiate URL above
// adapters/contipay/ContiPayAdapter.ts — REST direct/redirect; providers EC/OM/IB/cards
// adapters/ecocash/EcoCashDirectAdapter.ts — official developers.ecocash.co.zw
// adapters/paypal/PayPalAdapter.ts — Orders v2 AUTHORIZE preferred when escrowPreferred
// adapters/cod/CodAdapter.ts — no HTTP; courier/supplier confirm → paid (D-7)
```

```ts
// adapters/whatsapp/types.ts
export interface WhatsAppAdapter {
  sendUtilityTemplate(input: { toE164: string; templateName: string; language: string; components?: unknown }): Promise<{ messageId: string }>
  sendSessionText(input: { toE164: string; text: string }): Promise<{ messageId: string }> // only inside 24h window
}
```

```ts
// adapters/fdms/types.ts
export interface FdmsAdapter {
  openFiscalDay(): Promise<void>
  submitReceipt(receipt: unknown): Promise<{ fiscalCode: string }>
  closeFiscalDay(): Promise<void>
}
```

```ts
// adapters/gemini via packages/ai — only through LiteLLM; Zod-validate outputs
```

Maps: **self-hosted Nominatim + OSRM + VROOM**; courier/client/admin maps = **MapLibre** (D-44). Do **not** use Google Maps as sole distance or courier-map SoR. Commercial tile CDN only as optional visual fallback (Blueprint I-2 / stitch doc §3). Dispatch/assignment SoR = **`packages/delivery`** (D-45); algorithm donor = AWS Last Mile Hyperlocal MIT-0 (D-45a / stitch §3.9), not Fleetbase.

---

## 12. RLS role matrix (minimum policies)

Roles: `customer`, `technician`, `supplier`, `admin`, `service_role` (server).

| Table area | customer | technician | supplier | admin |
| --- | --- | --- | --- | --- |
| own profile/vehicles/orders/jobs | CRUD own | read assigned jobs | — | all |
| offers (read) | yes (no supplierId leakage in views) | — | own costs | all |
| supplier_costs / stock | — | — | own | all |
| promo_campaigns (active read) | yes (public fields) | yes | own coop | all |
| promo_credits / referral_edges | own | — | — | all |
| ledger / job_reserves | — | — | — | all (+ service) |
| delivery_jobs / offers | — | — (courier: own offers) | — | all |
| delivery_runs / stops (assigned) | track own shipment | — | — | all |
| courier_locations | track own active shipment (read) | — (courier role: insert own) | — | all |
| delivery_assignment_events | — | — | — | all |
| ai_invocations | — | — | — | all; insert via service |
| outbox | — | — | — | service only |

CI must run RLS tests (Appendix C). Service role never in mobile/web bundles.

**D-47 — object-level AuthZ on top of RLS:** API handlers must call `assertResourceAccess` (or equivalent) after AuthN for jobs, orders, vehicles, promo_credits, delivery_jobs/offers, courier_locations. RLS is necessary but not sufficient for BOLA/IDOR. Add cross-tenant IDOR cases in T9.

---

## 13. Checklists package seed

- Schema: blueprint §4.1 / v4 JobAssessment alignment  
- Seed all **42** entries from `DIAL_Diagnostic_Checklist_Library.md` as `status: 'approved'`, `authoredBy: 'ops_human'`  
- Cleaning/beauty/nail = intake (`known_need`), not fault trees  
- Runtime: deterministic; Gemini only drafts revisions offline → lint → human approve  

---

## 14. Design tokens starter (`packages/design-tokens`)

Style Dictionary sources at minimum:

```json
{
  "color": { "brand": { "primary": { "value": "#0B3D2E" }, "accent": { "value": "#C45C26" }, "danger": { "value": "#B42318" }, "surface": { "value": "#F7F4EF" }, "ink": { "value": "#1A1A1A" } } },
  "size": { "touch": { "min": { "value": "44" } }, "radius": { "sm": { "value": "4" }, "md": { "value": "8" } } },
  "font": { "family": { "display": { "value": "\"Fraunces\", serif" }, "body": { "value": "\"Source Sans 3\", sans-serif" } } },
  "motion": { "duration": { "fast": { "value": "120ms" }, "base": { "value": "240ms" } }, "easing": { "standard": { "value": "cubic-bezier(0.2, 0, 0, 1)" } } }
}
```

Founder may replace brand hex before Gate 1; **do not** ship five apps with independent palettes. Outputs: CSS variables (Tailwind), Swift, Compose.

*(Avoid purple-default / cream-terracotta clichés if redesigning — keep purposeful brand.)*

---

## 15. Scaffold acceptance criteria (internal trains)

Agents close a train only when AC pass.

| Train | Done when |
| --- | --- |
| T0 Foundation | Monorepo boots; apps render shell; tokens compile; CI lint/typecheck; **Semgrep dial hard-fail + Checkov HIGH+ workflows present (D-48)**; Renovate config or Mend App noted; **root living docs present** (`README` / `CHANGELOG` / `ENHANCEMENTS` / `BUGS`) |
| T1 Identity | Sign-in/up; auth home Shop\|Services; RLS tests green on profiles |
| T2 Catalogue+Search | Migrations for catalogue/offers (**no owned inventory — D-58**); Meili settings incl. `offerSource` / `supplierFormality`; stub docs searchable; B2B Meili filter excludes informal; SandPIM notes linked in ADR; **Catalogue Factory ingest/review stubs + `search_no_result_events` (D-53)** |
| T3 Spare UI | Mercur-patterned browse/PDP/cart against stub API; no supplierId in client payloads; checkout seller disclosure agency supplier (D-58); **USD-only browse/cart display (D-57)**; ZiG only on pay-step mock; WA FLOW_SPARE_CHECKOUT EcoCash+COD **required buttons** (D-57); **responsive desktop+mobile web QA + shared design-tokens (Blueprint §8.0.1)** |
| T4 Tech UI | FixItNow-patterned intake/book; emergency path bypasses AI; checklist runner loads 1 automotive + 1 emergency checklist; **responsive desktop+mobile web QA + shared design-tokens (Blueprint §8.0.1)** |
| T5 Money spine | Ledger tables; Paynow + ContiPay/EcoCash/PayPal/COD adapter stubs; JobReserve state machine unit tests; Threat Dragon models under `ThreatDragonModels/` (Job Reserve + related); **`itf263_records` + `withholding_balances` stubs and tech-payout WHT decision path (D-50)**; **tech economics / Take-Home UI stub (D-53)**; **`fx_daily_rates` + admin Daily ZiG rate stub + checkout conversion persists `fx_rate_id` (D-57)**; **FDMS agency receipt types + Gateway adapter stub (D-59)** |
| T6 Jobs | Classification + assignment eligibility tests; quote from rate card only; **`job_class_definitions` + `trade_definitions` lifecycle stubs; Value Score snapshot read path (D-53)** |
| T7 AI | guidedIntake + opsDraftQuote behind Zod; Promptfoo smoke; no price in customer assessment; **Intelligence Factory shadow/promote metadata stubs; capability rename = commercial-forecast / pricing-draft-assist only — never money writer (D-53)**; **checklist outcome loop + outcome-weighted dataset versioning ACs (D-54 §13)** |
| T8 Polish | Chatwoot/Cal.com/Formbricks/PostHog wired or mocked; Rive greeting optional; **Command Centre MetricContract registry stubs + Actual vs Simulated banner (D-54 §14)** |
| T9 Hardening | Degradation tests §6.22; restore drill doc; Metabase views stub; **AuthZ/IDOR + webhook AC** (Appendix A.1); bundle secret grep; security headers/CORS allowlist; cost/health dashboard stub; Semgrep community packs hard-fail after baseline; Strix staging runbook exercised when staging URL + `STRIX_ENABLED` (**D-48**); **Simulated→payout path forbidden integration test (D-54)** |

**D-53 overlay (not a new train number):** Commercial Simulation service may scaffold after T5 money spine exists; prefer post-dogfood calibration. Do **not** renumber to Train 0–10.

Customer-open requires Appendix C + §8.1 gates — not T-train alone.

### Appendix A.1 — AuthZ / IDOR + webhook acceptance (T9 / D-47)

**Object AuthZ**

- [ ] Central helper (e.g. `assertResourceAccess`) on jobs, orders, vehicles, promo_credits, delivery_jobs/offers, courier_locations
- [ ] No handler trusts body/query `userId` / `email` / `role`
- [ ] CI smoke: cross-tenant IDOR denied on ≥5 priority resources
- [ ] User-scoped cache keys include `userId`; authorize before cache read

**Internal / webhooks**

- [ ] `INTERNAL_API_SECRET` (or mTLS) fail-closed on n8n→API, BullMQ→HTTP, Temporal activity side-effect HTTP
- [ ] `/webhooks/*` (Paynow, ContiPay, EcoCash, PayPal, Meta WA, FDMS): signature verified **and** idempotency store checked before mutate
- [ ] `docs/agent-audits/` prompts run (report-only) before merging money/webhook trains

---

## 16. Do-not-reopen research table

| Topic | Already decided | Cite |
| --- | --- | --- |
| Customer apps | Native Android+iOS+web+WhatsApp | C-5, D-17 |
| Expo ecommerce tutorial | Rejected as customer shell | §6.2.1, D-38 |
| Search | Meilisearch | D-26 |
| Images | Sharp | D-31 |
| Motion | Rive | D-27 |
| Queues | BullMQ not Inngest | D-29 |
| Booking | Cal.com | D-35/36 |
| Spare UX donor | Mercur B2C | D-38 |
| Tech UX donor | FixItNow primary | D-38 |
| Fitment PIM reference | SandPIM (schema only) | D-38 |
| AI brain | Gemini sole | C-1, D-18 |
| Voice | None | D-23 |
| Cores / buffer SKUs | Not accepted / not required | D-21, D-22 |
| Withholding | **30% tech-hire WHT enforced** — ITF263 hard preference; `withholding_balances`; do not assume WHT disappears | §7.2, D-50 (D-3 counsel parallel) |
| Agency / B2B formal | Marketplace agency default; B2B **hide** informal at Meili/search/APIs (+ checkout); registered VAT-inclusive | D-49, §4.1, §7.1 |
| Agency characterisation | DIAL is agent (D-2/D-58); no DIAL_OWNED; FDMS agency receipt model + in-house Gateway | D-49, D-58, D-59, §4.1, §7.1 |
| Job Reserve | PSP escrow path | C-4 |
| Payment methods | Paynow + ContiPay + EcoCash optional + PayPal + COD + escrow via PspAdapter | D-43, D-7 |
| Courier maps / ETA | MapLibre + Nominatim/OSRM/VROOM — not Google as SoR | D-44 |
| Delivery app | `delivery-android` Compose; foodhub-compose pattern | D-44 |
| Delivery job / dispatch SoR | `packages/delivery` + Temporal `DeliveryDispatchWorkflow`; FIFO queue; algorithm donor AWS Last Mile (MIT-0, D-45a); not Fleetbase | D-45 / D-45a |
| Complementary ERP/ops donors | tableflow CSV import; Tracktor fleet UX; react-pdf; DantSu ESC/POS; Formance Console *patterns only*; bull-board; Schedule-X roster | D-46 |
| Cursor rules / Lazy Dev pack | `.cursor/rules`, `.cursorignore`, `AGENTS.md`, dial-* skills, agent-audits, `DIAL_Cursor_Rules_and_Skills.md` | D-47 |
| Security toolchain | Threat Dragon models; Semgrep CE; Checkov; Renovate (primary); Strix staging; `DIAL_Security_Toolchain.md` | D-48 |
| Tracer / feature DoD | Plan→Build→Expand→Done; no stub-as-MVP | D-52 |
| v7-2 platform extensions | Catalogue Factory, JobClass/Trade, Value Score, offline Sim, WHT UI; Kernel/Intelligence/CERTIFIED–DORMANT **modified**; reject v7 SoR + Train 0–10 + Unleash/OR-Tools SoR | D-53 |
| Intelligence Factory + CC metrics | Continuous learning + checklist wrap; MetricContract; Actual vs Simulated; no auto-publish / no Simulated payouts | D-54 |
| External skills utilization | Thin dial-diagram-editorial; agency payments/evidence habits; anthropics anatomy + dial-webapp-recon; no full tree vendors | D-55 |
| Plan-phase grill + AI capability gate | `dial-grill-locks` in Plan; `dial-ai-capability-review` before `packages/ai` merge; slim AGENTS + evals + T0 affirmed; Flash-Lite P1 | D-56 |
| Spare USD browse / ZiG checkout | Display USD on PLP/PDP/search/cart; ZiG only at pay step from ops daily rate; admin Daily ZiG rate + audit; WA EcoCash+COD buttons | D-57 |
| AI Kernel / Prime Agent absorb | Dev Manager = Build managerial authority throughout; Prime = mandatory harness (before workspace); prod multi-step = capabilities + Temporal/BullMQ; no prod adapter / alternate agent framework; Factory remains eval SoR; §5.3 locked | D-61 |

### 16.1 Optional donors (D-46) — high-value only

Do **not** treat these as replacements for D-38 storefronts or D-44/45 delivery:

- **Must-adopt (D-46):** `tableflowhq/csv-import`, `javedh-dev/tracktor`, `@react-pdf/renderer`, `DantSu/ESCPOS-ThermalPrinter-Android`, Formance Ledger Console patterns (never SoR), `felixmosh/bull-board`, `schedule-x/schedule-x`.
- **Backlog:** Plane (AGPL triage UX), Ballerine (ELv2 KYC UX), PicPeak evidence gallery, SolidInvoice layouts, DGFraud research, Lago portal pattern (AGPL). Full table: stitch §7.
- **D-53 OSS:** UnoPIM (pattern), WorldOfTaxonomy (seed), json-rules-engine (non-money), SimPy+SALib (offline sim), SHAP (offline explain), GO Feature Flag/flagd (optional vs Unleash AGPL), NestJS module pattern. Full matrix: companion + stitch §8.

---

## 17. Minimal Cursor agent system prompt (paste)

```text
You are scaffolding DIAL. Authority: DIAL_Consolidated_Plan_v4.md, then
DIAL_Development_Agent_Pack.md. Do not re-research tool choices or UX donors.
Follow D-38 stitch kit (Mercur B2C, FixItNow, CoolMallKotlin, tunacosgun/eCommerce,
Mercur vendor-panel, Style Dictionary, Rive, shadcn). UI donors only — DIAL ERP is SoR.
No Expo/RN customer apps, no voice, no AI customer prices, auth-first gateway.
Use env names, Meili schema, table inventory, and adapter stubs from the Agent Pack.
Payment methods: PspAdapter registry (Paynow/ContiPay/EcoCash/PayPal/COD/escrow) — D-43.
Courier app: delivery-android + MapLibre + OSRM/VROOM — D-44; dispatch SoR =
packages/delivery + DeliveryDispatchWorkflow (accept/reject/timeout/FIFO) — D-45; see
DIAL_Deep_Engineering_and_OSS_Stitch.md. ERP complements (CSV import, fleet UX,
react-pdf, ESC/POS, ledger display patterns, bull-board, Schedule-X) — D-46 / stitch §7.
Cite v4 section numbers for behavioural decisions. Prefer stubs over inventing
PSP/FDMS/WhatsApp production behaviour until Phase 0 contracts exist.
Ship habits (**D-47**): honour `.cursor/rules`, audit-then-fix via
docs/agent-audits + dial-* skills; see DIAL_Cursor_Rules_and_Skills.md and
DIAL_Lazy_Developer_Playbook_Adaptations.md — no architecture reopen.
AppSec CI (**D-48**): Semgrep + Checkov + Renovate per DIAL_Security_Toolchain.md;
Strix only on authorized staging — does not replace IDOR/RLS tests.
Agency + B2B hide informal (**D-49**); tech payout 30% WHT via itf263 /
withholding_balances (**D-50**); DIAL-owned dual capacity (**D-51**) —
do not reopen marketplace-wide principal, show informal to B2B, or drop WHT.
Tracer DoD (**D-52**); v7-2 extensions only via D-53 companion — never v7 as SoR,
never Train 0–10, never Unleash/OR-Tools as SoR, AI never writes money.
Intelligence Factory continuous learning + Command Centre MetricContracts (**D-54**):
human+Promptfoo promote; no checklist auto-publish; Simulated never auto-pays.
External skills (**D-55**): dial-diagram-editorial; money-path/tracer agency habits;
dial-webapp-recon; skill anatomy — no full upstream tree vendors / no ToS doc skills.
Plan-phase grill + AI capability merge gate (**D-56**): dial-grill-locks before
scaffold of money/WA/maps/AI/dual-capacity/Catalogue Factory/Intelligence;
dial-ai-capability-review before packages/ai merge; Flash-Lite stays P1.
Spare USD browse + ZiG-at-checkout (**D-57**): displayCurrency=USD on catalogue/cart;
ZiG only at pay step from ops daily fx_daily_rates; admin Daily ZiG rate + audit;
WA EcoCash + COD via required checkout buttons/CTAs (not free-text only).
Web UX: responsive desktop+mobile + shared design-tokens (Blueprint §8.0.1).
Living docs: update README/CHANGELOG/ENHANCEMENTS/BUGS in the same PR (§8.0.2).
```

---

## 18. Gap log — what this pack intentionally does not invent

Agents must **not** invent these as facts; wait for founder/counsel/ops inputs:

- Final Harare labour rate-card numbers (illustrative only in blueprint)  
- Named escrow PSP contract terms  
- Live WABA template names  
- Production brand colour finalisation (tokens are starters)  
- Licensed TecDoc/MOTOR data (buy later per §3.2)  
- ZIMRA FDMS field-level XML/JSON until device docs attached to repo  

When blocked, implement interface + fake adapter + tests.

---

*End of Development Agent Pack v1.0 — locked via v4 D-39; extended by D-53 / D-54 / D-55 / D-56 / D-57.*

**D-58:** D-2 agency confirmed; D-51 owned-stock discarded — no DIAL_OWNED scaffold.
