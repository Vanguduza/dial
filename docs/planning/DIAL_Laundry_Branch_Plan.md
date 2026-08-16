# Dial Laundry — Branch Integration Plan (Peer-Depth)

> **See first:** [`DIAL_Laundry_Consolidated_Blueprint.md`](./DIAL_Laundry_Consolidated_Blueprint.md) — merges Harare business plan + this depth plan + OSS absorb matrix for founders and eng cite.

**Status:** Plan-phase artifact (**D-52** / **D-56**). **Not product SoR.**  
**Date:** 2026-08-16  
**Authority conflict order:** (1) `DIAL_Consolidated_Plan_v4.md` → (2) `DIAL_Development_Agent_Pack.md` → (3) Blueprint / WA / promotions companions → (4) this plan. **On any conflict, v4 + D-log win.**  
**Grill:** Founder grill Part 15 + living session [`DIAL_Laundry_Grill_Session.md`](./DIAL_Laundry_Grill_Session.md). Run grill before scaffolding money / WA / maps / AI / catalogue / Intelligence for this branch.  
**Repo facts used:** `packages/{catalogue,payments,delivery,tax,ledger,promotions,ai,queues,search-indexer,shared}`, `adapters/{psp,fdms,maps,whatsapp}`, `apps/{gateway-web,worker-temporal,worker-queues}`, Pack §8 Meili shape, E1a money spine, `DeliveryDispatchWorkflow` (D-45), agency FDMS classes in `@dial/tax` (D-59), groceries pattern `DIAL_Groceries_Liquor_Branch_Plan.md`, Full ERP Completion Plan Phases 0–12.  
**Scaffold code this revision:** **No.**

---

## Part 0 — How to read this, confidence & research gaps

### 0.1 Purpose and depth bar

This document is the **Dial Laundry vertical companion** to v4 — same *section kinds* as the groceries branch plan: market/problem register, commercial, tax/compliance with confidence tags, architecture absorb map, money/escrow, delivery SLA, catalogue/Meili, WA, AI drafts-only, security, tracer **L0–Ln**, L-log draft decisions, launch checklist, open Unverified counsel items.

It does **not** reopen locks. It does **not** replace Spare/Tech/Grocery product SoR. It proposes **L-log draft decisions** pending founder (Part 13) — nothing here silently locks.

### 0.2 Confidence tags (same grammar as v4 §7)

| Tag | Meaning |
| --- | --- |
| **[Verified]** | Primary instrument, official notice, or locked DIAL D-log / Pack contract already in-repo |
| **[Reported]** | Credible secondary (SI text, ministry/council by-law digest, trade press) — not counsel-confirmed for marketplace agency |
| **[Unverified]** | Research lead or common practice claim — **treat as false until counsel/ops confirm** |
| **[Founder-input]** | Commercial number or policy the founder must supply |
| **[Engineering]** | DIAL implementation posture that does not invent statute |

**Honest status:** Municipal laundry/launderette licensing, dry-cleaning chemical / ODS equipment duties, platform-vs-merchant licence holder for *home washers*, CPA damage/lost-item allocation for textile care, and whether laundry **service** lines map 1:1 to D-59 `GOODS_*` vs fee-only `DIAL_FEE` are **predominantly [Unverified] or [Reported]** here. Engineering implements **configurable gates + audit trails**; counsel supplies numbers, copy, and who must hold what licence before customer-open.

### 0.3 What this document delivers

1. Market & problem register (agency laundry / home washers — not DIAL-owned wash plants).  
2. Dual-surface product inventories (web + native) + Services hub placement + care labels / bag tiers.  
3. Commercial architecture: take-rate, pickup/delivery fees as `DIAL_FEE`, weight/bag `amountMinor`, damage scenarios.  
4. Pack-§8-style `laundry_offers_v1` Meili schema + capacity heartbeat.  
5. Money path: E1a reuse, laundry OfferSnapshot fields, PspAdapter, COD USD, escrow table.  
6. Tax / FDMS / municipal licensing brief + counsel checklist (**service vs goods Unverified**).  
7. Delivery / Temporal: **pickup → wash → return-delivery** SLA (textile care — cold-chain N/A).  
8. WhatsApp companion chapter (`FLOW_LAUNDRY_*`).  
9. AI capability contracts + Promptfoo + MetricContract (drafts only).  
10. Security IDOR/RLS for laundry orders / bags / claims.  
11. OSS stitch table (SoR vs pattern).  
12. Tracer **L0–L6** with DoD evidence columns.  
13. Proposed L-1…L-n decisions (pending founder).  
14. Launch checklist + ops KPIs.  
15. Founder grill with recommended defaults.  
16. Full ERP Completion Plan fit: **Phase 10b candidate** (after Phase 10 groceries food; does **not** reopen Phase 1).

### 0.4 Reading order for agents

1. v4 Parts 0–1 locks + D-49…D-61  
2. Agent Pack §2 non-negotiables + §8 Meili  
3. Groceries branch plan (absorb pattern) — then **this plan** (Parts 1–16)  
4. `DIAL_WhatsApp_Flows_and_Templates.md` style for Flow implementation (mirror, do not fork SoR)  
5. `dial-grill-locks` → ticket DoD → `dial-tracer-slice` Build  

### 0.5 Research gaps status

| Gap cluster | Status | Blocks true peer depth |
| --- | --- | --- |
| Harare / municipal laundry & launderette licence matrix for *marketplace agent* | **[Reported]** local by-law patterns (e.g. licensed-premises laundry/launderette/laundry-depot definitions in council SIs) — Harare-specific counsel map needed | Yes — Part 6.6 |
| Dry-cleaning solvents / industrial washer & dry-cleaning machine controls (ODS/GHG equipment schedules) | **[Reported]** SI environmental management schedules list dry-cleaning / industrial washing machines as controlled equipment categories | Soft — publish gates for dry-clean suppliers |
| Home washer / informal capacity licensing | **[Unverified]** | Soft — informal policy grill |
| CPA textile damage / lost item / electronic cancellation read-across | **[Unverified]** via v4 §7.5 framing | Yes — refund SOP counsel |
| FDMS class for **laundry service** (vs goods) | **[Unverified]** — D-59 classes are fee + goods; service supply characterisation needs tax opinion | Yes — Part 6.1 |
| Founder commercial inputs (take rate, bag tiers, SLA hours, liability caps) | **[Founder-input]** | Yes — unit economics |
| Escrow threshold for laundry | Grill / L-log | Soft block L1 money design |

**Self-assessment:** Structural/engineering depth ≈ **~80–85% of groceries section kinds**. True **100%** needs founder commercial cells + Zimbabwe counsel on municipal laundry licences + FDMS service characterisation + CPA textile claims (Part 6.6).

### 0.6 Hard locks (never reopen)

Agency **D-58** (no principal wash-plant stock / no `DIAL_OWNED` inventory of plant capacity as DIAL-owned GMV principal); Job Reserve / ledger money SoR; **D-49** B2B hide informal; **D-57** USD browse + ZiG-at-checkout; **D-59** FDMS classes (extend carefully — do not invent silent fourth class without counsel); **D-60** IMTT opex + COD USD; official WhatsApp Cloud API only; MapLibre + Nominatim/OSRM/VROOM SoR (**D-44**); AI never writes payable amounts; no Expo customer shell (**C-5**); delivery job SoR = `packages/delivery` + Temporal (**D-45**); promotions = `@dial/promotions` only (**D-42**).

---

## Part 1 — Market & problem register

### 1.1 Vision sentence (laundry vertical)

> **Dial Laundry sells certainty that a disclosed partner laundry (or approved home washer) collects, cares for, and returns the customer’s textiles in the booked windows — at a frozen USD price the customer reviewed — without DIAL taking title to laundry plant, chemicals, or garments.**

Everything in this vertical either produces that certainty (service catalogue, bag/weight pricing engine, pickup/wash/delivery SLA, claim evidence, ledger, FDMS) or distributes it (web, native, WhatsApp). Features that do neither stay off the critical path.

### 1.2 Market evidence `[Reported]` / `[Unverified]`

**Framing.** Public Zimbabwe laundry-marketplace TAM with auditor-grade sizing is thin. Evidence below is behavioural and competitive enough to shape product — not to replace founder unit-economics inputs.

| Fact / observation | Figure / note | Why it matters | Confidence | Source lead |
| --- | --- | --- | --- | --- |
| Urban demand for wash/fold + dry clean | Harare households + lodges/Airbnb + clinics linen [common knowledge] | Recurring frequency > Spare; slots + SLA matter | [Unverified] sizing | Market practice |
| Horizontal apps already carry “laundry” alongside groceries/packages | Competitor marketing bundles laundry with courier | Customers expect pickup + return, not storefront-only | [Reported] | Competitor copy (same class as groceries plan) |
| Mobile-money + COD | EcoCash ubiquitous; COD culturally strong | Aligns **D-57** EcoCash\|COD + **D-60** COD USD | [Verified] DIAL lock | v4 D-57 / D-60 |
| Municipal licensed premises for laundry / launderette / laundry depot | Council by-laws define laundry, launderette, depot; hygiene/equipment standards | Formal partner onboarding needs licence refs | [Reported] | e.g. council licensed-premises SI patterns (Shurugwi 2025 laundry section; Harare licensed-premises amendments) — **not** marketplace-agency counsel |
| Controlled equipment schedules include dry-cleaning / industrial washers | Environmental management SI schedules | Dry-clean suppliers may need extra publish gates | [Reported] | SI 2023 ODS/GHG equipment schedules |
| WA as commerce surface | High WA penetration | Laundry MVP should include WA thin path (grill default) | [Reported] | v4 §4.6 |

**Competitive position.** Incumbents are often single-brand laundries or courier add-ons. DIAL’s wedge: **one ERP account** (Spare/Tech/Grocery already) → Services → Dial Laundry with **agency Sold by {Laundry}**, shared Job Reserve / FDMS / delivery SoR, textile-care SLA, and B2B formal-only filters.

### 1.3 What comparable laundry ventures get wrong (lessons for DIAL)

| Failure mode | Lesson encoded in this plan |
| --- | --- |
| Owning wash plants before unit economics | **Forbidden** without new D-log (**D-58**). Agency partners only (default). |
| Opaque “per bag” float pricing | Deterministic pricing engine → `amountMinor`; bag tiers / kg steps frozen in OfferSnapshot |
| AI quoting garment prices live | AI drafts care guidance / category only — **never** payable |
| Liability silent until dispute | Supplier until return POD default; Dial-caused pickup/delivery fail → Dial (mirror grocery spoilage) |
| Dual laundry OMS / money | Reject parallel laundry SoR |
| IMTT on checkout | **D-60** |
| Informal home washer visible to B2B | **D-49** filter at Meili/API |

### 1.4 Problem register — laundry specific

#### 1.4-1. Service ≠ simple SKU

**Problem:** Wash/fold, dry clean, ironing, express, starch, stain treatment — mix of service types + optional add-ons + pickup/delivery windows.  
**Solution:** Catalogue offers as **service SKUs** with `serviceKind`, `pricingMode` (`bag_tier` | `per_kg_step` | `unit_garment`), frozen `amountMinor`; cart can mix service lines + `DIAL_FEE` logistics lines.

#### 1.4-2. Weight / bag price surprise

**Problem:** Customer estimates “one bag”; plant weighs more at intake → payable creep + AI temptation.  
**Solution:** **MVP = declared bag tiers / packed weight steps only** (customer selects tier; intake overage = human pricing-engine adjust + customer accept — phase 2). AI never writes payable.

#### 1.4-3. Textile damage / lost item disputes

**Problem:** Stain, shrink, colour bleed, missing shirt — courier vs plant vs customer care-label abuse.  
**Solution:** Intake photo + item count (MVP); POD on return; claim taxonomy; **supplier liability until return POD** default; Dial absorbs Dial-caused logistics fail (grill L-5).

#### 1.4-4. Multi-leg SLA (pickup → wash → deliver)

**Problem:** Single grocery “out for delivery” model understates laundry.  
**Solution:** Extend Temporal job metadata / phases: `pickup_window` → `in_plant` → `return_window` → POD; customer track honesty; miss → reschedule Flow.

#### 1.4-5. Multivendor / multi-plant settlement

**Problem:** One payment, N laundry payables + Dial fee.  
**Solution:** Integer journals; one Intent/Job Reserve; split ledger; webhook idempotency (same as grocery Part 1.4-4).

#### 1.4-6. Informal home washers vs formal plants

**Problem:** D-60 B2C informal visibility vs hygiene optics for textiles.  
**Solution:** `informalAllowed` product policy; **formal-first** launch recommended; B2B **formal-only** (**D-49**); home washer = informal capacity with disclosure + capacity gates (grill).

#### 1.4-7. Dry-clean chemical / premises compliance

**Problem:** Platform enables remote sale of dry-clean services; enforcement targets premises.  
**Solution:** Supplier `laundry_licence_ref` + optional `dry_clean_capable` publish gates; counsel who-holds-what (**Unverified**).

#### 1.4-8. Slot / capacity thrash

**Problem:** Overbooked pickup vans + plant throughput → CPA timing risk.  
**Solution:** Separate capacity pools: **pickup slots**, **plant throughput**, **return slots**; transactional holds; degrade messaging (Pack §6.22).

#### 1.4-9. B2B linen / hospitality informal leak

**Problem:** Hotels/clinics must not see informal home washers.  
**Solution:** Meili `supplierFormality=formal` + `assertB2bMayPurchase` + leak=0 on `laundry_offers_v1`.

#### 1.4-10. Promo cash-out on recurring laundry

**Problem:** High-frequency wash invites wallet abuse.  
**Solution:** `@dial/promotions` only; non-cash-out (**D-42**); vertical-scoped campaigns.

### 1.5 Why agency marketplace (not Dial-owned wash plants)

| Criterion | Principal wash plants | Agency marketplace (**recommended default**) |
| --- | --- | --- |
| Title / COGS | DIAL plant, chemicals, labour | Partner laundry / home washer principal (**D-58**) |
| FDMS | VAT on GMV risk | Fee + on-behalf service/goods characterisation per counsel (**D-59**) |
| Capital | Plant CapEx + chemicals | Working capital on fees + float policy |
| Competitive wedge | Race on plant utilisation | Multivendor + ERP trust + SLA |
| Reopen cost | New D-log + counsel | N/A — do not scaffold `DIAL_OWNED` plant inventory |

---

## Part 2 — Product dual-surface & scope

### 2.1 Hub placement `[Engineering]` — recommended

Authenticated Dial home (**v4 §1.4**): **Shop | Services**.

**Recommended default:** Dial Laundry lives under **Services** (peer to Dial a Tech) — service marketplace with logistics legs — **not** under Shop groceries:

```text
Shop
  ├── Dial a Spare
  ├── Dial Groceries & Liquor
  └── (future shop verticals)
Services
  ├── Dial a Tech
  └── Dial Laundry          ← this vertical (recommended)
```

**Alternate (grill):** Shop tab if founder wants “browse laundry offers” adjacent to groceries. Either way: **one account**, routes first under `apps/gateway-web` (`/laundry/*`); split app only after bundle measurement.

### 2.2 In-MVP (launch) — Full Feature MVP

**Catalogue & commerce**

- Multivendor laundry; `offerSource = MARKETPLACE` only.  
- Service kinds (ops taxonomy **[Founder-input]**): `wash_fold`, `dry_clean`, `iron_only`, `wash_iron`, `express_wash`, optional `stain_treat` add-on.  
- `pricingMode = bag_tier | per_kg_step | unit_garment` with **declared tiers only** in MVP (`amountMinor` — never float).  
- Care hints: `careLevel` ambient textile (no cold-chain); `garmentRisk` (`standard` | `delicate` | `high_value`).  
- Multi-vendor cart → one checkout → split settlement (rare at launch; design for it).  
- Meili `laundry_offers_v1`; Postgres catalogue SoR.  
- Supplier onboarding formal/informal + laundry licence fields; Catalogue Factory human approve before Meili publish (**D-53**).  
- Promotions via `@dial/promotions` only.

**Checkout & FX (D-57)**

- Browse/cart `displayCurrency = USD`.  
- ZiG only at pay from `fx_daily_rates` / `fx_rate_id`.  
- Required CTAs: **EcoCash** + **COD** (web + WA); other rails per **D-43**.  
- COD settle **USD** (**D-60**).  
- Eighteen-item electronic disclosure adapted for **service + textile care** — counsel copy.

**Delivery / SLA (textile care)**

- **Pickup slot** + **return slot** booking + capacity.  
- Plant phase `in_plant` with ETA honesty (not fake GPS inside plant).  
- `packages/delivery` + `DeliveryDispatchWorkflow` extended metadata — **no parallel laundry job SoR**.  
- MapLibre track for courier legs; OSRM/VROOM.  
- Intake checklist + return POD photo / count.

**Surfaces:** web responsive; native Android+iOS (**not Expo**); WA Flows; admin; supplier/laundry portal (Mercur pattern only).

**Fiscal & money:** Job Reserve / authorize-capture per Part 5; agency FDMS; same outbox drain.

**AI:** drafts only — care guidance, stain tips, ranking assist, ops summaries — MetricContract + Promptfoo + human promote.

### 2.3 Explicitly out of MVP

- DIAL-owned wash plants / `DIAL_OWNED` capacity GMV.  
- Live weight reprice without customer accept (phase 2).  
- Subscription unlimited wash wallets as money SoR.  
- Third-party laundry OMS as money/delivery SoR.  
- AI-set prices; Simulated Command Centre auto-pay.  
- Baileys; Google/Mapbox SoR; Expo customer shell.  
- Cross-border laundry; national expansion beyond founder geography.  
- Customer wallet as money SoR; physical fiscal printers.  
- Chemical inventory / plant MES as DIAL SoR.

### 2.4 Web screen inventory (`gateway-web`)

| Route / screen | Purpose | Notes |
| --- | --- | --- |
| `/laundry` | Home / service kinds | Brand signal + search; USD |
| `/laundry/search` | Meili PLP | Facets: serviceKind, pricingMode, formality, band, careLevel |
| `/laundry/[offerId]` | PDP | Sold by {Laundry}; SLA windows; bag tiers |
| `/laundry/cart` | Cart | Multi-vendor grouping; USD only |
| `/laundry/slots` | Pickup + return picker | Dual capacity |
| `/laundry/checkout` | Review + disclosures | Agency + care / liability summary |
| `/laundry/checkout/pay` | Pay step | EcoCash\|COD; ZiG for EcoCash |
| `/laundry/orders/[id]` | Status | pickup → in_plant → return → POD |
| `/laundry/orders/[id]/track` | MapLibre | Courier legs only |
| `/laundry/orders/[id]/claims` | Damage / lost | Taxonomy + media |
| Support deep-link | Chatwoot | Attach orderId |

Responsive desktop + mobile; `@dial/design-tokens` (Blueprint §8.0.1).

### 2.5 Native screen inventory (Android + iOS — C-5)

| Screen | Notes |
| --- | --- |
| Laundry home / service kinds | Not Expo shell |
| Search + facets | Meili |
| PDP | Bag tiers + Sold by |
| Cart | USD |
| Pickup + return slots | |
| Checkout review | Disclosures |
| Pay | EcoCash \| COD + other rails |
| Order status + MapLibre track | Multi-phase status |
| Claims | |
| Support | Chatwoot / WA deep-link |

Courier: **delivery-android** — pickup intake checklist + return POD (not customer Expo).

### 2.6 Weight / bag pricing deferred policy

| Mode | MVP | Phase 2 |
| --- | --- | --- |
| Declared bag tier / packed kg step | **Yes** — OfferSnapshot freezes `amountMinor` | — |
| Intake scale reprice | **No** | Human pricing-engine adjust + customer notify; new snapshot version; AI forbidden |
| Per-garment unit list | Optional MVP for dry-clean unit SKUs | Expand catalogue |

### 2.7 Textile care SLA summary (ops)

| Phase | Customer promise posture (recommended) | System |
| --- | --- | --- |
| Pickup | Booked window; courier intake photo/count | Slot hold + job create |
| Wash / care | Plant ETA band (hours/days by serviceKind) | `in_plant` status; supplier confirm |
| Return delivery | Booked return window | Second courier leg or same job multi-stop |
| POD | Customer accepts return | POD + release escrow / COD reconcile |
| Claim window | **[Founder-input]** e.g. 24–48h after POD | Claims Flow + ledger reason codes |

Cold-chain: **N/A**. Do not copy grocery chilled/frozen eligibility.

---

## Part 3 — Commercial architecture & unit economics

### 3.1 Pricing engine (deterministic — v4 §4.1)

```text
Customer line price (USD minor)
  = laundry service net (valid, unexpired)
  + DIAL margin (serviceKind × supplier agreement)   [Founder-input ladder]
  + pickup/delivery allocation (band × distance × dual-leg)  → DIAL_FEE
  + payment cost component (method)                   [modelled]
  ± promotion (@dial/promotions only)
```

**Never:** AI prose prices; IMTT as customer line (**D-60**); float math.

Agency display: Sold by {Laundry}; formal vs informal disclosure; B2B formal-only (**D-49**).

### 3.2 Take-rate ladder `[Founder-input]`

| Band | Volume / month / laundry (USD) | Commission on service net | Notes |
| --- | --- | --- | --- |
| Launch | — | **[Founder-input]** | Start low; earn increases |
| Growth | — | **[Founder-input]** | SLA / claim rate compliance |
| Preferred | — | **[Founder-input]** | Placement ≠ money SoR change |

Pickup/delivery fee options (same as groceries):

| Option | Customer sees | FDMS | Risk |
| --- | --- | --- | --- |
| **A. DIAL logistics fee** (**recommended**) | `DIAL_FEE` line(s) | DIAL VAT on fee | Dial ops vs courier payable |
| B. Pass-through courier | Courier component | Careful agency characterisation | Looks like logistics principal |
| C. Laundry-absorbed | “Free pickup” in margin | Margin only | Hide true cost |

### 3.3 Example journals (`amountMinor`) — illustrative only

**Scenario:** Wash/fold bag tier $8.00 (Supplier L) + Dial pickup+return fee $4.00 = **$12.00** USD → `1200` cents.

```text
// On verified webhook capture
Dr  cash_psp_clearing          1200 USD
Cr  customer_clearing          1200 USD

Dr  customer_clearing          1200
Cr  supplier_payable_L          800   // service — net of commission per contract
Cr  dial_fee_revenue            400   // logistics fee example
```

**IMTT:** DIAL opex only — never customer surcharge.  
**COD:** intent → return POD → `reconcileCodAfterPod`; settle USD.  
**Damage refund (supplier bears — example):** reverse supplier payable / refund customer; fiscal credit-note path.

### 3.4 Unit economics skeleton (no line may be deleted)

```text
+ Customer price (USD minor sum)
− Laundry net cost(s)
− Pickup + return courier cost
− Failed-attempt cost × failure_rate                    [Founder-input]
− Damage / lost claim write-off × claim_rate            [Founder-input]
− Payment processing (+ COD variance)
− IMTT economic cost (opex)                             [v4 §7.2]
− Laundry WHT if counsel says applicable (NOT auto tech D-50)
− Refund/claim cost × claim_rate (CPA-aware)
− Ops minutes × loaded cost
− AI cost per order (budgeted)
− WA template cost
− Guarantee / textile liability provision %
= Contribution per order
```

### 3.5 Multivendor split settlement under agency

Same spine as groceries Part 3.5: single customer capture → N× `supplier_payable` + `dial_fee_revenue` → payout T+N or escrow release → FDMS enqueue (**D-59** characterisation per Part 6.1).

### 3.6 Channel costs

Reuse v4 §4.6 Meta Rest of Africa rates [Reported]. Prefer session messages; laundry status as utility inside open windows.

### 3.7 Promotions (D-42)

| Campaign | Laundry use |
| --- | --- |
| `PLATFORM` | First-order pickup fee off / non-cash credit |
| `SUPPLIER_COOP` | Laundry-funded % on their services |
| `REFERRAL` | Optional; no cash-out |
| `FLASH` | Off-peak plant capacity |

---

## Part 4 — Catalogue / Meili (`laundry_offers_v1`)

### 4.1 Index choice

**Recommend separate index** `laundry_offers_v1` (not Spare chassis fields; not grocery coldChain). Postgres remains catalogue SoR; Meili = customer browse (**Pack §8**).

**Repo fact:** `@dial/catalogue` today types `vertical?: "spare" | "grocery"` and rejects `liquor` until counsel — laundry would extend vertical enum in Build (**not this Plan revision**).

### 4.2 Document shape (Pack §8 style)

```ts
export interface LaundryOfferDocument {
  id: string                       // offerId
  masterServiceId: string
  title: string
  description: string
  brand?: string                   // laundry trade name
  categoryPath: string[]           // e.g. ["wash_fold","household"]
  vertical: 'laundry'
  serviceKind:
    | 'wash_fold'
    | 'dry_clean'
    | 'iron_only'
    | 'wash_iron'
    | 'express_wash'
    | 'stain_treat'
    | 'other'
  pricingMode: 'bag_tier' | 'per_kg_step' | 'unit_garment'
  priceMinor: number               // USD cents per tier / kg step / garment
  currency: 'USD'                  // D-57 — no ZiG on browse docs
  bagTierLabel?: string            // e.g. "Small ≤5kg"
  maxWeightGrams?: number          // declared tier ceiling
  unitLabel: string                // "bag" | "kg" | "shirt" | "suit"
  availability: 'available' | 'confirm_required' | 'sourcing'
  careLevel: 'standard' | 'delicate' | 'high_value'
  turnaroundHoursMin: number
  turnaroundHoursMax: number
  pickupBandId: string
  returnBandId: string             // often same as pickup
  stockValidUntil: number          // capacity validity unix ms
  offerSource: 'MARKETPLACE'       // D-58 — reject DIAL_OWNED
  supplierFormality: 'formal' | 'informal'  // D-49
  supplierDisplayName: string
  dryCleanCapable: boolean
  imageUrl?: string
  // NEVER index raw supplierId for customer search authorization
}
```

### 4.3 Settings (sketch)

```json
{
  "searchableAttributes": [
    "title", "description", "brand", "categoryPath",
    "serviceKind", "supplierDisplayName", "bagTierLabel"
  ],
  "filterableAttributes": [
    "vertical", "categoryPath", "serviceKind", "pricingMode",
    "availability", "careLevel", "currency", "pickupBandId",
    "priceMinor", "stockValidUntil", "offerSource",
    "supplierFormality", "dryCleanCapable"
  ],
  "sortableAttributes": ["priceMinor", "turnaroundHoursMin", "stockValidUntil"]
}
```

**B2B (D-49):** force `supplierFormality = formal` on Meili + APIs + checkout. Regression: `countInformalB2bLeaks(laundry_offers_v1) === 0`.  
**Display currency (D-57):** USD only in index and cart APIs.

### 4.4 Import / capacity heartbeat

| Path | Use | Outcome |
| --- | --- | --- |
| CSV / xlsx laundry import | Bulk service catalogue | Catalogue Factory review (**D-53**) |
| Capacity heartbeat (WA / dashboard) | Plant throughput this week | Refresh `stockValidUntil` / availability |
| Photo price list OCR | Optional | Same draft row + source field |

**Capacity TTL defaults (engineering proposals):**

| serviceKind | Default capacity TTL | Heartbeat |
| --- | --- | --- |
| wash_fold | 48–72h | daily peak days |
| dry_clean | 72h–7d | 2–3×/week |
| express_wash | 24h | daily |

On expiry → `confirm_required`, do not silent-delete.

### 4.5 Dry-clean / premises publish gates

Before Meili publish: `offerSource=MARKETPLACE`; if `dryCleanCapable` → require `laundry_licence_ref` (and ops checklist for controlled-equipment attestation **[Unverified]** legal necessity) when policy on.

---

## Part 5 — Money path (E1a reuse)

### 5.1 End-to-end spine

```text
Cart (USD lines, amountMinor)
  → assertB2bMayPurchase(formality) per line (D-49)
  → freeze OfferSnapshot(s) per laundry + DIAL_FEE logistics + promo
  → createCheckoutPayment(EcoCash|COD|…) OR authorizeJobReserve (escrow)
  → customer action ≠ truth
  → verified PSP webhook + claimProcessedEvent
  → ledger journal
  → enqueueFiscalReceipt (DIAL_FEE + supplier class per Part 6.1)
  → money outbox → FDMS Virtual Gateway
  → createDeliveryJob(s) + pickup/return slot bind + start DeliveryDispatchWorkflow
```

Reuse: `freezeOfferSnapshot`, `createCheckoutPayment`, `authorizeJobReserve`, E1a spine, `@dial/tax` — **do not duplicate**.

### 5.2 Laundry-specific OfferSnapshot fields

| Field | Purpose |
| --- | --- |
| `vertical` | `laundry` |
| `serviceKind` | Care path + SLA |
| `supplierDisplayName` | Agency disclosure freeze |
| `supplierFormality` | FDMS / B2B |
| `pricingMode` / `bagTierLabel` / `maxWeightGrams` | Dispute evidence |
| `pickupSlotId` / `returnSlotId` | Capacity bind |
| `careLevel` | Handling metadata |
| `turnaroundHoursMin/Max` | SLA freeze |
| `fx_rate_id` | ZiG pay conversion |
| `promo_campaign_id[]` | Logged components |
| `laundry_licence_ref` (supplier snapshot) | Compliance evidence |

AI **must not** write any payable keys (`assertNoPayableKeys`).

### 5.3 PspAdapter rails (D-43)

| Rail | Laundry MVP posture |
| --- | --- |
| EcoCash | Required button; ZiG from daily rate |
| COD | Required button; USD settle at return POD |
| Paynow / ContiPay / PayPal | As enabled |
| Escrow / Job Reserve | Per decision table below |

### 5.4 Escrow vs direct capture — decision table

| Condition | Path | Rationale |
| --- | --- | --- |
| COD | Direct COD intent → return POD reconcile | D-60 |
| EcoCash / card below threshold T | Direct capture | Speed; low ticket |
| Multi-laundry OR total ≥ T | Job Reserve / escrow hold | Dispute / split / claims |
| High-value delicate / `careLevel=high_value` ≥ T_hv | Escrow preferred | Damage/lost risk |
| B2B formal | Escrow or Net terms **[Founder-input]** | TIN capture |

**Provisional recommended anchors (ops-tunable — not statute):**  
- **T = 5000** USD minor ($50.00) — align groceries food T  
- **T_hv = 10000** USD minor ($100.00) — high-value garment baskets  

Engineering: strategy interface / config — **no** magic hard-code in PSP adapters.

### 5.5 WHT note (D-50 boundary)

Tech hire 30% ITF263 stays for **Dial a Tech**. Laundry partner payouts: **pluggable withholding strategy**; do **not** auto-apply tech WHT; counsel decides marketplace commission/payout WHT (**Unverified**).

---

## Part 6 — Tax / FDMS / laundry compliance brief

**How to read:** Research, not legal advice. Tags per Part 0.2.

### 6.0 Load-bearing inheritance from v4 (do not re-litigate)

| Topic | Lock | Confidence |
| --- | --- | --- |
| Agency characterisation | D-2 / **D-58** | [Verified] |
| FDMS receipt classes | **D-59** `DIAL_FEE` / `GOODS_FORMAL` / `GOODS_INFORMAL` | [Verified] lock — **service mapping Unverified** |
| Virtual fiscalisation | D-40a | [Verified] |
| VAT 15.5% from 2026 | v4 §7.1 | [Verified] in v4 research |
| IMTT = opex | **D-60** | [Verified] |
| COD USD | **D-60** | [Verified] |
| CPA electronic disclosure | v4 §7.5 | [Verified] Act framing — laundry read-across **counsel** |
| Job Reserve licensed escrow | C-4 / §7.3 | [Verified] RBZ posture in v4 |

### 6.1 VAT & agency FDMS for laundry lines — **counsel attention**

**Engineering default pending tax opinion:**

| Line | Recommended eng class | Confidence |
| --- | --- | --- |
| Dial pickup/delivery / protection / commission fee | `DIAL_FEE` (+ VAT on fee) | [Engineering] mirrors groceries G-5 / D-59 |
| Formal laundry **service** charge (wash/dry-clean) | Treat as **on-behalf supplier taxable supply** — map to existing `GOODS_FORMAL` **only if** counsel says service receipts may ride that class *or* counsel defines service class | **[Unverified]** |
| Informal laundry service | Analogous to `GOODS_INFORMAL` (no VAT goods/service line for supplier; **never B2B**) | **[Unverified]** naming |
| Chemicals / hangers sold as goods add-ons | True `GOODS_*` | [Engineering] if SKU exists |

**Do not** invent a fourth production receipt class in Build without counsel + D-log. Prefer: configurable `receiptClass` strategy keyed by `lineKind` with feature flag + audit.

No GMV VAT split-pot as principal. Buyer TIN for B2B Valid claims (v4 §7.1).

### 6.2 Municipal laundry / launderette licensing

| Topic | Public research lead | Tag | Engineering |
| --- | --- | --- | --- |
| Premises licence for laundry / launderette / laundry depot | Council licensed-premises by-laws define laundry, launderette, depot; hygiene & equipment standards | [Reported] | Store `laundry_licence_type` + ref + expiry on supplier |
| Who must hold licence for marketplace pickup/delivery | Platform vs each plant vs home washer | **[Unverified]** | Default eng: **merchant/plant holds**; block dry-clean publish without ref |
| Home washer / informal | Often unlicensed domestic capacity | **[Unverified]** | Policy flag; formal-first; B2B hide |
| Harare-specific schedule | Counsel must map Harare by-laws (not copy another town’s SI) | **[Unverified]** until counsel | Config by `deliveryBandId` |

### 6.3 Chemicals / dry-cleaning equipment

| Topic | Tag | Engineering / ops |
| --- | --- | --- |
| Controlled dry-cleaning / industrial washing equipment under environmental SI schedules | [Reported] | Ops attestation checklist for `dryCleanCapable` suppliers |
| Whether *platform* needs ODS handler registration | **[Unverified]** | Default: supplier obligation in contract |
| Chemical discharge / municipal health | **[Unverified]** | Indemnity + insurance **[Founder-input]** |

### 6.4 Consumer protection — textiles `[Unverified]` / counsel

v4 §7.5 electronic disclosure / cancellation [Verified framing]. Whether cooling-off / cancellation carve-outs apply to **begun laundry service** or **soiled goods already collected** is a **counsel question**.

**Engineering SOP pending counsel:**

- Eighteen-item disclosure + review on web/WA/native.  
- Clear damage/lost/stain pre-existing policy in T&Cs module.  
- Claims path (Part 7.6) without waiting for perfect legal taxonomy.  
- Do not silently exclude statutory rights in UI copy.

### 6.5 Data protection

Intake photos of garments may include identifiable belongings. Apply v4 §7.6 / D-32: minimise retention; strip identity from AI egress; POTRAZ; no garment photos to foreign models without consent gates.

### 6.6 Counsel checklist (laundry addendum)

**Must confirm before customer-open:**

1. Whether DIAL as agent needs any laundry/launderette licence, or only partner premises.  
2. Harare municipal licence matrix for laundry / launderette / depot / home washer.  
3. Dry-cleaning solvent / controlled-equipment obligations for listed suppliers.  
4. FDMS / VAT characterisation of **laundry service** vs goods vs Dial fee (Part 6.1).  
5. CPA cancellation after pickup / mid-wash; damage & lost-item allocation.  
6. Whether informal home washers may be B2C-visible (policy + law).  
7. WHT / VAT marketplace specifics for laundry commissions (beyond tech D-50).  
8. Advertising / misleading care claims on WA templates.  
9. Insurance sizing for textile liability.  
10. Retention rules for intake/POD photos.

### 6.7 What could not be verified (laundry-specific)

- Binding Harare licence section IDs for marketplace agents.  
- Platform chemical/ODS registration duty (if any).  
- Exact FDMS receipt class for service (vs goods).  
- CPA mid-service cancellation money rules.  
- Competitor take rates / GMV (marketing noise).

---

## Part 7 — Delivery / Temporal (pickup → wash → return)

### 7.1 Dual slot capacity model

```text
LaundrySlot {
  slotId, bandId, windowStart, windowEnd,
  leg: 'pickup' | 'return',
  capacityTotal, capacityReserved, capacityRemaining
}

PlantCapacity {
  supplierOrgId, serviceKind,
  throughputUnits, reservedUnits, validUntil
}
```

- Checkout binds `pickupSlotId` + `returnSlotId` with **transactional** decrements; idempotent hold key = `cartId|orderId`.  
- Release on cancel / payment fail TTL.  
- Missed pickup/return → Temporal timer → WA utility → reschedule Flow.

### 7.2 Workflow recommendation

**Extend `DeliveryDispatchWorkflow`** (preferred) — do not invent parallel laundry job SoR.

| Activity / phase | When |
| --- | --- |
| `awaitPickupWindow` | First courier leg |
| `recordIntakeChecklist` | Photo + count + pre-existing damage notes |
| `markInPlant` | Supplier confirm received |
| `awaitPlantReady` | Turnaround timer / supplier ready signal |
| `awaitReturnWindow` | Second courier leg (or multi-stop return) |
| `recordReturnPod` | POD before escrow release / COD reconcile |
| Existing offer→accept→reassign→FIFO | Unchanged (**D-45**) |

Algorithm donor: AWS Last Mile Hyperlocal MIT-0 patterns inside `packages/delivery` (**D-45a**) — not Fleetbase.

### 7.3 Textile handling eligibility

- Courier profile flags: `canHandleDelicate`, bag type.  
- Job `careLevelMax` = max among lines.  
- MVP: no IoT humidity SoR.

### 7.4 Multi-stop

- Multi-laundry cart → one multi-stop pickup job when same band/slot, else split — **recommended** same as grocery grill default.  
- Return may batch by plant readiness.

### 7.5 Refunds / claims — damage / lost / incomplete — SOP (ops)

| Step | Owner | System |
| --- | --- | --- |
| 1. Customer reports within claim window | Support | Ticket + orderId |
| 2. Evidence: intake + POD + customer photo | Support/courier | Attachments |
| 3. Classify: `damage` / `lost` / `stain_preexisting` / `wrong_item` / `incomplete` / `shrink` | Support | Taxonomy |
| 4. Liability: laundry vs Dial logistics vs customer care-label | Ops rules **[Founder-input]** | Ledger reason codes |
| 5. Refund / rewash / partial | Payments | Idempotent refund + fiscal credit path |
| 6. Supplier score / confirm-fail fee | Catalogue | Statement line |

**Recommended default liability:** goods/textile risk **supplier until return POD**; Dial-caused pickup/delivery fail / lost-in-transit under Dial custody → **Dial** (mirror groceries G-5 spoilage logic adapted).

---

## Part 8 — WhatsApp companion chapter

**Align style with** `DIAL_WhatsApp_Flows_and_Templates.md`. Official Cloud API only. Same ERP APIs — WA never second SoR. **D-57:** USD browse/cart; EcoCash\|COD **buttons**; shared fiscal outbox.

### 8.1 Happy path

```text
Menu → FLOW_LAUNDRY_HOME
  → FLOW_LAUNDRY_SEARCH (Meili) — USD prices
  → FLOW_LAUNDRY_CART (USD)
  → FLOW_LAUNDRY_SLOTS (pickup + return)
  → FLOW_LAUNDRY_CHECKOUT (disclosure review)
  → Pay buttons: EcoCash | COD | other
  → Utilities: confirmed → pickup → in_plant → out_for_return → delivered
  → FLOW_LAUNDRY_TRACK
  → FLOW_LAUNDRY_CLAIMS (MVP)
```

### 8.2 Flow screen maps

#### `FLOW_LAUNDRY_HOME`

Screens: Welcome · Book laundry · Track · Claims · Live chat  

#### `FLOW_LAUNDRY_SEARCH`

| Screen | Fields / logic |
| --- | --- |
| Query | Text; serviceKind chips |
| Results | title, unitLabel, **priceMinor USD**, turnaround, Sold by |
| PDP | Detail; ATC |

#### `FLOW_LAUNDRY_CART`

Lines grouped by Sold by; edit qty/tier; USD totals.

#### `FLOW_LAUNDRY_SLOTS`

Select pickup window + return window; show capacity remaining.

#### `FLOW_LAUNDRY_CHECKOUT`

| Screen | Purpose |
| --- | --- |
| Address | Saved place / pin+landmark+phone |
| Buyer tax | Optional VAT/TIN B2B |
| Review | USD totals, laundry name, care/liability summary, T&Cs — **mandatory** |
| Pay | **Buttons:** EcoCash \| COD \| other — **not free-text**. EcoCash → ZiG + `fx_rate_id` |

#### `FLOW_LAUNDRY_TRACK`

Order id → ERP multi-phase status.

#### `FLOW_LAUNDRY_CLAIMS`

Reason taxonomy; media upload; policy messaging.

#### `FLOW_SUPPLIER_LAUNDRY_HEARTBEAT`

Supplier Yes/At-capacity on listed services (utility).

### 8.3 `data_exchange` stubs (TypeScript-shaped)

```ts
type LaundryFlowRequest =
  | { screen: 'LAUNDRY_SEARCH'; data: { query: string; serviceKind?: string } }
  | { screen: 'LAUNDRY_ADD_CART'; data: { offerId: string; qty: number; bagTier?: string } }
  | { screen: 'LAUNDRY_SET_SLOTS'; data: { cartId: string; pickupSlotId: string; returnSlotId: string } }
  | { screen: 'LAUNDRY_APPLY_PROMO'; data: { code: string; cartId: string } }
  | { screen: 'LAUNDRY_CHECKOUT_PAY'; data: { orderId: string; method: 'ECOCASH' | 'COD' | 'PAYNOW' | 'OTHER' } }
```

Server re-prices from ERP; never trust client `priceMinor`.

### 8.4 Templates register

| Template name | Category | When | Body shell |
| --- | --- | --- | --- |
| `laundry_welcome_menu` | UTILITY | Opt-in | Hi {{1}}. Laundry, Track, Claims, Live chat. |
| `laundry_order_confirmed` | UTILITY | Paid | Order {{1}} confirmed. Total {{2}} {{3}}. Pickup {{4}}. |
| `laundry_pickup_eta` | UTILITY | Courier assigned | Pickup for {{1}} window {{2}}. |
| `laundry_in_plant` | UTILITY | Intake done | {{1}} is being processed. Ready by ~{{2}}. |
| `laundry_out_for_return` | UTILITY | Return leg | Returning {{1}}. Track {{2}}. |
| `laundry_delivered` | UTILITY | Return POD | {{1}} delivered. Issues? {{2}} |
| `laundry_slot_missed` | UTILITY | Timer | Missed {{1}} slot. Reschedule: {{2}} |
| `laundry_claim_ack` | UTILITY | Claim filed | We received claim {{1}} on order {{2}}. |
| `laundry_payment_link` | UTILITY | Resume unpaid | Pay for {{1}}: {{2}} expires {{3}}. |
| `supplier_laundry_heartbeat` | UTILITY | Capacity | Still accepting {{1}}? Yes / At capacity. |

### 8.5 Live chat

Chatwoot handoff with `customer_id`, `cart_id`, `orderId`; status updates **only** via ERP.

---

## Part 9 — AI (`packages/ai` only)

### 9.1 Rules (inherit v4 §5.1 + D-61)

Production = typed capabilities + LiteLLM→Gemini + Temporal/BullMQ. **No prod agent host.** AI never writes payable amounts. D-32 strip identity. Merge gate: `dial-ai-capability-review` (**D-56**). Promote: Promptfoo + human (**D-54**).

### 9.2 Capability contracts

| Capability | Input (Zod) | Output | Forbidden |
| --- | --- | --- | --- |
| `laundryCareGuidance` | fabric/care hints (no raw PII) | structured care tips draft | prices, payables |
| `laundryServiceSuggest` | constraints + candidate offer ids | ranked **offerIds** + reasons | amounts |
| `searchRankingAssist` | query + candidate ids | rank hints | silent Meili rewrite without human |
| `opsLaundrySummary` | MetricContract ids + aggregates | narrative draft | Simulated payouts |

### 9.3 Promptfoo outline

| Golden | Assert |
| --- | --- |
| Money keys absent | No `price`, `amountMinor`, `fee` in model JSON |
| Offer ids exist | ids ∈ catalogue fixture |
| PII egress | no phone/name/address after strip |
| Informal B2B | no suggest informal when `buyer_segment=b2b` |
| No intake photo bytes to model without consent flag | privacy golden |

### 9.4 MetricContract KPIs (examples)

| Metric id | Definition | Actual vs Simulated |
| --- | --- | --- |
| `laundry.fill_rate` | paid orders / checkout starts | Actual |
| `laundry.pickup_ontime_pct` | pickup in window / jobs | Actual |
| `laundry.return_ontime_pct` | return POD in window / jobs | Actual |
| `laundry.claim_bps` | claim refunds / GMV | Actual |
| `laundry.confirm_fail_rate` | plant confirm fails / orders | Actual |
| `laundry.contribution_per_order` | unit economics | Actual; Simulated never pays |

---

## Part 10 — Security

### 10.1 IDOR resource list (extend T9)

| Resource | AuthZ |
| --- | --- |
| `laundry_cart` | owner userId from JWT |
| `laundry_order` | buyer or supplier-org scoped |
| `pickup_slot_hold` / `return_slot_hold` | owner |
| `intake_media` / `pod_media` | job assignment / buyer / admin |
| `laundry_claim` | owner; supplier scoped reply |
| `delivery_job` / offers | D-47 patterns |
| `promo_credit` | owner; no cash-out |
| `supplier_laundry_licence` | supplier org + admin |
| Admin catalogue publish | role + Factory queue |

Never trust body `userId` / `email` / `role`. Authorize before cache; cache keys include `userId`.

### 10.2 RLS notes

Supabase RLS **necessary not sufficient** — object-level `assertResourceAccess` still required (**D-47**).

### 10.3 Webhooks & secrets

All `/webhooks/*` verify signature + idempotency. Fail closed if `INTERNAL_API_SECRET` unset for side-effect workers. No `NEXT_PUBLIC_` / `VITE_` on service_role / PSP / WA / FDMS.

### 10.4 B2B informal

Meili + API + checkout leak=0 tests for `laundry_offers_v1`.

---

## Part 11 — OSS stitch table

| Concern | Pattern donor OK | SoR |
| --- | --- | --- |
| Catalogue / Meili | Pack §8 spare/grocery | `@dial/catalogue` + Meili |
| Money / Job Reserve | E1a / groceries | `@dial/payments` + ledger |
| Delivery | Hyperlocal MIT-0 patterns | `packages/delivery` + Temporal |
| WA Flows | Meta Cloud API | `adapters/whatsapp` |
| Maps | MapLibre client | Nominatim/OSRM/VROOM SoR |
| Native | Kotlin + Swift donors | C-5 no Expo |
| Promotions | Medusa+OfferKit ideas | `@dial/promotions` only |
| Fiscal | In-house FDMS gateway | D-40a / D-59 |
| Laundry plant MES | None | **Out** — supplier systems |

---

## Part 12 — Tracer L0–L6 (D-52)

**Rule:** Plan (this doc + grill) → Build thin vertical → Expand in-ticket → Done at DoD 100%. Tracer ≠ stub-as-MVP. Fits **T0–T9 / E1–E6** — no new train numbers; no Train 0–10 (**D-53**). **No endless PD invent** — use **L0–Ln** only.

### L0 — Plan residual

| DoD item | Acceptance criteria (evidence) |
| --- | --- |
| Grill answered or “use recommended” recorded | Part 15 / grill session |
| Ticket opened | One thin-vertical ticket with DoD + owner (Dev Manager) |
| Counsel laundry brief started | Checklist 6.6 filed or explicitly deferred with flags |
| Living docs | Same PR note when Build lands |

### L1 — Thin vertical (money + browse)

**Path:** Browse USD → cart → checkout EcoCash\|COD → Intent/Job Reserve → webhook → ledger → FiscalReceiptQueued → delivery job create (pickup stub OK if Temporal job exists).

| DoD | Evidence |
| --- | --- |
| Meili/stub returns MARKETPLACE laundry offers | Test `offerSource=MARKETPLACE` |
| Cart USD only | currency===USD |
| EcoCash ZiG + `fx_rate_id` | Fixture rate row |
| COD USD | Confirm payload |
| OfferSnapshot Sold by; AI cannot set payable | freeze + `assertNoPayableKeys` |
| B2B informal rejected | 403/empty |
| Webhook sig + idempotency | Replay → single ledger effect |
| FDMS `DIAL_FEE` (+ supplier class strategy) queued | Outbox assert |
| No DIAL_OWNED | Reject publish |
| IMTT not on checkout | Money-path review |
| Responsive web checkout | Blueprint §8.0.1 QA |

### L2 — Expand commerce

| DoD | Evidence |
| --- | --- |
| Bag tier / kg step / unit garment pricing | Snapshot fields |
| Multi-laundry cart + split payables | Ledger test |
| Service kinds + Factory publish | Review → Meili only after approve |
| Admin laundry catalogue screens | Screen checklist |

### L3 — Delivery / SLA expand

| DoD | Evidence |
| --- | --- |
| Pickup + return slot holds | Concurrent capacity never negative |
| Intake checklist + return POD | Workflow test |
| `in_plant` phase honesty | Status API |
| MapLibre track courier legs | Recon smoke |
| delivery-android intake/POD UI | Screenshot / checklist |

### L4 — Claims / liability expand

| DoD | Evidence |
| --- | --- |
| Claim taxonomy + media | API + UI |
| Liability reason codes → ledger | Journal test |
| Supplier until POD default encoded | Policy config test |

### L5 — WhatsApp

| DoD | Evidence |
| --- | --- |
| FLOW_LAUNDRY_SEARCH→CART→SLOTS→CHECKOUT→TRACK | Meta draft + ERP test |
| EcoCash\|COD buttons not free-text | Flow JSON review |
| Same intents as web | Shared payment intent id |

### L6 — AI drafts

| DoD | Evidence |
| --- | --- |
| Capabilities + Zod | Typecheck + unit |
| Promptfoo goldens | CI smoke |
| dial-ai-capability-review | Audit attached |
| Simulated cannot pay | Integration assert |

### Completion matrix (AC × channel)

| AC theme | Web | WA | Native | Admin/Courier |
| --- | --- | --- | --- | --- |
| USD browse/cart | L1 | L5 | L1/L2 | N/A |
| ZiG pay / EcoCash\|COD | L1 | L5 | L1 | FX admin |
| Agency + FDMS | L1 | L5 | L1 | Fiscal day worker |
| Pickup/return SLA | L3 | L5 | L3 | delivery-android |
| Claims | L4 | L5 claims | L4 | support |
| B2B hide informal | L1 leak=0 | L5 filter | L1 | — |
| AI no money | L6 | N/A | N/A | L6 |

---

## Part 13 — Proposed decisions (L-log) — pending founder

Cite as `L-n` in tickets. Promote to v4 D-log only if ecosystem-wide.

| ID | Decision draft | Recommended status |
| --- | --- | --- |
| **L-1** | Dial Laundry is Services vertical in same ERP (no monorepo fork) | Accept (plan) |
| **L-2** | Apply D-57 USD browse / ZiG pay / EcoCash\|COD unchanged | **Recommended** |
| **L-3** | Meili index `laundry_offers_v1` separate | Accept (plan) |
| **L-4** | Absorb into `@dial/catalogue` (+ payments/delivery/tax); extract `packages/laundry` only if needed | Accept (plan) |
| **L-5** | Logistics fee = `DIAL_FEE` (option A); textile risk **supplier until return POD**; Dial-caused logistics fail → Dial | **Recommended** |
| **L-6** | Escrow if multi-laundry OR ≥ T; high-value ≥ T_hv. Provisional T=**5000**, T_hv=**10000** USD minor | **Recommended** |
| **L-7** | Informal home washers: formal-first launch; B2B hide informal (**D-49**) | **Recommended** |
| **L-8** | Declared bag tiers / kg steps only MVP; intake reprice deferred | Accept (plan) |
| **L-9** | Extend `DeliveryDispatchWorkflow` (no parallel laundry workflow SoR) | Accept (plan) |
| **L-10** | WA laundry Flows **full MVP** (Part 8) — after or with Phase 9 WA readiness | **Recommended** |
| **L-11** | **No** auto tech WHT on laundry merchants; provisional payout **T+3** | **Recommended** |
| **L-12** | Merchant/plant holds laundry premises licence; DIAL terms + publish gates | Provisional eng; **counsel pending** |
| **L-13** | FDMS: Dial fee=`DIAL_FEE`; supplier service class **strategy pending counsel** (do not invent class) | **Counsel** |
| **L-14** | Geography: Harare metro single band first | **Recommended** |
| **L-15** | Pricing = deterministic multi-factor engine; AI drafts only; no LLM live fees; no prod agent host (**D-61**) | **Recommended** |
| **L-16** | Hub = Services tab (peer Dial a Tech) | **Recommended** |
| **L-17** | Completion Plan fit = **Phase 10b** after Phase 10 groceries food (gate: G5 delivery + G8 money preferred) | **Recommended sequencing** |

---

## Part 14 — Launch checklist & ops KPIs

### 14.1 Laundry launch checklist (additive to v4 Appendix C)

**Bold = blocks laundry customer-open.**

- Partner contracts: agency, claim liability, oversell/capacity fee, indemnity, **licence warranties**  
- **Counsel opinion (Part 6.6) green — or dry-clean / informal classes dormant**  
- **FDMS service characterisation agreed or fee-only soft-launch documented**  
- Customer T&Cs: textile care, claims window, 18-item disclosure on web/WA/native  
- FDMS virtual device + laundry receipt paths tested  
- Job Reserve / PspAdapter for laundry order namespace  
- **IMTT never on checkout**  
- Meili `laundry_offers_v1` + B2B informal leak=0  
- Pickup/return capacity + DeliveryDispatch activities  
- delivery-android intake + return POD UI  
- WA Flows + templates approved (or dormancy flag)  
- POTRAZ / D-32 green for intake media  
- Insurance: textile liability **[Founder-input]**  
- Threat Dragon laundry money + claims; Semgrep CI green  
- Tracer L1–L5 green; L6 if AI exposed  
- Living root docs updated in landing PR  

### 14.2 Ops KPIs

| KPI | Target posture |
| --- | --- |
| Contribution / order | **[Founder-input]** > 0 after claim stress |
| Pickup on-time % | High |
| Return on-time % | High |
| Claim bps | Within provision |
| Confirm-fail rate | Low |
| Repeat 90-day | LTV track |
| Advance-pay vs COD share | Float vs equity |

---

## Part 15 — Founder grill (answers-or-defaults)

Per `dial-grill-locks`: facts looked up in-repo; below are **human decisions**. Defaults in italics are **recommendations**, not locks.  
**Living session:** [`DIAL_Laundry_Grill_Session.md`](./DIAL_Laundry_Grill_Session.md) — Waves **OPEN** with recommended defaults ready for “use recommended”.

| # | Question | Recommended default | Status |
| --- | --- | --- | --- |
| Q1 | Launch geography / bands? | *Harare metro single band first* | Open — **recommended** |
| Q2 | FX display follows D-57? | *Yes — USD browse/cart; ZiG at pay* | Open — **recommended** |
| Q3 | Agency vs Dial-owned plants? | *Agency only (D-58); partners + optional home washers* | Open — **recommended** |
| Q4 | Hub: Services vs Shop? | *Services peer to Dial a Tech* | Open — **recommended** |
| Q5 | Informal home washers B2C? | *Formal-first; informal optional later; B2B hide* | Open — **recommended** |
| Q6 | Fee / liability bearer? | *DIAL_FEE logistics; supplier until return POD; Dial logistics fail → Dial* | Open — **recommended** |
| Q7 | Merchant payout WHT / T+N? | *No auto tech WHT; provisional T+3* | Open — **recommended** |
| Q8 | Escrow vs direct? | *Direct below T; escrow multi-laundry/high ticket; T=5000, T_hv=10000* | Open — **recommended** |
| Q9 | SLA turnaround promises? | *Per serviceKind bands; honest in_plant ETA; no fake plant GPS* | Open — **recommended** |
| Q10 | Licence holder? | *Merchant/plant holds; publish gates; counsel confirm* | Open — provisional eng |
| Q11 | WA in MVP? | *Full FLOW_LAUNDRY_* when Phase 9 ready* | Open — **recommended** |
| Q12 | Intake reprice? | *Declared tiers only MVP* | Open — **recommended** |
| Q13 | B2B linen MVP? | *B2C first; B2B formal-only if launched* | Open — **recommended** |
| Q14 | Take-rate launch bps? | *[Founder-input] publish ladder* | Open — commercial |
| Q15 | Completion Plan slot? | *Phase 10b after groceries food; gate G5+G8* | Open — **recommended** |
| Q16 | FDMS service class? | *DIAL_FEE now; supplier class via counsel — no invented class* | Open — counsel |
| Q17 | Claim window hours? | *48h after return POD provisional* | Open — **recommended** |
| Q18 | Multi-stop default? | *One multi-stop when same band/slot* | Open — **recommended** |

❓ Format for live grill — ask frontier only; refuse lock reopeners.

---

## Part 16 — Architecture integration (seamless ERP)

### 16.1 Domain map

| Laundry concept | Existing SoR |
| --- | --- |
| Service offer | Postgres catalogue + Meili |
| Cart | Extend `@dial/catalogue` cart (`vertical=laundry`) |
| Money | `@dial/payments` + ledger + PspAdapter |
| FDMS | `@dial/tax` + adapter-fdms |
| Delivery / SLA | `@dial/delivery` + Temporal |
| Promo | `@dial/promotions` |
| WA | `@dial/adapter-whatsapp` |
| Maps | `@dial/adapter-maps` |

### 16.2 Package boundary

**Absorb into `@dial/catalogue` + existing packages (recommended).** Reject parallel laundry OMS. Optional later `packages/laundry` only if SLA/claims logic proves catalogue-bloating.

### 16.3 Feature flags

`DIAL_FEATURE_LAUNDRY=1` / PostHog; vertical tags; **not** a process fork that disables Spare/Tech/Grocery.

### 16.4 Fit vs Full ERP Completion Plan

| Completion Plan phase | Laundry relationship |
| ---: | --- |
| 0–1 | **Do not reopen** — foundation first |
| 2–4 | Spare + supplier Factory patterns reused later |
| 5 Delivery | **Hard preference** before laundry SLA legs |
| 8 Payments/FDMS | **Hard preference** before L1 money |
| 9 WhatsApp | Unlocks L5 live Flows |
| **10 Groceries food** | **Precede laundry** (recommended) — absorb pattern proven |
| **10b Dial Laundry** (**proposed**) | After G10; before or parallel soft with Phase 11 only if eng capacity — **not** in frozen 0–12 spine until founder promotes |
| 11–12 | Intelligence/hardening after or independent of laundry customer-open |

**Gate to open Phase 10b ticket:** G5 green (or equivalent delivery POD rails) + G8 money/FDMS sandbox matrix; **preferably G10 groceries food green** so vertical absorb is battle-tested. Liquor remains counsel-gated and orthogonal.

---

## Part 17 — Risks & non-goals

| Risk | Mitigation |
| --- | --- |
| Agency threatened by owned plants | Ban DIAL_OWNED; disclosure tests |
| Textile liability surprise | Contracts; SOP; insurance; counsel |
| FDMS service misclass | Counsel L-13; configurable strategy |
| Dual SoR creep | Stitch doctrine; money-path skill |
| Settlement bugs | Integer money; idempotent webhooks |
| Informal→B2B leak | Shared filters + leak=0 |
| AI price hallucination | Zod; Promptfoo; capability review |
| Slot overload | Dual capacity + degrade messaging |
| IMTT on checkout | D-60 checklist |
| Premature Build before G5/G8 | Phase 10b gate |

**Non-goals:** principal wash plants; renumber trains; Expo/Baileys/Mapbox SoR; Formance/Medusa ledger; Simulated auto-pay; promo cash-out; physical fiscal printers; parallel monorepo fork; endless PD invent.

---

## Appendix A — Authority citations

| Lock | Relevance |
| --- | --- |
| C-4 / C-5 | Job Reserve; native not Expo |
| D-38 | UX donors only |
| D-40 / D-40a / D-41 | WA; virtual FDMS; MVP Flows |
| D-42 | promotions SoR |
| D-43 | PspAdapter |
| D-44 / D-45 / D-45a | maps + delivery SoR |
| D-47 / D-48 | IDOR + AppSec |
| D-49 | B2B hide informal |
| D-50 | Tech WHT ≠ auto laundry |
| D-52 / D-56 | Tracer + grill |
| D-53 / D-54 | Factory; MetricContract |
| D-57 | USD browse; ZiG pay; EcoCash\|COD |
| D-58 / D-59 / D-60 | Agency; FDMS; IMTT; COD USD |
| D-61 | AI capabilities; no prod agent host |

## Appendix B — Repo anchors

- `packages/catalogue` (vertical spare\|grocery today — laundry extends later)  
- `packages/payments` (`freezeOfferSnapshot`, `createCheckoutPayment`, `authorizeJobReserve`)  
- `packages/delivery` (`DeliveryDispatchWorkflow`, POD, COD reconcile)  
- `packages/tax` (`DIAL_FEE` / `GOODS_*` enqueue)  
- `adapters/{psp,fdms,maps,whatsapp}`  
- `apps/gateway-web` `/spare/*`, `/grocery/*` as route patterns for `/laundry/*`  
- `docs/planning/DIAL_Groceries_Liquor_Branch_Plan.md` (template)  
- `docs/planning/DIAL_Full_ERP_Completion_Plan.md` (Phase 10 analog → proposed 10b)  
- `docs/diagrams/01-layer-stack-laundry.md`, `02-laundry-order-money-sla-swimlane.md`

## Appendix C — Supplier laundry import columns (draft)

| Col | Field | Required | Notes |
| --- | --- | --- | --- |
| A | Supplier service SKU | Yes | |
| B | Title | Yes | |
| C | serviceKind | Yes | enum |
| D | pricingMode | Yes | bag_tier \| per_kg_step \| unit_garment |
| E | priceMinor USD | Yes | integer cents |
| F | bagTierLabel / maxWeightGrams | If bag/kg | |
| G | turnaroundHoursMin/Max | Yes | |
| H | supplierFormality | Yes | formal\|informal |
| I | dryCleanCapable | Yes | bool |
| J | laundry_licence_ref | If dry-clean / formal policy | |
| K | pickupBandId | Yes | |

---

*End of Dial Laundry Branch Integration Plan.*
