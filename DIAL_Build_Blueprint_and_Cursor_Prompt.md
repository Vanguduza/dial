# DIAL Build Blueprint & Cursor Development Prompt — v1.0

**Companion to `DIAL_Consolidated_Plan_v4.md`. Read that document first — this one does not repeat its compliance, legal or founder-decision detail; it extends it with build-ready material and closes with a single prompt you can hand to Cursor.** Cursor engineering hygiene (**D-47**): `AGENTS.md`, `.cursor/rules/`, `DIAL_Cursor_Rules_and_Skills.md`. Rationale companion: `DIAL_Lazy_Developer_Playbook_Adaptations.md`. Security toolchain (**D-48**): `DIAL_Security_Toolchain.md`. Platform extensions (**D-53** / Intelligence Factory + Command Centre **D-54**): `DIAL_v7_2_Adopted_Platform_Extensions.md` (v7-2 absorb; not a second plan SoR). External skills utilization (**D-55**): `DIAL_External_Skills_Repos_Utilization.md` (locked adopted).

Everything below is additive to v4. Where this document disagrees with a `[FOUNDER]`-tagged decision in v4, v4 wins — nothing here overrides a founder decision; it fills gaps v4 left open (concrete checklists, concrete rate cards, a self-learning spec, and researched OSS repos with licences actually checked, not guessed).

Methodology note, inherited from v4 §5.13: every tool and repo below was checked for its **actual licence file**, not a blog post's claim about it. Two licence traps were found in this research round alone (iFixit's true terms, and the ban risk of unofficial WhatsApp libraries) — see §3 and §7.

---

## 1. How the DIAL business is set up — a consolidated description

**One sentence.** DIAL is a Zimbabwean, multi-trade "certainty" business: it sells confidence that a customer will get the right part, at an honest price, from a vetted person, and that if something goes wrong DIAL — not the customer — absorbs it (v4 §1.1).

**The five customer-facing products, one login.**

| Product | What it is | Money model |
| --- | --- | --- |
| **Dial a Spare** (`dialaspare.co.zw`) | Direct multi-supplier parts storefront, Meilisearch-powered, chassis-code fitment | Margin on supplier net cost + delivery + payment cost (v4 §3.2, §4.1) |
| **Dial a Tech** (`dialatech.co.zw`) | Multi-trade service marketplace (mechanics, electricians, plumbers, cleaners, hairdressers, etc.) via a calming guide bot | Commission on completed jobs + booking/protection fee (v4 §3.1, §4.4) |
| **Dial Fleet** | Multi-vehicle dashboard for fleet operators — the acquisition beachhead, not a Phase-2 nicety | Monthly membership per vehicle (v4 §2A-7, §4.4) |
| **Vehicle Hub** | Digital garage / service history / expiry reminders, OCR-populated | Retention flywheel, not a separate revenue line (v4 §2A-8) |
| **Dial Care** | Insurance distribution (roadside, towing) via the IPEC microinsurance **aggregator** route | Distribution fee, disclosed underwriter (v4 §7.7) |
| **Projects** | Construction-style multi-trade jobs with PM, budgets, milestones | Designed into the ERP now; client-visible only behind an admin toggle once labour-law review (D-14) clears (v4 §3.9) |

**Entry is authentication-first, not a public storefront wall.** The main gateway's landing screen is a sign-in screen (create-account link at the bottom); only after authentication does a customer see the **Shop | Services** split into the two sub-domains above (v4 §1.4, §6.2). This is a deliberate, founder-locked reversal of the more common "browse first, sign in at checkout" pattern, and it should not be second-guessed during the build — see §2 for why it is nonetheless worth one specific mitigation.

**Money never comes from a model.** A deterministic pricing engine (v4 §4.1) computes every customer-facing amount from rate cards, supplier costs, delivery bands and taxes; AI (through the D-61 provider-configurable `packages/ai`/Hermes fabric) may **draft** a quote for ops to approve, or classify/triage a job, but it can never itself become a payable amount. Customer money sits in a **Job Reserve** — a ledger entry in DIAL's books, backed by funds actually held by a licensed **payment-service-provider escrow partner**, not DIAL's own bank account (v4 §2B-3, §4.2, §7.3). This single design choice is what keeps DIAL out of an unlicensed-deposit-taking problem under the National Payment Systems Act.

**The catalogue is DIAL's actual moat, and it is deliberately not built on scraped OEM data.** Fitment is keyed on **chassis code** (`KUN26`, `ZRE152`, …) rather than make/model/year, because 92% of the Zimbabwean parc is grey-import Japanese-domestic-market stock that Western VIN-based catalogues do not decode. Fitment is stored as an **evidence-weighted claim** (source + confidence + corroboration count), not a boolean, and every delivered, unreturned order is itself a fitment confirmation (v4 §3.2). This is the single most defensible technical decision in the whole plan, and the research in §3/§7 of this document independently confirms there is no shortcut around it — every free or cheap JDM-chassis data source found is a proprietary web service scraping government registries, not an open, redistributable dataset.

**The AI layer is one governed DIAL fabric, not one hardcoded model.** `packages/ai` remains the typed model-capability layer. **D-61 supersedes the old Gemini-only restriction:** the persistent business-agent layer is Hermes behind a deterministic DIAL Hermes Supervisor, with a provider-configurable bridge for approved API-key and subscription-backed paths. Around it remain deterministic "organs" for policy/privacy, OCR/vision, deterministic part matching, RAG/context, schemas and evaluation. The canonical flow is Gateway → identity/purpose → Privacy Context Compiler/Egress Firewall → Supervisor → Hermes/approved provider → typed H0–H4 DIAL tools → authoritative ERP services → Zod/evidence/Langfuse/Promptfoo. Models never become money/catalogue/order/job/identity/health truth. Every invocation, tool action, approval and correction is auditable. See master §6.24.

**The compliance backbone is not a footnote — it decides the data model.** Four facts drive large parts of the build: VAT/fiscalisation via ZIMRA's FDMS is mandatory from the first invoice (v4 §7.1); withholding tax on payouts is **30%**, not the commonly assumed 10%, triggering at US$1,000/payee/year (v4 §7.2); holding customer money directly is high-legal-risk, hence the PSP-escrow Job Reserve (v4 §7.3); and sending any customer photo or voice note to a foreign AI model is a cross-border personal-data transfer requiring POTRAZ notification, authorisation and **express, separate consent** (v4 §5.7, §7.6). All of this is why `packages/tax`, `packages/legal` and the privacy layer of `packages/ai` are first-class packages, not afterthoughts, in v4 §6.12.

**Trades are multi-trade from day one**, with automotive as the operational emphasis (catalogue depth, chassis-code table, fleet anchors) but electricians, plumbers, cleaners, hairdressers and other artisans onboarding, vetting and booking from launch (v4 C-2). Vetting is trade-specific and legally aware — the Trade Test (Class 1–4), ZERA licensing for solar, and National Ozone Office certification for refrigerant handling are all first-class credential fields with expiry monitoring, because dispatching an unlicensed person in a regulated trade is a materially worse story than not listing them at all (v4 §2A-6, §7.9).

**Distribution is native Android + native iOS + web + WhatsApp for customers, native Android (Kotlin/Compose) for technicians, web for suppliers and admin** (v4 C-5, §6.2) — a deliberately expensive decision (dual native customer apps) that the founder has explicitly accepted the cost of (D-17). §2 of this document proposes one concrete way to bring that cost down without reopening the decision.

---

## 2. Areas of improvement beyond v4

v4 is already unusually self-critical — most of the "obvious" gaps (financial model, tax, licensing, fraud vectors) are already closed. What follows are gaps that survived that review, found by cross-checking the plan against what open-source tooling and 2026 platform research actually offer.

| # | Gap in v4 | Why it matters | Recommended fix | Effort |
| --- | --- | --- | --- | --- |
| **I-1** | Dual native apps (C-5/D-17) accepted at full cost, with no mitigation offered | Building and maintaining two fully separate native codebases (Kotlin + Swift) roughly doubles UI engineering for every customer screen, forever | Adopt **Kotlin Multiplatform (KMP)** for the *shared, non-UI* layer only — networking, offline sync/cache, domain models, validation, the AI-capability client, pricing-display formatting. Keep **native SwiftUI on iOS and native Jetpack Compose on Android** for UI (do **not** adopt Compose Multiplatform for the customer-facing UI itself — v4's dual-native decision was about UI fidelity, and KMP-shared-logic does not touch that). This is exactly the adoption pattern JetBrains and Google recommend as the safe default, and it is already proven at scale (Netflix, Cash App, McDonald's) without touching UI. See §3. | Medium — one new `packages/mobile-shared` KMP module; does not reopen C-5 |
| **I-2** | Delivery/dispatch distance and ETA calculations are left as "the maps distance matrix" (v4 §4.1, §6.11) with no cost or FX plan | v4 §7.4 found foreign metered SaaS is potentially capped at 3% of revenue under exchange control, and every Google/Mapbox distance-matrix call is metered, foreign-billed, and subject to the 15.5% digital-services withholding tax (v4 §2B-5) | Self-host **Nominatim** (geocoding/reverse-geocoding) + **OSRM** (drive-time/distance) + **VROOM** (technician/courier route and job assignment optimisation) as a **Tier 2 sibling** in the same South African region as the Tier 0/1 CPU box (v4 §5.12). Zimbabwe OSM coverage is good in Harare/Bulawayo road networks (confirmed via Geofabrik's current extract) though thinner in rural areas — acceptable given v4 §2B-19 already treats addressing as pin+landmark, not turn-by-turn. Keep a paid map-tile provider only for the **visual map tile layer** customers see (small, cacheable, not per-distance-calculation billed) | Medium — new `infra/nominatim`, `infra/osrm`, `infra/vroom`; removes a recurring forex-exposed cost line entirely for the routine case |
| **I-3** | The AI checklist library (v4 §5.16 enhancer #1) is specified as "AI draft → schema lint → human approve → publish" but has no mechanism to **keep improving after publish** | Publishing a checklist is not the end of the flywheel v4 §5.8 promises — a checklist that is never revised from field outcomes is a static FAQ, not a self-learning system, and this is explicitly what the user of this document asked for | Build the checklist-specific promotion/demotion pipeline specified in §6 below: every checklist step carries an outcome-linked confidence score, degrades or is proposed for revision when technician outcomes disagree with it often enough, and every revision goes through the same AI-draft → lint → human-approve gate the original did | Medium-High — new package `packages/checklists` with its own state machine, feeding the same eval infra already chosen (Promptfoo, Langfuse) |
| **I-4** | v4 never evaluated any existing open-source commerce/marketplace engine before deciding to hand-build the whole storefront and marketplace domain | Two mature, permissively-licensed, **stack-matching** (Node/TypeScript/Postgres) open-source marketplace engines exist and were never checked against the plan; even if DIAL does not adopt either as a dependency (which v4's own doctrine in §6.11 would forbid for money/fulfilment SoR), *mining their schemas* for the vendor/commission/payout/order-splitting domain is materially faster than designing from a blank page | Treat **Medusa v2 + the Mercur marketplace layer** (both MIT, TypeScript, Postgres, Redis — see §3) as a **read-only pattern reference**, exactly as v4 §6.11 already permits for GPL/AGPL "Tier 2" tools, except this one is MIT so there is no licence friction at all. Study `Seller`, `Commission`, `Offer`, `Payout` module shapes before writing `packages/suppliers`, `packages/pricing`, `packages/ledger` | Low — a research/design-review task before Build Sequence step 2 (v4 §6.23) |
| **I-5** | The auth-first landing screen (v4 §1.4, D-27) is a strong trust/positioning decision but has an unaddressed first-run cold-start cost: a customer with **zero prior relationship with DIAL** has nothing to sign in *to* | v4 already handles the returning-customer case (optional session restore, welcome-back) but the *first ever* visitor still hits a sign-in wall with only a small "create account" link — for a market where trust has to be earned before a phone number is handed over, this may suppress top-of-funnel exploration DIAL needs during Gate 0/Gate 2 dogfooding | Not a reversal of C-5/D-27 — add a **read-only, unauthenticated "browse the catalogue" deep link** reachable only from paid acquisition channels (WhatsApp business catalog links, print/flyer QR codes, fleet-sales collateral) that lands on a **single Spare product or category page**, always with a persistent "sign in to buy" action, and never on a general anonymous Shop\|Services home. This preserves the founder's auth-first architecture for the *app* while not making every marketing link dead-end at a sign-in wall | Low — one additional route, not a new surface |
| **I-6** | Technician badge tiers exist (probationary → verified → preferred, for **suppliers**, v4 §3.3) but no equivalent, explicit commission-tier ladder is specified for **technicians** the way it is for suppliers | §4.4 says commission should rise "in 1–2 point increments against measured value" but does not name the tiers a technician can see and aim for, which is a motivational and retention gap given the stickiness stack in §2A-5 is otherwise very concrete | Mirror the supplier ladder for technicians explicitly — see the badge/commission table in §5 below | Low — a policy table, not new engineering |
| **I-7** | No explicit versioning/rollback story for the **checklist content itself**, only for AI model prompts (v4 §5.9's eval gates cover *capabilities*, not *content*) | A bad checklist edit (wrong safe-self-help step, wrong escalation trigger) is a safety issue, not just a quality regression, and deserves the same rollback discipline as a database migration (v4 §6.7) | Checklists are versioned, signed-off content with a required rollback path — specified in §6 | Low-Medium — process + one `checklist_versions` table |
| **I-8** | ~~v4 never named storefront UI repos~~ — **closed by v4 D-38 / §6.2.1** | — | Locked: Mercur B2C (Spare); **FixItNow primary** (+ NearServe/Homezy) for Tech; CoolMallKotlin + tunacosgun/eCommerce for native shopping; Mercur vendor-panel; Style Dictionary + Rive + shadcn | Done — follow v4 |
| **I-9** | Because the mandate is fully native, independently-coded apps per platform (no Compose Multiplatform UI, §3.2), v4 has **no mechanism at all** to keep Android, iOS and web looking/feeling like one product once three separate teams build them | "Fluid modern design" on each platform individually is achievable per-platform, but without a shared source of truth the three apps will visibly diverge over time — different spacing, different motion timing, different brand feel, defeating the founder's own "one finished product" launch bar (v4 §1.3 #10) | A **design-tokens pipeline** (`packages/design-tokens`, Style Dictionary, Apache-2.0) compiling one JSON source to Tailwind vars / Swift constants / Compose values, plus standardising on **Rive's own official per-platform runtimes** so the same `.riv` motion asset renders identically everywhere — see §3.8 | Medium — one new package plus a build-step per app, but pays for itself immediately in avoided visual drift |

---

## 3. Alternate & complementary tools — researched, with licences checked

Every entry below states **licence (verified against the project's own LICENSE file or licence page, not a summary blog)**, and a **fit tier** using v4's own doctrine from §6.11 (Tier 1 = in-repo code/pattern, Tier 2 = self-hosted sibling, Tier 3 = external API, **Reference-only** = study the design, never run or import it into the proprietary core).

### 3.1 Commerce / marketplace engine layer

| Tool | Licence (verified) | Stack fit | Fit tier | Verdict |
| --- | --- | --- | --- | --- |
| **Medusa v2** | MIT | Node.js/TypeScript, PostgreSQL — exact match | **Reference-only** | Do not adopt as a dependency (v4 already chose a bespoke Meilisearch + custom storefront path, and re-platforming now would contradict the single-polished-launch principle in §8.1). Its module boundary pattern (products/orders/payments/fulfilment as swappable modules linked by explicit "links") is a genuinely good architectural analogue for `packages/orders`, `packages/pricing`, `packages/delivery` — read the module source before designing those packages |
| **Mercur** (marketplace layer on Medusa) | MIT | Same stack as above, plus Redis, React, TanStack Query, Zod | **Reference-only** | This is the closest thing in the OSS world to DIAL's `Offer`/`Supplier`/commission/payout domain (v4 §6.8 `Offer` type, §6.1 Supplier service). Its `Seller`, `Commission`, `Offer`, `Payout` module split is worth mining line-by-line before building `packages/suppliers` and `packages/ledger`. MIT licence means there is no legal reason not to literally copy small illustrative snippets with attribution if useful — but v4's Tier-1 doctrine still means DIAL owns and runs its own code, not Mercur's runtime |
| **Vendure v3** | GPLv3 (core); commercial licence for enterprise features | NestJS/GraphQL/TypeORM | **Reference-only, GPL caveat applies** | Strong B2B/multi-vendor plugin architecture, but GPLv3 means v4 §6.11 rule 3 applies: study the plugin pattern, do not copy code into DIAL's proprietary core without counsel sign-off. Lower priority than Medusa/Mercur given the stack (GraphQL-first, TypeORM) diverges more from v4's Postgres-direct, REST/RPC-leaning approach |
| **Saleor** | BSD-3-Clause (core) | Python/Django/GraphQL | **Not recommended even as reference** | Wrong language entirely for a TypeScript monorepo (v4 §6.12); its multi-channel/multi-warehouse patterns are good but not worth the context-switch cost for a two-to-four-engineer team |

### 3.2 Mobile — architecture references and the KMP proposal (I-1)

| Tool | Licence | Fit tier | Verdict |
| --- | --- | --- | --- |
| **Now in Android** (`android/nowinandroid`, Google's official sample) | Apache-2.0 | **Tier 1 (in-repo pattern) / directly reusable** | This is the canonical, Google-maintained reference for exactly the stack v4 already chose for the technician app (Kotlin, Jetpack Compose, offline-first data layer, WorkManager sync, unidirectional Flow-based state). Use its module structure (`core-data`, `core-database`, `core-network`, `feature-*`) as the literal starting skeleton for `apps/technician-android`. Apache-2.0 permits direct reuse of code, not just patterns |
| **Kotlin Multiplatform (KMP)** | Apache-2.0 (Kotlin itself) | **Tier 1 — recommended new package** | See I-1. Stable since Nov 2023; Google officially documents it as the sharing mechanism for business logic (not UI) between Android and iOS. Use for `packages/mobile-shared`: API client types, offline cache/sync logic, Zod-equivalent validation mirrors, pricing/quote display formatting, `AiInvocation`-aware client helpers. Ship native SwiftUI and native Compose UI on top, unchanged from v4's C-5 decision |
| **Compose Multiplatform (CMP) for iOS** | Apache-2.0 | **Explicitly not recommended for customer-facing screens** | Stable since v1.8.0 (May 2025) and used by real production apps, but v4's C-5 decision was specifically about **native UI fidelity** on iOS; adopting CMP for customer screens would quietly re-litigate that decision through the back door. Confine any CMP experimentation, if ever wanted, to **internal admin/ops tooling only**, never customer surfaces |
| Fleetbase Storefront, Ever Demand, ServeNow, HandyGo, "Thumbtack clone" white-labels | Mixed — several are AGPL-3.0-derived or partially proprietary demo repos with source sold separately; verify per-repo before any use | **Reference-only, verify licence per repo before even reading source into context if AGPL is a concern** | None of these match v4's stack (Ionic/Flutter/Firebase/MongoDB vs Kotlin+Compose+Swift+Postgres+Supabase) closely enough to justify licence risk. Their *product* pattern — separate customer/provider/admin apps, booking → dispatch → payout flow — validates that v4's own service-marketplace shape (§3.1, §6.1) is the industry-normal shape, which is a useful sanity check, not a code source |

### 3.3 Dispatch, routing and geocoding (I-2)

| Tool | Licence | Fit tier | Verdict |
| --- | --- | --- | --- |
| **Nominatim** | GPLv2 (server) | **Tier 2 (self-hosted sibling)** | Geocoding/reverse-geocoding from OpenStreetMap data. Self-host in the same South African region as the Tier 0/1 CPU box (v4 §5.12). GPLv2 on the *server* is fine under v4's own Tier-2 rule (self-hosted, not linked into the proprietary core) |
| **OSRM** | BSD-2-Clause | **Tier 2 (self-hosted sibling)** | Drive-time/distance for delivery bands and technician ETA. Permissive licence, no caveat needed |
| **VROOM** | BSD-2-Clause | **Tier 2 (self-hosted sibling), new capability not in v4** | Solves the actual vehicle-routing/job-assignment problem (which technician/courier takes which job, in what order) in milliseconds, using OSRM under the hood for real road-network times. This is materially better than the "distance band from the maps distance matrix" v4 currently specifies (§4.1) for anything beyond simple call-out fee bands — worth adding once technician density in a zone is high enough to matter (post-launch optimisation, not a Gate-1 blocker) |
| Google Maps / Mapbox distance matrix | Proprietary, metered | **Tier 3 (external API), narrowed scope** | Keep only as **optional visual fallback** if self-hosted OSM has a rural gap. **Do not** use as default for delivery-band, dispatch-ETA, or courier in-app map SoR — **D-44 locks MapLibre + OSRM/VROOM** (see `DIAL_Deep_Engineering_and_OSS_Stitch.md`) |
| **MapLibre Native Android** + **maplibre-compose** | BSD-2-Clause / BSD-3-Clause | **Tier 1 (library) — D-44 primary courier maps** | In-app map for `delivery-android` (and optional customer track). Offline ZW packs from Geofabrik → MBTiles/PMTiles |
| **foodhub-compose** (`furqanullah717/foodhub-compose`) | Apache-2.0 | **Tier 2 pattern — D-44 primary delivery UX donor** | Rider flavour screens only; strip Google Maps → MapLibre; strip Stripe/Firebase money |

### 3.4 Catalogue / fitment data — confirms, does not change, v4's approach

| Source | Nature | Verdict |
| --- | --- | --- |
| **SandPIM** (`autopartsource/sandpim`) | MIT, LAMP/PHP | **Reference-only.** A working open-source implementation of the ACES/PIES data model (fitment by make-model-year *and* chassis code, PAdb/Qdb attribute and qualifier support). Wrong stack for direct reuse (PHP vs v4's TS monorepo), but its table design is a genuinely useful cross-check for the `FitmentClaim`/`vehicle_master`/`catalog_*` schema in v4 §3.2 before finalising migrations |
| JP Sheet, jdmvin.com, S-Chassis Archive and similar JDM-chassis lookup sites | Proprietary web services (some AI-inferred, none redistributable); S-Chassis Archive's *data* is CC0 but scoped only to one Nissan chassis family | **Confirms v4's conclusion, does not change it.** No open, licensable, comprehensive JDM chassis-fitment dataset exists. This independently validates v4 §2B-16/§3.2/§7.9's decision to build the chassis-code table and confirmed-fitment ledger as a proprietary, hand-built asset rather than searching further for a shortcut that does not exist |

### 3.5 ERP domain-pattern references (garage/workshop, fleet, HR)

| Tool | Licence | Fit tier | Verdict |
| --- | --- | --- | --- |
| Odoo "Garage Workshop Management" module | LGPL-3 | **Reference-only** | Its repair-order state machine (repair request → diagnosis → technician assignment → quotation → workorder → invoice) is close to v4's own Job state machine (§6.15) and worth a side-by-side read before finalising `packages/jobs`. LGPL-3 is more permissive than AGPL but v4's hard ban (§6.11 rule 1) on routing DIAL's SoR through another ERP still applies — read, do not run |
| Odoo "Fleet Repair Management" module | Proprietary (paid Odoo Apps Store listing) | **Not usable** | Paid/closed source; the *feature description* (role-based technician/head-technician/manager workflow) is a useful UX cross-check only, nothing to license |
| ERPNext / Frappe | GPLv3 | **Reference-only** | Same doctrine as Odoo. Its HR/payroll module structure is a reasonable sanity check for `packages/hr` and `packages/payroll-zw`, but Zimbabwe-specific PAYE/NSSA/ZIMDEF rules must be authored in-repo regardless (v4 already specifies this correctly in §6.17K) |

### 3.6 Messaging — confirms v4's existing choice, flags a trap

| Tool | Licence | Verdict |
| --- | --- | --- |
| **WhatsApp Business Cloud API** (official, Meta) | Proprietary, metered per template | **Already the correct v4 choice (Tier 3) — keep it.** No change recommended |
| **Baileys**, **whatsapp-web.js**, and gateways built on them (OpenWA, felipeDS91/whatsapp-api) | MIT (the libraries themselves) | **Rejected for any customer-facing or production path.** These are unofficial, reverse-engineered clients. Even with a permissive licence, using them risks the WhatsApp number itself being banned — a business-ending failure mode for a company whose primary conversational channel *is* WhatsApp. Meta actively fingerprints and has taken down these projects before (the April 2023 Baileys takedown). If ever used at all, confine strictly to an internal, non-production sandbox for engineers testing message templates against a throwaway number — never dialatech's or dialaspare's real WhatsApp Business number |

### 3.7 Troubleshooting-content sources — the licence trap for §4/§6 of this document

| Source | Actual licence (verified against iFixit's own Licensing and Terms of Use pages, not a summary article) | Verdict |
| --- | --- | --- |
| **iFixit repair guides / API** | **CC BY-NC-SA 3.0.** Non-commercial only. Explicitly forbids using the content to train an AI/ML model without a separate paid licence. A secondary blog claiming iFixit is "now free for remixing under CC BY-SA 4.0" **could not be corroborated on iFixit's own site and should be treated as unverified/likely wrong** — exactly the kind of secondary-source error v4 §5.13 warns about | **Do not use as a content source, and do not feed it to Gemini as few-shot material either — that is training-adjacent use under a licence that explicitly forbids it.** DIAL must author its own checklists from scratch, which is in fact already v4's plan (§5.16 #1: "AI draft → schema lint → human approve → publish"). iFixit is useful only as an *inspiration for structure* (step-by-step, tools-needed framing), never as copied or paraphrased content, and never as a training corpus |

### 3.8 Storefront / marketplace UI repos (the actual UX), plus design infrastructure

**Locked in `DIAL_Consolidated_Plan_v4.md` as founder decision D-38 / §6.2.1 / §6.10.** Scaffolding contracts (env, Meili schema, screens, adapters) live in **`DIAL_Development_Agent_Pack.md` (D-39 / Part 9)** — agents must use that pack and must not repeat base research. This blueprint section remains UX-donor detail; where anything below disagrees with v4 §6.2.1, **v4 wins**.

**Correction of earlier framing:** naming shadcn/ui, Magic UI, Pow, Style Dictionary and Compose samples answers "what do we build *with*?" — it does **not** answer "what storefront/marketplace UX do we start from?". DIAL needs full shopping and booking flows (product grids, multi-vendor catalog, cart, checkout, technician discovery, booking, job tracking). Those live in **storefront and services-marketplace repos**, not in component libraries. This section separates the two layers. FixItNow is the **locked primary** Dial a Tech web UX donor.

#### 3.8.1 Primary storefront & services UX repos (feature-bearing, UI-focused)

These are the repos to open, click through demos of, and pattern/fork screen flows from. Backend engines stay reference-only where v4 already said so (§3.1); the **customer-facing UI** is what we adopt as the visual and flow baseline.

| DIAL surface | Repo (primary UX reference) | Live demo / look | What you actually get | Licence | Fit notes |
| --- | --- | --- | --- | --- | --- |
| **Dial a Spare (web storefront)** | [`mercurjs/b2c-marketplace-storefront`](https://github.com/mercurjs/b2c-marketplace-storefront) | [b2c.mercurjs.com](https://b2c.mercurjs.com) | Multi-vendor browse, seller storefronts, cart across vendors, checkout, marketplace shopping UX on Next.js | MIT | **Best product-shape match for Spare** — multi-supplier catalog, not single-brand DTC. Pattern the UI; keep DIAL's own pricing/fitment/ZIMRA rules in ERP, do not swallow Mercur's backend as the money engine |
| **Spare secondary — premium single-brand polish** | [`mirumee/nimara-ecommerce`](https://github.com/mirumee/nimara-ecommerce) | [demo.nimara.store](https://demo.nimara.store) | Modern headless storefront (Next.js + **shadcn/ui**), cart/checkout/account, marketplace-ready hooks | BSD-3-Clause | Stronger *visual* polish than most Medusa starters; use as the "how modern should Spare feel?" bar, not as the multi-vendor source of truth |
| **Spare secondary — official Medusa DTC storefront** | [`medusajs/dtc-starter`](https://github.com/medusajs/dtc-starter) (storefront app) | Local via starter; older demo lineage [next.medusajs.com](https://next.medusajs.com) | Product list/detail, collections, cart, Stripe checkout, accounts, orders | MIT | Official Medusa path; single-seller DTC — use for PDP/cart/checkout screen patterns once Mercur gives multi-vendor shape |
| **Spare secondary — simpler multi-vendor template** | [`GreatStackDev/gocart`](https://github.com/GreatStackDev/gocart) | [gocart-gs.vercel.app](https://gocart-gs.vercel.app) | Customer storefront + vendor dashboard + admin commissions, Next.js + Tailwind | MIT | Lightweight multi-vendor UI if Mercur feels heavy; less production-hardened |
| **Dial a Tech (web services UX)** | [`AyanSujon/FixItNow`](https://github.com/AyanSujon/FixItNow) (**locked primary**, v4 D-38) | [fixitnow-client.vercel.app](https://fixitnow-client.vercel.app) | On-demand home-services: discover, book slots, pay, rate; technician + admin surfaces | Check repo LICENSE before Gate 1 | **Primary Dial a Tech UX** — founder-locked |
| **Tech secondary** | [`Pranit-DC/nearserve`](https://github.com/Pranit-DC/nearserve) | See repo README (Next.js + Framer Motion) | Local services marketplace: skill search, location discovery, book worker, ratings | Check repo LICENSE before Gate 1 | Local-trades discovery companion to FixItNow |
| **Tech secondary** | [`PrashantJaybhaye/homezy`](https://github.com/PrashantJaybhaye/homezy) | See repo | Clean home-service browse + calendar booking UI (Radix + Tailwind) | Check repo LICENSE | Good "calm professional services" visual reference for Tech's guide-bot landing |
| **Android Spare (Compose storefront)** | [`Dukkan-ITI/Dukkan`](https://github.com/Dukkan-ITI/Dukkan) | Repo screenshots / APK docs | Full Compose shopping app: catalog, search, cart, checkout, wishlist, maps address, offline cache | Check repo LICENSE | Real storefront screens, not an architecture sample — use as Android Spare UI reference alongside Now in Android for structure |
| **Android Spare secondary** | [`SilentFURY-x/ShopAThing-App`](https://github.com/SilentFURY-x/ShopAThing-App) | APK in releases | Compose + Material 3 shopping UX, paging, offline cart, Lottie/shimmer | Check repo LICENSE | Stronger "fluid list/search" feel |
| **iOS Spare (SwiftUI storefront)** | [`tunacosgun/eCommerce`](https://github.com/tunacosgun/eCommerce) | Repo preview assets | Full SwiftUI shopping: brands, PDP, favorites, Stripe checkout, orders | MIT | Best researched full-flow native iOS storefront; pattern screens into DIAL's native iOS app |
| **iOS Spare secondary (fluid brand feel)** | [`petemcgowan/Organico`](https://github.com/petemcgowan/Organico) | App Store listing linked from repo | Modern SwiftUI commerce with mesh gradients / offline cart — UX polish reference | Check repo LICENSE | Use for motion/brand feel, not as the multi-vendor source |

**Hard rule:** none of these replace DIAL's ERP, Meilisearch fitment search, Job Reserve, or ZIMRA flows. They are **UI/UX and screen-flow donors**. The Cursor prompt must wire their patterns onto DIAL APIs, not adopt their backends as the ledger.

#### 3.8.2 Design infrastructure (still required — but not the storefront)

| Layer | Toolkit | Licence | Role |
| --- | --- | --- | --- |
| Cross-platform consistency | **Style Dictionary** → `packages/design-tokens` | Apache-2.0 | One token source → Tailwind / Swift / Compose so Spare & Tech feel like one brand on every OS |
| Shared branded motion | **Rive** runtimes (`rive-android`, `rive-ios`, `rive-react`) | MIT | Same `.riv` greeting/host asset everywhere (v4 §1.4) |
| Web component primitives | **shadcn/ui** | MIT | Building blocks *inside* the storefronts above (Nimara already uses this) |
| Web marketing motion | **Magic UI** | MIT | Gateway welcome-back / landing flourishes only — not a substitute for a storefront |
| Android architecture | **Now in Android** + **compose-samples** (Jetsnack/Reply/Jetcaster) | Apache-2.0 | Module structure + Material 3 Expressive polish *around* Dukkan-style storefront screens |
| iOS micro-interactions | **Pow** | MIT | One-line polish on top of the SwiftUI storefront patterns |

**How it fits:** Mercur B2C + **FixItNow** (primary Tech) define *what the customer sees and does*; NearServe/Homezy are secondary Tech references; Style Dictionary + Rive keep brand/motion consistent; shadcn/Magic/Pow/Compose samples are the toolkit used while rebuilding those flows on DIAL's APIs.

#### 3.8.3 Expanded storefront catalog (additional researched repos)

Same rule as §3.8.1: **UI/UX donors only** — pattern screens onto DIAL APIs; do not adopt foreign backends as the ledger. Prefer MIT/Apache/BSD; note licence caveats before Gate 1.

| Category | Repo | Demo / look | Why it matters for DIAL |
| --- | --- | --- | --- |
| Spare — supplier/vendor panel | [`mercurjs/vendor-panel`](https://github.com/mercurjs/vendor-panel) | [vendor panel demo via Mercur site](https://mercurjs.com/) | Closest open UX for Dial a Spare **supplier** dashboard (catalog, orders, payouts) |
| Spare — modern DTC storefront | [`spree/storefront`](https://github.com/spree/storefront) | Spree docs / local starter | Next.js 16 + Tailwind 4 one-page checkout, multi-region — strong PDP/cart polish |
| Spare — Saleor “Paper” storefront | [`saleor/storefront`](https://github.com/saleor/storefront) | [storefront.saleor.io](https://storefront.saleor.io/) | Minimal modern catalog/cart/checkout; **licence caveat: FSL-1.1 → Apache after 2 years** — treat as visual reference unless counsel clears FSL |
| Spare — AI-native Next store | [`yournextstore/yournextstore`](https://github.com/yournextstore/yournextstore) | [demo.yournextstore.com](https://demo.yournextstore.com) | Highly polished shadcn storefront + AGENTS.md (Cursor-friendly); Stripe-native DTC |
| Spare — Relivator starter | [`reliverse/relivator`](https://github.com/reliverse/relivator) / [`blefnk/relivator`](https://github.com/blefnk/relivator) | [relivator.com](https://relivator.com) | Next.js + shadcn + anime.js ecommerce baseline |
| Spare — Bagisto Next storefront | [`bagisto/nextjs-commerce`](https://github.com/bagisto/nextjs-commerce) | via Bagisto headless | Full headless storefront patterns; PHP backend stays out of DIAL stack |
| Spare — Bagisto Flutter shop | [`bagisto/opensource-ecommerce-mobile-app`](https://github.com/bagisto/opensource-ecommerce-mobile-app) | repo / Flutter run | Mobile commerce flows (browse/cart/orders) — pattern only; DIAL customer apps stay native Compose/SwiftUI |
| Spare — Compose mall (stronger star count) | [`Joker-x-dev/CoolMallKotlin`](https://github.com/Joker-x-dev/CoolMallKotlin) | repo docs | MIT Compose ecommerce (auth, catalog, cart, orders, coupons) — solid Android Spare alternative to Dukkan |
| Spare — KMP shopping sample | [`razaghimahdi/Shopping-By-KMP`](https://github.com/razaghimahdi/Shopping-By-KMP) | repo | Full shopping flows shared across platforms — **UI ideas only**; DIAL still forbids Compose Multiplatform for customer UI |
| Spare — auto parts PIM (not storefront) | [`autopartsource/sandpim`](https://github.com/autopartsource/sandpim) | n/a (admin PIM) | ACES/PIES fitment catalog tooling — complements Spare search, not a customer UI |
| Tech — local trades marketplace | [`Asad-Saeed/Boots-Ladders`](https://github.com/Asad-Saeed/Boots-Ladders) | repo | Seller verification, booking, messaging, AI discovery — close to Dial a Tech ops |
| Tech — contractor matching | [`vyomfadia/contract-me`](https://github.com/vyomfadia/contract-me) | repo | Photo issue → AI estimate → contractor match/schedule — checklist+dispatch UX ideas |
| Tech — handwerker landing UX | [`arikissel/fix-it`](https://github.com/arikissel/fix-it) | local / landing | PLZ + trade search landing for electricians/plumbers — calm Tech marketing reference (pre-booking) |
| Tech — on-demand multi-app (RN) | [`enatega/food-delivery-multivendor`](https://github.com/enatega/food-delivery-multivendor) | Enatega product page | Customer + vendor + rider apps UX patterns for dispatch; **backend is proprietary** — UI only |
| Dispatch / maps UX | [`YoussefSalem582/delivery_app`](https://github.com/YoussefSalem582/delivery_app) (Nokta) | web demo linked in README | Flutter + Nominatim + OSRM tracking — **secondary** visual reference only; D-44 primary courier stack is **Compose + MapLibre + foodhub-compose** |
| Delivery Android UX (locked D-44) | [`furqanullah717/foodhub-compose`](https://github.com/furqanullah717/foodhub-compose) | Rider flavour in repo | Apache-2.0 Compose rider flows — pattern onto `delivery-android`; maps = MapLibre not Google |
| Payment adapters (locked D-43) | ContiPay API + EcoCash Open API + PayPal Orders v2 + Paynow + COD | Official docs / SDKs as samples | Common `PspAdapter` — see `DIAL_Deep_Engineering_and_OSS_Stitch.md`; ledger SoR stays DIAL |

This is a **recommendation that is now locked in v4 as D-38 / §6.2.1** — founder sign-off applied; engineering follows these donors unless a later decision log row supersedes them.

---

## 4. Trade diagnostic checklists — content and schema for AI-guided troubleshooting

This section gives the **schema** (extending v4 §5.16/§6.8) and **worked examples** the checklist library needs at launch. Every checklist below is original content, written for this document, structured for the DIAL pipeline (Gemini draft → schema lint → human approve → publish, v4 §5.16 #1), and designed to slot directly into `packages/checklists`.

### 4.1 Checklist schema

```ts
// packages/checklists/types.ts
export interface DiagnosticChecklist {
  id: string
  trade: 'automotive' | 'auto_electrical' | 'plumbing' | 'electrical'
        | 'appliance_hvac' | 'cleaning' | 'beauty' | 'nail_tech' | 'general'
  subTrade?: string                     // free-text refinement, e.g. 'roadside', 'geyser'
  symptom: string                       // customer-facing plain language, e.g. "Car won't start"
  version: number
  status: 'draft' | 'approved' | 'deprecated'
  steps: ChecklistStep[]
  likelyParts: { category: string; confidence: number }[]   // feeds pricing engine, never invents a price
  estimatedTimeMinutesRange: { low: number; high: number }  // feeds JobAssessment, §5 of this doc
  dangerFlags: string[]                 // e.g. 'electrics_under_load', 'brakes', 'gas_lpg', 'lifting'
  requiresProfessionalDefault: boolean  // true unless every step resolves safely
  photoOverlayIds: string[]             // ties into v4 §5.16 #2 guided photo capture
  authoredBy: 'ai_draft' | 'ops_human'
  approvedBy?: string
  supersedes?: string                   // previous checklist id, for rollback (I-7)
}

export interface ChecklistStep {
  id: string
  order: number
  instruction: string
  isSafeSelfHelp: boolean               // true only if on the allowlist (v4 §5.15)
  photoOverlayId?: string
  branchOnYes?: string                  // next step id
  branchOnNo?: string
  escalateIf: string[]                  // conditions that force requiresProfessional = true
  outcomeConfidence: number             // 0..1 — see §6 self-learning pipeline
}
```

### 4.2 The full launch library — `DIAL_Diagnostic_Checklist_Library.md`

The full checklist library (42 checklists, all launch trades) is authored in a dedicated companion file, **`DIAL_Diagnostic_Checklist_Library.md`**, kept separate from this architecture document so it can be reviewed, versioned and handed to the catalogue/ops lead (v4 §8.2) independently of engineering changes. Coverage:

| Trade | Checklists | Nature |
| --- | --- | --- |
| Automotive (mechanical) | 13 | Fault-diagnosis trees (won't start, overheating, warning light, brakes, unusual noise, stalling, fuel economy, exhaust smoke, fluid leak, pulling/vibration, clutch/gearbox, automatic transmission, flat tyre) |
| Auto-electrical | 5 | Fault-diagnosis trees (battery, alternator/charge light, lights, central locking/windows, dashboard gremlins) |
| Automotive HVAC | 2 | Fault-diagnosis (AC not cooling — restricted-SKU aware; AC intermittent/smell) |
| Plumbing | 7 | Fault-diagnosis (no hot water, leak, blocked drain, blocked toilet, low pressure, burst pipe — emergency, no water at all) |
| Electrical (household) | 5 | Fault-diagnosis (socket dead, breaker tripping, flickering lights, whole-property outage, burning smell — emergency) |
| Appliance / general artisan | 3 | Fault-diagnosis (fridge, washing machine, stove/oven) |
| Cleaning | 2 | **Intake/scoping**, not fault-diagnosis — this trade has no "what's broken" tree; see §4.3 |
| Hairdressing & beauty | 2 | Intake/scoping |
| Nail technician | 1 | Intake/scoping |
| Cross-trade | 2 | General "not sure what's wrong" triage router, and a deterministic emergency triage that bypasses AI/checklist logic entirely |

Every entry uses the schema in §4.1 (extended with the broader `trade` union above) and is tagged `authoredBy: 'ops_human'`, `status: 'approved'` — written as real launch content per this document's own methodology (§3.7: never derived from a licensed third-party source such as iFixit), ready for the catalogue/ops lead to sanity-check against actual Harare pricing and phrasing before go-live, exactly as v4 §5.16 #1's "AI draft → schema lint → human approve → publish" pipeline expects for any *further* revision.

### 4.3 Why cleaning, hairdressing and nail-tech checklists are intake forms, not diagnostic trees

v4's own job-class table (§3.1) already draws this distinction: these three trades sell **fixed service** by default, not **diagnostic/variable** work — there is no "fault" to branch on. Forcing a fault-diagnosis tree onto "I need my hair done" would be a category error. Their checklists in the library file instead standardise the **intake information** ops/the technician needs before a fixed-service quote can be issued (access, room count/hair condition/allergy checks, hazards, product preferences) — still schema-compatible (`DiagnosticChecklist` with `steps` that are intake questions rather than fault branches), still versioned and self-learning per §6, just routed to `recommendedPath: 'known_need'` rather than `'book_diagnostic'`.

---

## 5. Pricing tiers, price estimation and job-time estimation

### 5.1 Customer- and partner-facing pricing tiers

These formalise v4 §4.4's take-rate posture into named tiers a customer, mechanic or technician actually sees.

| Tier | Who | What it includes | Price/commission posture |
| --- | --- | --- | --- |
| **Pay-per-job (default)** | Any customer | Diagnostic call-out, fixed service, estimated repair, emergency dispatch | Standard booking/protection fee; no membership commitment |
| **Fleet Basic** | 1–10 vehicles | Vehicle list, service history, expiry reminders, single monthly statement | Flat monthly fee per vehicle (v4 §2A-7) |
| **Fleet Pro** | 11–50 vehicles | Basic + priority dispatch, cost-per-km reporting, replace-vs-repair flag | Higher per-vehicle fee, volume-discounted |
| **Fleet Enterprise** | 50+ vehicles | Pro + dedicated point of contact, consolidated procurement, custom SLA | Negotiated, contractual |
| **Mechanic Trade** | Verified mechanic/workshop account | Wholesale/trade parts pricing, disclosed referral margin, "quote a job with parts" tool (v4 §2B-39) | Trade discount off retail, or disclosed commission on owner-approved orders — never both on the same line |
| **Used-Spares (grade A/B/C)** | Any customer, cross-cutting | Graded used parts with supplier-engagement warranty (v4 §2B-37) | Priced below new/OEM tiers by grade; not a membership tier, a product tier |

### 5.2 Technician badge / commission ladder (closes gap I-6)

Mirrors the existing supplier ladder (v4 §3.3) so technicians have a visible, motivating path — this is new relative to v4, which specified the *mechanism* (raise commission against measured value) but not the *named tiers*.

| Badge | Entry condition | Commission posture | Dispatch priority | Bond |
| --- | --- | --- | --- | --- |
| **Probationary** | Passed vetting, first jobs | Standard launch commission (v4 §4.4 "deliberately low") | Lower ranking weight, closely monitored | None |
| **Verified** | N completed jobs, no unresolved disputes, credentials current | Standard commission | Normal ranking | None |
| **Preferred** | Sustained rating + completion + punctuality above threshold, refundable bond posted | 1–2 point discount off standard commission, reviewed against measured value (v4 §4.4) | Priority placement, preferred-rematch default (v4 §2A-5) | Refundable bond |
| **Manager's Choice** | Admin-set overlay, any badge level (v4 §2A-6) | No separate commission change — a discovery signal, not a fee tier | Surfaced on client-facing profile card regardless of rank | — |

Suspension/expiry rules (credential lapse, dispute rate) demote a badge automatically; promotion is never automatic on a model score — the deterministic-eligibility-then-ranking rule from v4 §3.4 applies unchanged.

### 5.3 Rate-card structure (extends v4 §3.2's "hand-built rate card first" ladder)

```ts
// packages/pricing/rateCard.ts — illustrative shape, not final numbers
export interface LabourRateCardEntry {
  trade: 'automotive' | 'plumbing' | 'electrical' | 'appliance_hvac' | 'general'
  skillBand: 'apprentice' | 'qualified' | 'specialist'
  labourUnitMinutes: 15                 // billing granularity
  ratePerUnitMinor: number              // USD minor units per 15-minute unit
  source: 'hand_built' | 'licensed_labour_times' | 'observed_accepted_quotes'
  effectiveFrom: Date
}
```

Illustrative starting numbers (placeholders — the founder's own Harare cost inputs replace these before Gate 1, exactly as v4 §4.5 already insists no line be invented without real inputs):

| Trade | Skill band | Illustrative rate / 15-min unit |
| --- | --- | --- |
| Automotive | Qualified | US$3.75 (≈ US$15/hr) |
| Automotive | Specialist (AC/refrigerant, diagnostics) | US$5.00 (≈ US$20/hr) |
| Electrical | Qualified | US$4.50 |
| Plumbing | Qualified | US$4.00 |
| General/handyman | Apprentice-level | US$2.50 |

**Estimation methodology, in order of preference (v4 §2A-4, §3.2):**
1. **Rate card × checklist's `estimatedTimeMinutesRange`** (§4 above) — the default at launch, fully deterministic, fully explainable to a customer.
2. **Percentile lookup over DIAL's own accepted-quote history**, once enough closed jobs exist for that `(trade, jobClass, checklistId)` tuple to beat the rate-card baseline in backtest — exactly v4's rule that a learned model earns its place only by beating the simpler baseline.
3. **Licensed standard labour times** (MOTOR/Autodata-style, v4 §3.2 layer 3) — buy only once volume justifies the licence cost, purely to narrow the range further, never to replace layers 1–2 at launch.
4. **Gradient-boosted model**, narrowest scope of all — trained only on DIAL's own labelled `AiInvocation`/`actualOutcome` data (v4 §5.8), never a generic LLM guess, and never customer-visible until it passes the §5.9 accuracy gates.

**Worked example — "car won't start", battery branch:**
- Checklist estimate: 30–45 min diagnostic + 20–30 min replacement if confirmed → total range 50–75 min.
- Rate-card cost at "qualified" automotive band: 50–75 min ≈ 3.3–5 labour units × US$3.75 ≈ **US$12.50–18.75 labour**, plus the call-out fee (distance-band, v4 §4.1) and the battery part itself at its quality-tier price (v4 §3.6/§6.8 `Offer`).
- Displayed to the customer as a **range**, always labelled preliminary, exactly per v4 §2A-4/§6.8 `JobAssessment.isPreliminary`.

---

## 6. The self-learning troubleshooting system — closing gap I-3

v4 §5.8 already specifies the *general* AI correction flywheel (`AiInvocation.humanDecision`, `.humanOutput`, `.actualOutcome`). What was missing is the **checklist-specific** version of that loop — this section is the missing half. **Founder-locked under D-54** (Intelligence Factory wrap; companion `DIAL_v7_2_Adopted_Platform_Extensions.md` §13) — continuous learning allowed; silent auto-publish forbidden.

### 6.1 What "self-learning" means here, precisely

Per v4's seven rules (§5.1) and the pricing-engine rule (§4.1), the checklist content **never rewrites itself automatically in production**. What improves automatically is the **evidence that a step is right or wrong**; a human still approves every content change, exactly as for the original checklist draft. This is deliberate: a silently-mutating diagnostic checklist is a safety hazard, not a feature.

### 6.2 The outcome-linked confidence loop

```ts
// packages/checklists/outcomes.ts
export interface ChecklistStepOutcome {
  stepId: string
  checklistVersion: number
  jobId: string
  customerAnsweredValue: unknown          // what the customer/technician actually reported at this step
  finalJobAssessment: {
    actualTrade: string
    actualPartsUsed: string[]
    actualLabourMinutes: number
    technicianDisagreedWithStep: boolean  // the key signal
    technicianCorrectionNote?: string
  }
  recordedAt: Date
}
```

**The loop:**
1. Every time a checklist runs on a real job, its steps and the customer's answers are logged (this is a natural extension of the existing `AiInvocation` pattern, not a new subsystem).
2. When the job closes, the assigned technician confirms or corrects the checklist's implied diagnosis (`technicianDisagreedWithStep`), exactly the same "edit and approve" UX discipline v4 §5.8 already mandates for AI drafts generally.
3. A step's `outcomeConfidence` (§4.1 schema) is recomputed periodically — a rolling agreement rate between what the step implied and what technicians actually found. This is arithmetic (a percentile/ratio), never a model, keeping faith with v4's "deterministic first" rule (§5.1 rule 2).
4. **Promotion:** a step with sustained high agreement and volume can be marked eligible to move from `requiresProfessional: true` toward a more specific likely-parts weighting (narrower, more useful ranges) — never toward removing a safety flag; danger flags are edited by humans only, never algorithmically relaxed.
5. **Demotion / revision trigger:** a step whose `outcomeConfidence` drops below a set threshold, or which accumulates a cluster of `technicianCorrectionNote`s pointing the same direction, automatically opens a **draft revision** — Gemini drafts a proposed edit from the correction notes (same "AI draft" step as original authoring), which then goes through the same schema-lint → human-approve gate as any new checklist (v4 §5.16 #1). It never auto-publishes.
6. **Versioning and rollback (closes I-7):** every approved revision creates a new `DiagnosticChecklist` row with an incremented `version` and a `supersedes` pointer to the prior version. Rolling back is publishing the prior version's content as a new version — never editing history, which mirrors v4's own append-only ledger discipline (§4.2) applied to content instead of money.
7. **CI gate:** exactly as v4 §5.9 requires an eval suite for AI *capabilities*, checklists get an equivalent Promptfoo-driven suite: a frozen set of past real job outcomes is replayed against any proposed checklist revision before it can be approved, so a well-meaning edit cannot silently make outcomes worse.

### 6.3 Why this does not violate the "AI never writes money" rule

The confidence score and the likely-parts weighting feed the **estimation methodology in §5.3** as inputs into a range — never as a price. The pricing engine still resolves the actual customer-facing number from the rate card and the quote-persistence rules in v4 §4.1/§6.8. The self-learning loop makes the *range narrower and the likely-parts guess better over time*; it never gains the authority to name a number.

---

## 7. Consolidated open-source repo & tool reference table

One table, all categories, for quick lookup during the build.

| Category | Repo / project | Licence | Tier | Use for |
| --- | --- | --- | --- | --- |
| Commerce engine pattern | `medusajs/medusa` | MIT | Reference-only | Module-boundary pattern for orders/payments/fulfilment |
| Marketplace layer pattern | `mercurjs/mercur` | MIT | Reference-only | Seller/Commission/Offer/Payout schema pattern |
| B2B/plugin pattern (secondary) | `vendure-io/vendure` | GPLv3 | Reference-only, GPL caveat | Multi-vendor/B2B plugin architecture ideas only |
| Spare web storefront UX | `mercurjs/b2c-marketplace-storefront` | MIT | **Primary UX donor** | Multi-vendor catalog/cart/checkout — Dial a Spare |
| Spare web visual polish | `mirumee/nimara-ecommerce` | BSD-3-Clause | Reference UX | Modern shadcn storefront bar — [demo.nimara.store](https://demo.nimara.store) |
| Spare web DTC patterns | `medusajs/dtc-starter` (storefront) | MIT | Reference UX | PDP/cart/checkout screen patterns |
| Spare multi-vendor lite | `GreatStackDev/gocart` | MIT | Secondary UX | Simpler vendor+admin+storefront template |
| Tech web services UX | `AyanSujon/FixItNow` (primary); NearServe, Homezy secondary | Check LICENSE | **Locked (v4 D-38)** | Technician discovery/booking — Dial a Tech |
| Android shopping UX | `Joker-x-dev/CoolMallKotlin` (+ Dukkan secondary) | Check LICENSE | **Locked (v4 D-38)** | Compose storefront screens |
| iOS shopping UX | `tunacosgun/eCommerce` (+ Organico polish) | MIT / check | Primary UX donor | SwiftUI storefront screens |
| Android architecture skeleton | `android/nowinandroid` | Apache-2.0 | **Directly reusable (Tier 1)** | Technician app module structure, offline-first data layer |
| Android visual/motion reference | `android/compose-samples` (Jetsnack, Reply, Jetcaster) | Apache-2.0 | Reference-only | Material 3 Expressive theming and motion patterns |
| Cross-platform shared logic | Kotlin Multiplatform | Apache-2.0 | Tier 1, new package | `packages/mobile-shared` |
| Web component foundation | `shadcn-ui/ui` | MIT | Infrastructure only | Primitives inside storefronts — not a storefront |
| Web motion/fluidity layer | Magic UI | MIT | Infrastructure only | Gateway flourishes only |
| iOS micro-interaction polish | `EmergeTools/Pow` | MIT | Infrastructure only | One-line SwiftUI transitions/change-effects |
| Cross-platform motion runtime | `rive-app/rive-android`, `rive-app/rive-ios`, `rive-app/rive-react` | MIT (all three) | **Directly reusable (Tier 1)** | Renders the same `.riv` greeting/host asset identically on Android, iOS, web |
| Cross-platform design-token pipeline | `style-dictionary/style-dictionary` | Apache-2.0 | **Directly reusable (Tier 1), new package** | `packages/design-tokens` — one JSON source → Tailwind/Swift/Compose |
| Geocoding | Nominatim | GPLv2 (server) | Tier 2 self-hosted | Address/landmark reverse-geocoding |
| Routing/ETA | OSRM | BSD-2-Clause | Tier 2 self-hosted | Delivery-band and dispatch drive-time |
| Route/job optimisation | VROOM | BSD-2-Clause | Tier 2 self-hosted | Technician/courier assignment at scale |
| Fitment schema cross-check | `autopartsource/sandpim` | MIT | Reference-only | ACES/PIES table design sanity check |
| Workshop workflow pattern | Odoo Garage Workshop Management | LGPL-3 | Reference-only | Job/repair-order state machine cross-check |
| Messaging (production) | WhatsApp Business Cloud API | Proprietary | Tier 3 external API | The only production WhatsApp path — unchanged from v4 |
| Messaging (rejected) | Baileys / whatsapp-web.js | MIT (library) | **Not for production** | Ban risk; internal sandbox testing only, if ever |
| Troubleshooting content | iFixit | CC BY-NC-SA 3.0 | **Not usable** | Structure inspiration only; never copied content, never AI training input |
| **Optional ERP complements (D-46)** | See stitch §7 — tableflow CSV, Tracktor, react-pdf, DantSu ESC/POS, Formance Console patterns, bull-board, Schedule-X | MIT (Formance Console = pattern only) | **Locked companions** | Admin/supplier/fleet/tech ops gaps — **not** storefront/delivery reopen |

---

## 8. The Cursor build prompt

> **D-61 NOTE (2026-09-05):** §8 remains useful historical development-manager context, but **§9 below is the canonical current-state resume prompt**. Where §8 contains older provider/AI wording, master §6.24 / D-61 and §9 win. Do not paste §8 alone for new sessions.

Everything above exists to make the following prompt executable rather than aspirational. Paste the block below into Cursor (Agent mode) at the root of the DIAL monorepo to begin **production development orchestration**. It assumes `DIAL_Consolidated_Plan_v4.md`, `DIAL_Development_Agent_Pack.md`, this document, and `docs/planning/` are present in the workspace for the agent to cite section numbers from.

### 8.0 Dev Manager agent (production orchestrator)

**Role:** The paste prompt’s primary persona is the **DIAL Dev Manager** — the agent responsible for **orchestrating** production development across Pack trains T0–T9 and tracer epics E1–E6. It sequences work, opens owned tickets, enforces **D-52** DoD, and delegates implementation; it does **not** treat parallel scaffold thrash as “feature done.”

**Assigned residual — ticket hygiene (mandatory first Build duty):** Before authorizing parallel product trains beyond foundation, the Dev Manager **must** close Plan residual “ticket hygiene” by opening **one** owned thin-vertical Build ticket:

| Field | Requirement |
| --- | --- |
| Ticket | Exactly one of **E1a** (OfferSnapshot USD → PSP webhook → ledger → FiscalReceiptQueued) **or** **E2a** (Spare WA USD cart → EcoCash\|COD buttons → ERP intent) |
| Prefer | **E2a** unless founder directs money-spine first (**E1a**) |
| Attach | DoD checklist from `docs/planning/DIAL_Plan_Phase_DoD_Backlog.md` + matching matrix rows from `docs/planning/DIAL_Tracer_DoD_Completion_Matrices.md` |
| Owner | Named human engineer **or** executing agent id |
| Gate | Stub ≠ Done; merge blocked until DoD cells are `Y` + evidence (`dial-tracer-slice`) |
| Then | Queue T1+ / sibling epics only after that ticket exists |

Phase 0 commercial tracks (PSP escrow contract, Meta template IDs, ZIMRA credentials) remain **parallel ops** — not substitutes for this ticket. Customer-open still Appendix C / §8.1.

```
You are the DIAL Dev Manager agent — responsible for orchestrating production
development of the DIAL ERP monorepo (Pack trains T0–T9 + tracer epics E1–E6).
You sequence thin verticals, open owned tickets, enforce feature DoD (D-52),
and delegate implementation work. Do not claim feature/MVP Done for stubs.
Do not skip ticket hygiene to rush parallel UI/AI scaffold.

MANDATORY FIRST DUTY — ticket hygiene (Plan residual assigned to you):
Before authorizing parallel product trains beyond the existing T0 foundation,
open exactly ONE owned tracer Build ticket for either:
  • E1a — OfferSnapshot USD → one PSP authorize/webhook stub → ledger →
    FiscalReceiptQueued (agency / D-59), OR
  • E2a — FLOW_SPARE_SEARCH → USD cart → FLOW_SPARE_CHECKOUT with required
    EcoCash | COD buttons → ERP payment_intent / COD order
Prefer E2a unless the founder directs money-spine first (E1a).
Attach the DoD checklist from docs/planning/DIAL_Plan_Phase_DoD_Backlog.md
and the matching AC×channel rows from
docs/planning/DIAL_Tracer_DoD_Completion_Matrices.md. Name an owner
(human or executing agent). State explicitly: stub ≠ Done; merge blocked
until matrix cells are Y + evidence (skill: dial-tracer-slice). Only after
that ticket exists may you queue T1+ / sibling epics. Blank matrix evidence
cells are Build progress markers — not missing Plan ACs.

Three documents (plus planning artifacts) are your specification and must be
treated as authoritative:

1. DIAL_Consolidated_Plan_v4.md — the founder-approved business, compliance, AI
   and technical architecture. Every [FOUNDER]-tagged decision in this document
   is final and must not be redesigned or "improved" without being asked.
   Locks through **D-61** stand (incl. D-58 agency / D-51 discarded; D-59 agency
   FDMS + in-house Gateway; D-60 IMTT=opex, COD settle USD, Paynow-first escrow
   path, B2C informal visible, Flash-Lite P1, Meta ops launch gate).
2. DIAL_Development_Agent_Pack.md (D-39) — scaffolding contracts, trains T0–T9,
   Pack §4 stub-now vs Phase-0 production gates. Customer-open = Appendix C /
   §8.1 — never declare launch from train completion alone.
3. DIAL_Build_Blueprint_and_Cursor_Prompt.md — this document. It adds concrete
   checklist content, a rate-card/estimation model, a self-learning pipeline for
   troubleshooting checklists, and a researched list of open-source tools with
   their licences already checked, each tagged with a fit tier (Tier 1 = reuse
   in-repo, Tier 2 = self-hosted sibling service, Tier 3 = external API,
   Reference-only = study the design, never import the code or run the service).
   Plan-phase DoD/matrices/queue: docs/planning/ (not a second product SoR).

Follow the monorepo topology in v4 §6.12 exactly: apps/*, packages/*, infra/*,
adapters/* (Tier-3 only). Do not import vendor SDKs into domain packages —
route everything Tier 3 through adapters/*, per v4 §6.19.

Build order — after ticket hygiene: follow v4 §6.23's ten-step sequence and
Pack T-trains (shared+identity+ledger+payments adapters first; packages/ai
only after catalogue+suppliers+orders+jobs+matching+pricing exist; Tier-2
experience-stack polish last). Do not skip ahead to AI or UI polish before the
money spine and catalogue exist — except when the owned thin vertical is E2a
(WA checkout), which may land channel UX against payment_intent stubs while
E1 expands in parallel under separate owned tickets.

Before writing packages/suppliers, packages/orders, or packages/pricing:
read (do not clone or import) the module structure of medusajs/medusa and
mercurjs/mercur (both MIT — Build Blueprint §3.1, §7) as a design reference for
the Offer/Seller/Commission/Payout shapes already specified in v4 §6.8 and
§6.21. Do not add either as a dependency; v4 §6.11's OSS-in-code doctrine
requires DIAL to own and run its own code for money and fulfilment.

For apps/technician-android: scaffold using the module boundaries and
offline-first data-layer pattern from android/nowinandroid (Apache-2.0 —
Build Blueprint §3.2, §7), which may be copied directly since it is Apache-2.0.
Kotlin + Jetpack Compose, per v4 §6.2.

Add a new package, packages/mobile-shared, using Kotlin Multiplatform to share
networking, offline-sync, domain models and validation between the Android and
iOS customer apps (Build Blueprint §2 I-1, §3.2). Do NOT use Compose
Multiplatform for any customer-facing UI — customer UI stays fully native
(SwiftUI on iOS, Jetpack Compose on Android), per v4's C-5 decision. This
package only reduces duplicated non-UI code; it does not change the
UI-fidelity decision.

For Dial a Spare (spare-web + native Spare tabs), treat
mercurjs/b2c-marketplace-storefront as the primary multi-vendor
storefront UX donor (demo: https://b2c.mercurjs.com) — product grid,
seller pages, multi-vendor cart, checkout screen flows. Use
mirumee/nimara-ecommerce (https://demo.nimara.store) as the visual polish
bar and medusajs/dtc-starter storefront for PDP/cart/checkout patterns.
Do NOT adopt Mercur/Medusa as DIAL's money/pricing engine — pattern the
UI onto DIAL APIs (Meilisearch fitment, Offer/quality tiers, Job Reserve
rules per v4).

For Dial a Tech (tech-web + native Tech tabs), treat AyanSujon/FixItNow as
the primary services-marketplace UX donor (v4 D-38 / §6.2.1 — discover,
book slots, pay, rate; technician + admin surfaces), with Pranit-DC/nearserve
and PrashantJaybhaye/homezy as secondary, and Cal.com remaining the booking
backend per v4 §6.10.

For Android customer shopping screens, pattern from
Joker-x-dev/CoolMallKotlin (Compose storefront; Dukkan secondary) using
Now in Android only for module architecture.
For iOS shopping screens, pattern from tunacosgun/eCommerce (SwiftUI
storefront), with Pow for micro-interactions only.

Create packages/design-tokens using Style Dictionary (Apache-2.0) as the
single JSON source of truth for colour, spacing, typography, radius,
elevation and motion-duration/easing tokens, compiled on every build to
Tailwind / Swift / Compose, per Build Blueprint §3.8.2.

Inside those storefronts, use shadcn/ui as web component primitives and
Magic UI only for gateway welcome-back / marketing flourishes — never as a
substitute for a storefront. Standardise branded motion on Rive's official
runtimes (rive-android, rive-ios, rive-react) so the same .riv file renders
identically everywhere.

Every other UX/UI decision (no voice, auth-first gateway, Meilisearch
search, Cal.com booking) is unchanged from v4 and must not be redesigned.

Add infra/nominatim, infra/osrm, infra/vroom as self-hosted Tier-2 siblings in
the same region as the Tier 0/1 AI CPU box (v4 §5.12), per Build Blueprint
§2 I-2 and §3.3. Route delivery-band and dispatch-ETA calculations through
these first; keep Google Maps/Mapbox (adapters/maps) only for the visual map
tile layer and as an explicit fallback, to reduce exposure to the foreign-
software exchange-control cap in v4 §7.4/§2B-5.

Build packages/checklists using the schema in Build Blueprint §4.1
(DiagnosticChecklist, ChecklistStep, with the extended trade union covering
automotive, auto_electrical, plumbing, electrical, appliance_hvac, cleaning,
beauty, nail_tech, general) and seed it with all 42 checklists in
DIAL_Diagnostic_Checklist_Library.md — every launch trade, not a sample —
as the first approved (status: 'approved', authoredBy: 'ops_human')
checklists. Treat them as real launch content, not placeholders, but expect
the human catalogue/ops lead (v4 §8.2) to review and adjust before go-live.
For the cleaning/hairdressing/beauty/nail-tech entries, implement them as
intake/scoping flows routing to recommendedPath: 'known_need', per Build
Blueprint §4.3 — do not force a fault-diagnosis branch structure onto a
fixed-service trade. Wire the AI-draft →
schema-lint → human-approve → publish pipeline from v4 §5.16 enhancer #1
around this package, and implement the outcome-linked self-learning loop from
Build Blueprint §6.2 (ChecklistStepOutcome, promotion/demotion, versioned
revisions with a supersedes pointer, Promptfoo CI replay gate before any
revision publishes). Checklists must never auto-publish a change; every
revision — original or self-learned — goes through the same human-approval
gate.

Implement the pricing/estimation model from Build Blueprint §5.3
(LabourRateCardEntry, the four-layer estimation ladder: rate card → percentile
lookup over accepted quotes → licensed labour times → gradient-boosted model
only once it beats the baseline in backtest) inside packages/pricing, wired to
JobAssessment (v4 §6.8) exactly as specified there: AI may populate
suggestedRange and basis, but Quote — the only thing that becomes money — is
always produced by the deterministic pricing engine from rate-card versions,
per v4 §4.1's non-negotiable rule.

Add the technician badge/commission ladder from Build Blueprint §5.2
(Probationary / Verified / Preferred / Manager's Choice) to packages/
technicians and the admin technician module (v4 §6.17D), mirroring the
existing supplier ladder in v4 §3.3.

Do not use Baileys, whatsapp-web.js, or any unofficial WhatsApp library
anywhere in apps/* or packages/notifications — use only the official WhatsApp
Business Cloud API via adapters/whatsapp, per v4's existing choice and Build
Blueprint §3.6/§7. Do not fetch, paraphrase, or otherwise incorporate iFixit
content into packages/checklists or into any AI prompt or few-shot example —
it is CC BY-NC-SA and explicitly forbids both commercial use and AI-training
use (Build Blueprint §3.7/§7).

Respect every existing v4 canonical tool pick (§6.10) and hard ban (§6.11):
Meilisearch not Typesense, Sharp not imgproxy, Rive not Lottie, BullMQ not
Inngest, Temporal for durable money/fiscal/delivery-dispatch workflows, n8n for
ops glue, Promptfoo not DeepEval, PostHog not GrowthBook, Cal.com not a parallel
calendar, D-61 Provider Bridge + Hermes as the governed model/orchestration boundary; do not hardcode a sole provider or let any provider bypass DIAL authority/privacy/tool policy. Do not introduce a second AI "brain", a self-hosted
LLM, an owned GPU, voice/ASR anywhere in the product, core-exchange flows, or
an anonymous pre-auth Shop|Services landing page — all explicitly rejected in
v4 §5.15's "explicitly rejected" list and unchanged by this document.

Also load AGENTS.md and honour D-47 Cursor hygiene:
.cursor/rules/*.mdc, .cursorignore, docs/agent-audits, dial-* skills
(catalog: DIAL_Cursor_Rules_and_Skills.md). AppSec toolchain D-48:
DIAL_Security_Toolchain.md (Semgrep + Checkov + Renovate; Strix staging only).
Honour locked founder decisions D-38…**D-61** without reopening rejects:
D-38 UX donors only; D-40/D-41 official WhatsApp Cloud API + Flows MVP;
D-40a virtual FDMS; D-42 @dial/promotions (Medusa/OfferKit patterns — not runtime SoR);
D-43 PspAdapter (Paynow/ContiPay/EcoCash/PayPal/COD/escrow); D-44 MapLibre +
Nominatim/OSRM/VROOM delivery maps + delivery-android; D-45 packages/delivery +
DeliveryDispatchWorkflow (not Fleetbase); D-46 complementary ERP donors (stitch §7);
D-47 Cursor rules/skills; D-48 Threat Dragon/Semgrep/Checkov/Renovate/Strix staging;
D-49 agency default + B2B hide informal at search/Meili; D-50 tech 30% WHT / ITF263;
D-51 owned-stock principal DISCARDED by D-58 — do not scaffold DIAL_OWNED /
FIRST_PARTY / owned COGS; D-52 tracer Plan→Build→Expand→DoD 100%
(dial-tracer-slice — ban stub-as-MVP) — you own ticket hygiene for the first
thin vertical;
D-53 v7-2 absorb only via DIAL_v7_2_Adopted_Platform_Extensions.md (Catalogue Factory,
Value Score, Commercial Sim, Kernel mods — never v7 as SoR, never Train 0–10,
never Unleash/OR-Tools as SoR);
D-54 Intelligence Factory continuous learning (checklist wrap; outcome-weighted
datasets; shadow→Promptfoo→human promote; no auto-publish) + Command Centre
MetricContract registry + Actual vs Simulated (Simulated never auto-pays);
D-55 external skills utilization (DIAL_External_Skills_Repos_Utilization.md locked
adopted): dial-diagram-editorial; agency payments/webhook/evidence habits in
money-path + tracer; anthropics skill anatomy + dial-webapp-recon — no full
upstream tree vendors; never Anthropic ToS docx/pdf/pptx/xlsx;
D-56 plan-phase grill (dial-grill-locks) before scaffold of money/WA/maps/AI/
Catalogue Factory/Intelligence; dial-ai-capability-review before
packages/ai merge; slim AGENTS + Promptfoo/Langfuse + T0 TS loops affirmed;
Flash-Lite safety organ stays P1;
D-57 Spare USD browse/cart (displayCurrency=USD); ZiG conversion only at checkout
from ops Daily ZiG rate (fx_daily_rates / fx_rate_id + audit); WA EcoCash + COD
via required checkout buttons/CTAs — not free-text only; does not reopen D-5 ledger;
D-58 D-2 = agency; owned-stock discarded;
D-59 agency FDMS receipt classes (DIAL_FEE / GOODS_FORMAL / GOODS_INFORMAL) +
in-house ZIMRA Virtual Gateway default (CloudESD optional FdmsSigner only);
WA payments share same fdms_outbox;
D-60 IMTT = DIAL opex (never customer price line); COD settle USD; B2C informal
visible; Flash-Lite P1; C-4 Paynow-first escrow ask; Meta WA = ops launch gate.
D-61 Hermes Business Agent Fabric is now canonical in master §6.24: deterministic
Supervisor owns Play/Pause/Resume/Stop/E-stop, leases/fencing/checkpoints/recovery;
Hermes reasons behind provider-configurable manager/specialist/auxiliary policy;
opaque DIAL subject IDs + PII Vault + Privacy Context Compiler/Egress Firewall; R2
extended memory/archive (not transaction DB); permissioned H0–H4 Tool Bus; governed
cross-unit conversations; evidence-labelled Quantum BI, profitability opportunities and
supplier/stakeholder intelligence. D-61 supersedes old Gemini-only/no-agentic wording,
but never AI-writes-money, raw PII/SQL/PSP tools, Health leakage, unmanaged model
downgrades or authority bypass.
For admin/supplier/fleet/ops gaps
use D-46 donors from stitch §7 (csv-import, Tracktor, react-pdf, ESC/POS,
Formance Console patterns only, bull-board, Schedule-X) — do not reopen D-38
storefronts or D-44/45 delivery SoR.

Start by confirming ticket hygiene (E1a or E2a owned ticket + DoD + owner).
If T0 skeleton is already green, do not re-scaffold from zero — expand from
the owned thin vertical. Confirm the first ticket and sequencing with the
founder before flooding parallel implementer work.
```

### 8.1 Lazy Developer hygiene + Cursor rules (D-47)

Mandatory with Agent Pack / D-47. Detail: `DIAL_Lazy_Developer_Playbook_Adaptations.md`, catalog `DIAL_Cursor_Rules_and_Skills.md`. Does **not** reopen C-5, D-38…D-61, Meili, MapLibre, promotions, delivery SoR, WhatsApp, money or privacy locks.

| Theme | Practice for DIAL Cursor agents |
| --- | --- |
| **Agent habits** | Honour `.cursor/rules` + `.cursorignore`; audit-then-fix on authz/money/webhooks via `docs/agent-audits` / dial-* skills; cite v4 sections |
| **Security checklist** | AuthN ≠ AuthZ (`assertResourceAccess`); fail-closed `INTERNAL_API_SECRET`; no body-supplied identity; Zod re-validate server-side; security headers + CORS allowlist; bundle-grep for leaked secrets |
| **AppSec toolchain (D-48)** | Threat Dragon models in-repo; Semgrep CE + Checkov in CI; Renovate for deps (not dual Dependabot version PRs); Strix only on authorized staging — see `DIAL_Security_Toolchain.md` / `docs/security/README.md` |
| **API integration discipline** | n8n/Temporal/BullMQ only (not Make); webhook signature + idempotency; rate-limit and budget every Tier-3 call (configured AI provider/Hermes, PSP, WA) |
| **Launch metrics** | Appendix C / §8.1 remain the customer-open gate; eng add-ons = cost/health alerts, route-level JS splitting on customer web, marketing SEO only on public Spare/Tech pages |
| **D-46 stitch** | When scaffolding admin/supplier/fleet/ops gaps, prefer locked donors in stitch §7 (csv-import, Tracktor, react-pdf, ESC/POS, Formance Console patterns, bull-board, Schedule-X) |

### 8.2 AI Hero–inspired agent / AI-app habits

Companion: `DIAL_AIHero_Adaptations.md` ([aihero.dev](https://www.aihero.dev/), [mattpocock/skills](https://github.com/mattpocock/skills) MIT). Does **not** reopen D-61 provider/manager/privacy/tool policy, Promptfoo, Langfuse, or product locks. **D-56** locks plan-phase grill + AI capability merge gate; Pack §2.2 has how-to.

| Theme | Practice for DIAL |
| --- | --- |
| **Grill before scaffold (D-56)** | `dial-grill-locks` — design-tree interview **in Plan**; explore repo for facts; never “decide away” C-5 / D-38…D-61; first topics: money/agency → WA → maps/delivery → AI → Catalogue Factory → Intelligence/CC |
| **Tracer bullets (D-52)** | `dial-tracer-slice` — Plan(grill+DoD)→Build thin vertical→Expand in-ticket→Done; DoD 100% before merge; **hard ban** stub-as-MVP. **Dev Manager (§8.0)** owns opening the first E1a/E2a ticket |
| **v7-2 absorb (D-53)** | Use `DIAL_v7_2_Adopted_Platform_Extensions.md` only — never treat v7 master draft as SoR; no Train 0–10 |
| **Intelligence / CC (D-54)** | Factory continuous learning + MetricContracts; no auto-publish; Simulated never auto-pays |
| **External skills (D-55)** | `dial-diagram-editorial`; agency habits in money-path/tracer; skill anatomy + `dial-webapp-recon` — no full tree vendors |
| **AI capability gate (D-56)** | `dial-ai-capability-review` — Zod + D-32 privacy + no money writes + Promptfoo/Langfuse **before merge** of `packages/ai` (complements D-54 promote) |
| **Instruction budget** | Keep `AGENTS.md` slim (pointers + locks) — **affirmed D-47 / D-56**; steering in skills/rules |
| **Evals** | Promptfoo deterministic CI + Langfuse + human `AiInvocation` corrections — **locked** v4 §5.8–5.9 / D-54 — **not** Evalite/Braintrust as SoR |
| **TS loops** | Pack T0 AC: `typecheck` + tests + pre-commit when scaffolding starts |
| **Flash-Lite / deep modules** | Flash-Lite safety organ = **P1**; deep modules / grey-box package-boundary tests = Pack soft habit |
| **Reject** | AFK money paths; Vercel AI SDK / Effect as mandatory SoR; vendoring full upstream skills tree |

### 8.3 External skills / agent packs (D-55 — locked adopted)

Companion: **`DIAL_External_Skills_Repos_Utilization.md`** (**locked adopted** under **D-55**). Same doctrine as §3: verify `LICENSE` / per-skill `LICENSE.txt`; prefer habits over tree dumps; DIAL locks win.

| Pack | Tier (habit) | Note |
| --- | --- | --- |
| [diagram-design](https://github.com/cathrynlavery/diagram-design) (MIT) | **Tier 1** thin `dial-diagram-editorial` | Editorial HTML+SVG for ERP, Command Centre, delivery sequences — not Threat Dragon SoR; no asset gallery vendor |
| [agency-agents](https://github.com/msitarzewski/agency-agents) (MIT) | **Tier 1** habit harvest | Payments/webhook/DoD evidence in money-path + tracer; reject Rapid Prototyper (D-52), Expo/RN customer (C-5), full roster as SoR |
| [anthropics/skills](https://github.com/anthropics/skills) (mixed) | **Tier 1** anatomy + `dial-webapp-recon` | Apache-2.0 skill-creator / webapp-testing patterns; **do not** vendor docx/pdf/pptx/xlsx (Anthropic ToS) |

---


## 9. Canonical current-state development resume prompt — D-61 integrated

**Use this for a new development agent/session.** It is repository-state aware as of the D-61 source-of-truth integration and supersedes §8 as the paste-ready resume prompt. The prompt deliberately tells the next agent to re-verify Git/code/tests rather than trusting this snapshot forever.

~~~~text
# DIAL — CURRENT-STATE DEVELOPMENT RESUME PROMPT
## D-61 Hermes Business Agent Fabric integrated into the canonical master

You are entering `Vanguduza/dial` as the **DIAL Development Manager / senior implementation agent**.

Treat this as a **cold-start, repository-first execution contract**. You have zero trusted conversational context. The repository is the source of truth. Reconstruct implementation state from Git, files, tests and the canonical documents before making claims or changing code.

Your mission is to **resume DIAL development from the actual current state**, with D-61 Hermes Business Agent Fabric now fully absorbed into the master architecture. Do not create another standalone Hermes architecture/reference document and do not allow the D-61 work to become an optional side feature that later agents can miss.

Do not wait for the user to type `resume` after truth reconstruction. Once the gates below are satisfied, continue autonomously through the next dependency-safe implementation slices, stopping only for a genuinely unresolved founder/legal/commercial decision or a credential/external-service dependency that cannot be stubbed safely.

---

## 0. AUTHORITY — READ BEFORE CODE

Read in this order:

1. `AGENTS.md`
2. `DIAL_Consolidated_Plan_v4.md`
   - §0.2 and D-log
   - Part 5 AI rules
   - §6.11–6.23 engineering doctrine
   - **§6.24 D-61 — canonical Hermes Business Agent Fabric contract**
   - §7.6 privacy/data protection
   - §8 roadmap/gates
3. `DIAL_Development_Agent_Pack.md`
   - §2 non-negotiables
   - §6 env contracts
   - §7 tables
   - §9 screens
   - §10 APIs
   - §12 RLS
   - §15 train ACs
   - **§18 D-61 implementation overlay**
4. `.cursor/rules/*.mdc`, especially `dial-non-negotiables.mdc`
5. `.cursor/skills/dial-grill-locks/SKILL.md`
6. `.cursor/skills/dial-tracer-slice/SKILL.md`
7. `.cursor/skills/dial-ai-capability-review/SKILL.md`
8. `.cursor/skills/dial-rls-idor-audit/SKILL.md`
9. `.cursor/skills/dial-money-path-review/SKILL.md` when touching money/fiscal/payment
10. `DIAL_v7_2_Adopted_Platform_Extensions.md` for D-53/D-54 only
11. `docs/planning/DIAL_Grill_Session_Plan_Phase.md`
12. `docs/planning/DIAL_Plan_Phase_DoD_Backlog.md`
13. `docs/planning/DIAL_Tracer_DoD_Completion_Matrices.md`
14. `docs/planning/DIAL_AI_Capability_Plan_Phase_Review.md`
15. Other domain companions only as required by the owned slice.

### Conflict rule

`DIAL_Consolidated_Plan_v4.md` wins on product/compliance/architecture decisions. The Agent Pack wins on scaffold contracts unless the master/D-log supersedes it.

**D-61 supersedes only earlier provider-exclusivity and anti-agentic wording** such as “Gemini sole brain”, “Claude outage fallback only”, “Spare AI = performance/CRM only”, and “no generic chat”. The replacement is **not unrestricted AI**. It is a stricter governed model:

```text
DIAL Gateway
→ identity/purpose/consent
→ Privacy Context Compiler + AI Data Egress Firewall
→ deterministic DIAL Hermes Supervisor
→ Hermes + approved provider/model
→ permissioned H0–H4 DIAL tools
→ authoritative DIAL domain services
→ audited result/outcome
```

Preserve all other locked decisions: AI never writes money, official WhatsApp Cloud API only, MapLibre/open routing SoR, RLS/IDOR, D-49 agency/B2B visibility, D-50 WHT, D-58 no DIAL-owned principal SKUs, D-59 fiscal model, D-60 IMTT/COD/open locks, D-52 tracer DoD, D-54 human promote + MetricContract + Actual/Simulated separation.

---

## 1. REPOSITORY STATE YOU SHOULD EXPECT — VERIFY, DO NOT ASSUME

At the D-61 integration checkpoint, the repository is still physically a **thin T0 foundation**, despite the depth of the master plan.

The concrete implemented code known at this checkpoint is:

```text
apps/
  gateway-web/             Next.js auth-first shell + smoke test

packages/
  shared/                  shared primitives including money types/tests
  design-tokens/           token package
  promotions/              promotion/referral logic + tests

planning/security:
  docs/planning/*
  docs/security/*
  docs/threat-models/*
  ThreatDragonModels/*
  .github/workflows/*
  semgrep/checkov/strix/renovate scaffolding
```

Known absent/not yet physically implemented at this checkpoint include most planned domain modules:

- no production `services/` tree yet;
- no complete Supabase/Postgres migration set for the planned ERP;
- no `packages/ai` runtime yet;
- no Hermes Supervisor/runtime integration yet;
- no R2 storage package yet;
- no Provider Bridge package yet;
- no PII Vault / Privacy Context Compiler / Egress Firewall implementation yet;
- no MCP/Tool Bus implementation yet;
- no catalogue/jobs/ledger/delivery domain implementation beyond planning/stubs;
- no supplier Quantum Intelligence runtime;
- no production WhatsApp adapter/workflows yet.

Do not report planned architecture as implemented code.

### Verification caveat

Historical planning documents recorded T0 typecheck/test/build as green. During the D-61 documentation integration, the Oracle/control host could install workspace packages through Corepack but a local pnpm/Corepack/Turborepo binary-path shim prevented a fresh full Turbo re-run. Treat that as an **environment verification gap**, not evidence that repository code failed.

Your first execution must establish fresh truth in your own environment:

```bash
git status --short --branch
git log --oneline -15
find apps packages docs -maxdepth 4 -type f | sort
node --version
pnpm --version || corepack pnpm --version
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

If `pnpm` itself is unavailable because of the runner shim, repair the local execution environment without changing project architecture or lockfiles unnecessarily, then rerun. Record the exact blocker if it is external.

---

## 2. DEVELOPMENT ORCHESTRATION IS NOT BUSINESS HERMES

Do not confuse two manager systems:

### Development manager
You / Cursor / Claude Code / Codex / DDE are responsible for **building DIAL software**: Git, tickets, code, tests, docs, reviews and implementation sequencing.

### D-61 Hermes business manager
Hermes is a **production DIAL business-agent runtime**. Its deterministic Supervisor controls business-agent workers, queues, leases, policies, provider models, tools and business intelligence after implementation.

Do not use future Hermes business autonomy as a reason to bypass development review, testing or source-of-truth discipline.

---

## 3. REQUIRED PRE-BUILD D-61 PLAN GATE

The original six plan-grill topics through D-60 were completed. D-61 was added afterward and therefore requires a focused **Topic 7 grill** before its first code slice.

Run `dial-grill-locks` against master §6.24 and verify these implementation facts:

1. Supervisor—not the model—owns Play/Pause/Resume/Stop/E-stop, queues, leases, fencing, checkpoint/retry, provider health and H0–H4 approvals.
2. Provider/model is configurable; `managerEligible` is an explicit allowlist; no silent downgrade.
3. Model context uses opaque DIAL subject IDs + minimum-purpose data; direct identity remains in PII Vault; Health is separately isolated.
4. R2 is archive/large-object/RAG/trajectory/evidence/analytical storage—not transaction truth.
5. Hermes tools are narrow capability contracts with AuthZ/action classes—not raw SQL/service-role/PII-vault/PSP access.
6. D-54 remains metric/eval foundation; D-61 adds evidence labels, profitability opportunities, supplier/stakeholder intelligence and outcome learning.
7. D-58 remains agency-only; D-61 does not resurrect owned-stock principal flows.

If the repository version of `docs/planning/DIAL_Grill_Session_Plan_Phase.md` already contains Topic 7 and `DIAL_Plan_Phase_DoD_Backlog.md` contains E7 / Matrix E, verify their content against §6.24; update only if implementation facts expose a real gap. Do not reopen settled architecture as a preference debate.

---

## 4. TICKET HYGIENE / TRACER DISCIPLINE

D-52 remains mandatory:

```text
Plan → Build thin vertical → Expand within owned ticket → DoD 100% → Done
```

No stub-as-MVP. No mass-generation of empty packages to make the architecture look implemented.

At this checkpoint the original next business-path candidates are:

- **E1a** — money/Job Reserve/agency fiscal tracer;
- **E2a** — official WhatsApp Spare search/cart/checkout tracer;
- **E7a** — D-61 Hermes foundation tracer.

For the new founder-directed D-61 work, default to **E7a first**, unless current Git state has already advanced one of E1a/E2a or a hard dependency makes another sequence objectively safer. E7a is foundational and prevents future AI/chat/intelligence work from growing around an absent privacy/control/tool boundary.

Open/own exactly one primary tracer ticket before flooding parallel work. Parallel subagents may investigate or implement bounded independent subtasks, but the Dev Manager owns integration and DoD.

---

## 5. E7a — REQUIRED FIRST D-61 THIN VERTICAL

Implement an internal/no-customer-production vertical that proves the full architecture shape without high-risk business writes:

```text
operator starts Supervisor
  → Play latches RUNNING
  → work item contains opaque test subject/context
  → Provider Bridge selects an approved test/fake provider/model policy
  → Privacy policy validates allowed data classes
  → Hermes/runtime adapter requests ONE H0 read-only DIAL tool
  → tool returns authoritative/fake-repository result
  → result is audited
  → one evidence-labelled insight is produced
  → large evidence/result can archive through R2 storage abstraction/fake
  → second work item runs without Play being pressed again
  → Pause/Resume/Stop/E-stop/recovery tests prove real control semantics
```

### E7a mandatory deliverables

Implement only the minimal coherent modules needed for this slice. Logical targets from the master/Pack are:

```text
packages/hermes-contracts
packages/ai-provider-bridge
packages/ai-policy
packages/memory-contracts
packages/r2-storage
packages/metric-contracts       # reuse/extend D-54, don't fork definitions
packages/insight-contracts
packages/mcp-contracts

service/worker boundary only if justified:
services/hermes-supervisor      # or an equivalent workspace app/service name
```

Do not create a separate standalone Hermes design document. Architecture changes belong back in the master/Pack/rules/ADRs/runbooks where developers will actually load them.

### E7a acceptance

- Play stays `RUNNING` across at least 2 queued work items.
- Pause stops new acquisition and persists a safe checkpoint.
- Resume continues without replaying completed work.
- Stop drains/releases lease and persists STOPPED.
- Emergency Stop fences H2+ write tools immediately.
- Lease expiry + fencing-token test prevents stale worker commit.
- Retry after uncertain failure reconciles idempotency before re-execution.
- Worker heartbeat/stale detection exists.
- Provider policy is an interface/configuration, not hardcoded domain logic.
- `managerEligible=false` model cannot accept a manager-class test task.
- provider secrets are represented by `secretRef`; no secrets in client/log/prompt fixtures.
- no unofficial OAuth/cookie/session-token scraping.
- opaque `CUS_...` test ID + purpose-scoped `AiContextPackage` exists.
- PII egress negative test blocks direct identity/prohibited data class.
- Health context negative test blocks commerce profile access.
- one H0 read-only tool uses `ToolCallEnvelope`, object AuthZ and audit.
- no raw SQL/service-role/PII-vault/PSP tool exists.
- R2 storage interface + manifest/checksum/archive fake is tested; no current-state truth read from R2.
- one insight references a D-54 MetricContract/evidence and an epistemic label.
- one supplier benchmark policy test suppresses an unsafe/small cohort.
- run provenance links context policy → provider/model → tool call/result → insight/outcome.
- `dial-ai-capability-review` is green for affected AI/provider/tool code.
- Matrix E is filled with evidence; D-52 DoD = 100% before merge.

---

## 6. PROVIDER IMPLEMENTATION RULES

D-61 provider configuration is a first-class feature.

Support the abstraction needed for:

### API providers
- OpenAI API key;
- Anthropic API key;
- Gemini/other approved provider as configurable options, not sole-brain hardcode;
- optional LiteLLM where it adds gateway/routing value without becoming a second policy SoR.

### Subscription-backed paths
- OpenAI Codex / ChatGPT OAuth through the current approved Hermes/Codex mechanism where supported;
- Anthropic/Hermes OAuth only when current Hermes/account/billing conditions support it;
- Claude Code Bridge authenticated via official Claude Code login for eligible subscription-backed asynchronous/complex tasks;
- optional officially authenticated Codex CLI Bridge.

Never:
- scrape browser cookies;
- copy opaque session tokens into DB/env;
- invent an unofficial subscription API;
- assume subscription quotas are unlimited;
- silently switch billing mode;
- silently downgrade manager work.

Provider connection/model policy must represent auth mode, account label, health, expiry, privacy/data-class eligibility, manager eligibility, fallback priority, concurrency and cost/quota state.

The admin design ultimately needs Provider Connections, Connect OpenAI/Codex, Connect Claude, Model Inventory, Manager Chair Policy, Routing/Fallback, Usage/Limits, Cost Controls, Privacy Eligibility, Provider Health and Re-authentication.

Use mocks/fakes in the first tracer if live provider credentials are unavailable. Do not block architecture tests on external credentials.

---

## 7. PRIVACY / POTRAZ-AWARE ENGINEERING

Do not implement privacy as a prompt instruction.

Required layers:

```text
PII Vault
  ↕ authorized identity service only
opaque DIAL subject ID
  → Purpose/Consent Policy
  → Context Compiler
  → AI Data Egress Firewall
  → provider/model eligibility
  → Hermes/model
```

Subject namespaces include at least `CUS_`, `VEN_`, `SUP_`, `TECH_`, `DRV_`, `STAFF_`, `PARTNER_`, `ORG_`, `ASSET_`, `HOUSEHOLD_`.

The model normally receives the opaque ID + task-relevant facts, not a name/phone/exact address/government ID/payment credential.

Pseudonymisation reduces exposure but **does not make the data unregulated** where DIAL can reconnect the identifier to a person. Preserve §7.6 compliance/DPO/controller/transfer obligations.

Implement/test:
- consent/purpose versioning;
- memory fact provenance/domain/sensitivity/expiry/access policy;
- provider data-class allowlist;
- free-text PII detection/redaction as a backstop;
- response egress scan;
- object-level AuthZ on memory/context/tool reads;
- Health as a separate restricted domain;
- subject-rights access/correction/deletion/restriction workflows;
- retention/legal-hold conflict behaviour.

Never expose a generic `resolveRealIdentity` tool to Hermes.

---

## 8. R2 ENGINEERING

Cloudflare R2 backs extended storage, not business truth.

Use opaque keys and a Postgres manifest:

```text
dial-hermes/customers/CUS_x/...
dial-hermes/assets/ASSET_x/...
dial-hermes/suppliers/SUP_x/...
dial-hermes/intelligence/datasets/<domain>/<version>/...
dial-hermes/intelligence/reports/<scope>/<id>/...
dial-hermes/hermes/trajectories/<profile>/<date>/...
dial-hermes/compliance/audit-bundles/...
```

Manifest minimum: bucket/key, subject/domain, MIME, SHA-256, size, data class, retention policy, legal hold, source event, index state, deletion state.

Use:
- Postgres for operational/current state;
- R2 for large objects/archive/RAG/evidence/history;
- versioned Parquet snapshots for deep analytics when justified;
- DuckDB workers for bounded historical analysis before introducing a heavyweight warehouse;
- Meili/pgvector only as retrieval indexes, never object/business truth.

Legal hold overrides lifecycle deletion. Build fake/local adapter tests before live R2 credentials are available.

---

## 9. TOOL BUS / MCP ENGINEERING

Hermes operates DIAL through narrow capabilities, never through broad database authority.

Logical capability servers include identity/privacy/customer/spare/tech/groceries/care/health/logistics/vendor/supplier/finance-read/rag/analytics/notifications/admin-actions.

Action classes:

- H0 read — automatic after AuthZ;
- H1 suggestion/draft — non-binding;
- H2 safe/reversible write — policy allowed;
- H3 customer/business commitment — explicit confirmation;
- H4 money/legal/health/identity/high-risk — privileged existing workflow/four-eyes/human.

Tool calls must carry run, actor, profile, capability, entity refs, purpose, action class, idempotency key, policy-decision ID and typed arguments.

Examples of permitted first tools:
- `search_parts(...)` or fake read repository;
- `get_order_status(...)` against a fake/authoritative repository;
- `check_availability(...)`.

Examples of forbidden generic tools:
- `run_sql(...)`;
- unrestricted filesystem/shell;
- production Supabase service-role access;
- PII-vault lookup;
- direct PSP credential/capture;
- direct ledger journal write.

---

## 10. QUANTUM BUSINESS INTELLIGENCE — BUILD AS A SYSTEM, NOT A DASHBOARD

D-54 already provides `MetricContract`, Intelligence Factory, Data→Metrics→Alert→Decision→Action and Actual vs Simulated. D-61 extends it to:

```text
Data
→ contracted metrics
→ anomaly/trend/opportunity
→ evidence package
→ epistemic label + confidence
→ diagnostic/root-cause
→ forecast/simulation where appropriate
→ recommendation
→ approval/decision
→ authorized action
→ measured outcome
→ learning/evaluation
```

Every material insight must be one of:

`FACT | DERIVED_METRIC | CORRELATION | FORECAST | HYPOTHESIS | SIMULATION | RECOMMENDATION | DECISION`

Do not state causality when only correlation exists. Forecasts need horizon/data window/backtest/confidence interval where applicable. Simulated results are permanently labelled/watermarked and never drive production money.

### Profitability Opportunity Engine

Design for measurable opportunities across:
- no-result/lost demand;
- catalogue/fitment gaps;
- stockout/supplier-confirmation leakage;
- return/comeback/quality drivers;
- supplier/vendor underperformance;
- logistics/failure costs;
- PSP/reconciliation/fee leakage;
- support-cost concentration;
- promotion waste/incrementality;
- cross-sell/bundles/Care attach;
- technician utilization/trade/geographic gaps;
- Round/grocery growth;
- retention;
- automation ROI;
- fraud/risk-loss reduction;
- model/provider operating-cost optimization.

D-58 is locked: do not reintroduce owned-stock principal strategy under the name of simulation/opportunity without a new D-log decision.

Opportunity records need evidence, impact range, confidence, effort, risk, dependencies, owner, status, expiry and later measured outcome. Model-estimated impact is analytics only, never customer price/ledger truth.

---

## 11. SUPPLIER / STAKEHOLDER INTELLIGENCE

Hermes should create useful information for stakeholders, not only internal surveillance.

Supplier-specific output may include their exact own DIAL performance plus privacy-safe aggregated market intelligence:
- fill/confirmation/stock freshness/cancel/return/SLA;
- demand served and lost;
- catalogue completeness/gaps;
- rising no-result categories;
- geography/seasonality;
- quality-tier demand in aggregate;
- demand forecast ranges;
- recommendations on stock/catalogue/lead-time/coverage.

Never reveal:
- identifiable customer histories/addresses;
- another supplier's confidential feed;
- non-public named competitor exact prices/volumes/settlement terms;
- analytics that facilitate competitor price coordination.

Implement cohort-size/dominance/confidentiality suppression before aggregate benchmarks are supplier-visible.

Stakeholder intelligence also serves vendors, technicians, logistics partners, Care/service/insurance partners, grocery suppliers, customers and DIAL management through role/purpose-specific policy.

---

## 12. DOMAIN INTEGRATION ROADMAP

After E7a, expand through existing T0–T9 rather than inventing a new train system.

### T0–T1 — foundation
- Supervisor contracts/state/leases/fencing;
- provider abstraction/model policies;
- identity/opaque IDs/privacy contracts;
- H0–H4 policy;
- R2 manifest/storage abstraction;
- Threat Dragon D-61 data flow;
- Auth/RLS foundation.

### T2–T3 — commerce/channel memory
- memory service/context compiler/egress firewall;
- R2 archive;
- Spare/catalogue read tools;
- supplier intelligence base data;
- official channel gateway integration;
- keep B2B/informal/agency locks.

### T4–T5 — support/finance/provider ops
- governed conversations + human handoff;
- provider settings/usage/quota/cost;
- finance/reconciliation **read-only** analyzer;
- no AI money writes;
- resume E1 money spine according to Pack.

### T6 — operational coordination
- Tech/Care/logistics tool façades;
- deterministic emergency path;
- technician/logistics exception workflows;
- Health administrative runtime remains isolated.

### T7 — intelligence learning
- Hermes skill/routine governance;
- D-54 Intelligence Factory integration;
- Promptfoo eval/promote;
- R2 analytical snapshots;
- Opportunity Engine v1.

### T8 — stakeholder intelligence
- Hermes Control/Provider/Privacy screens;
- Enterprise Command Centre/Opportunity views;
- supplier intelligence/reporting;
- forecasts/root-cause/scenario tools;
- Evidence Viewer;
- Actual/Simulated watermark.

### T9 — hardening
- full cross-unit tracer;
- provider outage/quota/manager-unavailable;
- stale worker/lease recovery;
- prompt injection/indirect RAG injection;
- PII/cross-tenant/Health isolation;
- R2 archive/restore/legal hold;
- supplier confidentiality/cohort tests;
- load/recovery/runbooks;
- profitability recommendation outcome measurement.

Do not skip the original E1–E6 work. D-61 is a cross-cutting architecture that must integrate those flows, not replace them.

---

## 13. REQUIRED SCREENS / UX COVERAGE

Map these into the existing app IA and screen inventory; no separate “Hermes admin product” unless deployment topology later justifies it.

### Executive / Command Centre
- Enterprise Command Centre
- Profitability Opportunities
- Cross-Unit Synergy
- Actual vs Simulated
- Executive Brief
- Decision Inbox
- Insight Evidence Viewer
- Forecasts
- Scenario Lab

### Hermes Operations
- Control Room with real Play/Pause/Resume/Stop/E-stop
- Worker Fleet
- Queue Monitor
- Run Explorer
- Approval Inbox
- Incident Centre
- Recovery Console
- Routines
- Skills Registry / Evaluation
- Memory Operations
- R2 Archive Operations

### Provider Settings
- Provider Connections
- Connect OpenAI/Codex
- Connect Claude
- Model Inventory
- Manager Chair Policy
- Routing & Fallback
- Usage & Limits
- Cost Controls
- Privacy Eligibility
- Provider Health / Reauth

### Privacy
- Privacy Control Centre
- Consent Ledger
- Egress Firewall
- Data Rights Queue
- Identity Link Review
- Sensitive Domain Policy
- Audit Explorer
- Retention Policies

### Domain intelligence
- Spare / Catalogue Demand / Fitment & Returns
- Tech / Technician Capacity & Value
- Groceries / Rounds
- Care
- Health Operations
- Logistics
- Vendor / Supplier Portfolio
- Finance / Reconciliation
- Support / Growth

### Supplier portal
- Intelligence Home
- Demand & Forecast
- Catalogue/Stock Opportunities
- Performance & SLA
- Quality & Returns
- Geography
- Aggregated Benchmarks
- Recommendations
- Report Inbox / Feedback

### Customer account
Keep warm and progressively disclosed:
- AI & Personalization
- Connected Channels
- What DIAL Remembers
- Memory Preferences
- Notifications
- Consent & Privacy
- Download/Correct/Delete/Restrict Data
- Human Support / AI handoff explanation

Do not build an overwhelming god-dashboard; use drill-downs and role-scoped progressive disclosure.

---

## 14. EVENTUALITY / FAILURE COVERAGE — DO NOT DEFER TO “LATER HARDENING”

Every affected tracer must consider its relevant failure cases from the start. The complete D-61 matrix includes:

- unknown/ambiguous/duplicate/recycled/shared identity;
- consent withdrawal and subject-rights requests;
- prompt injection / indirect document injection;
- cross-customer IDOR / customer asks for another person's order;
- supplier/vendor attempts competitor-confidential extraction;
- benchmark cohort too small;
- model asks for unnecessary identity;
- response PII leakage;
- Health cross-domain request;
- provider auth expiry/quota/spend/latency/outage;
- no manager-tier model / prohibited downgrade;
- malformed tool call;
- tool timeout/partial success;
- duplicate/out-of-order webhook;
- payment pending/duplicate callback;
- booking race;
- stock/price changed during conversation;
- supplier/technician/driver unavailable;
- customer offline mid-flow;
- worker crash after side-effect request;
- stale heartbeat/lease;
- Pause/Stop during atomic write;
- emergency-stop;
- R2 upload/missing/corrupt/checksum/lifecycle/legal-hold conflict;
- stale retrieval index;
- incomplete analytical dataset;
- metric version change;
- forecast structural break;
- correlation mistaken for causality;
- simulation mistaken for actual;
- stale/false-positive insight;
- supplier disputes recommendation;
- recommendation produces worse outcome;
- fraud suspicion;
- privacy/security breach;
- human takeover vs AI double reply;
- WhatsApp outage / 24h-template restrictions;
- conflicting RAG sources;
- network partition / clock drift.

When authoritative state cannot be verified, **writes fail closed**.

---

## 15. SECURITY / OBSERVABILITY

Preserve D-48 and add D-61 controls:

- network-isolate Hermes API/Run endpoints; DIAL Gateway is public boundary;
- per-profile/internal credentials;
- no `--yolo` / unrestricted terminal in production business profiles;
- no production DB admin/PSP/PII-vault credentials in Hermes;
- capability-scoped MCP tools;
- object AuthZ + RLS;
- idempotency/fencing;
- egress filtering;
- container/resource limits;
- prompt injection tests;
- Threat Dragon + Semgrep + Checkov + Renovate + Strix staging;
- Langfuse/AiInvocation for provider/model/tool/cost/correction/eval;
- D-54 MetricContracts for business KPIs;
- Prometheus/isolated Grafana only for infrastructure, not a permissions bypass.

Every run should trace:

```text
input/context hash
→ privacy/policy decision
→ provider/model
→ tool request/result hashes
→ approval
→ output
→ business event
→ measured outcome
```

---

## 16. SOURCE-OF-TRUTH MAINTENANCE RULE

As you implement D-61:

- update `DIAL_Consolidated_Plan_v4.md` only when a product/architecture decision changes;
- update `DIAL_Development_Agent_Pack.md` when scaffold/API/table/screen/AC contracts change;
- update always-on rules/skills when enforcement changes;
- update planning DoD/matrices with real evidence;
- create runbooks/ADRs for operational detail where appropriate;
- **do not create a standalone Hermes feature blueprint and rely on agents to remember to read it**;
- if a detailed new design is temporarily drafted, absorb its canonical decisions/contracts into master/Pack before marking the ticket Done.

---

## 17. EXECUTION STYLE

1. Reconstruct truth first.
2. Fix only real repository/environment gaps, not imaginary ones from old conversation history.
3. Plan/grill the owned slice.
4. Build the thinnest end-to-end path that proves architecture.
5. Expand within the ticket until its DoD/matrix is 100%.
6. Run tests/evals/security checks.
7. Update canonical docs/rules as implementation teaches us something.
8. Commit cohesive changes with D-log/section references.
9. Continue to the next dependency-safe slice autonomously.

Use high-quality manager reasoning for complex architectural/integration decisions; delegate mechanical bounded tasks to lower-tier workers only where quality cannot be degraded. Do not sacrifice correctness to “finish quickly.”

---

## 18. FIRST COMMANDS / FIRST OUTPUT

Start now with:

```bash
pwd
git status --short --branch
git log --oneline -15
find . -maxdepth 2 -type d | sort
find apps packages docs -maxdepth 4 -type f | sort
cat package.json
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

Then read the authority chain and produce a short **repository-truth checkpoint** containing:

- current HEAD;
- what actually exists;
- tests/build status;
- what is planned but absent;
- current owned tracer ticket or the ticket you are opening;
- D-61 Topic-7 grill outcome;
- exact first implementation slice and DoD;
- external blockers, if any.

Do not ask the founder to repeat facts already in the repository. Ask only when a genuine unresolved decision remains after repository research.

**Then proceed with implementation.**
~~~~

---

*End of Build Blueprint v1.0. Sections 1–7 are reference material; §8 is historical Dev Manager context; **§9 is the canonical current-state development handoff after D-61**. The master (`DIAL_Consolidated_Plan_v4.md`) remains product/compliance/architecture authority.*
