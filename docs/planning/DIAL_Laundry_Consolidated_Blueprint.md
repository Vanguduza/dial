# Dial Laundry — Consolidated Business + Technical Blueprint

**Status:** Plan-phase artifact (**D-52** / **D-56**). **Not product SoR.**  
**Date:** 2026-08-16  
**Authority:** (1) `DIAL_Consolidated_Plan_v4.md` → (2) `DIAL_Development_Agent_Pack.md` → (3) Blueprint / WA / promotions / stitch companions → (4) this blueprint. **On conflict, v4 + D-log win.**  
**Sources merged:**  
- Primary commercial/ops: `Harare_Laundry_Business_Plan_v2.md` (external, 2026)  
- DIAL plan: [`DIAL_Laundry_Branch_Plan.md`](./DIAL_Laundry_Branch_Plan.md), [`DIAL_Laundry_Grill_Session.md`](./DIAL_Laundry_Grill_Session.md)  
- Diagrams: [`docs/diagrams/01-layer-stack-laundry.md`](../diagrams/01-layer-stack-laundry.md), [`02-laundry-order-money-sla-swimlane.md`](../diagrams/02-laundry-order-money-sla-swimlane.md)  
- Sequencing: [`DIAL_Full_ERP_Completion_Plan.md`](./DIAL_Full_ERP_Completion_Plan.md) Phase **10b** (proposed)  
- Absorb doctrine: `DIAL_Deep_Engineering_and_OSS_Stitch.md`, `DIAL_External_Skills_Repos_Utilization.md` (**D-55**), `DIAL_v7_2_Adopted_Platform_Extensions.md` (**D-53** CERTIFIED absorb), groceries donor pattern  
**Scaffold / Build this revision:** **No.** **Commit:** founder-driven only.

---

## Executive summary (founder)

1. **Harare opportunity is real:** crowded market (Jack’s, Snow White, 100% Cleaners, …) — differentiate on **condition-photo + approval-before-wash** and **subscriptions**, not “we’re digital.”
2. **Business plan assumes a Dial-owned backyard plant**; **DIAL ERP lock D-58 is agency-only.** Recommended resolution: run the Harare garage as a **partner merchant / first plant** (or founder-owned merchant entity), while **Dial Laundry** is the marketplace agency layer — **do not** scaffold `DIAL_OWNED` wash capacity. **Founder decision required** (see Part D).
3. **Money stays Dial packages:** `amountMinor` + pricing engine; USD browse / ZiG-at-checkout (**D-57**); EcoCash + COD buttons; Job Reserve / ledger SoR — **no parallel laundry OMS**.
4. **Ops journey maps cleanly:** pickup → weigh/photos → approve → wash → return → confirm — extend `DeliveryDispatchWorkflow` (pickup → `in_plant` → return POD), not a second job engine.
5. **Mature laundry OSS is scarce** (mostly low-star demos). Prefer **reuse Dial stack** + **DONOR_UX** from Tech/Spare/Grocery patterns; reject Google Maps SoR, Baileys, Expo, second money ledger.
6. **Sequencing:** Plan-only now; Build as **Phase 10b** after groceries food (prefer G10) and only when **G5 delivery + G8 money/FDMS** are green — never reopen Phase 1.
7. **Counsel Unverified (ZW):** municipal laundry licence matrix, FDMS **service** vs goods class, CPA textile claims — engineering ships configurable gates; counsel supplies answers before customer-open.
8. **Harare Stage 1 can stay lean** (WhatsApp + spreadsheet) while Dial ERP laundry Build waits; Stage 2/3 digital chain-of-custody **is** Dial’s L1–L5 when Phase 10b opens.

---

# Part A — Business (Harare plan + Dial agency framing)

## A.1 Vision

| Lens | Statement |
| --- | --- |
| **Harare plan** | Trusted Harare-wide laundry **collection, processing, delivery** brand: *You don't come to us. We come to you.* Differentiator = dispute-proof condition photos + approval before wash. |
| **Dial Laundry (agency)** | Dial sells **certainty** that a disclosed partner laundry collects, cares for, and returns textiles in booked windows at a frozen USD price — **without Dial taking title** to plant, chemicals, or garments (**D-58**). |

**Merged product promise:** marketplace trust + Harare ops excellence (photos, SLA honesty, EcoCash/COD) on one Dial ERP account (Spare / Tech / Grocery → Services → Laundry).

## A.2 Market (Harare, 2026)

- Not empty: WhatsApp booking + pickup/delivery already common among incumbents.
- Lead with **condition-photo / approval workflow** and **subscriptions** — not “app convenience.”
- Underserved corporate tier vs Jack’s / Snow White: Airbnb / small guesthouses, salons, small restaurants, small offices, gyms, uniform-heavy SMEs.
- Household: professionals, families, students, elderly, no-machine households, urgent / ironing-averse.
- Specialty: blankets, duvets, curtains, jackets/blazers, shoes, bedding.

## A.3 Customer segments → Dial surfaces

| Segment | Harare GTM | Dial surface (recommended) |
| --- | --- | --- |
| Household B2C | WA / call / website | `gateway-web` `/laundry/*`, native, `FLOW_LAUNDRY_*` |
| Small guesthouse / Airbnb | Recurring + delivery | Same + optional B2B formal-only later (**D-49**) |
| SME linen | Priority niche | B2B formal-only if launched; hide informal |
| Specialty garments | Unit pricing | `pricingMode=unit_garment` catalogue |

## A.4 Service menu → catalogue SKUs

Map Harare price list to **service SKUs** with `pricingMode` ∈ `bag_tier` | `per_kg_step` | `unit_garment`. All payable values = **integer USD cents** (`amountMinor`) via pricing engine — **AI drafts only, never live payables**.

| Harare service | Suggested Dial `serviceKind` | Pricing mode | Notes |
| --- | --- | --- | --- |
| Wash only $1.20/kg | `wash_fold` (wash-only variant) or dedicated flag | `per_kg_step` | MVP may start bag tiers |
| Wash + Fold $1.80/kg | `wash_fold` | `per_kg_step` / bag | |
| Wash + Iron + Fold $3.00/kg | `wash_iron` | `per_kg_step` / bag | Push upgrade |
| Iron + Fold only $1.80/kg | `iron_only` | `per_kg_step` | |
| Dry + Fold only $1.80/kg | `other` / dry-only | `per_kg_step` | |
| Blankets / duvets / jackets / curtains / shoes | specialty | `unit_garment` | Unit list |
| Dry clean (Dial expand) | `dry_clean` | `unit_garment` | Licence publish gates |
| Express | `express_wash` | bag/kg | SLA bands |

**Subscriptions (Harare §15):** Family Basic / Plus / Premium kg caps. In Dial: model as **promotion / prepaid entitlement** via `@dial/promotions` patterns — **not** a second wallet money SoR; delivery still priced or partially included by band (**Founder-input**).

## A.5 Unit economics → `amountMinor` + pricing engine

Harare planning estimates (illustrative, not guarantees):

| Scenario | Throughput | ~Revenue | ~Op. profit (before owner/tax/capex) |
| --- | --- | --- | --- |
| 40 kg/day | ~1,040 kg/mo @ ~$2/kg | ~$2,080/mo | ~$1,520/mo |
| 50 kg/day | ~1,300 kg/mo | ~$2,600/mo | ~$1,975/mo |
| Mix-up to ~$2.30/kg | same kg | higher | potential >$2,300/mo |

**Dial commercial layers (agency):**

```text
Customer line (USD minor)
  = laundry service net (partner price)
  + Dial margin / take-rate (agreement)     [Founder-input]
  + pickup + return logistics               → DIAL_FEE (recommended)
  ± promotion (@dial/promotions only)
```

- Delivery Harare launch: **$0.50/km, $3 minimum** → encode as band × distance fee in pricing engine (`DIAL_FEE`), not float UI math.
- **IMTT never a customer line** (**D-60**).
- EcoCash: price USD, settle ZiG via ops **daily rate** + `fx_rate_id` (**D-57**); track **EcoCash settlement variance** KPI (Harare §19).
- COD: settle **USD** at return POD (**D-60**).

## A.6 Ops model: pickup → wash → return

**Harare journey:** WA/call/web → book → pickup or CBD drop → weigh → condition photos → customer approval → sort/wash/dry/iron/fold → QC → completion photos → delivery/CBD collect → confirm → photo retention 24h (hold if dispute).

**Dial SLA phases (textile — cold-chain N/A):**

| Phase | Promise | System |
| --- | --- | --- |
| Pickup | Booked window; intake photo/count | Slot hold + Temporal |
| Wash / care | Honest plant ETA band | `in_plant` (no fake indoor GPS) |
| Return | Booked return window | Second leg / multi-stop |
| POD | Customer confirms | Escrow release / COD reconcile |
| Claim | Provisional **48h** after POD | Claims Flow + ledger reason codes |

**Plant vs home washer:**

| Capacity type | Harare plan | Dial recommendation |
| --- | --- | --- |
| Backyard garage plant (2×7 kg, natural dry) | Dial-owned CapEx Stage 1 | Treat as **partner plant** (formal-first); **not** Dial principal inventory |
| CBD collection point | Partner storefront ($0.50–$1/order) | Partner location / drop node — no processing |
| Home washers | Not primary in Harare plan | Optional **informal** capacity later; **B2B hide** (**D-49**); formal-first launch |
| Riders | Independent, ID + agreement | Courier via `packages/delivery` + delivery-android |

**Liability (Harare + Dial grill):** stated max liability per item (cleaning cost, not replacement) at photo-approval; pre-existing damage documented. Dial default: **textile risk supplier until return POD**; Dial-caused logistics fail → Dial.

## A.7 Competitive positioning vs agency marketplace

| | Harare lean plant | Dial Laundry marketplace |
| --- | --- | --- |
| Title to wash capacity | Owner CapEx | Partners (**D-58**) |
| Differentiator | Condition-photo chain | Same UX + multi-vendor ERP trust + shared money/FDMS/delivery |
| Capex | $1.3–1.6k Stage 1 | Platform; plants fund their machines |
| Risk | Water permit, drying weather, rider trust | Dual-SoR if someone forks a laundry OMS — **rejected** |

### ⚠ Main business ↔ agency conflict

**Harare plan = Dial-owned backyard processing centre + CBD partner + citywide P/D.**  
**DIAL D-58 = agency only — no Dial-owned principal wash-plant GMV / `DIAL_OWNED` capacity.**

| Option | Description | Recommendation |
| --- | --- | --- |
| **A. Agency absorb (default)** | Garage operates as **merchant laundry #1** (founder/LLC separate from Dial agent characterisation); Dial Laundry = marketplace + fees | **Recommended** — preserves locks; still uses Harare ops playbook |
| **B. Owned capacity** | Dial holds plant as principal | Requires **new D-log** + counsel; **do not scaffold** without founder lock reopen |
| **C. Hybrid** | Soft-launch own plant off-platform while marketplace builds | Ops OK for Harare Stage 1 manual; **do not** wire Dial money as principal COGS |

**Founder decision:** confirm **A** (or reopen D-58 with counsel). Until then, eng plans **agency only**.

## A.8 GTM, geography, staffing

- **Geography:** Harare metro first (single `deliveryBandId`) — grill L-14 / Harare citywide from one processing centre.
- **GTM:** WA Business + price list + 7-day market test (Harare §23) before CapEx; Dial digital when Phase 10b.
- **Staffing Stage 1:** owner-operator + independent riders; Stage 2 part-time assistant; no large permanent staff at launch.
- **Equipment:** 2×7 kg front-loaders, natural drying first, dryer Stage 2; CBD partner before rented shop; no delivery vehicle at launch.

## A.9 Regulatory / counsel Unverified (ZW)

Tags: **[Verified]** Dial locks · **[Reported]** secondary · **[Unverified]** until counsel · **[Founder-input]** commercial.

| Topic | Harare plan | Dial posture | Tag |
| --- | --- | --- | --- |
| Council business licence (~$200/yr small-shop) | Register pre-launch | Merchant holds; Dial terms + publish gates | [Reported] / counsel for **agent** duty |
| Borehole commercial permit (Sub-Catchment) | Must confirm category | Ops for **plant merchant**, not Dial SoR | [Founder-input] |
| Company / ZIMRA / tax clearance | Three independent | Agency FDMS (**D-59**); service class **Unverified** | [Unverified] service mapping |
| Rider ID + written agreement | Required | Courier onboarding | Ops |
| Liability / CPA textile | Terms at photo approval | 18-item disclosure + claims SOP | Counsel |
| Dry-clean / controlled equipment | Specialty path | `dryCleanCapable` + licence ref gates | [Reported] SI schedules |
| EcoCash USD vs ZiG settlement | Confirm at merchant reg | **D-57** daily rate + variance KPI | Ops + lock |

**Counsel checklist before Dial Laundry customer-open:** see Branch Plan Part 6.6 (licence matrix, FDMS service class, CPA mid-wash, WHT on commission, photo retention).

---

# Part B — Technical (DIAL ERP absorb)

## B.1 Package / surface map

```text
Surfaces:  gateway-web /laundry/*  ·  native Android/iOS (no Expo)  ·  WA Cloud API Flows  ·  admin  ·  delivery-android
Packages:  catalogue · payments/Job Reserve · ledger · delivery+Temporal · tax/FDMS · promotions · ai (drafts) · search-indexer
Infra:     Postgres SoR · Meili laundry_offers_v1 · Temporal · Redis/BullMQ · Nominatim/OSRM/VROOM · MapLibre · outbox
```

| Concern | Absorb into | Explicit non-goal |
| --- | --- | --- |
| Service offers / cart | `@dial/catalogue` (`vertical=laundry`) | Parallel laundry catalogue DB |
| Money / escrow | `@dial/payments` + ledger + PspAdapter | Medusa/Formance/Fleetbase money |
| Pickup/return SLA | `@dial/delivery` + `DeliveryDispatchWorkflow` | Second laundry job OMS |
| Fiscal | `@dial/tax` + Virtual Gateway (**D-59**) | Physical printer SoR |
| Search | Meili `laundry_offers_v1` | Typesense fork |
| WA | `adapters/whatsapp` official only | Baileys / unofficial |
| Maps | MapLibre + Nominatim/OSRM/VROOM | Google/Mapbox as SoR |
| Hub | **Services** peer Dial a Tech (recommended) | Separate monorepo |

Diagrams: layer stack + money/SLA swimlane under `docs/diagrams/`.

## B.2 Tracer L0–L6 (finite — **D-52**)

| Layer | Scope | Exit evidence (summary) |
| --- | --- | --- |
| **L0** | Grill + ticket + counsel flags | Wave accepted / “use recommended”; DoD ticket; no Build until Phase 10b gates |
| **L1** | Thin vertical: browse USD → cart → EcoCash\|COD → webhook → ledger → FDMS queue → delivery job stub | MARKETPLACE only; B2B informal reject; no IMTT line; responsive checkout |
| **L2** | Bag/kg/unit pricing; multi-laundry split; Factory publish | Snapshot fields; review→Meili |
| **L3** | Pickup+return slots; intake+POD; `in_plant`; MapLibre legs | Capacity never negative; recon smoke |
| **L4** | Claims / liability reason codes | Ledger journals |
| **L5** | `FLOW_LAUNDRY_*` + EcoCash\|COD buttons | Same payment intent as web |
| **L6** | AI care/ranking drafts | Promptfoo + capability review; no payables |

No endless PD invent. Fits T0–T9 / E1–E6 — no Train 0–10 (**D-53**).

## B.3 Data model sketches

```text
LaundryOffer { offerId, serviceKind, pricingMode, priceMinor, currency=USD,
  bagTierLabel?, maxWeightGrams?, turnaroundHoursMin/Max,
  offerSource=MARKETPLACE, supplierFormality, dryCleanCapable, laundry_licence_ref? }

LaundrySlot { slotId, bandId, window, leg: pickup|return, capacity* }

PlantCapacity { supplierOrgId, serviceKind, throughputUnits, validUntil }

LaundryOrder / OfferSnapshot { … + pickupSlotId, returnSlotId, careLevel,
  fx_rate_id, Sold by, formality, intakeMediaIds[], podMediaIds[] }

LaundryClaim { taxonomy, media, liabilityBearer, ledgerReasonCode }
```

Photo retention: Harare 24h post-confirm (dispute hold) — implement as **policy config** + MinIO/S3-compatible object store already in Dial media path (or Supabase storage); **PicPeak**-style gallery UX for ops review (**DONOR_UX**).

## B.4 Money path / escrow / FX

Spine (reuse E1a / groceries):

```text
Cart USD amountMinor → assertB2bMayPurchase → freeze OfferSnapshot + DIAL_FEE
  → COD intent | direct capture | authorizeJobReserve
  → verified webhook (truth) → ledger → FDMS outbox → createDeliveryJob + slots
```

| Condition | Path |
| --- | --- |
| COD | Intent → return POD reconcile (USD) |
| EcoCash/card, single laundry, &lt; T | Direct capture |
| Multi-laundry OR ≥ T | Job Reserve |
| High-value ≥ T_hv | Prefer escrow |

Provisional: **T = 5000**, **T_hv = 10000** USD minor (ops-tunable).  
No tech **D-50** WHT auto-apply to laundry merchants; payout provisional **T+3**.

## B.5 Explicit bans

- **No parallel laundry OMS / money / delivery SoR**
- No `DIAL_OWNED` plant inventory without new D-log
- No AI payable amounts; no Expo customer shell; no Baileys; no Google/Mapbox SoR
- No IMTT checkout line; no promo cash-out; no physical FDMS printer as SoR

---

# Part C — Open source repos & tools (SELF-HOST / absorb strategy)

## C.0 Doctrine (do not reopen locks)

| Adopt how | Meaning |
| --- | --- |
| **DONOR_UX** | Screen/flow patterns only (**D-38**) — reimplement against Dial APIs |
| **SELF_HOST_RUNTIME** | Run beside Dial infra; Dial remains SoR (Tier 2 sibling) |
| **LIBRARY** | npm/crate/SDK embed |
| **REJECT** | Conflicts locks, copyleft into proprietary core without counsel, or dual SoR |

**D-55:** selective habits — no full upstream tree dumps.  
**D-53:** CERTIFIED–DORMANT = internal readiness labels, not public MVP ladder.  
**Groceries pattern:** Mercur/Medusa/Saleor = UX only; Meili/MapLibre/Temporal = real stack; reject grocery OMS as money SoR — **same for laundry**.

## C.1 Already-in-DIAL stack (do not reinvent)

| Component | Role for laundry | Adopt how |
| --- | --- | --- |
| **Temporal** + `DeliveryDispatchWorkflow` | Pickup → in_plant → return | **Reuse** (SELF_HOST_RUNTIME already) |
| **Redis / BullMQ** + bull-board | Timers, ETA, media, webhooks | **Reuse** |
| **Meilisearch** | `laundry_offers_v1` browse | **Reuse** |
| **Postgres / Supabase** + Realtime | Catalogue SoR; courier track | **Reuse** |
| **MapLibre + Nominatim + OSRM + VROOM** | Distance, VRP, track | **Reuse** (**D-44**) |
| **gateway-web** `/spare` `/grocery` `/tech` | Pattern for `/laundry` | **Reuse** |
| **PspAdapter** (Paynow, ContiPay, EcoCash, PayPal, COD) | Checkout rails | **Reuse** (**D-43**) |
| **Job Reserve / ledger / tax FDMS** | Money + fiscal | **Reuse** |
| **adapters/whatsapp** Cloud API | Flows + templates | **Reuse** — official only |
| **Cal.com** (AGPL self-host) | Slot sibling only | **Reuse** — Dial job SoR remains Dial |
| **Schedule-X** (MIT) | Admin capacity calendar | **LIBRARY** / DONOR already D-46 |
| **Chatwoot** | Live chat | **Reuse** |
| **foodhub-compose** (Apache-2.0) | Courier intake/POD UX | **DONOR_UX** (strip Google/Stripe) |
| **FixItNow** (stitch §1.1) | Services hub booking UX | **DONOR_UX** for Laundry peer Tech |
| **Mercur** storefront / vendor-panel | Multivendor / supplier UX | **DONOR_UX** |
| **PicPeak** (MIT) | Intake/POD evidence gallery | **DONOR_UX** |
| **csv-import** (MIT) | Supplier service CSV | **DONOR_UX** / LIBRARY |
| **ESCPOS-ThermalPrinter-Android** (MIT) | Optional bag tags | **LIBRARY** — **not** fiscal SoR (**D-40a**) |
| **LiteLLM / Langfuse / Promptfoo** | AI drafts + eval | **Reuse** — never money |
| **n8n** | Ops automation | Optional SELF_HOST — not money SoR |
| Object storage (S3-compatible / Supabase) | Bag/condition photos | **Reuse** — MinIO-class if self-host media |

## C.2 Research honesty — laundry-specific OSS

**Mature, production-grade open-source laundry/dry-clean SaaS is rare.** Most GitHub hits are low-star demos, student projects, or Stripe/Google-Maps-centric stacks unsuitable as Dial SoR. Prefer adapting **Dial a Tech + Spare + groceries delivery slots** over forking a laundry OMS.

## C.3 Candidate matrix (researched 2026-08)

### 1) Laundry / wash-fold / dry-clean OSS

| Name | URL | License | Good for | Adopt how | Fits / conflicts | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| **Lavandaria** | [HSousa1987/Lavandaria](https://github.com/HSousa1987/Lavandaria) | **MIT** | Kg + itemized laundry orders; **photo verification** (cleaning line); status lifecycle | **DONOR_UX** | Aligns Harare condition-photo story; Node/Postgres rhyme — **not** money SoR | **P0 research** |
| **Dry-Drop** | [JordanCJ7/Dry-Drop](https://github.com/JordanCJ7/Dry-Drop) | **MIT** | PHP laundry P/D scheduling, COD, customer/admin dashboards | **DONOR_UX** | Screen flows only; PHP stack ≠ Dial monorepo runtime | **P1** |
| **Daya Laundry** | [ahmadnurhidayat/laundry](https://github.com/ahmadnurhidayat/laundry) | Check SPDX at Gate 1 | Per-kg / per-item POS, public track token, thermal receipt layout | **DONOR_UX** | Receipt **layout** only — fiscal = Dial FDMS; Cloudflare D1 ≠ Dial SoR | **P1** |
| **Sunshine Laundrymat** | [nrobbyjay/sunshinelaundrymat](https://github.com/nrobbyjay/sunshinelaundrymat) | **MIT** | WIP wash/fold + P/D boilerplate | **DONOR_UX** / Park | Immature; useful as screen sketch only | **Park** |
| **Smart Laundry Basket** | [sureshalluru/smart_laundry](https://github.com/sureshalluru/smart_laundry) | **Elastic-2.0** (not OSI) | Booking, POS, P/D, recurring | **REJECT** as SELF_HOST_RUNTIME for Dial marketplace SaaS | ELv2 forbids offering as hosted service to third parties — conflicts agency multi-tenant SaaS; also **Google Maps** + Stripe + Claude vision as defaults | **REJECT** runtime; optional **Park** UX screenshots only with counsel |
| **WashWise** | [MrPatt025/WashWise](https://github.com/MrPatt025/WashWise) | Claims MIT | Laundromat SaaS / machine telemetry | **Park** / likely **REJECT** SoR | Low maturity / multi-tenant SaaS overlap; verify stars & scope — not Dial job SoR | **Park** |
| **we-laundry-client** | [hxxtae/we-laundry-client](https://github.com/hxxtae/we-laundry-client) | Apache-2.0 (verify) | Laundry **POS** intake UX | **DONOR_UX** | Korean dry-shop POS patterns; strip foreign payments | **P1** |

### 2) Field service / booking / P/D scheduling UIs

| Name | URL | License | Good for | Adopt how | Fits / conflicts | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| **FixItNow** (stitch-locked) | [AyanSujon/FixItNow](https://github.com/AyanSujon/FixItNow) | Check Gate 1 | Services marketplace booking UX | **DONOR_UX** | Peer Dial a Tech → Laundry under Services | **P0** |
| **Cal.com** / **cal.diy** | [calcom/cal.com](https://github.com/calcom/cal.com) AGPL · [calcom/cal.diy](https://github.com/calcom/cal.diy) MIT CE | Slot booking | **SELF_HOST_RUNTIME** sibling | Slots only — Dial capacity/job SoR | **P0** (already) |
| **Schedule-X** | [schedule-x/schedule-x](https://github.com/schedule-x/schedule-x) | **MIT** | Admin plant/courier day board | **LIBRARY** | D-46 — do not replace Cal for customer slots | **P0** |
| **Open Field Scheduling** | [clawnify/open-fieldservice](https://github.com/clawnify/open-fieldservice) | **MIT** (verify) | FSM dispatch UI | **DONOR_UX** | Immature stars; study dispatch boards only | **P1** |
| **Fleetbase / Navigator** | fleetbase/* | **AGPL-3.0** | Courier lifecycle UX | **DONOR_UX** reference only | **REJECT** runtime job SoR (**D-45**) | Pattern only |

### 3) Route / last-mile

| Name | License | Adopt how | Note |
| --- | --- | --- | --- |
| **OSRM** + **VROOM** | BSD-2-Clause | **SELF_HOST_RUNTIME** | **Primary** (**D-44**) |
| **Nominatim** | GPL-2.0 server | **SELF_HOST_RUNTIME** | Geocode sibling |
| **MapLibre** | BSD | **LIBRARY** | Client render |
| **AWS Last Mile Hyperlocal** | MIT-0 | **DONOR_UX** / algorithm into `packages/delivery` | **D-45a** |
| **Google Maps / Mapbox GL** | Proprietary | **REJECT** as SoR | Strip from any donor |
| **jsprit** | Apache-2.0 | Alternate VRP only | Not offer-cycle engine |

### 4) Temporal / BullMQ / Redis

**Already Dial — reuse, do not re-adopt.** Temporal = durable laundry SLA; BullMQ = timers/media; Redis = queues/cache.

### 5) Meili / Supabase / MinIO-class media

| Tool | Adopt how | Laundry use |
| --- | --- | --- |
| **Meilisearch** | SELF_HOST (already) | `laundry_offers_v1` |
| **Supabase Postgres + Realtime** | Already | SoR + track |
| **S3-compatible / MinIO** | SELF_HOST if used for media | Condition/POD photos; TTL deletion jobs |
| **Sharp** | LIBRARY | Mobile image optimise |

### 6) WhatsApp

| | |
| --- | --- |
| **Official Cloud API + Flows** | **SELF_HOST_RUNTIME** N/A — Tier 3 proprietary; **required** |
| **Baileys / whatsapp-web.js / unofficial** | **REJECT** (**D-40**) |

### 7) POS / receipts vs FDMS agency

| Name | License | Adopt how | Note |
| --- | --- | --- | --- |
| **opensourcepos** | MIT (+ footer retention clause) | **DONOR_UX** / **REJECT** runtime | Retail POS — not agency FDMS; study ticket UI only |
| **ESCPOS Android** (D-46) | MIT | **LIBRARY** | Bag tags / customer copy — **fiscal truth = Virtual FDMS** (**D-40a** / **D-59**) |
| **react-pdf** | MIT | **LIBRARY** | Statements / claim PDFs |
| Any POS as money ledger | — | **REJECT** | Dual SoR |

### 8) FixItNow-style Services hub

Use **FixItNow + Dial a Tech** patterns for Laundry discovery → book slots → pay → track. Laundry is **service + dual logistics legs**, not spare SKU browse alone — still **Services** hub (grill L-16).

### 9) Verdict on laundry GitHub stars

Few high-quality, permissively licensed laundry systems exist. **Do not wait for a laundry OSS SoR.** Build Dial Laundry by absorbing:

1. Tech Services UX (FixItNow)  
2. Grocery dual-slot / delivery Temporal patterns  
3. Spare agency Sold-by + Meili + money spine  
4. Lavandaria / Daya / we-laundry **photo + POS screen** donors only  

## C.4 Top adopt list (summary)

**P0**

| Item | How |
| --- | --- |
| Dial existing stack (Temporal, Meili, MapLibre/OSRM/VROOM, payments, WA Cloud API, gateway-web) | **Reuse** |
| FixItNow (+ Tech) Services UX | **DONOR_UX** |
| Lavandaria condition-photo / order lifecycle UX | **DONOR_UX** |
| Cal.com / Schedule-X | **SELF_HOST** / **LIBRARY** (already) |
| foodhub-compose courier intake/POD | **DONOR_UX** |
| PicPeak evidence gallery | **DONOR_UX** |

**P1**

| Item | How |
| --- | --- |
| Dry-Drop / Daya / we-laundry POS screens | **DONOR_UX** |
| Open Field Scheduling dispatch boards | **DONOR_UX** |
| csv-import laundry catalogue | Already D-46 |
| Mercur vendor-panel for plant portal | **DONOR_UX** |

**REJECT**

| Item | Why |
| --- | --- |
| Smart Laundry Basket as self-host marketplace runtime | ELv2 + Google Maps + Stripe dual-SoR risk |
| Fleetbase / Medusa / Saleor / Formance as laundry OMS or money | Dual SoR |
| Baileys / unofficial WA | **D-40** |
| Google / Mapbox as distance/map SoR | **D-44** |
| Expo customer shell | **C-5** |
| Unleash / OR-Tools as SoR | **D-53** |
| AI models writing payables | Non-negotiable |
| Parallel laundry monorepo OMS | Explicit ban |

---

# Part D — Decisions & sequencing

## D.1 Recommended defaults (from grill — not locks until founder accepts)

| ID | Default |
| --- | --- |
| R1 | Harare metro single band |
| R2 | **Agency only** — Harare garage = partner plant #1, not Dial principal |
| R3 | Hub = **Services** (peer Tech) |
| R4 | **D-57** USD browse / ZiG pay / EcoCash\|COD buttons |
| R5 | Formal-first; B2B hide informal |
| R6 | `DIAL_FEE` logistics; supplier until return POD |
| R7 | Escrow rule T=5000 / T_hv=10000 |
| R8 | Declared bag/kg/unit MVP; intake reprice phase 2 |
| R9 | Full WA Flows when Phase 9 ready |
| R10 | No auto tech WHT; payout T+3 |
| R11 | Phase **10b** after groceries food; gate G5+G8 |
| R12 | FDMS: `DIAL_FEE` now; supplier service class pending counsel |

Living grill: [`DIAL_Laundry_Grill_Session.md`](./DIAL_Laundry_Grill_Session.md).

## D.2 Open founder decisions

1. **Owned plant vs agency-only** — recommend agency absorb (Part A.7).  
2. **Hub: Services vs Shop.**  
3. Take-rate launch bps + subscription inclusion of delivery.  
4. Claim window hours (48h provisional) + liability cap copy.  
5. Whether Harare Stage 1 runs **manual** (WA+sheet) in parallel before Phase 10b Build.  
6. Promote Phase **10b** into frozen Completion Plan spine (today: proposed only).  
7. Informal home washers on B2C timeline.

## D.3 Fit vs Full ERP Completion Plan Phase 10b

| Fact | Status |
| --- | --- |
| Documented in Completion Plan §9 | **Proposed Phase 10b** after G10 food; gate G5+G8; Plan-only until founder promotes |
| Frozen phases 0–12 | Laundry **not** counted until promoted |
| Must not | Reopen Phase 1; claim G3/G5 before evidence; fixture-only green |

## D.4 Plan-only vs Build later

| Now (Plan) | Later (Build — Phase 10b) |
| --- | --- |
| This blueprint + branch plan + grill + diagrams | L1–L6 implementation |
| Harare ops can Stage 1 manual | Digital chain-of-custody = Dial L1–L5 |
| Counsel checklist open | Customer-open only after Appendix C / counsel greens |
| OSS research matrix | Selective DONOR_UX absorb in tickets |

**CERTIFIED–DORMANT (**D-53**):** Dial Laundry can be internally CERTIFIED while `customer_bookable=false` until gates + counsel — not a public multi-phase MVP ladder.

---

# Part E — Crosswalk table

| Harare business plan § | Dial blueprint | Package / ticket later |
| --- | --- | --- |
| §1–2 Vision / journey | A.1, A.6, B.4 swimlane | L1–L3 |
| §3 Customers | A.3 | Catalogue facets / B2B |
| §4 Competition | A.2, A.7 | GTM copy — ops |
| §5–6 Price + delivery $ | A.4–A.5 | pricing engine + `DIAL_FEE` |
| §7 CBD collection | A.6 | Partner location / drop node |
| §8–9 Water / power | A.9 (merchant ops) | Out of Dial SoR |
| §10 Payments EcoCash/cash | A.5, B.4 | PspAdapter EcoCash + COD |
| §11–14 Equipment / budget | A.8 Stage 1 lean | Merchant CapEx — not Dial plant SKU |
| §15 Subscriptions | A.4 | `@dial/promotions` entitlement |
| §16 Digital chain-of-custody | A.6, B.2–B.3 | L1–L5 + media TTL |
| §17 Garage zones | Merchant SOP | Supplier portal checklist |
| §18–19 Finance / KPIs | A.5, MetricContract | Command Centre Actual |
| §20 Expansion stages | D.3–D.4 | Phase 10b timing |
| §21–22 Legal / risk | A.9 | Counsel + publish gates |
| §23 Action plan | D.2 Stage 1 manual vs Build | Founder ops checklist |
| Dial Branch Plan Parts 1–17 | Entire blueprint | L0–L6 tickets |
| Grill Waves 1–2 | Part D | Founder “use recommended” |
| Diagrams 01–02 | B.1 / B.4 | Eng onboarding |
| Completion Plan Phase 10b | D.3 | Dev Manager sequencing |
| OSS stitch / D-55 / D-53 | Part C | Absorb tickets only |

---

## Appendix — Authority citations (eng)

| Lock | Relevance |
| --- | --- |
| C-5 | Native not Expo |
| D-38 / D-55 | UX donors / selective skills — no full tree dumps |
| D-40 / D-40a | WA Cloud API; virtual FDMS |
| D-42 | Promotions SoR |
| D-43–D-45a | PspAdapter; MapLibre; delivery Temporal; AWS last-mile donor |
| D-46 | Complementary ops stitch |
| D-47 / D-48 | IDOR + AppSec toolchain |
| D-49 | B2B hide informal |
| D-52 / D-56 | Tracer + grill |
| D-53 / D-54 | CERTIFIED absorb; MetricContract / Factory |
| D-57 | USD browse; ZiG pay; EcoCash\|COD buttons |
| D-58 / D-59 / D-60 | Agency; FDMS classes; IMTT opex; COD USD |
| D-61 | AI capabilities; no prod agent host |

**Peer docs:** [`DIAL_Laundry_Branch_Plan.md`](./DIAL_Laundry_Branch_Plan.md) (depth SoR for eng sections) · [`DIAL_Laundry_Grill_Session.md`](./DIAL_Laundry_Grill_Session.md) · groceries plan for absorb template · `DIAL_Deep_Engineering_and_OSS_Stitch.md`.

---

*End of Dial Laundry Consolidated Blueprint.*
