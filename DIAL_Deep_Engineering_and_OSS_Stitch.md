# DIAL Deep Engineering & OSS Stitch

**Companion to** `DIAL_Consolidated_Plan_v4.md` (D-43, D-44, **D-45**, **D-45a**, **D-46**; Cursor pack **D-47** in Agent Pack / `.cursor/rules`) **and** `DIAL_Development_Agent_Pack.md`.  
**Doctrine:** same as D-38 / D-42 — UI/pattern donors or in-repo packages; **DIAL ledger remains SoR for money/fulfilment**. Payment providers are **Tier 3 adapters only**. Maps/routing prefer **self-hosted OSS** (ZW connectivity + FX/withholding cost). Do **not** adopt a second money ledger (Mercur/Medusa/OfferKit/Fleetbase/**Formance/Blnk** as runtime SoR). **Delivery job SoR = `packages/delivery` + Temporal/BullMQ** — foodhub-compose and Fleetbase/Navigator are pattern-only, never the job engine (D-45). **Dispatch algorithm donor = AWS Last Mile Hyperlocal (MIT-0)** — reimplement offer/accept/reject/requeue into `packages/delivery` (D-45a / §3.9). **D-46** = complementary ERP/ops stitch (CSV import, fleet UX, PDF, Bluetooth print, ledger *display* patterns, BullMQ board, roster calendar) — never reopens D-38 / D-42 / D-44 / D-45a donors. **D-53** = v7-2 adopted platform extensions (§8) — Catalogue Factory, trades/score/sim/WHT UI + modified kernel/intelligence/readiness — never v7 as SoR, never Unleash/OR-Tools as SoR.

**Licence method:** SPDX from GitHub `license.spdx_id` / packagist/pypi licence fields where available (2026-08 research pass; D-46 pass 2026-08-11). Re-verify before Gate 1 copy-paste.

---

## 1. Feature → tool / repo matrix (locked + gaps filled)

### 1.1 Already locked in v4 / Blueprint / Agent Pack

| MVP / deep-dive area | Locked tool / repo | Licence (SPDX) | Tier | Role |
| --- | --- | --- | --- | --- |
| Spare multi-vendor storefront UX | [`mercurjs/b2c-marketplace-storefront`](https://github.com/mercurjs/b2c-marketplace-storefront) | MIT | Tier 2 pattern | UI only (D-38) |
| Marketplace domain shapes | Mercur / Medusa v2 | MIT | Reference | Sellers, commission, payouts — not SoR |
| Tech services UX | [`AyanSujon/FixItNow`](https://github.com/AyanSujon/FixItNow) (+ NearServe, Homezy) | Check at Gate 1 | Tier 2 pattern | UI only (D-38) |
| Supplier panel UX | Mercur vendor-panel | MIT | Tier 2 pattern | UI only |
| Android shopping UX | CoolMallKotlin (+ Dukkan) | Check at Gate 1 | Tier 2 pattern | Customer Android |
| iOS shopping UX | tunacosgun/eCommerce (+ Pow) | Check at Gate 1 | Tier 2 pattern | Customer iOS |
| Technician Android arch | [`android/nowinandroid`](https://github.com/android/nowinandroid) | Apache-2.0 | Tier 1 pattern | Module skeleton |
| Fitment / ACES schema cross-check | [`autopartsource/sandpim`](https://github.com/autopartsource/sandpim) | MIT | Reference | Schema only — not SoR |
| Promotions stitch | Medusa Promotion Module + OfferKit → `@dial/promotions` | MIT / check OfferKit | Tier 1 in-repo | D-42 |
| Catalogue search | Meilisearch | MIT | Tier 2 | Customer Spare search |
| Booking slots | Cal.com | AGPL-3.0 (self-host) | Tier 2 sibling | Slots only — DIAL job SoR |
| Live chat | Chatwoot | MIT (+ enterprise) | Tier 2 sibling | Human chat |
| Surveys | Formbricks | AGPL-3.0 | Tier 2 sibling | CX surveys |
| Product analytics | PostHog | MIT | Tier 2 / cloud | Flags + analytics |
| Ops BI | Metabase | AGPL-3.0 | Tier 2 sibling | Ops dashboards |
| Durable money/fiscal workflows | Temporal | MIT | Tier 2 | Job Reserve / FDMS |
| Ops automation | n8n | Fair-code / Sust. Use | Tier 2 | Ops workflows |
| Queues (reindex, Sharp, webhooks) | BullMQ | MIT | Tier 1 | In-repo workers |
| Images | Sharp | Apache-2.0 | Tier 1 | ZW mobile optimise |
| Motion | Rive | Proprietary runtime OK | Tier 3 assets | Auth/home motion |
| WhatsApp commerce | WhatsApp Cloud API + Flows | Proprietary | Tier 3 | Official only |
| Fiscalisation | ZIMRA FDMS Virtual API | Proprietary | Tier 3 | D-40a |
| Geocoding | Nominatim | GPL-2.0 (server) | Tier 2 sibling | Pin/landmark |
| Drive-time / distance | OSRM | BSD-2-Clause | Tier 2 sibling | Bands + ETA |
| Multi-stop / assignment optim | VROOM | BSD-2-Clause | Tier 2 sibling | Courier + tech VRP |
| Primary ZW PSP (existing) | Paynow (raw API preferred) | Proprietary API; SDKs e.g. [`paynow/Paynow-NodeJS-SDK`](https://github.com/paynow/Paynow-NodeJS-SDK) | Tier 3 | Initiate + poll + hash |
| Escrow / Job Reserve | Licensed PSP partner (C-4 / D-4) | Contract | Tier 3 | Hold/release on instruction |
| AI brain | Gemini via LiteLLM | Proprietary | Tier 3 | Sole reasoning brain |
| Realtime channels | Supabase Realtime | Apache-2.0 | Tier 2 | Live location fan-out |

### 1.2 Gaps filled this pass (new recommendations)

| Gap | Primary pick | Licence | Tier | Copy vs call vs reject |
| --- | --- | --- | --- | --- |
| Extra ZW payment rails | **ContiPay** REST (see §2) | API proprietary; PHP/Python SDKs **MIT** | Tier 3 | **Call** ContiPay API from `ContiPayAdapter`; do not import PHP/Python into Node — implement thin TS client from docs |
| Direct EcoCash | **EcoCash Developer Portal** EIP / Open API | Proprietary | Tier 3 | **Call** official API; community SDKs optional pattern only |
| EcoCash OSS helper (optional) | [`kinsleykajiva/ecocash-with-java`](https://github.com/kinsleykajiva/ecocash-with-java) / [`phoscoder/ecocash`](https://github.com/phoscoder/ecocash) | MIT | Reference | Study payload shapes; **reimplement** in TS adapter |
| International wallet | **PayPal Orders v2** | Proprietary | Tier 3 | Create → approve → capture/authorize; webhooks |
| COD engineering surface | In-repo `CodAdapter` + tables (D-7) | — | Tier 1 | No external PSP; courier float + ban policy |
| Android in-app maps | **MapLibre Native Android** + **maplibre-compose** | BSD-2-Clause / BSD-3-Clause | Tier 1 (lib) | **Integrate** SDK; tiles from self-host or cache |
| Offline map packs (ZW) | Geofabrik ZW extract → MBTiles/PMTiles (OpenMapTiles / Protomaps) | ODbL data | Tier 2 data | Bundle Harare/Bulawayo regions for couriers |
| Delivery Android UX donor | **[`furqanullah717/foodhub-compose`](https://github.com/furqanullah717/foodhub-compose)** (rider flavour) | Apache-2.0 | Tier 2 pattern | Screen flows only; **strip Google Maps → MapLibre**; strip Stripe/Firebase money |
| Courier product pattern (cross-check) | Fleetbase Navigator | AGPL-3.0 | Reference **only** | Study POD/QR/fuel-report flows — **do not fork into monorepo** |
| Live GPS without Firebase SoR | Supabase Realtime + `courier_locations` | — | Tier 1+2 | Device → ERP → Realtime channel |
| Multi-stop routing | **OSRM matrix + VROOM** (confirm Blueprint I-2) | BSD-2-Clause | Tier 2 | Primary; GraphHopper+jsprit alternate |
| Delivery **dispatch / assignment** SoR | **In-repo `packages/delivery`** + Temporal `DeliveryDispatchWorkflow` + BullMQ timers | — | Tier 1 | **D-45 / D-45a** — auto-offer → accept/reject/timeout → reassign → FIFO queue; **primary algorithm donor** = AWS Last Mile Hyperlocal (MIT-0); Fleetbase / Witylogix = AGPL pattern-only; jsprit = VRP alternate (not offer-cycle) |

---

## 2. Payment method expansion (D-43)

### 2.1 Principles

1. **DIAL ledger** posts every `payment_intent`, hold, capture, COD attempt, fee, and payout. Providers never become a second SoR.
2. **Job Reserve / escrow** remains the target for prepaid Spare/Tech money (C-4). Methods that cannot hold escrow still create ledger holds as *internal* reserves and settle when cash/webhook confirms — with explicit risk flags.
3. All providers implement one interface family (`PspAdapter` / `PaymentMethodAdapter`) so checkout, WhatsApp pay links, and Temporal workflows stay provider-agnostic.
4. **Paynow remains primary ZW aggregator** for card/ZimSwitch/many wallets; ContiPay and EcoCash-direct are **parallel adapters**, not replacements. PayPal is international/diaspora. COD is cash fulfilment (D-7).

### 2.2 Adapter interface (extend Agent Pack)

```ts
// adapters/psp/types.ts — canonical

export type PaymentMethodCode =
  | 'paynow'
  | 'contipay'
  | 'ecocash_direct'
  | 'paypal'
  | 'cod_collection'   // cash at supplier
  | 'cod_delivery'     // cash via courier
  | 'psp_escrow'       // licensed escrow partner (D-4)

export type Money = { amountMinor: bigint; currency: 'USD' | 'ZWG' }

export type CreatePaymentInput = {
  reference: string
  money: Money
  method: PaymentMethodCode
  customer: { msisdnE164?: string; email?: string; name?: string }
  returnUrl: string
  resultUrl: string
  metadata: Record<string, string>
  /** When true, prefer AUTHORIZE/hold semantics if provider supports them */
  escrowPreferred: boolean
}

export type PaymentSession = {
  providerRef: string
  status: 'created' | 'redirect_required' | 'awaiting_customer' | 'pending' | 'paid' | 'failed' | 'cancelled'
  redirectUrl?: string
  pollUrl?: string
  /** USSD / push prompt already sent (EcoCash / ContiPay mobile) */
  customerAction?: 'approve_on_handset' | 'open_redirect' | 'pay_courier' | 'pay_at_supplier'
}

export interface PspAdapter {
  readonly code: PaymentMethodCode
  /** Capabilities for checkout UI + Job Reserve policy engine */
  capabilities(): {
    supportsHold: boolean
    supportsSplitPayout: boolean
    supportsRefund: boolean
    currencies: Array<'USD' | 'ZWG'>
    channels: Array<'web' | 'android' | 'ios' | 'whatsapp'>
  }
  createPayment(input: CreatePaymentInput): Promise<PaymentSession>
  pollStatus(providerRefOrPollUrl: string): Promise<PaymentSession['status']>
  capture?(input: { providerRef: string; money?: Money }): Promise<{ captureRef: string }>
  refund?(input: { providerRef: string; money: Money; reason: string }): Promise<{ refundRef: string }>
  /** Escrow partner only — instruct release to parties */
  instructRelease?(input: {
    holdRef: string
    allocations: Array<{ partyId: string; amountMinor: bigint }>
  }): Promise<{ instructionId: string }>
  verifyWebhook(headers: Record<string, string>, rawBody: string): Promise<{
    eventId: string
    type: string
    providerRef: string
    status: PaymentSession['status']
    payload: unknown
  }>
}

/** Registry used by packages/payments */
export type PspRegistry = Record<PaymentMethodCode, PspAdapter>
```

COD implements the same interface with no external HTTP: `createPayment` → `customerAction: 'pay_courier' | 'pay_at_supplier'`; status moves to `paid` only after courier/admin confirms + float reconciliation.

### 2.3 Provider matrix

| Method | Adapter class | Eng surface | Escrow / Job Reserve | Notes |
| --- | --- | --- | --- | --- |
| **Paynow** | `PaynowAdapter` | `POST …/initiatetransaction`, SHA512 hash, `pollurl`, result webhook | Prefer escrow partner path; Paynow buyer-protection if contracted | Primary ZW; raw API > thin Node SDK when methods missing |
| **ContiPay** | `ContiPayAdapter` | ContiPay REST: direct + redirect; providers EcoCash (`EC`), OneMoney, Omari, InnBucks, Visa/MC/ZimSwitch | Usually **instant/capture**, not true escrow — pair with `psp_escrow` or internal reserve policy | Site: https://contipay.co.zw/ — merchant approval required. Pattern from MIT SDKs: [`iamnigelzw/php-sdk`](https://github.com/iamnigelzw/php-sdk), PyPI `contipay`, npm `contipay-js` ([`njzw/contipay-js-client`](https://github.com/njzw/contipay-js-client) — licence unmarked; treat as API sample, reimplement) |
| **EcoCash direct** | `EcoCashDirectAdapter` | Official portal https://developers.ecocash.co.zw/ — charge/lookup/refund; handset prompt | No platform escrow — ledger `awaiting_customer` until SUCCESS | Use **official** credentials. Community: `phoscoder/ecocash` (MIT), `kinsleykajiva/ecocash-with-java` (MIT) = payload pattern only. Prefer ContiPay/Paynow when merchant already aggregated unless EcoCash commercial terms win |
| **PayPal** | `PayPalAdapter` | Orders v2: create (`intent: AUTHORIZE` preferred for Job Reserve-like hold) → buyer approve → authorize/capture; webhooks `PAYMENT.CAPTURE.*` / `CHECKOUT.ORDER.APPROVED` | AUTHORIZE ≈ soft hold (29d); **not** ZW escrow licence substitute | Diaspora / international; FX + DSWT on fees; reconcile to USD/ZWG ledger policy |
| **COD collection** | `CodAdapter` | Checkout flag → `cod_attempts`; supplier confirms cash | No PSP hold; order state `awaiting_cod`; ban via `CodDefaultRecord` | D-7 |
| **COD delivery** | `CodAdapter` | Courier app “Collect cash” → float ledger + daily banking queue | Same | Caps by order value + customer history |
| **PSP escrow** | `EscrowPspAdapter` | Partner hold/release API | **Canonical Job Reserve backing** | D-4 / D-4a critical path |

### 2.4 Coexistence rules

```text
Checkout / WhatsApp pay picker
        │
        ▼
packages/payments selects method from enabled_flags + currency + channel
        │
        ├─ prepaid + escrowPreferred → prefer psp_escrow, else Paynow/PayPal AUTHORIZE
        ├─ ZW mobile money → Paynow | ContiPay | ecocash_direct (config priority)
        ├─ international card/wallet → PayPal (and/or ContiPay/Paynow cards)
        └─ cash → COD_* (always available per D-7 caps)
        │
        ▼
payment_intents.method + provider_ref
        │
        ▼
ledger: reserve / receivable / cash_float (never double-post from two adapters)
```

- **One intent → one adapter.** Failover is a *new* intent with audit link, not dual-charge.
- ContiPay already routes EcoCash: enable `ecocash_direct` only when commercial case beats ContiPay/Paynow fees or ContiPay coverage gaps.
- Escrow PSP remains mandatory for launch architecture even if ContiPay/EcoCash/PayPal are live for capture rails.

### 2.5 Env vars (Agent Pack §6.6 extension)

```bash
# Existing
PAYNOW_INTEGRATION_ID=
PAYNOW_INTEGRATION_KEY=
PAYNOW_RESULT_URL=
PAYNOW_RETURN_URL=
PSP_ESCROW_BASE_URL=
PSP_ESCROW_API_KEY=
PSP_WEBHOOK_SECRET=

# ContiPay (D-43)
CONTIPAY_API_KEY=
CONTIPAY_API_SECRET=
CONTIPAY_MERCHANT_ID=
CONTIPAY_MODE=dev          # dev|live
CONTIPAY_WEBHOOK_URL=
CONTIPAY_SUCCESS_URL=
CONTIPAY_CANCEL_URL=

# EcoCash direct (optional parallel)
ECOCASH_API_KEY=
ECOCASH_MERCHANT_CODE=
ECOCASH_ENVIRONMENT=sandbox  # sandbox|live
ECOCASH_WEBHOOK_SECRET=

# PayPal Orders v2
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MODE=sandbox          # sandbox|live
PAYPAL_WEBHOOK_ID=

# COD policy
COD_MAX_ORDER_MINOR_USD=
COD_MAX_ORDER_MINOR_ZWG=
COD_COURIER_FLOAT_LIMIT_MINOR=
COD_BAN_FAILURE_THRESHOLD=3
```

### 2.6 Rejects / caveats (payments)

| Item | Why |
| --- | --- |
| Unofficial WhatsApp pay / Baileys | Ban risk — already rejected |
| Running ContiPay/Paynow PHP SDKs inside Node ERP | Wrong runtime — reimplement adapters |
| Treating ContiPay or EcoCash as escrow SoR | Not a licensed escrow substitute for C-4 |
| PayPal as sole ZW mobile money path | Poor EcoCash UX; keep ZW rails primary |
| Dual ledger sync from Medusa payments module | Violates D-38/D-42 doctrine |

---

## 3. Delivery Android app (D-44) + dispatch engine (D-45)

### 3.0 Ownership (locked)

| Concern | Owner | Not owner |
| --- | --- | --- |
| Delivery **job / offer / assignment / queue** SoR | **`packages/delivery`** + Temporal + BullMQ | foodhub-compose, Fleetbase, Navigator, Google Maps |
| Courier UX screens | `apps/delivery-android` (foodhub-compose **pattern**) | Fleetbase Navigator runtime |
| Maps render / ETA / multi-stop math | MapLibre + Nominatim/OSRM/**VROOM** (D-44) | Google as SoR |
| Live track fan-out | Supabase Realtime on `courier_locations` / `run:{id}` | Firebase as SoR |

**Dispatch product pattern (OSS reference only):** Fleetbase Fleet-Ops lifecycle (`dispatched` → driver accept → `started`) + Orchestrator “unassigned pool” ideas; GraphHopper **jsprit** / VROOM for *route* optimisation after accept. **Do not** run Fleetbase as job SoR (AGPL + dual logistics engine). **Algorithm / offer-cycle donor (D-45a):** [`aws-samples/aws-last-mile-delivery-hyperlocal`](https://github.com/aws-samples/aws-last-mile-delivery-hyperlocal) — see §3.9 bake-off.

### 3.1 Product surface

**App:** `apps/delivery-android` — **courier / last-mile only**. Does **not** reopen C-5 customer apps.

| Capability | Requirement |
| --- | --- |
| Auth | Courier role JWT; device binding; mock-location detection (same spirit as technician app) |
| Offer inbox | Incoming `delivery_offers` (pending) — **accept / reject**; timeout auto-expires |
| Run inbox | Accepted `delivery_runs` with ordered `delivery_stops` |
| Live GPS | Foreground service + periodic/batch upload; ERP stores `courier_locations`; fan-out via Supabase Realtime to ops + customer track |
| In-app map | MapLibre: own position, stop pins, active polyline |
| ETA | Server: OSRM route duration remaining → push to run; client displays clock |
| Multi-stop optimisation | Server: VROOM (OSRM backend) reorders open stops **after accept**; courier can request “optimise remaining” |
| POD | Photo + optional signature + GPS stamp → `pod_media` |
| COD | Collect amount, denomination notes, failure reasons → `cod_attempts`; float warning if over limit |
| Offline | Queue location + POD uploads; map region packs for Harare/Bulawayo |
| Comms | Optional Chatwoot deep-link / WhatsApp utility templates for customer ETA |

### 3.1a Dispatch rules (D-45) — auto-offer → reassign → FIFO queue

Mirrors Tech **`packages/matching`**: **deterministic eligibility filter, then rank** (v4 §3.4 / §5.3). Eligibility is never a model output.

**Courier status (assignment eligibility):** `available` | `busy` | `offline` (plus device/mock-location / float-limit / zone gates).

**Waiting queue fairness:** when **no** eligible available courier exists, the job sits in a **FIFO waiting queue** (`queued_at` order). Prefer FIFO for fairness across Shipments. **Distance / geo ranking applies only among currently available eligible couriers** when offering — not to reorder the waiting queue. (Multi-stop *route* optimisation after accept remains **VROOM**, which is distance/time-based and separate from who gets the next queued job.)

```text
Shipment ready for last-mile
  → packages/delivery creates delivery_job (status: queued|offering|assigned|…)
  → Temporal DeliveryDispatchWorkflow

If waiting queue non-empty AND courier becomes available:
  → dequeue FIRST job (FIFO) → start offer cycle for that job

Offer cycle (per job):
  1. Eligibility: status=available, zone/band OK, COD float OK, not mock-flagged,
     not already offered this job (or cooldown), device bound
  2. Rank eligible: optional geo (OSRM duration to pickup) + reliability score
     + COD suitability — explainable, deterministic
  3. Create delivery_offer → push to delivery-android (status: offered)
  4. Wait accept | reject | timeout (BullMQ/Temporal timer, e.g. 45–90s)
       accept → assign courier; delivery_job=assigned; create/activate delivery_run
                → (optional) VROOM optimise stops on that run
       reject | timeout → log assignment_event; mark offer expired/rejected;
                → offer next best eligible (exclude prior); if none → job back to FIFO queue
```

**State machine sketch (`delivery_jobs.status`):**

```text
pending_create → queued → offering → assigned → in_progress → completed
                      ↑         |         |
                      └─────────┴─────────┘  (reject/timeout/no eligible → queued)
Any non-terminal → cancelled (ops / order cancel)
```

**Offer states (`delivery_offers.status`):** `pending` → `accepted` | `rejected` | `timed_out` | `superseded`.

### 3.2 Data model (Agent Pack tables)

```text
delivery_jobs
  id, shipment_id, status (queued|offering|assigned|in_progress|completed|cancelled),
  queued_at, assigned_courier_id?, active_offer_id?, run_id?,
  priority (default 0; FIFO within priority), created_at

delivery_offers
  id, job_id, courier_id, rank_score, status (pending|accepted|rejected|timed_out|superseded),
  offered_at, expires_at, responded_at?

delivery_assignment_events
  id, job_id, offer_id?, courier_id?, type (enqueued|offered|accepted|rejected|timed_out|
      reassigned|dequeued|manual_override), payload jsonb, created_at

delivery_runs
  id, job_id?, courier_id, status (planned|active|completed|cancelled),
  optimised_at, vroom_plan_json, created_at

delivery_stops
  id, run_id, shipment_id, seq, lat, lng, landmark,
  status (pending|en_route|arrived|delivered|failed|cod_pending),
  eta_at, completed_at, pod_media_id, cod_attempt_id

courier_locations
  id, courier_id, run_id?, lat, lng, accuracy_m, recorded_at, source (gps|mock_rejected)

-- existing (extend): zones, shipments, pod_media, cod_attempts
-- couriers.availability_status: available|busy|offline
-- payment_intents.method enum includes D-43 codes
```

### 3.3 Primary maps stack (ONE pick)

**Primary: MapLibre Native Android (BSD-2-Clause) + maplibre-compose (BSD-3-Clause) + self-hosted / offline OSM tiles + Nominatim + OSRM + VROOM.**

| Layer | Choice | Why |
| --- | --- | --- |
| Render | MapLibre Native + Compose wrapper | Active, permissive, offline regions / MBTiles, matches Compose courier + technician stack |
| Tiles | Self-host OpenMapTiles / Protomaps from **Geofabrik Zimbabwe** extract; optional CDN cache | Avoids Google/Mapbox as SoR; FX + DSWT friendly; works offline in packs |
| Geocode | Nominatim (Tier 2) | Already Blueprint I-2 |
| ETA / legs | OSRM | Already locked |
| Multi-stop | VROOM on OSRM | True VRP; BSD-2-Clause |

**Do not use Google Maps as sole SoR** for courier maps or distance arithmetic (D-44 / Agent Pack do-not-reopen). Optional commercial tiles only as visual fallback if OSM rural gap (Blueprint §3.3 narrowed scope).

### 3.4 Maps / routing rejects

| Candidate | Licence | Verdict |
| --- | --- | --- |
| **osmdroid** | Apache-2.0 | **Reject primary** — archived; weaker modern vector/Compose story |
| **Organic Maps** | Mixed / NOASSERTION on GitHub | **Reject as embedded SDK** — full offline *app*, not a clean map library; study UX only |
| **Mapsforge / VTM** | LGPL-3.0 | **Reject primary** — LGPL copyleft friction vs MapLibre BSD |
| **Google Maps SDK** | Proprietary | **Reject as SoR** — cost, FX, offline; optional last-resort visual only |
| **Mapbox GL** | Proprietary (post-fork) | **Reject** — MapLibre is the OSS fork path |
| **Valhalla** | MIT (engine; confirm LICENSE in tree) | **Reject as primary** — capable TSP-ish tooling but duplicates OSRM+VROOM already chosen; higher ops surface |
| **GraphHopper + jsprit** | Apache-2.0 | **Alternate Tier 2** if VROOM fails ops fit — not primary |
| **OSRM trip plugin alone** | BSD-2-Clause | Fine for small TSP; prefer **VROOM** when multiple vehicles/constraints |

### 3.5 Primary delivery-app UX donor (ONE pick)

**Primary: [`furqanullah717/foodhub-compose`](https://github.com/furqanullah717/foodhub-compose) — Apache-2.0.**

- Kotlin + Jetpack Compose + Hilt + rider flavour (pickup/delivery, location, status).
- **Pattern screens only** onto DIAL APIs.
- Replace Google Maps with MapLibre; remove Stripe/Firebase Auth/FCM-as-SoR (use DIAL push + Supabase).
- Architecture still lean on **Now in Android** module layout (same as technician).

**Secondary pattern (AGPL caveat):** [`fleetbase/navigator-app`](https://github.com/fleetbase/navigator-app) (AGPL-3.0, React Native) — POD, QR, issue/fuel reports, live order steps. **Reference-only**; do not copy into proprietary core without counsel.

**Other rejects / demotions**

| Repo | Why not primary |
| --- | --- |
| `yamindroid/delivery-compose-android` | No SPDX licence on GitHub |
| Fleetbase Navigator as runtime | AGPL + RN ≠ Compose stack; logistics SoR conflict |
| Food-delivery demos on Google Maps + Firebase money | Wrong maps + money doctrine |
| Flutter courier demos (e.g. Nokta) | Wrong UI toolkit for courier Android (Compose locked with technician) |

### 3.6 Live location architecture

```text
delivery-android (FGS)
  → POST /api/v1/courier/locations  (batched, Idempotency-Key optional)
  → packages/delivery writes courier_locations
  → outbox → Realtime channel `run:{id}`
  → admin-web MapLibre live track + customer track screen subscribe
```

- Throttle (e.g. 5–15s moving / 60s idle); drop mock GPS.
- ETA refresh: BullMQ/Temporal worker calls OSRM from last point → next open stop; write `delivery_stops.eta_at`.
- **Management UI:** `apps/admin-web` → **Orders & delivery** module — order/shipment detail **live MapLibre map** of the assigned driver’s latest `courier_locations` (ops tracking). Customer surfaces subscribe to the same Realtime channel for “track my delivery” (read-only). Emergency tech map (§6.17 F) stays separate.

### 3.7 Multi-stop optimisation flow

1. After a courier **accepts** (or ops manual assign), `packages/delivery` creates/activates `delivery_run` with unordered or draft-ordered stops.
2. Worker calls **VROOM** with OSRM matrices → persists `seq` + `vroom_plan_json`. (VROOM = run optimisation, **not** who gets the job.)
3. Courier starts run; on “optimise remaining”, re-solve open stops only.
4. Client draws MapLibre polyline from OSRM geometry for current leg (not from Google Directions).

### 3.8 Temporal / BullMQ roles (D-45)

| Engine | Owns |
| --- | --- |
| **Temporal** `DeliveryDispatchWorkflow` | Durable offer cycle, reassign chain, dequeue-on-available, cancel/compensate with order state |
| **BullMQ** | Offer timeout ticks, ETA refresh, location ingest fan-out, Meili-unrelated image/POD processing |
| **n8n** | Optional ops chase (manual “stuck in queue” alerts) — not SoR |

When courier status flips `busy|offline` → `available`, emit event → workflow/worker dequeues **FIFO head** and starts a new offer cycle.

### 3.9 Delivery dispatch OSS bake-off (D-45 / D-45a)

**Research pass:** 2026-08-11 (WebSearch + `gh api` SPDX/stars). Re-verify licences at Gate 1 before any copy-paste.

**Verdict:** There is **no** production-ready MIT/Apache TypeScript logistics OS that is safe to run inside the proprietary ERP as a second job engine. **DIAL keeps job SoR in `packages/delivery`.** The strongest **code-integration** donor for the offer → accept/reject → requeue loop (and ranking ideas) is **AWS Last Mile Hyperlocal (MIT-0)**. Closest *product* twins (Fleetbase, Witylogix) are **AGPL** — pattern/UX only.

#### Ranked candidates

| Rank | Repo | Stars¹ | SPDX | Stack | Accept/reject/reassign | FIFO when none available | Live track | AGPL/GPL risk | Tier / integration |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **1 — Primary** | [`aws-samples/aws-last-mile-delivery-hyperlocal`](https://github.com/aws-samples/aws-last-mile-delivery-hyperlocal) | ~54 | **MIT-0** (LICENSE text; GitHub `NOASSERTION`) | TS + Java dispatch engine; AWS Step Functions / IoT / Kinesis / DynamoDB | **Yes** — notify driver; accept/reject; reject → order back to dispatch batch | Partial — batch/requeue semantics; **DIAL still owns explicit FIFO waiting queue** | Yes (track & search + GPS ingest) | Low (permissive) | **Tier 1 copy algorithms / state-machine ideas** into `packages/delivery` — **not** AWS runtime |
| 2 | [`fleetbase/fleetbase`](https://github.com/fleetbase/fleetbase) + [`fleetops`](https://github.com/fleetbase/fleetops) + [`navigator-app`](https://github.com/fleetbase/navigator-app) | ~2341 / 17 / 86 | **AGPL-3.0** | JS/PHP + RN Navigator; OSRM; WebSockets | Strong product fit (ad-hoc accept/decline; Fleet-Ops lifecycle) | Unassigned / orchestrator pool (study; reimplement) | Strong live map + WS | **High** as dependency | **Tier 2 UI / lifecycle pattern only** — already locked; never runtime SoR |
| 3 | [`wityliti/witylogix`](https://github.com/wityliti/witylogix) | ~0 | **AGPL-3.0** | Fastify TS, Postgres/PostGIS, Redis, **BullMQ**, Leaflet/OSM, OSRM, Socket.io; `assignDriver` workflow | Scoring + assign workflows (study) | Queue/dashboard concepts | Leaflet + WS tracking | **High** | **Tier 2 stack-shape / workflow pattern only** — closest *infra rhyme* to DIAL (BullMQ) but AGPL + immature stars |
| 4 | [`graphhopper/jsprit`](https://github.com/graphhopper/jsprit) | ~1826 | **Apache-2.0** | Java VRP toolkit | **No** — assignment = vehicle routing, not human offer cycle | N/A | N/A | Low | **Reject as offer-engine**; keep as **Tier 2 VRP alternate** if VROOM fails (already §3.4) |
| 5 | [`VROOM-Project/vroom`](https://github.com/VROOM-Project/vroom) | ~1829 | **BSD-2-Clause** | C++ VRP | **No** — post-accept multi-stop only | N/A | N/A | Low | **Already locked** for run optimisation — not who gets the job |
| 6 | [`furqanullah717/foodhub-compose`](https://github.com/furqanullah717/foodhub-compose) (+ [`kaaneneskpc/Deliverr`](https://github.com/kaaneneskpc/Deliverr) MIT) | ~23 / ~39 | Apache-2.0 / MIT | Kotlin Compose; Google Maps; Stripe/Firebase | Rider accept UX only; thin/no production dispatch SoR | Weak | Client GPS only | Low | **Tier 2 Android UX** (foodhub already D-44 primary); strip Google/Stripe |
| 7 | [`SectorCT/WayPoint`](https://github.com/SectorCT/WayPoint) | ~3 | **MIT** | RN + Django; K-means + OSRM | Auto-allocate packages; not full offer timeout chain | Weak | Live GPS + reroute | Low | **Demote** — tiny; study clustering only |
| 8 | [`mrmarufpro/Delivery-management-system`](https://github.com/mrmarufpro/Delivery-management-system) | ~57 | **MIT** | NestJS + Remix + Prisma + MySQL | Basic CRUD delivery mgmt | Weak | Weak | Low | **Demote** — useful Nest/Prisma shapes only; not dispatch state machine |

¹ Stars from GitHub API at research date — approximate.

**Demoted / reject (domain or licence):**

| Repo | Why |
| --- | --- |
| [`ro31337/libretaxi`](https://github.com/ro31337/libretaxi) (~3914★, AGPL-3.0, Go/Telegram) | Ride-hail P2P via Telegram — wrong domain; AGPL |
| Google-Maps-only rider SDKs (e.g. Compose tracking demos) | Cannot be SoR under D-44 MapLibre lock |
| Full marketplace/money engines (Fleetbase Ledger, Medusa money, Stripe-first food demos) | Dual SoR vs DIAL ledger |

#### Primary donor — what to integrate (D-45a)

**Primary:** [`aws-samples/aws-last-mile-delivery-hyperlocal`](https://github.com/aws-samples/aws-last-mile-delivery-hyperlocal) — **MIT-0**.

**Port into `packages/delivery` (reimplement in TypeScript; do not vendor AWS CDK/IoT):**

| Donor concept | DIAL target |
| --- | --- |
| Dispatch orchestrator offer → driver decision | Temporal `DeliveryDispatchWorkflow` + `delivery_offers` |
| Accept / reject; reject returns order to batch | Accept → assign; reject/timeout → next ranked / FIFO queue |
| Instant sequential assignment / ranking heuristics | Eligibility → rank (geo via **OSRM**, not GraphHopper; reliability + COD gates) |
| GPS ingest + track/search ideas | `courier_locations` + Supabase Realtime (not AWS IoT as SoR) |
| Simulator accept/reject event shapes | Test fixtures for dispatch workflow |

**Do not port:** Step Functions as SoR, IoT Core topics, DynamoDB order store, GraphHopper as primary router (OSRM+VROOM locked), Mapbox/Google map UIs.

**Still build ourselves:** wiring from DIAL `shipments` / orders → `delivery_jobs`; ledger/COD/POD; MapLibre admin live map; Compose `delivery-android`; FIFO fairness policy; BullMQ offer timers; Temporal compensation with order cancel.

**Alternates:** Fleetbase Fleet-Ops/Navigator (AGPL, UX/lifecycle); Witylogix (AGPL, BullMQ/Leaflet stack rhyme); jsprit only if VROOM ops-fail.

---

## 4. Full MVP deep-dive stitch (quick index)

| Domain | Donor / tool | Package / app |
| --- | --- | --- |
| Spare UX | Mercur B2C | `spare-web` |
| Tech UX | FixItNow | `tech-web` |
| Supplier UX | Mercur vendor | `supplier-web` |
| Promotions | Medusa + OfferKit stitch | `packages/promotions` |
| Search | Meili | `packages/search-indexer` |
| Money | PspAdapter matrix §2 | `packages/payments` + `adapters/psp/*` |
| Fiscal | FDMS virtual | `adapters/fdms` |
| WA | Cloud API + Flows | `adapters/whatsapp` |
| Chat | Chatwoot | infra |
| Booking | Cal.com | infra |
| Jobs durable | Temporal | infra |
| Queues | BullMQ | workers |
| Maps math | Nominatim + OSRM + VROOM | infra + `adapters/maps` |
| Delivery job SoR / dispatch | In-repo eligibility→rank + FIFO queue (D-45); algorithm donor AWS Last Mile MIT-0 (D-45a) | `packages/delivery` + Temporal |
| Courier UX | foodhub-compose rider | `delivery-android` |
| Courier maps | MapLibre | `delivery-android` + `admin-web` live track |
| Tech mobile | Now in Android | `technician-android` |
| Supplier CSV import | tableflowhq/csv-import (D-46) | `supplier-web` + admin unmatched queue |
| Fleet expiry UX | Tracktor (D-46) | Care/Fleet portals |
| PDF statements | @react-pdf/renderer (D-46) | workers / `packages/statements` |
| Bluetooth print | DantSu ESC/POS (D-46) | `technician-android` |
| Ledger explorer UX | Formance Console patterns (D-46) | `admin-web` module H |
| BullMQ inspector | bull-board (D-46) | internal ops route |
| Roster calendar | Schedule-X (D-46) | `admin-web` / tech roster |

---

## 5. Build-order implications

| Order | Work | Notes |
| --- | --- | --- |
| T0 | Add `apps/delivery-android` shell + MapLibre hello-map | Tokens shared with technician |
| T5+ | Expand `PspAdapter` registry; stubs ContiPay / EcoCash / PayPal / COD | Paynow + fake escrow first |
| T5b | `payment_intents.method` enum + webhook routes | Idempotent `psp_events` |
| Delivery-A | Tables `delivery_jobs`, `delivery_offers`, `delivery_assignment_events`, `delivery_runs`, `delivery_stops`, `courier_locations` | RLS: courier own offers/runs |
| Delivery-B | Location ingest + Realtime + **admin-web live MapLibre track** | Before fancy optimise |
| Delivery-C | `DeliveryDispatchWorkflow` offer/accept/reject/timeout + FIFO queue | Mirrors Tech matching |
| Delivery-D | OSRM ETA worker | Depends on Nominatim pins |
| Delivery-E | VROOM multi-stop (post-accept) | After ≥2 stops/run common |
| Delivery-F | COD collect UI + float limits | Aligns D-7 ops |
| Gate | Offline ZW tile packs | Before rural courier pilots |
| Launch | Escrow PSP contract still blocks prepaid Job Reserve | ContiPay/EcoCash/PayPal can sandbox earlier |

**Do not** block Spare/Tech UI trains on ContiPay merchant approval — stubs suffice.

---

## 6. Do-not-reopen (this companion)

- Google Maps / Mapbox as **default** distance or courier map SoR.
- Fleetbase / Medusa / Mercur as delivery or money runtime SoR (dispatch SoR = `packages/delivery` — D-45).
- Replacing FIFO waiting-queue fairness with pure distance reordering of queued jobs (geo ranks **offers** among available couriers only).
- AGPL Navigator code in the proprietary monorepo without counsel.
- Expo/RN for `delivery-android` (Compose to match technician).
- Replacing Paynow wholesale with ContiPay without fee/coverage evidence.
- Skipping COD reconciliation engineering (D-7 already decided).
- Formance / Blnk / Invoice Ninja / Lago as **money or Care billing SoR** (D-46 — display/portal patterns only).
- Replacing PaddleOCR with Surya weights (v4 §5.5 / §5.13 revenue-threshold trap).
- Replacing Cal.com slot sibling with Schedule-X (Schedule-X = display only).

---

## 7. Additional ERP OSS opportunities (gap analysis vs locked matrix)

**Scope:** Admin modules A–P (v4 §6.17), supplier/tech/fleet ops UX, and tech-device patterns **not** already owned by D-38 / D-42 / D-43 / D-44 / D-45 / D-45a.  
**Already covered (do not re-research as primary):** Mercur / FixItNow / CoolMall / Now in Android / SandPIM / Medusa+OfferKit / MapLibre / foodhub-compose / AWS Last Mile / Chatwoot / Cal.com / Formbricks / PostHog / Metabase / Meili / Temporal / n8n / BullMQ / Nominatim+OSRM+VROOM / Paynow+ContiPay+EcoCash+PayPal adapters / **PaddleOCR + Tesseract** (v4 §5.5 — stock sheets, registration books, VIN).

### 7.1 D-46 complementary ERP stitch kit (locked must-adopt — max 7)

| # | Feature (module) | Current gap | Recommended repo | Licence (SPDX) | Stars¹ | Tier | Integrate how | Reject |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Supplier catalog upload (C / Appendix A) | Mercur vendor covers seller shell; **no** first-class CSV/XLSX map→validate→preview UX for `SupplierStockRow` | [`tableflowhq/csv-import`](https://github.com/tableflowhq/csv-import) | **MIT** | ~1.8k | **Tier 1 pattern** | Embed importer modal in `supplier-web` + admin catalogue unmatched queue; map columns A–I; emit validated rows → DIAL match/OCR pipeline | Do not use Tableflow cloud as SoR; do not adopt AGPL ImportCSV **backend** |
| 2 | Dial Fleet / vehicle compliance (Care+Fleet) | WA Fleet Flows exist; **no** dedicated vehicle expiry/maintenance dashboard donor | [`javedh-dev/tracktor`](https://github.com/javedh-dev/tracktor) | **MIT** | ~1.0k | **Tier 2 pattern** | Copy garage / insurance-PUCC / maintenance / reminder widgets into Care+Fleet portals + admin credential clocks | Not courier dispatch (D-44/45); not GPS tracking SoR |
| 3 | PDF statements / B2B line docs (C, H, Care) | Statement lines specified; **no** PDF renderer locked | [`diegomura/react-pdf`](https://github.com/diegomura/react-pdf) (`@react-pdf/renderer`) | **MIT** | ~16.7k | **Tier 1 lib** | Generate supplier settlement, tech payout, Care/Fleet statements from ledger DTOs (server or worker) | Not a second invoicing product; FDMS fiscal PDF stays ZIMRA path |
| 4 | Tech Bluetooth thermal print | Required on technician Android; library unnamed | [`DantSu/ESCPOS-ThermalPrinter-Android`](https://github.com/DantSu/ESCPOS-ThermalPrinter-Android) | **MIT** | ~1.5k | **Tier 1 lib** | Wire into `technician-android` (+ optional `delivery-android` labels) via Now-in-Android print module | Do not couple print to fiscalisation device (D-40a = virtual FDMS) |
| 5 | Ledger / reserve explorer UX (H) | Append-only browser specified; no UI donor | [`formancehq/ledger`](https://github.com/formancehq/ledger) **Console UI patterns** (alt: [`blnkfinance/blnk`](https://github.com/blnkfinance/blnk) Apache-2.0) | **MIT** | ~1.3k / ~0.5k | **Tier 2 pattern** | Study account/posting/explorer screens; **reimplement** read-only views on DIAL `ledger_*` + Job Reserve | **Never** run Formance/Blnk as money SoR; no Numscript as DIAL posting engine |
| 6 | BullMQ eng/ops board (platform) | BullMQ locked; no inspector | [`felixmosh/bull-board`](https://github.com/felixmosh/bull-board) | **MIT** | ~3.4k | **Tier 2 sibling** | Mount behind admin SSO for workers (reindex, Sharp, webhooks, dispatch timers) | **Not** the product SLA queues (disputes/credentials) — those stay in-repo Command centre (A) |
| 7 | Tech/ops roster calendar (D / F) | Cal.com = **slots** sibling only; admin needs multi-tech day board | [`schedule-x/schedule-x`](https://github.com/schedule-x/schedule-x) | **MIT** | ~2.5k | **Tier 1 lib** | Admin + tech-web roster / capacity views bound to DIAL assignments | Do **not** replace Cal.com for customer bookable slots |

¹ Stars approximated from GitHub at D-46 research pass (2026-08-11); re-check at Gate 1.

### 7.2 Recommended backlog (no new D-IDs)

| Feature | Current gap | Recommended repo | Licence | Tier | Integrate how | Reject / caveat |
| --- | --- | --- | --- | --- | --- | --- |
| Queue-first **product** ops console (A) | Command centre is in-repo; need triage UX inspiration | [`makeplane/plane`](https://github.com/makeplane/plane) triage/inbox | **AGPL-3.0** | Tier 2 pattern **only** | Keyboard claim/resolve, SLA badges, correlation deep-links — reimplement in `admin-web` | Do not fork Plane into monorepo; Metabase stays BI not ops queue |
| KYC / document verification (C, D, L) | Vetting packs + credential clocks; weak capture UX | [`ballerine-io/ballerine`](https://github.com/ballerine-io/ballerine) case-mgmt + collection flows | **ELv2** (default; modular) | Tier 2 pattern | Study document-step UX + review queue; wire uploads to DIAL media + human verify | ELv2 ≠ OSI; no Ballerine as identity SoR; ZW ID docs need human correction UI (§5.5) |
| Disputes / returns / warranty (J) | Taxonomy + evidence tables exist; thin claim UI | Medusa order-return admin **patterns** (already Medusa-aware via D-42) + in-repo Kanban | MIT (Medusa) | Tier 2 pattern | Reason codes → owner routing; evidence deadline clocks; four-eyes | Immature 0★ dispute demos; do not add AI-claims engines as SoR |
| Evidence gallery / photo review (F, M) | `job_media` + MediaFingerprint; no proofing UX | [`PicPeak/picpeak`](https://github.com/PicPeak/picpeak) | **MIT** | Tier 2 pattern | Lightbox, keyboard next/prev, approve/reject for dispute + POD + near-dupe review | Not a customer photo-sharing product |
| Notification preference centre (N) | Consent + Resend/Brevo (D-28); no pref-matrix UX | shadcn notification-preference blocks + in-repo store | MIT (shadcn) | Tier 1 pattern | Channel × topic matrix; utility vs marketing cost class | Novu (~39k★) is dual/EE-skewed (`NOASSERTION`) — API optional later, not SoR |
| Support tickets beyond Chatwoot | Chatwoot = human chat (locked) | Keep Chatwoot; escalate to admin queues | MIT | — | Deep-link Chatwoot conversations → dispute/order ids | Do not add second helpdesk SoR |
| Multi-tenant B2B invoicing polish | Statement content in-repo | [`SolidInvoice/SolidInvoice`](https://github.com/SolidInvoice/SolidInvoice) layouts | **MIT** | Tier 2 pattern | Visual polish for PDF/HTML statements | Invoice Ninja = **ELv2** — self-host OK for *own* books only; **reject** as marketplace SoR |
| Care / Fleet subscription portal | Care packages in WA Flows; billing portal thin | [`getlago/lago`](https://github.com/getlago/lago) customer portal UX | **AGPL-3.0** | Tier 2 pattern **only** | Portal information architecture; DIAL Care entitlements stay in-repo | No Lago as subscription SoR |
| Graph fraud / trust (M) | MediaFingerprint + fraud signals | [`safe-graph/DGFraud`](https://github.com/safe-graph/DGFraud) / [`UGFraud`](https://github.com/safe-graph/UGFraud) | **Apache-2.0** | Research / later | Offline graph experiments on supplier–offer–media graphs | Not launch-critical; no GNN in money path without eval gate |
| Escrow / payment ops console (H) | PSP instruction log + four-eyes | In-repo Temporal visibility + Formance-style hold explorer (D-46 #5) | — | Tier 1 | Hold → release allocations UI on DIAL instructions | Reject crypto escrow dapps as ZW PSP UX |
| Rate cards / pricing admin (G) | Rate card versions in-repo | Medusa price-list admin **patterns** (D-42 adjacency) | MIT | Tier 2 pattern | Versioned labour units + delivery bands UI | Pricing engine stays deterministic in DIAL |
| Warehouse / owned inventory | Asset-light; supplier stock heartbeats | Skip owned WMS for MVP | — | — | — | Inventree/Odoo-style WMS out of launch scope |
| OCR stock sheets | **Already locked** PaddleOCR / PP-OCR / Tesseract (§5.5) | — | Apache-2.0 | Tier 1 organ | Correction UI for unmatched OCR rows (in-repo) | Surya weights (revenue licence); Nougat NC |
| i18n | Parked (D-23) | — | — | — | Skip | — |
| Temporal workflow ops | Temporal locked | [`temporalio/ui`](https://github.com/temporalio/ui) | **MIT** | Tier 2 sibling | Ops visibility for Money + DeliveryDispatch workflows | Not product admin home |

### 7.3 What to take vs reject (summary)

| Take | Reject |
| --- | --- |
| CSV map/validate UX, fleet expiry widgets, PDF renderer, ESC/POS lib, ledger *explorer* patterns, BullMQ board, roster calendar lib | Second ledger, second helpdesk, AGPL Plane/Lago/Navigator as dependencies, ELv2 Invoice Ninja / Ballerine as SoR, crypto escrow, owned WMS, reopening Google Maps / Fleetbase / Mercur money |

---

## 8. D-53 platform extension OSS (v7-2 absorb)

**Companion:** `DIAL_v7_2_Adopted_Platform_Extensions.md`. **Classifier:** `DIAL_v7-2_Adjustment_Expansion_Evaluation.md`. Does **not** reopen D-37…D-52.

| Feature | Repo | SPDX | Tier | Integrate how | Reject |
| --- | --- | --- | --- | --- | --- |
| Catalogue enrichment UX | [`unopim/unopim`](https://github.com/unopim/unopim) | MIT | Tier 2 pattern | Study queues/attributes/publish → `services/catalogue-factory` | UnoPIM as catalogue SoR; Akeneo CE EOL path as new SoR |
| Supplier CSV (existing) | [`tableflowhq/csv-import`](https://github.com/tableflowhq/csv-import) | MIT | Tier 1 | Feed Factory ingest (D-46) | Tableflow cloud SoR |
| Trade taxonomy seed | [`colaberry/WorldOfTaxonomy`](https://github.com/colaberry/WorldOfTaxonomy) | MIT | Tier 2 data | Optional ESCO/ISCO seed into `trade_definitions` | Remote taxonomy as runtime bookability gate |
| Non-money rules | [`CacheControl/json-rules-engine`](https://github.com/CacheControl/json-rules-engine) | ISC | Tier 1 lib | Intake/matching modifiers | Ledger / payable amounts in rules |
| Score explain (offline) | [`shap/shap`](https://github.com/shap/shap) | MIT | Tier 2 offline | Batch audits of Value Score | Live money path |
| Ranking Shapley (research) | [`DataResponsibly/ShaRP`](https://github.com/DataResponsibly/ShaRP) | MIT | Research | Optional | MVP dependency |
| Commercial DES | [SimPy](https://gitlab.com/team-simpy/simpy) | MIT | Tier 1 | `services/commercial-simulation` | `simpx/simpy` fork as primary; mutating ledger |
| DES alt | [`salabim/salabim`](https://github.com/salabim/salabim) | MIT | Tier 2 opt | Same offline rule | — |
| Sensitivity | [`SALib/SALib`](https://github.com/SALib/SALib) | MIT | Tier 1 | what-breaks-first | — |
| Full ABM / SupplyNetPy | — | — | **Defer/reject D-53** | — | Mesa full ABM + SupplyNetPy twin |
| OR-Tools / Pyomo | — | Apache-2.0 / BSD | Offline only | Experiments | Delivery SoR (D-44/45) |
| Feature flags | PostHog + Pack `feature_flags`; opt. [`thomaspoignant/go-feature-flag`](https://github.com/thomaspoignant/go-feature-flag) + [`open-feature/flagd`](https://github.com/open-feature/flagd) | MIT / Apache-2.0 | Tier 2 opt | Internal rollout | **Unleash SoR (AGPL-3.0)**; flags overriding certification DB |
| Domain module pattern | [`nestjs/nest`](https://github.com/nestjs/nest) | MIT | Tier 2 pattern | `DialDomainModule` ideas | Nest mandate; Kernel as second ledger |
| WHT certificate PDF | [`diegomura/react-pdf`](https://github.com/diegomura/react-pdf) | MIT | Tier 1 | Tech Take-Home certificates (D-46/D-50) | Second payroll product SoR |
| Ops viz isolate | grafana/grafana | AGPL-3.0 | Tier 2 isolate | Self-host only | Import into app binary |

---

*End of `DIAL_Deep_Engineering_and_OSS_Stitch.md` — locks engineering detail for D-43 / D-44 / D-45 / D-45a / **D-46** / **D-53**. Agent Cursor guardrails: **D-47** / `AGENTS.md`.*
