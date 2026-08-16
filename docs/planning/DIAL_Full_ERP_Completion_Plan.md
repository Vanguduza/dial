# DIAL Full ERP Completion Plan

**Status:** Authoritative **engineering completion spine** from 2026-08-16 until Phase 12 exit + Appendix C / §8.1 customer-open (human).  
**Authority conflict order:** (1) `DIAL_Consolidated_Plan_v4.md` → (2) `DIAL_Development_Agent_Pack.md` → (3) Blueprint / checklists / WA / promotions / D-53…D-61 companions → (4) this plan.  
**Replaces as “what eng does next”:** open-ended **PD139+** invent and any reading of workplan STATE that equates “eng complete / S90 green” with “ready to open to customers.”  
**Does not replace:** Appendix C + v4 §8.1 as the **only** customer-open declaration (founder/ops).  
**Date:** 2026-08-16  
**Locks respected:** C-5, D-38…D-61 (incl. D-52 no stub-as-MVP; D-58 agency-only; D-57 USD browse; official WA Cloud API only; MapLibre SoR; AI never writes money).

---

## 0. Executive summary (founder-readable)

### What happened

DIAL’s build trains (T0–T9) and the later “product depth” stages (PD1–PD138) did real work: packages, screens, adapters, tests, and dogfood harnesses exist across web, Android, iOS, supplier, delivery, tech, admin, money, WhatsApp, and groceries (food). That is **not** the same as a production ERP customers can trust with real money, real stock, and real ZIMRA/Meta/PSP accounts.

The trains were designed so agents could close tickets when **acceptance criteria for a thin path** passed—often against **fixture** mode (in-memory data, fake payment refs, sandbox-fail-closed without live keys). Calling that “eng Build complete” (S90) was accurate for **scaffold + behaviour contracts**. It was **not** accurate for “all required features at full functionality with live tools and integrations.”

### What “open to customers” still requires

Customers must get **one finished product** (v4 §8.1 / D-37): native Android + iOS + web + WhatsApp, supplier portal, courier app, technician app, full admin ERP modules, live Meilisearch catalogue, live Job Reserve / ledger / fiscal receipts, live maps stack, live Meta WhatsApp Flows, groceries food path, Intelligence/Command Centre that never auto-pays from Simulated mode—and legal/ops gates (contracts, licences, escrow partner, ZIMRA credentials, POTRAZ, insurance) that **engineers cannot code around**.

### What this plan does

It freezes a **finite** sequence of **13 phases (0–12)**. Each phase has a **100% exit gate**. The next phase does **not** start until the gate is green with **evidence** (tests, recon screenshots, webhook replay, money-path / capability audits). No new endless PD micro-stages. Liquor stays counsel-gated (separate from MVP food groceries).

### Plain-language glossary

| Term | Meaning |
| --- | --- |
| **Fixture mode** | Software runs with fake/in-memory data so CI stays green without live cloud keys. |
| **Sandbox** | Real vendor test environments (Paynow sandbox, Meta test WABA, etc.) with test keys. |
| **Live / production** | Real customer money, real fiscal day, real WhatsApp Business Account. |
| **Thin vertical** | One happy-path slice through the stack (useful as *build order*, not as “feature done”). |
| **DoD 100%** | Definition of Done fully checked with evidence—no blank channel cells (D-52). |
| **SoR** | System of record—the component allowed to decide truth (e.g. DIAL ledger for money). |
| **Job Reserve** | Hold customer funds via a licensed PSP escrow path until the job/order settles. |
| **FDMS** | ZIMRA fiscal device / virtual fiscalisation—receipts that make tax reporting real. |
| **Meili** | Meilisearch—product search index for Spare/grocery offers. |
| **Temporal** | Durable workflow engine for delivery dispatch and money/fiscal long-running work. |

### Verdict in five bullets

1. **S90 / PD138 ≠ production ERP** — green trains proved contracts; most money/search/auth paths still default to fixture or fail-closed without live env.  
2. **Surface coverage is broad; durability is thin** — Pack §9 screens largely exist under `gateway-web` + native apps; Postgres migrations, live Meili, live Temporal/Redis, store-ready apps, and full checklist library (42) are incomplete.  
3. **This plan is the eng SoR for sequencing** until Phase 12; Appendix C remains the human launch SoR.  
4. **Thirteen phases, one hard exit gate each** (~13 eng gates + Appendix C human gate); no PD139+ invent.  
5. **Top blockers to customer-open:** live foundation (Auth/DB/Meili), Spare end-to-end on real rails, native store readiness, live PSP/FDMS/WA contracts, and founder/ops Appendix C items.

### Anti-stub gate policy (applies to every phase)

**Mandatory for G0–G12.** Stub/fixture paths may exist for CI, but **no phase exits** on them. Complements D-52 / `dial-tracer-slice`.

| Rule | Meaning |
| --- | --- |
| **No fixture-only exit** | Cannot exit a phase on fixture-only Auth, Meili, PSP, WhatsApp, FDMS, or Temporal. Fixture mode is CI convenience only. |
| **Thin vertical ≠ done** | Thin vertical = **build order inside the ticket only**. Phase exit requires **feature DoD 100%** with sandbox or live evidence (not “AC green on mocks”). |
| **No mock-green = complete** | Passing unit/contract tests against in-memory Maps, stub provider refs (`eco_stub_*`, `taskUid: "fixture"`, in-process Temporal) does **not** satisfy an exit gate. |
| **Exit checklist (every phase)** | (1) **Durable data** where the phase owns persistence (Postgres/outbox, not only process memory). (2) **Real integration mode** — `DIAL_INTEGRATION_MODE=sandbox` (or live) with a documented credentials path; fail-closed without secrets is correct safety, not “integration done.” (3) **UI usable** on desktop + mobile web and/or native as in phase scope (§8.0.1). (4) **Money paths** use integer `amountMinor` + currency; webhook (or documented PSP truth) before settlement mutation. |

Each phase’s **Exit gate** section below adds 2–4 phase-specific anti-stub bullets. Dev Manager must refuse phase advance if any anti-stub bullet fails.

---

## 1. Diagnosis — why stub-tolerant train ACs ≠ production ERP

### 1.1 How trains were scored green

Pack §15 trains (T0–T9) and workplan stages (S10–S90, then PD1–PD138) explicitly allowed:

- **Adapter stubs** and **fixture** `DIAL_INTEGRATION_MODE` (default).  
- **Sandbox fail-closed** without keys (correct safety posture—but not “integration live”).  
- **Thin vertical** evidence (one path) plus unit tests in CI.  
- Matrices marked **Y** when the *behaviour contract* existed on the fixture path (see `DIAL_Tracer_DoD_Completion_Matrices.md`).

That matches Pack §4 (“stub now vs Phase 0 production gates”) and the workplan note that Phase 0 commercial ENH-020…022 stay `proposed` while eng continues on stubs.

### 1.2 What “eng complete” (S90) actually left

| Claim at S90 / PD* | Reality in repo (evidence) |
| --- | --- |
| Money spine done | `@dial/payments` still documents Phase 0 in-memory SoR + stub provider refs (`eco_stub_*`, etc.); live keys = fail-closed or sandbox path only. |
| Search done | Meili client returns `taskUid: "fixture"` when mode=fixture; sandbox requires `MEILI_*` host. Index bootstrap exists; **production catalogue depth** (chassis table, brand feeds, ops approve volume) not Gate-1 complete. |
| Auth done (PD1) | GoTrue path + `0002_profiles_auth_rls.sql`; CI still fixture-friendly. Full Pack §12 RLS matrix across ledger/delivery/jobs tables **not** fully migrated/tested as production SoR. |
| Delivery Temporal done | Worker hosts `DeliveryDispatchWorkflow`; fixture = in-process; sandbox/live needs `TEMPORAL_ADDRESS`. Self-hosted Nominatim/OSRM/VROOM still ENH-013 `proposed`. |
| WA Flows done (PD12) | Cloud API adapter + Flow registry + EcoCash\|COD buttons; **Meta WABA + approved template IDs = ENH-021 proposed**. |
| FDMS done (PD11) | Virtual Gateway day machine + agency receipt classes in `@dial/tax`; **ZIMRA credentials = ENH-022 proposed**. |
| Native apps done | Android/iOS/customer/delivery/technician **apps exist** with Compose/SwiftUI thin+deepen paths; **not** Play/App Store–ready (signing, privacy labels, crash reporting, store listings, production gateway URLs). |
| Admin ERP done | Many `/admin/*` routes under **gateway-web** (not separate `admin-web` deployable); modules A–P partially covered; HR/Payroll-ZW (K), full Metabase BI (P), full pricing explorer (G) remain shallow or pattern-only. |
| Checklist library done | Pack §13 = **42** approved seeds; repo has **~26** `catalogId`s (PD136 tranche 3); CHANGELOG explicitly “≠ full 42”. |
| Experience enhancers (§5.16) | Chatwoot/Formbricks/PostHog/Rive/Realtime/Langfuse largely **stubs** that skip or fixture without keys (PD113, PD117, PD122, PD130). |
| Groceries | Food thin+deepen green (G1, PD14+); liquor **counsel-gated** — correctly out of MVP Build. |
| Dogfood / staging | Local Playwright recon (PD37) green; **remote staging URL optional** (ENH-011 in_progress). |
| Customer-open | Workplan correctly kept **S99 human**; STATE still tempted agents toward **PD139+** product invent instead of finishing durability. |

### 1.3 The D-52 failure mode that opened gates early

**Tracer = build order**, not permission to ship stubs as MVP (D-52 / `dial-tracer-slice`). The monorepo repeatedly:

1. Shipped the thin vertical.  
2. Marked stage green.  
3. Auto-advanced (`DIAL_Dev_Manager_Autonomous_Runbook.md`).  
4. Treated Pack §9 “screen exists” as Pack Gate 1 “launch-complete.”

**Correct interpretation going forward:** a phase exit gate means **production-intent behaviour on sandbox (then live) rails**, durable storage, channel matrix filled for real clients, and evidence that is not fixture-only—unless the phase explicitly scopes fixture→sandbox promotion.

### 1.4 What we keep from the trains (do not rebuild)

Do **not** throw away:

- Domain packages: `ledger`, `payments`, `tax`, `catalogue`, `delivery`, `jobs`, `promotions`, `identity`, `suppliers`, `ai`, `queues`, `search-indexer`, `shared`, `design-tokens`.  
- Adapters: `adapters/psp`, `fdms`, `whatsapp`, `maps`.  
- Apps: `gateway-web`, `customer-android`, `customer-ios`, `delivery-android`, `technician-android`, `worker-temporal`, `worker-queues`.  
- Locks, dogfood harnesses, money-path audits, Semgrep/Checkov posture, living docs habit.

The completion plan **hardens and finishes** these assets—it does not renumber to Train 0–10 or invent a parallel ERP.

---

## 2. Phase 0 — Reality baseline + gap matrix (this document)

### 2.1 Repo topology (as built)

| Planned (Pack / v4 §6.12) | Actual |
| --- | --- |
| `gateway-web`, `spare-web`, `tech-web`, `supplier-web`, `admin-web` | **Single Next app** `apps/gateway-web` hosts customer Shop/Services, `/spare`, `/tech`, `/grocery`, `/supplier`, `/admin/*`, `/delivery/*` |
| Customer Android / iOS | `apps/customer-android`, `apps/customer-ios` |
| Technician / delivery Android | `apps/technician-android`, `apps/delivery-android` |
| Workers | `apps/worker-temporal`, `apps/worker-queues` |
| Packages | Listed in §1.4 |
| SQL | `supabase/migrations/0001_core_tables.sql`, `0002_profiles_auth_rls.sql` only (thin vs Pack §7 inventory) |
| Compose | `docker-compose.yml` (Redis/Meili/Temporal siblings — ENH-031) |

**Decision (engineering default, not a lock reopen):** keep **one gateway-web** with bundle rules (admin never in customer first-load chunks) unless founder later funds separate deployables. Completion gates judge **function**, not folder count.

### 2.2 Achieved vs Pack §9 / v4 product shape

Legend: **P** = pattern/UI+API contract exists · **F** = fixture-default · **S** = sandbox path coded · **L** = live/prod proven · **G** = gate incomplete

| Surface | Pack / v4 intent | Repo evidence | Maturity |
| --- | --- | --- | --- |
| Gateway home Shop\|Services | §9.1 | `/` + `/api/home` (PD26) | P/F |
| Spare web browse→checkout | §9.2 / D-57 | `/spare`, cart, EcoCash\|COD, facets, EPC entry (PD3/18/27/95…) | P/F/S |
| Tech web guide/book | §9.3 | `/tech/*`, rate_card book, checklists partial (PD13/137) | P/F — **G** checklist 42 |
| Supplier portal | §9.4 | `/supplier` + `@dial/suppliers` (PD6/38/84/116/132) | P/F |
| Admin modules A–P | §9.5 / v4 §6.17 | Many `/admin/*` routes (CC, Factory, FDMS, dispatch, promo, WHT, …) | P/F — **G** depth K/G/P |
| Customer Android | §9.6 / C-5 | Compose Spare+grocery+orders (PD5/20/21/42) | P/F — **G** store |
| Customer iOS | §9.6 / C-5 | SwiftUI DialCustomerCore (PD8/20/42) | P/F — **G** store |
| Technician Android | §9.7 | Compose jobs/checklist/Take-Home/WHT (PD9/25/30/31) | P/F — **G** store |
| Delivery Android | §9.8 / D-44 | Compose offers/POD/COD/MapLibre/offline (PD7/28–32/51) | P/F — **G** maps Tier-2 |
| Money / Job Reserve | T5 / E1 | packages + webhooks + admin outbox/escrow | F/S — **G** live escrow ENH-020 |
| WA Cloud Flows | D-40/41 | adapters + `/admin/wa` + FLOW_SPARE/GROCERY (PD12/40) | S — **G** ENH-021 |
| FDMS agency | D-59 | `@dial/tax` + `/admin/fdms` (PD11/41) | S — **G** ENH-022 |
| Meili catalogue | Pack §8 | client + Factory publish (PD2/15) | F/S — **G** live index ops |
| Temporal delivery | D-45 | worker + workflow stubs | F/S — **G** durable cluster |
| Groceries food | G1 plan | `/grocery`, Meili grocery, cold-chain slots | P/F — food OK for later phase |
| Liquor | G plan | Hidden; counsel gate | **Out of MVP** |
| Intelligence / CC | D-54 | Factory + CC pages (PD10/17/47) | P/F — **G** promote ops |
| Experience §5.16 | D-35 | stubs (PD113/117/122/130) | F — **G** |

### 2.3 Workplan historical map (S00–S90 / PD*)

| Historical ID | Meaning retained | Completion-plan treatment |
| --- | --- | --- |
| S00–S01 | Env + ticket hygiene | Absorbed into Phase 1 ops hygiene |
| S10–S30 / T0–T9 | Scaffold trains | **Historical**—contracts landed; durability = Phases 1–11 |
| S90 | “Eng Build complete” | **Retire as launch signal**; means “scaffold band closed” only |
| S91–S465 invent | OpenAPI micro-stages | **Paused permanently** as SoR |
| PD1–PD138 | Product-depth band | **Historical inventory**; remaining gaps fold into Phases 1–11 |
| PD139+ | Invented Pack-gap micro-stages | **Forbidden** — use this plan’s phases |
| G1 | Grocery food thin vertical | Feeds Phase 10 |
| S99 | Customer-open | **Phase 12 human gate** + Appendix C only |

**STATE rule:** `next_stage` for eng = **Phase 1 (then sequential)** of this document — **not** S99 and **not** PD139+.

### 2.4 Phase 0 exit gate

| Gate | Evidence |
| --- | --- |
| **G0** | This document merged/landed in `docs/planning/`; `docs/planning/README.md` points here; STATE points eng next to Phase 1 |

**Anti-stub (G0):**

- Gap matrix must label **F/S/L** honestly — do not mark fixture contracts as live or production-intent.
- Plan must state that S90/PD* green ≠ phase-complete under this document’s anti-stub policy.
- STATE must not treat PD invent or fixture ACs as the eng “next” SoR.

**Phase 0 status:** **COMPLETE** upon landing of this file + README pointer (+ STATE redirect).

---

## 3. Target architecture & integrations (as planned — locks held)

```text
Customers:  Android | iOS | gateway-web (Spare/Tech/Grocery) | WhatsApp Cloud API Flows
Partners:   supplier portal | technician Android | delivery Android
Ops:        gateway-web /admin (modules A–P) | Command Centre | Intelligence Factory
Workers:    Temporal (DeliveryDispatchWorkflow, money/fiscal) | BullMQ (Meili, Sharp, webhooks)
Data:       Supabase Postgres + RLS + Realtime | Meilisearch spare_offers_v1 + grocery_offers_v1
Money:      @dial/payments + @dial/ledger  → adapters/psp (Paynow, ContiPay, EcoCash, PayPal, COD, escrow)
Fiscal:     @dial/tax → adapters/fdms (ZIMRA Virtual Gateway in-house; CloudESD optional signer only)
Maps:       adapters/maps → Nominatim + OSRM + VROOM; MapLibre clients (not Google/Mapbox SoR)
AI:         packages/ai → LiteLLM → Gemini; Promptfoo + Langfuse; never payable amounts
Promo:      @dial/promotions only (no cash-out)
```

**Forbidden:** Baileys / unofficial WA; Expo/RN customer shell; Medusa/OfferKit/Formance as money SoR; Fleetbase as delivery engine; `DIAL_OWNED` principal stock; AI-written payable amounts; Simulated Command Centre auto-pay; liquor Build without counsel.

---

## 4. Phased completion plan (finite gates)

**Global rules for every phase**

1. **No phase skip.** Dependencies listed must be green.  
2. **Exit gate = 100%** of checklist items + evidence codes (T/W/P/S/A as applicable).  
3. **Tracer allowed inside a phase** only as build order; ticket stays open until phase gate.  
4. **Human/ops blockers** listed separately—eng may prepare code paths but cannot fake “live” without keys/contracts.  
5. **No new PD invent stages.** If a gap appears, attach it to the current open phase’s DoD—do not mint PD139.  
6. **Anti-stub gate policy (§0)** is mandatory — fixture-only Auth/Meili/PSP/WA/FDMS/Temporal cannot exit; “AC green on mocks” is never phase complete.

**Estimated gates:** 13 engineering exit gates (G0–G12) + **1 human customer-open gate** (Appendix C / §8.1). Internal checklists below expand each gate (~80–100 leaf DoD lines total across phases—not open-ended stages).

---

### Phase 1 — Live platform foundation (Auth, DB/RLS, Meili, env)

**Intent:** Make the ERP stand on real infrastructure in **sandbox**, with CI still able to run fixture.

| | |
| --- | --- |
| **Scope** | Promote Auth + profiles beyond fixture; expand Postgres migrations toward Pack §7 table inventory (priority: offers, orders, ledger, job_reserves, delivery_*, fx_daily_rates, fdms_outbox, promo_*); RLS policies + CI RLS tests for priority tables; Meili index bootstrap `spare_offers_v1` (+ grocery index schema ready); Redis/BullMQ + Temporal address wired in staging compose; `DIAL_INTEGRATION_MODE=sandbox` dogfood env documented; `INTERNAL_API_SECRET` fail-closed proven. |
| **Apps/packages** | `supabase/migrations/*`, `@dial/identity`, `@dial/catalogue`, `@dial/search-indexer`, `apps/gateway-web` auth, `docker-compose.yml`, `apps/worker-*` |
| **Integrations** | Supabase Auth/Postgres, Meilisearch, Redis, Temporal |
| **Dependencies** | Phase 0 |
| **Non-goals** | Live customer traffic; Play Store; Meta/ZIMRA production credentials; liquor |
| **Exit gate G1** | Staging (or equivalent) boots: password sign-in → session cookie → `/api/auth/me`; Meili search returns **non-fixture** task UIDs for upsert/search against seeded offers; RLS CI denies cross-tenant reads on ≥5 priority resources; workers connect with secrets unset → fail-closed; env catalog Pack §6 filled for sandbox. Evidence: T + S (recon) + runbook note. |

**Anti-stub (G1):**

- Auth session must hit real GoTrue/Postgres profiles — not an in-memory fixture user that only CI accepts.
- Meili upsert/search evidence must show real `taskUid` / host responses — never `taskUid: "fixture"` as gate proof.
- Temporal/Redis/worker wiring proven against staging addresses (or documented sandbox compose); in-process-only worker is not G1 complete.
- `DIAL_INTEGRATION_MODE=sandbox` dogfood env documented with a real credentials path; fail-closed without secrets ≠ “integrations live.”

---

### Phase 2 — Spare end-to-end production path (web)

**Intent:** One complete Dial a Spare customer journey on sandbox rails: search → PDP → USD cart → disclosures → EcoCash|COD|Paynow → Job Reserve → order track → cancel/return claim → seller disclosure → B2B informal deny.

| | |
| --- | --- |
| **Scope** | Durable OfferSnapshot + order rows (not only Maps); Meili-backed browse (PD95 facets/collections live); dual-entry vehicle/EPC against DB seeds (C-6); checkout Idempotency-Key; shadow failover after confirm SLA; 18-item disclosure; agency “Sold by {Supplier}”; Daily ZiG four-eyes → EcoCash ZiG payable; Playwright recon desktop+mobile (§8.0.1). |
| **Apps/packages** | `gateway-web` `/spare*`, `@dial/catalogue`, `@dial/payments`, `@dial/ledger`, `@dial/promotions` (apply draft), search-indexer |
| **Integrations** | Meili, PSP sandbox (at least EcoCash + COD + Paynow URL), FX admin |
| **Dependencies** | G1 |
| **Non-goals** | Native store release; WA live templates; grocery; full admin A–P polish |
| **Exit gate G2** | Documented sandbox dogfood script: **human** completes buy EcoCash **and** COD on web against Meili-seeded offers; ledger journals + FiscalReceiptQueued (sandbox FDMS or queued outbox); B2B informal leak probe = 0; money-path review refreshed. Evidence: S + W + A + T. |

**Founder exception (G2 EcoCash only — 2026-08-16):** Eng may complete G2 **sequencing** with documented pretend / API-doc sandbox EcoCash (`eco_sb_*` via Pack §6 keys; see `docs/ops/ecocash-pretend-sandbox.md` + `dial-autonomous-completion.mdc`). STATE label: `G2: eng-exception (pretend/sandbox EcoCash)`. This **unblocks Phase 3+ eng work** under the dependency graph; it is **not** live/production EcoCash. Keep real portal EcoCash on `blocked_on_human`. Other secret phases (Meta / ZIMRA / escrow) stay open unless separately excepted.

**Anti-stub (G2):**

- Checkout must create durable order/OfferSnapshot + Job Reserve rows — not Map-only / process-memory carts.
- PSP path uses sandbox adapters with webhook (or documented PSP truth) — `eco_stub_*` / fixture `eco_fx_*` alone cannot exit; under the founder exception, documented pretend Pack §6 keys yielding `eco_sb_*` (or portal sandbox HTTP) count for eng sequencing.
- Fiscal queue must enqueue real outbox events (sandbox FDMS or durable `FiscalReceiptQueued`) — not a skipped stub.
- UI dogfood on desktop **and** mobile web (§8.0.1); money = `amountMinor` integers only.

---

### Phase 3 — Native customer Android + iOS store-ready Spare path

**Intent:** Same ERP APIs as Phase 2; apps releasable to closed testing (internal track), not “thin Compose demo.”

| | |
| --- | --- |
| **Scope** | Production gateway base URL config; release signing pipeline docs; crash-free happy path Spare+garage+orders+returns+promo (PD20/21); grocery browse parity optional if Phase 10 not yet open but API-stable; privacy policy / data-safety forms drafted; no Expo; USD-only browse; EcoCash\|COD. |
| **Apps/packages** | `customer-android`, `customer-ios`, gateway contract tests |
| **Integrations** | Same sandbox ERP as G2 |
| **Dependencies** | G2 |
| **Non-goals** | Public store listing before Phase 12; technician/delivery store |
| **Exit gate G3** | Internal TestFlight / Play internal testing builds install and complete Spare checkout against staging; contract tests green; screenshot evidence matrix web∥Android∥iOS for disclosure+pay CTAs. Evidence: S + T. |

**Anti-stub (G3):**

- Builds must talk to staging gateway (sandbox rails from G2) — emulator-only mocks / fixture API hosts do not exit.
- EcoCash\|COD CTAs must complete against real sandbox payment path — not UI-only buttons with stubbed success.
- Screenshot matrix proves disclosure + pay CTAs on both Android and iOS (usable native UX, not thin demo shells).

---

### Phase 4 — Supplier + Catalogue Factory production

**Intent:** Suppliers can onboard, upload costs, heartbeat, confirm SLA, see statements/bonds/co-op; ops Catalogue Factory CSV→human approve→Meili with demand-gap—**no AI auto-publish**.

| | |
| --- | --- |
| **Scope** | Durable supplier_costs/stock; heartbeat stale/missing escalations (PD38) on live data; confirm SLA board; co-op propose/approve/spend (D-42); Factory queues + B2B leak=0; take-rate ladder publish integer bps (ops-set, not AI); statement PDF beyond stub bytes if ops requires (react-pdf). |
| **Apps/packages** | `/supplier`, `/admin/catalogue/factory`, `@dial/suppliers`, `@dial/catalogue` |
| **Integrations** | Meili publish, optional WA utility heartbeat templates (sandbox) |
| **Dependencies** | G1 (G2 recommended parallel) |
| **Non-goals** | Liquor suppliers; DIAL_OWNED; Tableflow cloud SoR |
| **Exit gate G4** | Two sandbox suppliers: upload → pending_review → approve → searchable on Meili; one confirm-SLA cycle; one co-op live offer; B2B cannot see informal. Evidence: T + S + A (catalogue). |

**Anti-stub (G4):**

- Supplier costs/stock and Factory approve must persist in Postgres — fixture Maps / “approve” that never indexes is not done.
- Meili search after publish must return non-fixture hits for the approved offers.
- Co-op / take-rate paths use integer bps from ops — no AI-written payable amounts; B2B informal leak probe on live index/API.

---

### Phase 5 — Delivery + maps production

**Intent:** Last-mile SoR matches D-44/D-45: offer→accept/reject/timeout→reassign→FIFO; MapLibre track; OSRM/VROOM; POD/COD; multi-stop when same band/slot.

| | |
| --- | --- |
| **Scope** | Temporal `DeliveryDispatchWorkflow` against real Temporal; `courier_locations` Realtime (or polled fallback documented); admin dispatch board + customer track; delivery-android offline packs Harare/Bulawayo; COD float warn; self-hosted or contracted Nominatim/OSRM/VROOM (close ENH-013 or document managed equivalent **without** Google as SoR). |
| **Apps/packages** | `@dial/delivery`, `worker-temporal`, `delivery-android`, admin delivery pages, `adapters/maps` |
| **Integrations** | Temporal, maps stack, Supabase Realtime |
| **Dependencies** | G2 (orders to deliver) |
| **Non-goals** | Fleetbase runtime; Google Maps SoR |
| **Exit gate G5** | Sandbox: create job → offer courier app → accept → navigate → POD → COD confirm; timeout→reassign test; admin MapLibre pin updates; workflow history visible in Temporal UI. Evidence: T + S + W (assignment events). |

**Anti-stub (G5):**

- `DeliveryDispatchWorkflow` must run on real Temporal (history visible in Temporal UI) — in-process fixture worker alone cannot exit.
- Courier Android POD/COD against durable delivery job rows — not mocked offer lists.
- Maps distance/ETA via Nominatim/OSRM/VROOM (or documented managed equivalent) — Google/Mapbox must not be SoR; MapLibre clients only.

---

### Phase 6 — Tech / jobs production

**Intent:** Dial a Tech bookable on rate cards with checklists, evidence, Cal.com slots, WHT Take-Home—**no AI prices**.

| | |
| --- | --- |
| **Scope** | Seed **all 42** checklists from `DIAL_Diagnostic_Checklist_Library.md` as approved; emergency deterministic path; guided intake Zod (no money); bookJobFromIntake; technician Android offline evidence queue; credential expiry gates; Value Score dispute≠money; ITF263 upload/verify; preferred-tech re-match behaviour; Cal.com sandbox or fixture-documented fallback with ops runbook. |
| **Apps/packages** | `@dial/jobs`, `packages/ai` (intake only), `/tech/*`, `technician-android`, admin trades/jobs |
| **Integrations** | Cal.com, LiteLLM/Gemini for intake drafts only |
| **Dependencies** | G1; money payout path from G2/G8 overlap OK |
| **Non-goals** | Customer-visible AI repair prices (§5.9); voice UX; Projects live labour broking |
| **Exit gate G6** | 42/42 checklists loadable; customer web books rate_card job; tech Android completes checklist+evidence; emergency path never blocked on AI; capability review current for intake. Evidence: T + P + S + A. |

**Anti-stub (G6):**

- All **42** approved checklists loadable from durable seed/DB — not a thin “1 automotive + 1 emergency” demo count.
- Customer `/tech` book + technician Android evidence queue against real jobs APIs — fixture job Maps do not exit.
- Intake AI drafts only (Zod); **no AI prices**; emergency path works with AI down.
- Desktop + mobile web book path usable; tech Android offline evidence not a stub no-op.

---

### Phase 7 — Admin / ERP modules production (Pack §9.5 / v4 §6.17 A–P)

**Intent:** Queue-first ops console is usable for Harare launch—not decorative stubs.

| Module | Must be production-intent at G7 |
| --- | --- |
| **A** Command centre | MetricContract tiles; SLA backlog; Simulated watermark; **autoPay=false** |
| **B** Catalogue & fitment | Factory + dual-entry editors + reindex controls |
| **C** Suppliers | Bonds, statements, heartbeat, SLA (from G4) |
| **D** Technicians | Vetting, credentials, Manager's choice, eligibility debugger |
| **E** Orders & delivery | Board, failover, dispatch, MapLibre, COD reconcile |
| **F** Jobs & Projects | Variations, evidence; Projects **toggle / coming soon** (C-3)—not live broking |
| **G** Pricing | Rate card versions, fee ladder, quote explorer (components persisted) |
| **H** Payments / ledger / FX | Reserve explorer, ledger browser (read-only), Daily ZiG four-eyes, escrow instruction log |
| **I** Tax & FDMS | Day open/close, outbox depth, WHT register (live submit = G8) |
| **J** Guarantee & disputes | Claims routing, returns/refunds human resolve |
| **K** HR / people | Minimum contractor register + credential clocks; Payroll-ZW may be **CERTIFIED–DORMANT** if counsel not ready—document explicitly |
| **L** Legal compliance | T&C versions, acceptance logs, consent register |
| **M** Trust & risk | Four-eyes, fraud holds, evidence gallery |
| **N** Notifications | Template registry status; Resend/Brevo adapters fail-closed or sandbox |
| **O** AI ops | Invocation browser, cost ceilings, Promptfoo gate status |
| **P** Analytics | Event taxonomy + Metabase (or equivalent) ops minutes / money views stub→live |

| | |
| --- | --- |
| **Apps/packages** | `gateway-web` `/admin/*`, domain packages, experience adapters |
| **Dependencies** | G4–G6 largely; can start after G2 for H/E |
| **Non-goals** | Unleash as SoR; Formance as ledger; Chatwoot as ticket SoR |
| **Exit gate G7** | Ops runbook walks A–P with **no “fixture-only” blockers** for launch-critical queues (orders, money, FDMS day, dispatch, Factory, disputes, legal T&Cs). Module K dormancy signed if needed. Evidence: S + checklist sign-off table in ticket. |

**Anti-stub (G7):**

- Launch-critical admin queues must mutate/read durable data (orders, money, FDMS day, dispatch, Factory, disputes, T&Cs) — pattern-only empty pages do not exit.
- Command Centre Simulated watermark + `autoPay=false` proven — decorative KPI tiles without MetricContract do not count.
- Module K / §5.16 dormancy must be **explicit founder sign-off**, not silent stub-as-done.
- Ops walkthrough on desktop + usable mobile admin where in scope.

---

### Phase 8 — Payments / webhooks / FDMS / WHT — sandbox→prod-ready

**Intent:** Money is durable, idempotent, agency-fiscalised; WHT enforced; escrow path real or explicitly blocked from customer-open.

| | |
| --- | --- |
| **Scope** | All PspAdapters: sandbox createPayment + verifyWebhook + ledger + outbox; escrow partner sandbox if ENH-020 signed else **remain blocked for open** (see §5); FDMS Virtual Gateway sandbox day close worker; agency receipt classes DIAL_FEE / GOODS_FORMAL / GOODS_INFORMAL; buyer TIN capture; WHT remittance draft→submit; IMTT never on checkout (D-60); dial-money-path-review full. |
| **Apps/packages** | `@dial/payments`, `@dial/ledger`, `@dial/tax`, `adapters/psp`, `adapters/fdms`, webhook routes, workers |
| **Integrations** | Paynow, ContiPay, EcoCash, PayPal, COD, escrow PSP, ZIMRA Gateway |
| **Dependencies** | G1–G2; human ENH-020/022 for **live** |
| **Non-goals** | Customer surcharge for IMTT; CloudESD as fiscal SoR |
| **Exit gate G8** | Sandbox end-to-end money matrix green for EcoCash, COD, Paynow; webhook duplicate no-op; FDMS day open→submit→close; WHT path on tech payout; **live** credentials either installed in prod vault **or** listed under §5 blocking customer-open. Evidence: W + T + A. |

**Anti-stub (G8):**

- Every in-scope PspAdapter: sandbox `createPayment` + **verifyWebhook** + ledger journal — stub provider refs / skip-webhook “success” cannot exit.
- FDMS day open→submit→close against Virtual Gateway sandbox (or durable outbox with credentials path) — not adapter no-ops.
- WHT on tech payout uses `withholding_balances` / ITF263 path — do not design as if 30% WHT disappears.
- Live keys absent ⇒ listed under §5 as **blocking customer-open**; never claim G8 “live-ready” on fixture mode.

---

### Phase 9 — WhatsApp Flows live

**Intent:** Official Cloud API only; Spare + grocery-food Flows; EcoCash\|COD buttons; same ERP money/fiscal outbox as web.

| | |
| --- | --- |
| **Scope** | WABA + approved templates (ENH-021); FLOW_SPARE_* + FLOW_GROCERY_* food; webhook signature+idempotency; Chatwoot handoff ids; marketing consent; utility heartbeat templates for suppliers; admin `/admin/wa` send against sandbox then live test numbers. |
| **Apps/packages** | `adapters/whatsapp`, gateway webhooks, `@dial/payments` shared checkout |
| **Integrations** | Meta Cloud API |
| **Dependencies** | G2, G8 (pay path); ENH-021 human |
| **Non-goals** | Baileys; liquor Flows; free-text-only pay |
| **Exit gate G9** | Test MSISDNs complete Spare Flow search→pay EcoCash and COD; fiscal outbox channel=`wa`; no unofficial WA deps in tree. Evidence: S + W + T. |

**Anti-stub (G9):**

- Flows run on Meta Cloud API sandbox/test WABA — not fixture message dumps or Baileys/unofficial clients.
- EcoCash\|COD via **required buttons/CTAs** (D-57); free-text-only pay path cannot exit.
- Same ERP money/fiscal outbox as web (`channel=wa`) with webhook signature + idempotency — mock Flow “paid” without ledger is not done.
- ENH-021 template IDs real or explicitly blocking live; eng cannot mark G9 live-complete without them.

---

### Phase 10 — Groceries food (liquor counsel-gated separate)

**Intent:** Dial Groceries **food/pantry** production path per `DIAL_Groceries_Liquor_Branch_Plan.md` — **no liquor**.

| | |
| --- | --- |
| **Scope** | `grocery_offers_v1` live Meili; USD browse; cold-chain slots; EcoCash\|COD; B2B informal hide; multi-stop delivery reuse G5; CPA disclosure; brand/KYC badges display-only; WA grocery Flows from G9; take-rate admin. |
| **Apps/packages** | `@dial/catalogue` grocery, `/grocery*`, delivery, admin grocery |
| **Integrations** | Same money/delivery/WA stacks |
| **Dependencies** | G5, G8; G9 for WA grocery |
| **Non-goals** | Liquor, age-gate-at-door Build, catch-weight |
| **Exit gate G10** | Sandbox food order → reserve → multi-stop or single delivery → POD; liquor SKUs absent from index/API; B2B informal leak=0. Evidence: T + S + A (money-path grocery). |

**Anti-stub (G10):**

- `grocery_offers_v1` Meili-backed browse + durable grocery order/reserve — fixture grocery Maps do not exit.
- Delivery reuses G5 Temporal rails (POD/COD) — stub “delivered” without workflow history cannot exit.
- Liquor absent from index **and** APIs (not checkout-only hide); B2B informal leak=0 on search.
- Money = `amountMinor` + sandbox webhook truth; desktop+mobile grocery UI usable.

**Liquor:** remains **counsel + founder gate** outside this phase. Do not schedule liquor under G10–G12.

---

### Phase 11 — Intelligence / Command Centre production

**Intent:** Continuous learning + ops KPIs without auto-publish or Simulated payouts (D-54).

| | |
| --- | --- |
| **Scope** | Shadow→Promptfoo→human promote for checklist/AI drafts; MetricContract registry for every CC tile; recommended actions permissioned; `autoPay=false`; Commercial Simulation offline only; cost/health kill-switch; Langfuse traces beyond stub when keys present; Flash-Lite stays P1 off critical path. |
| **Apps/packages** | `@dial/ai`, `/admin/intelligence/*`, `/admin/command-centre`, `/admin/commercial-simulation`, `/admin/cost-health` |
| **Integrations** | Promptfoo, Langfuse, LiteLLM |
| **Dependencies** | G6–G7 |
| **Non-goals** | Prime/agent host as production driver (D-61); AI payable amounts |
| **Exit gate G11** | One capability fails Promptfoo → no promote; one Actual KPI fires recommended action that **cannot** pay; Simulated path integration test forbids payout. Evidence: P + T + A (`dial-ai-capability-review`). |

**Anti-stub (G11):**

- Promote path must hit Promptfoo + human gate — “always promote in fixture” / skip-eval stubs cannot exit.
- Command Centre **Actual** vs **Simulated**: Simulated must never auto-pay (integration proof, not a comment).
- MetricContract registry backs CC tiles — ad-hoc KPI strings without contracts do not count.
- Langfuse/cost paths: keys present ⇒ real traces; else documented dormancy — not silent stub-as-done.

---

### Phase 12 — Hardening, staging dogfood, launch checklist (human open)

**Intent:** Gate 2 dogfood + Gate 3 open readiness; eng cannot self-declare customer-open.

| | |
| --- | --- |
| **Scope** | T9/Appendix A.1 IDOR+webhook AC; Semgrep/Checkov green; Strix staging when authorized (D-48); restore drill; degradation paths (§6.22); Resend+Brevo consent; retention job; incident runbooks; full §5.16 polish (photo overlays, Realtime status, Formbricks, PostHog) or explicit dormancy with founder sign-off; remote staging recon (ENH-011); store public listings prepared. |
| **Apps/packages** | All |
| **Integrations** | Full stack |
| **Dependencies** | G1–G11 |
| **Non-goals** | Declaring launch without Appendix C |
| **Exit gate G12 (eng)** | Closed dogfood cohort completes Spare + Tech + Grocery-food + WA on staging/prod-like; security checklist green; living docs current. |
| **Exit gate G12-H (human)** | Founder/ops marks **Appendix C bold items + §8.1 Gate 3** green → only then S99 / customer-open. |

**Anti-stub (G12):**

- Dogfood cohort uses sandbox or prod-like rails (Auth/Meili/PSP/WA/FDMS/Temporal) — fixture-mode “green dogfood” cannot exit eng G12.
- IDOR/webhook + Semgrep/Checkov evidence on real routes — mock-only security ACs do not satisfy.
- Eng **never** auto-marks S99 / customer-open; G12-H remains human Appendix C only.
- Any remaining §5.16 / store-listing stubs need founder dormancy sign-off — not silent “done.”

---

## 5. Human / ops blockers (engineers cannot skip)

Track in `ENHANCEMENTS.md` / ops runbooks. Eng prepares adapters; **gates stay red** without these.

| ID | Blocker | Blocks |
| --- | --- | --- |
| ENH-020 | PSP escrow partner contract (Paynow-first / licensed equivalent) | Live Job Reserve / customer-open |
| ENH-021 | Meta WABA + approved template IDs | Phase 9 live |
| ENH-022 | ZIMRA Virtual FDMS Gateway credentials | Phase 8 live fiscal |
| ENH-023 | POTRAZ / cross-border AI authorisation | AI live photo→foreign model; Appendix C |
| ENH-013 | Nominatim/OSRM/VROOM hosting | Phase 5 production maps quality |
| ENH-011 | Remote staging URL | Phase 12 dogfood convenience |
| — | Supplier net-price agreements (Gate 0) | Commercial premise |
| — | Technician contractor agreements + labour opinion (Projects toggle) | Projects live; tech launch risk |
| — | Tax opinion agency VAT/FDMS (D-2/D-58/D-59) | Appendix C |
| — | Insurance (PL + GPA) | Appendix C |
| — | Domains/trademarks dialaspare/dialatech | Appendix C |
| — | Take-rate live bps (founder) | Commercial go-live numbers |
| — | Liquor counsel | Liquor vertical only |

---

## 6. Founder decision boxes (max 5 — no grill interview)

Only decisions that unblock sequencing; locks are not reopened.

1. **Admin deploy shape:** Keep single `gateway-web` admin routes (recommended) vs fund split `admin-web` deployable before G7?  
2. **Escrow:** If ENH-020 slips, is customer-open **hard-blocked** (recommended per C-4/D-60) or is a documented weaker “authorize/capture without hold” temporary posture allowed for Tech only?  
3. **Module K Payroll-ZW:** Must ship at G7 or CERTIFIED–DORMANT until counsel?  
4. **§5.16 enhancers:** Any allowed dormancy at open (e.g. Rive optional already) beyond PostHog/Formbricks keys?  
5. **Groceries geography:** Harare-only food at G10 (recommended) vs multi-city?

---

## 7. Evidence standards (every phase)

From `dial-tracer-slice` Reality Checker habits + **§0 Anti-stub gate policy**:

- [ ] `pnpm typecheck` + `pnpm test` green for touched packages  
- [ ] UI: Playwright / `dial-webapp-recon` or native screenshots (**desktop + mobile** where web in scope)  
- [ ] Webhooks: duplicate event no-op proven  
- [ ] Money/fiscal: `dial-money-path-review` audit attached when path changes; `amountMinor` + webhook/PSP truth  
- [ ] AI: Promptfoo + `dial-ai-capability-review` when `packages/ai` changes  
- [ ] Channel matrix cells Y for in-scope channels—**no blanks**  
- [ ] Living docs (`README` / `CHANGELOG` / `ENHANCEMENTS` / `BUGS`) updated in the same landing  
- [ ] **Anti-stub:** exit evidence is sandbox or live — not fixture-only Auth/Meili/PSP/WA/FDMS/Temporal; thin vertical ≠ phase complete  
- [ ] Durable data + documented real-credentials path for integrations owned by the phase  

---

## 8. How Dev Manager / Prime should operate under this plan

1. Read this file + STATE (next phase).  
2. Open **one** phase ticket with the phase DoD copied; no PD invent.  
3. Build thin vertical → expand **in-ticket** → exit gate evidence (**anti-stub policy**) → only then advance phase number.  
4. Never set `next_stage` to S99 from eng auto-advance.  
5. Prefer Pack §9 / v4 §6.17 gaps over decorative D-46 stitch stubs.  
6. Skip liquor; skip workflow file edits unless token scope available.  
7. Cite v4 / Pack / D-log IDs in PRs.  
8. Refuse phase advance if exit evidence is fixture/mocks-only (“AC green on mocks”).

---

## 9. Relationship to other planning docs

| Doc | Role after this plan |
| --- | --- |
| `DIAL_Build_Workplan.md` | **Historical spine** + PD inventory reference |
| `DIAL_Build_Workplan_STATE.md` | Points eng next to **Phase N** here |
| `DIAL_Plan_Phase_DoD_Backlog.md` | Epic checklists fold into phase DoDs (re-open unchecked E3–E6 items as durability work) |
| `DIAL_Tracer_DoD_Completion_Matrices.md` | Re-verify Y cells on **sandbox/live**, not fixture alone |
| `DIAL_Groceries_Liquor_Branch_Plan.md` | Phase 10 food; liquor still gated |
| `DIAL_Laundry_Consolidated_Blueprint.md` (+ branch plan + grill) | **Proposed Phase 10b** (after G10 food; gate G5+G8) — Plan-only; **not** in frozen 0–12 spine until founder promotes; does not reopen Phase 1 |
| Appendix C / §8.1 | Sole customer-open authority |

---

## 10. Phase–gate quick reference

| Phase | Name | Exit gate |
| ---: | --- | --- |
| 0 | Reality baseline (this doc) | G0 landed |
| 1 | Live platform foundation | G1 sandbox Auth/DB/Meili/workers |
| 2 | Spare web E2E | G2 sandbox purchase + ledger/fiscal queue |
| 3 | Native customer store-ready | G3 internal distribution builds |
| 4 | Supplier + Factory | G4 two-supplier Meili publish |
| 5 | Delivery + maps | G5 Temporal + courier POD |
| 6 | Tech / jobs | G6 checklists 42 + book + evidence |
| 7 | Admin A–P | G7 ops walkthrough |
| 8 | Payments/FDMS/WHT | G8 sandbox money matrix (+ live keys or Appendix block) |
| 9 | WhatsApp live | G9 Flow pay on test MSISDN |
| 10 | Groceries food | G10 food order E2E |
| 11 | Intelligence / CC | G11 no auto-promote / no Simulated pay |
| 12 | Hardening + dogfood | G12 eng + **G12-H human Appendix C** |

**Counts:** **13 phases (0–12)** · **13 eng exit gates (G0–G12)** · **1 human open gate (G12-H / S99)** · **≈90 leaf DoD lines** across phase checklists (finite; not a micro-stage mill).

---

*End of DIAL Full ERP Completion Plan.*
