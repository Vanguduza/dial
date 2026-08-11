# DIAL WhatsApp Flows & Message Templates — v1.2

**Companion to `DIAL_Consolidated_Plan_v4.md`.** Locked by **D-40**, expanded to full MVP surface by **D-41**, promotions/referrals by **D-41a**, Spare USD browse + ZiG-at-checkout + EcoCash/COD buttons by **D-57**, open-issue locks by **D-60**. Official **WhatsApp Cloud API only** (no Baileys / whatsapp-web.js). Same ERP APIs as web/mobile — WhatsApp is never a second source of truth (v4 §6.2).

**Authority:** product rules in v4; this file owns Flow screen maps, template IDs/copy shells, categories (Utility / Marketing / Auth), and Chatwoot handoff. Re-verify Meta template approval and Rest-of-Africa rates before go-live (§4.6).  
**Agent hygiene:** webhook signature + idempotency and secrets rules are **D-47** (`DIAL_Cursor_Rules_and_Skills.md`) — do not redefine AuthZ here.

**MVP rule (D-37 + D-41):** everything in §§2–6 **and** §10 ships in the **single customer launch** — not a later phase.

---

## 0. ZIMRA FDMS — device vs API (answered)

**You do not need a physical fiscal printer/hardware FDMS device for DIAL’s connected server architecture.**

ZIMRA allows either:

| Path | What it is | Fit for DIAL |
| --- | --- | --- |
| **A. Hardware fiscal device** | Approved physical device from ZIMRA-listed suppliers | Poor fit — marketplace is server-side, multi-channel |
| **B. Virtual Fiscalisation (API)** | Software “virtual device” + Fiscal Device Gateway API (REST JSON) | **Chosen** — ZIMRA recommends API for taxpayers on connected servers |

**What “virtual device” still means (not optional):**

1. Register on ZIMRA tax portal → obtain **device ID, serial, activation key** (software credentials, not a box).  
2. Implement API: `registerDevice` / `getConfig` → **`openDay`** → **`submitReceipt`** (cryptographically signed) → **`closeDay`**.  
3. Durable outbox + fiscal-day state machine (v4 §7.1, Agent Pack adapters).  
4. Test environment approval before live.  
5. **D-59:** in-house Virtual Gateway default; CloudESD optional `FdmsSigner` only.

**Founder lock:** DIAL uses **FDMS Virtual Fiscalisation via API**; no retail fiscal printer in the critical path. Admin still shows “device” status = virtual device certificate health.

**D-58 / D-59 agency FDMS:** Characterisation = **agent**. Receipt classes: `DIAL_FEE` (DIAL VAT on commission/fees), `GOODS_FORMAL` (supplier seller / on-behalf; VAT-inclusive goods), `GOODS_INFORMAL` (no goods VAT fiscal; never B2B). In-house Virtual Gateway default; CloudESD optional only. **WhatsApp payments** enqueue the same `fdms_outbox` as web; e-invoice/receipt links must reflect these tax lines. **No DIAL-owned principal SKUs** (D-51 discarded).

---

## 1. Channel architecture (how WhatsApp is used)

```text
Customer WhatsApp
    │
    ├─ Session (24h free) ── interactive lists/buttons + Flows + free replies
    ├─ Templates (paid if outside window) ── Utility / Marketing / Auth
    ├─ Flows (in-chat multi-screen forms + data_exchange endpoint)
    └─ Live chat handoff ── Chatwoot (human) keyed by customer_id / order_id / job_id
           │
           ▼
    DIAL ERP APIs (catalogue, offers, jobs, payments, Care, Fleet)
           │
           ▼
    Paynow / PSP escrow (payment links — not WhatsApp Pay for ZW at launch)
```

### 1.1 Feature map

| Meta feature | Use in DIAL |
| --- | --- |
| **WhatsApp Flows** (+ `data_exchange`) | Spare search→cart→checkout; Tech intake→troubleshoot→book; Care status/upgrade; Fleet vehicles/expiry/maintenance; **plus full §10 MVP catalog** (returns, referrals, promos, media, calendar, etc.) |
| **Utility templates** | Order/job/payment/dispatch/expiry *account* updates; supplier heartbeat; referral reward notices |
| **Marketing templates** | Upgrades, renewals, re-engagement, **promo blasts** — **consent required** (§2B-26) |
| **Authentication templates** | OTP / login link if phone-auth on WA |
| **Interactive list/reply buttons** | Menus inside free service window |
| **Chatwoot** | Live chat; never invent job/order status in the inbox |
| **Catalog / product messages** | Optional later; Flows + Meili search are launch Spare path |
| **WhatsApp Pay / India checkout-button payments** | **Not launch** for ZW — India-centric hosted WA Pay |
| **Spare checkout method buttons (D-57)** | **Required** — EcoCash + COD via Cloud API interactive buttons / Flow CTAs at pay step (not free-text only); other methods may use Paynow/PSP URL |
| **Media upload / CalendarPicker / RichText / OptIn / Image** | MVP (D-41) — Tech/Care/Fleet evidence; booking; T&Cs; consent; Spare imagery |

### 1.2 Hard rules

1. Customer-initiated or open 24h window → prefer free session messages.  
2. Never put card numbers / ID docs in Flows; payment = hosted Paynow/PSP link **or** EcoCash/COD button path (**D-57**).  
3. AI guided intake on Tech may run server-side; **no AI price** as payable amount (v4 §5.9).  
4. Emergency Tech path: short-circuit Flow → human/deterministic dispatch.  
5. Template category honesty — Meta reclassifies; budget Utility vs Marketing (§4.6).  
6. Consent: marketing, Vehicle Hub reminders, Care renewals — granular + revocable.  
7. Eighteen-item electronic disclosure + order review before final pay (v4 §7.5) — include a **review screen** in Spare checkout Flow.  
8. Spare browse/cart = **USD only**; ZiG only at Pay step / COD confirm transparency (**D-57**). EcoCash + COD must be **button/CTA choices**, not free-text.

---

## 2. Dial a Spare — autonomous search, cart, checkout + live chat

### 2.1 Happy path (no human)

```text
Menu → Search Flow (OEM | vehicle model | VIN)
  → results (from Meili / hybrid OEM match) — prices USD only (D-57)
  → add to cart → Cart Flow (USD line totals) → delivery pin/landmark
  → Checkout review (disclosure + USD totals + quality tier)
  → Pay: choose EcoCash | COD | other via buttons/CTAs
       · EcoCash → show ZiG payable (daily ops rate) → PSP/customer action
       · COD → confirm USD + ZiG equivalent transparency → place order
       · USD rails → Paynow/PSP link → payment webhook → Utility: order_confirmed
  → Utility: supplier_confirming | shipped | delivered
```

Failover: brand-differ shadow offer → Utility `spare_failover_choice` with Flow/buttons Accept B / Cancel+refund.

### 2.2 Flows

#### `FLOW_SPARE_HOME` (entry)
Screens: Welcome · Shop Spares · Talk to person · Track order  
Actions: open search / open track / Chatwoot handoff  

#### `FLOW_SPARE_SEARCH` (**core**)
| Screen | Fields / logic |
| --- | --- |
| Search method | Radio: Part number · Vehicle (make/model/year) · VIN |
| Part number | Text OEM; server normalises; hybrid match |
| Vehicle | Cascading make → model → year → chassis if known |
| VIN | Validate check digit server-side; map to vehicle_master when possible |
| Results | Dynamic list from `data_exchange` (oem, brand, qualityTier, **priceMinor USD only — D-57**, availability, fitmentConfidence). No ZiG on browse. Restricted SKUs: “quote only / certified tech” — no add-to-cart |
| Product detail | Warranty days, delivery band, Confirm-required flag; price **USD only** |
| Add to cart | Qty; writes ERP cart for WA identity |

#### `FLOW_SPARE_CART`
Lines, edit qty, remove, continue shopping, checkout. **Line prices = USD only (D-57)** — no ZiG on cart browse.

#### `FLOW_SPARE_CHECKOUT`
| Screen | Purpose |
| --- | --- |
| Delivery | Saved place or new pin+landmark+phone (v4 §2B-19) |
| Buyer tax | Optional VAT/TIN for B2B FDMS (v4 §7.1) |
| Review | Full total **in USD**, tiers, cancellation summary, T&Cs accept — **mandatory review** |
| Pay | **Method choice via interactive buttons/CTAs (required):** **EcoCash** \| **COD** \| Paynow/other PSP URL as applicable (**D-57** / D-43). **Not free-text** for EcoCash or COD. EcoCash: show **ZiG payable** from ops daily rate + persist `fx_rate_id`. COD: USD + indicative ZiG equivalent. USD rails stay USD. Then PSP URL / COD confirm → ends Flow |

#### `FLOW_SPARE_TRACK`
Order id or recent orders → status from ERP (not Chatwoot).

### 2.3 Live chat (Spare)

| Trigger | Behaviour |
| --- | --- |
| “Talk to a person” / stuck search / dispute | Open Chatwoot conversation; attach `customer_id`, last `search_query`, `cart_id` |
| Outside hours | Utility `support_offline_ack` + create ticket |
| Agent resolves | Status still updated only via ERP |

### 2.4 Message templates — Spare

| Template name | Category | When | Body shell (approve in Meta) |
| --- | --- | --- | --- |
| `auth_otp_wa` | AUTHENTICATION | Login / step-up | Your DIAL code is {{1}}. Expires in {{2}} minutes. |
| `spare_welcome_menu` | UTILITY | After user opt-in / account link | Hi {{1}}. Reply or open menu: Search spares, Track order, Live chat. |
| `spare_order_confirmed` | UTILITY | Paid | Order {{1}} confirmed. Total {{2}} {{3}}. Track: {{4}} |
| `spare_awaiting_supplier` | UTILITY | Confirm SLA running | We’re confirming stock for order {{1}}. We’ll update you by {{2}}. |
| `spare_failover_choice` | UTILITY | Brand-differ fallback | Primary supplier can’t fulfil {{1}}. Alternative: {{2}} at {{3}}. Accept or cancel for refund. |
| `spare_shipped` | UTILITY | Courier assigned | Order {{1}} is on the way. Band {{2}}. Driver contact via DIAL. |
| `spare_delivered` | UTILITY | POD | Order {{1}} delivered. Issues? Open Track or Live chat within policy window. |
| `spare_payment_link` | UTILITY | Resume unpaid | Complete payment for order {{1}}: {{2}} (link expires {{3}}). |
| `spare_cart_resume` | MARKETING* | Abandoned cart — **consent** | You left items in your DIAL Spare cart. Resume: {{1}}. Reply STOP to opt out. |
| `support_offline_ack` | UTILITY | After-hours chat | We received your message. An agent will reply during {{1}}. Ticket {{2}}. |

\*Prefer session reminders inside 24h (free) over marketing.

### 2.5 Supplier-side (not customer shop, but same WABA or separate number)

| Template | Category | Purpose |
| --- | --- | --- |
| `supplier_heartbeat` | UTILITY | “Still have these 8 SKUs? Yes / Sold out” |
| `supplier_confirm_order` | UTILITY | Confirm pick for order {{1}} by {{2}} |
| `supplier_confirm_chase` | UTILITY | Reminder before SLA breach |

---

## 3. Dial a Tech — intake → troubleshoot → select → quote → hold → dispatch

### 3.1 Happy path

```text
Menu → Problem Flow (text + optional photo links)
  → Checklist Flow (deterministic steps from packages/checklists)
  → Branch: self_help | book_diagnostic | known_need | emergency
  → Tech selection (eligible list) → Quote (rate card / preliminary range)
  → Job Reserve payment link → paid
  → Utility: tech_assigned → en_route → on_site → completed
```

Emergency: skip checklist depth → `tech_emergency_ack` + deterministic dispatch (v4 §3.1).

### 3.2 Flows

#### `FLOW_TECH_HOME`
Report problem · Book known service · Emergency · Track job · Live chat  

#### `FLOW_TECH_INTAKE`
| Screen | Notes |
| --- | --- |
| Trade hint | Auto / plumbing / electrical / appliance / not sure |
| Description | Free text (Presidio scrub before AI) |
| Media | Instruct user to send photos in chat *after* Flow, or upload if Flow media allowed; server attaches to job |
| Location | Pin/landmark/phone |
| Safety | Flags smoke/gas/flood/sparks → jump emergency |

#### `FLOW_TECH_CHECKLIST`
Dynamic screens from checklist JSON (`DiagnosticChecklist`). Safe self-help only on allowlist. Escalation sets `requiresProfessional`.

#### `FLOW_TECH_SELECT`
List eligible technicians (badge, ETA band, manager’s choice). Prefer rematch if prior preferred tech (v4 §2A-5).

#### `FLOW_TECH_QUOTE`
Show `JobAssessment` summary + **preliminary** range or fixed/call-out; never imply AI final price. T&Cs + hold explanation (Job Reserve).

#### `FLOW_TECH_PAY_HOLD`
Paynow/PSP escrow hold URL → return to track.

#### `FLOW_TECH_TRACK`
Job status from ERP.

### 3.3 Live chat (Tech)

Handoff with `job_id`, checklist progress, assessment id. Agents must not override emergency SOP without admin role.

### 3.4 Templates — Tech

| Template name | Category | When | Body shell |
| --- | --- | --- | --- |
| `tech_job_received` | UTILITY | Intake saved | We have your request {{1}}. Next: {{2}}. |
| `tech_emergency_ack` | UTILITY | Emergency | Emergency request {{1}} received. Help is being arranged. Stay safe. {{2}} |
| `tech_quote_ready` | UTILITY | Quote ready | Quote for job {{1}}: {{2}}. Pay holding amount: {{3}} |
| `tech_reserve_held` | UTILITY | Escrow held | Holding funds received for job {{1}}. Matching a technician. |
| `tech_assigned` | UTILITY | Assigned | {{1}} is assigned. ETA band {{2}}. Track: {{3}} |
| `tech_en_route` | UTILITY | En route | Your technician is on the way for job {{1}}. |
| `tech_on_site` | UTILITY | Geofence/check-in | Technician on site for job {{1}}. |
| `tech_variation` | UTILITY | Extra work | Additional work proposed: {{1}}. Approve/decline: {{2}} |
| `tech_completed` | UTILITY | Done | Job {{1}} completed. Summary: {{2}}. Rate: {{3}} |
| `tech_reminder_appointment` | UTILITY | Cal.com slot | Reminder: service {{1}} at {{2}}. Manage: {{3}} |

---

## 4. Dial Care — subscriptions, benefits, upgrades

Care = insurance/microinsurance aggregator path (v4 §7.7) — **soft-launch / Phase gated (D-15)** but WhatsApp surfaces designed now.

### 4.1 Flows to utilise

| Flow | Purpose | Screens |
| --- | --- | --- |
| `FLOW_CARE_HOME` | Hub | My cover · Benefits · Claims help · Upgrade · Live chat |
| `FLOW_CARE_STATUS` | Subscription status | Plan name, status (active/grace/lapsed), renew date, vehicles covered |
| `FLOW_CARE_BENEFITS` | Benefits & packages | What’s included; limits; exclusions summary; “full policy PDF” link |
| `FLOW_CARE_PACKAGES` | Compare options | Tier cards (e.g. Roadside / Comprehensive micro) — **informational**; sale only if IPEC path live |
| `FLOW_CARE_UPGRADE` | Upgrade path | Current → target tier; proration note; pay link **or** “agent will call” if regulated sale needs human |
| `FLOW_CARE_CLAIM_INTAKE` | Claim start | Policy id, incident type, media instructions → creates claim ticket (insurer disclosed) |

### 4.2 Templates — Care

Full copy shells: **§12.7**. Summary:

| Template | Category | Notes |
| --- | --- | --- |
| `care_status_snapshot` | UTILITY | Account-triggered status |
| `care_renewal_reminder` | UTILITY | Pure expiry — no promo language |
| `care_lapsed` | UTILITY | Reinstatement link |
| `care_claim_received` / `care_claim_update` | UTILITY | Intake + status |
| `care_payment_received` | UTILITY | Paid |
| `care_upgrade_offer` | MARKETING | Consent-gated |

**Regulated sales:** if product is live insurance, Flow may **inform** and collect interest; binding sale may require insurer-scripted disclosure — keep “Complete with specialist” Chatwoot path.

---

## 5. Dial Fleet — status, licences, maintenance

Fleet v1 (v4 §2A-7): vehicle list, history, licence/insurance/fitness expiry, monthly statement — not telemetry.

### 5.1 Flows

| Flow | Purpose | Screens |
| --- | --- | --- |
| `FLOW_FLEET_HOME` | Fleet manager hub | Fleet summary · Vehicles · Expiries · Maintenance · Statement · Live chat |
| `FLOW_FLEET_SUMMARY` | Dashboard | Vehicle count, open jobs, parts spend MTD (from ERP), alerts count |
| `FLOW_FLEET_VEHICLES` | List / pick vehicle | Plate, make/model, next service, next expiry |
| `FLOW_FLEET_EXPIRIES` | Licence / insurance / fitness | Filter: overdue · 30 days · 60 days; deep-link book Tech or upload proof |
| `FLOW_FLEET_MAINTENANCE` | Schedules | Per vehicle: due items from Vehicle Hub / rate-card intervals; book service CTA → Tech Flow |
| `FLOW_FLEET_STATEMENT` | Monthly statement | Period, PDF link, pay outstanding if any |

### 5.2 Templates — Fleet

Full copy shells: **§12.8**. Includes expiry, maintenance, statement, spend-approve, invite, job update; `fleet_upgrade_offer` MARKETING with consent.

---

## 6. Shared entry menu (single WABA recommended)

Interactive list (session) or Utility `dial_main_menu`:

1. Dial a Spare  
2. Dial a Tech  
3. Dial Care (if toggle on)  
4. Dial Fleet (fleet role only)  
5. Live chat  
6. My account / places / consent  
7. Referrals & promos (enter code / share code)  
8. Track order or job  

Deep-links: `wa.me/263…?text=SPARE` etc. for ads — landing still respects auth/consent.

---

## 7. `data_exchange` endpoint contract (Flows)

```ts
// POST /api/v1/whatsapp/flows/data-exchange
// Verify Meta signature; decrypt per Flows crypto docs
export type FlowAction =
  | { screen: 'SPARE_SEARCH'; data: { method: 'oem'|'vehicle'|'vin'; query: string } }
  | { screen: 'SPARE_ADD_CART'; data: { offerId: string; qty: number } }
  | { screen: 'SPARE_APPLY_PROMO'; data: { code: string; cartId: string } }
  | { screen: 'TECH_CHECKLIST_NEXT'; data: { checklistId: string; stepId: string; answer: unknown } }
  | { screen: 'TECH_APPLY_REFERRAL'; data: { code: string; jobId?: string } }
  | { screen: 'CARE_STATUS'; data: { policyId?: string } }
  | { screen: 'FLEET_EXPIRIES'; data: { fleetId: string; windowDays: number } }
  | { screen: 'REFERRAL_STATUS'; data: { customerId: string } }
  | { screen: 'PROMO_VALIDATE'; data: { code: string; vertical: 'spare'|'tech'|'care'|'fleet' } }

// Response: next screen + dynamic data payload for dropdowns/lists
```

Idempotent; never trust client prices — always re-price from ERP offers/rate cards **after** applying `packages/promotions` rules (v4 §4.1.1).

---

## 8. Implementation checklist (eng)

- [ ] WABA + Cloud API; official adapter only  
- [ ] Template pack submitted (English MVP) — Utility first  
- [ ] Flows published for Spare search/cart/checkout + Tech intake/checklist  
- [ ] **§10 MVP expansion Flows published** (returns, calendar, media, referral, promo, supplier confirm, etc.)  
- [ ] Care/Fleet Flows behind **product** feature flags only (code shipped; Care gated D-15)  
- [ ] Chatwoot WhatsApp inbox + CRM fields  
- [ ] Paynow links from Flow CTAs; webhooks → order/job state  
- [ ] Consent store gates Marketing + reminder templates; **OptIn Flow** writes `consents`  
- [ ] `packages/promotions` + referral codes wired into checkout / Job Reserve quote  
- [ ] Supplier co-op campaigns: propose → ops approve → price_quotes component  
- [ ] Flow golden-path E2E tests (incl. promo apply + referral fraud reject)  
- [ ] Cost cap: max Utility templates per order/job (v4 §4.6)  

---

## 9. Do not build

- Unofficial WhatsApp multi-device libraries  
- Card data / national ID images inside Flows (use secure upload URLs if KYC needed)  
- Silent brand substitution without `spare_failover_choice`  
- AI final prices on Tech WA  
- Care binding sales before IPEC path (D-15)  
- Treating Chatwoot as order/job SoR  
- Cash-out of promotional / referral credit (§2B-30)  
- Supplier co-op that bypasses confirmation SLA or restricted-SKU rules  

---

## 10. MVP expansion catalog (D-41) — previously “later”, now launch-mandatory

All Flows below are **MVP**. Prefer ≤5–7 screens per Flow; use `data_exchange` for dynamic lists.

### 10.1 Shared / account

| Flow | Screens / purpose |
| --- | --- |
| `FLOW_ACCOUNT_LINK` | Link phone ↔ customer; name; default place |
| `FLOW_CONSENT_CENTRE` | OptIn per purpose (marketing, Vehicle Hub, Care renewals, referral invites) |
| `FLOW_SAVED_PLACES` | List / add / edit pin+landmark+phone |
| `FLOW_SUPPORT_TICKET` | Topic, order/job id, description → Chatwoot ticket |
| `FLOW_CSAT` | Post-order / post-job score + optional comment → Formbricks/ERP |
| `FLOW_REFERRAL_HOME` | My code · Share · Enter code · Rewards balance (promo credit) |
| `FLOW_PROMO_APPLY` | Enter code → validate → show eligible verticals → attach to cart/job |

### 10.2 Dial a Spare (extra)

| Flow | Purpose |
| --- | --- |
| `FLOW_SPARE_RETURNS` | Order line, reason, media upload, refund/replace path (7-day rules) |
| `FLOW_SPARE_CANCEL_CHANGE` | Cancel before dispatch / change address |
| `FLOW_SPARE_SOURCING_REQUEST` | “Can’t find part” vehicle + OEM + media → deposit quote path |
| `FLOW_SPARE_WARRANTY_CLAIM` | Within warranty window; media; creates guarantee claim |
| `FLOW_SUPPLIER_CONFIRM` | Supplier: confirm pick / sold-out / ETA for order lines |
| `FLOW_SUPPLIER_COOP_ACK` | Supplier accept/decline co-op campaign on listed SKUs |

Templates add: `spare_promo_applied` (UTILITY), `referral_reward_earned` (UTILITY), `spare_coop_live` (MARKETING*, consent).

### 10.3 Dial a Tech (extra)

| Flow | Purpose |
| --- | --- |
| `FLOW_TECH_VARIATION` | Scope delta, price delta, media → approve / decline |
| `FLOW_TECH_RESCHEDULE` | CalendarPicker slots from Cal.com / availability |
| `FLOW_TECH_CANCEL` | Cancel policy summary → confirm |
| `FLOW_TECH_PREFERRED` | Save preferred tech when rematch eligible |
| `FLOW_TECH_KNOWN_SERVICE` | Catalog of known services (oil, COF prep) → book without full checklist |
| `FLOW_TECH_EVIDENCE_REVIEW` | Customer confirms completion photos |
| `FLOW_TECH_MEDIA_INTAKE` | MediaUpload on intake (replaces “send after Flow” where Meta allows) |
| `FLOW_TECH_REFERRAL` | Enter/share referral at quote or post-complete (primary growth loop) |
| `FLOW_TECHNICIAN_JOB` | Tech-facing: accept/reject, ETA, parts needed → Spare deep-link |

### 10.4 Dial Care (extra)

| Flow | Purpose |
| --- | --- |
| `FLOW_CARE_VEHICLES` | Add/remove covered vehicles |
| `FLOW_CARE_CLAIM_TRACK` | Claim id → status from ERP (not Chatwoot) |
| `FLOW_CARE_BENEFIT_USAGE` | e.g. roadside uses remaining |
| `FLOW_CARE_SPECIALIST_HANDOFF` | Interest capture → Chatwoot when binding sale gated |

### 10.5 Dial Fleet (extra)

| Flow | Purpose |
| --- | --- |
| `FLOW_FLEET_VEHICLE_CRUD` | Add/edit plate, make/model, docs |
| `FLOW_FLEET_PROOF_UPLOAD` | MediaUpload licence / COF / insurance per plate |
| `FLOW_FLEET_SPEND_APPROVE` | Manager approve parts/job over threshold |
| `FLOW_FLEET_QUOTE_PACK` | Multi-vehicle → Tech + Spare request pack |
| `FLOW_FLEET_SEAT_INVITE` | Invite manager/driver roles |

### 10.6 Component checklist (Meta)

Use on MVP Flows where noted: **MediaUpload**, **CalendarPicker**, **Image**, **RichText** (disclosures/T&Cs), **OptIn**, **If/Switch**, **Dropdown/Radio** with on-select `data_exchange`.

---

## 11. Referrals & supplier promotions on WhatsApp (D-41a)

### 11.1 Dial a Tech referral (primary scheme)

```text
Completed happy job / post-CSAT
  → Utility: referral_invite_share (or session message)
  → FLOW_REFERRAL_HOME / FLOW_TECH_REFERRAL
  → Referee books Tech → attribution window
  → Both earn promo_credit (non-cash) on next qualifying Job Reserve fee
  → Fraud graph reject → Utility: referral_rejected_policy
```

Admin configures: reward amounts, attribution window, max referrals per month, eligible trades.

### 11.2 Dial a Spare + supplier co-op

```text
Ops/supplier create SUPPLIER_COOP campaign on SKU set
  → Supplier FLOW_SUPPLIER_COOP_ACK or dashboard accept
  → Offers reprice via pricing engine (logged promo component)
  → Customer sees badge in FLOW_SPARE_SEARCH results
  → Optional Marketing template to consented buyers
  → Redemption on checkout; supplier statement shows co-op funded amount
```

Customer may also enter a **PLATFORM** / flash code via `FLOW_PROMO_APPLY` at cart.

---

---

## 12. Master message-template register (comprehensive — D-40 / D-41 / D-60)

Submit to Meta in **en** (MVP). Prefer **UTILITY** for account/order/job triggers; **MARKETING** only with consent; **AUTHENTICATION** for OTP only (Meta Template Library OTP button). Parameters `{{n}}` are positional. Buttons noted where useful (URL / QUICK_REPLY). Prefer free session messages inside the 24h window.

**Naming:** `{vertical}_{event}` snake_case; shared prefix `dial_` / `auth_` / `supplier_` / `tech_ops_`.

### 12.1 Authentication (all verticals)

| Name | Category | Components / body | Buttons |
| --- | --- | --- | --- |
| `auth_otp_wa` | AUTHENTICATION | Use Meta auth template: code {{1}}; security recommendation on; expiry {{2}} min | OTP copy-code / one-tap |
| `auth_otp_step_up` | AUTHENTICATION | Step-up for payout / address change: code {{1}}; expires {{2}} min | OTP copy-code |

### 12.2 Shared / account / support

| Name | Category | When | Body shell | Buttons |
| --- | --- | --- | --- | --- |
| `dial_main_menu` | UTILITY | Post-link / re-entry | Hi {{1}}. Choose: Spare, Tech, Care, Fleet, Track, Live chat, Account. | QUICK_REPLY or list |
| `dial_account_linked` | UTILITY | Phone linked | Your WhatsApp is linked to DIAL account {{1}}. | Open menu URL |
| `dial_consent_updated` | UTILITY | Consent change | Consent updated for {{1}}: {{2}}. Manage anytime: {{3}} | URL consent centre |
| `support_offline_ack` | UTILITY | After hours | We received your message. Agents reply during {{1}}. Ticket {{2}}. | — |
| `support_ticket_update` | UTILITY | Ticket status | Support ticket {{1}} is now {{2}}. | Live chat URL |
| `csat_request` | UTILITY | Post fulfilment | How was experience {{1}}? Rate 1–5: {{2}} | URL CSAT Flow |
| `referral_invite_share` | UTILITY | After happy job/order | Share DIAL: your code {{1}}. Friends save; you earn promo credit (not cash). | Share / Flow URL |
| `referral_reward_earned` | UTILITY | Credit granted | Promo credit {{1}} {{2}} added. Non-cash; apply at next checkout/job. | — |
| `referral_rejected_policy` | UTILITY | Fraud/policy | Referral {{1}} couldn’t be rewarded ({{2}}). | Support |
| `promo_code_applied` | UTILITY | Code OK | Promo {{1}} applied. Savings {{2}} {{3}} on eligible lines. | — |
| `promo_code_invalid` | UTILITY | Code fail | Promo {{1}} not applied: {{2}}. | — |
| `fiscal_receipt_ready` | UTILITY | FDMS Valid / PDF | Tax invoice/receipt for {{1}} is ready: {{2}} | URL |
| `payment_failed` | UTILITY | PSP fail | Payment for {{1}} failed ({{2}}). Retry: {{3}} | URL pay |
| `payment_pending` | UTILITY | Awaiting PSP | Payment for {{1}} is pending. We’ll confirm when cleared. | Track URL |

### 12.3 Dial a Spare — customer

| Name | Category | When | Body shell | Buttons |
| --- | --- | --- | --- | --- |
| `spare_welcome_menu` | UTILITY | Opt-in / link | Hi {{1}}. Search spares, Track order, or Live chat. | Menu |
| `spare_order_confirmed` | UTILITY | Paid / COD placed | Order {{1}} confirmed. Total {{2}} {{3}}. Track: {{4}} | Track |
| `spare_cod_confirmed` | UTILITY | COD accepted | COD order {{1}} placed. Pay {{2}} USD on delivery (≈ {{3}} ZiG indicative). Track: {{4}} | Track |
| `spare_ecocash_pending` | UTILITY | EcoCash started | Complete EcoCash for order {{1}}: pay {{2}} ZiG. Guide: {{3}} | URL |
| `spare_awaiting_supplier` | UTILITY | Confirm SLA | Confirming stock for order {{1}}. Update by {{2}}. | — |
| `spare_supplier_confirmed` | UTILITY | Supplier OK | Stock confirmed for order {{1}}. Preparing dispatch. | — |
| `spare_failover_choice` | UTILITY | Shadow offer | Can’t fulfil {{1}}. Alternative {{2}} at {{3}} {{4}}. | Accept / Cancel |
| `spare_cancelled` | UTILITY | Cancelled | Order {{1}} cancelled. Refund/status: {{2}}. | — |
| `spare_payment_link` | UTILITY | Unpaid resume | Complete payment for order {{1}}: {{2}} (expires {{3}}). | URL |
| `spare_shipped` | UTILITY | Courier | Order {{1}} on the way. Band {{2}}. | Track |
| `spare_out_for_delivery` | UTILITY | Same-day | Courier nearby for order {{1}}. | Track |
| `spare_delayed` | UTILITY | Delay | Order {{1}} delayed. New window {{2}}. Sorry. | Support |
| `spare_delivered` | UTILITY | POD | Order {{1}} delivered. Issues? Track or Live chat within policy. | Track / Chat |
| `spare_return_received` | UTILITY | Return opened | Return {{1}} for order {{2}} received. Status: {{3}}. | — |
| `spare_refund_issued` | UTILITY | Refund | Refund {{1}} {{2}} for order {{3}} initiated. | — |
| `spare_warranty_update` | UTILITY | Claim | Warranty claim {{1}}: {{2}}. | — |
| `spare_sourcing_quote` | UTILITY | Sourcing | Sourcing quote for request {{1}}: {{2}} {{3}}. Pay deposit: {{4}} | URL |
| `spare_cart_resume` | MARKETING | Abandoned cart | Items waiting in your DIAL Spare cart. Resume: {{1}}. STOP to opt out. | URL |
| `spare_promo_blast` | MARKETING | Co-op/flash | {{1}} on selected parts until {{2}}. Shop: {{3}}. STOP to opt out. | URL |
| `spare_review_ask` | UTILITY | Post delivery | Order {{1}} — quick rating? {{2}} | URL |

### 12.4 Dial a Spare — supplier WABA / same number

| Name | Category | When | Body shell | Buttons |
| --- | --- | --- | --- | --- |
| `supplier_heartbeat` | UTILITY | Heartbeat | Confirm stock for {{1}} SKUs by {{2}}. | Yes / Sold out Flow |
| `supplier_confirm_order` | UTILITY | New line | Confirm pick order {{1}} by {{2}}. | Confirm Flow |
| `supplier_confirm_chase` | UTILITY | SLA risk | Reminder: confirm order {{1}} before {{2}}. | Confirm |
| `supplier_rejected_line` | UTILITY | Sold out path | Line {{1}} marked unavailable. Failover may run. | — |
| `supplier_coop_invite` | UTILITY | Co-op propose | Co-op campaign {{1}} on {{2}} SKUs. Accept/decline: {{3}} | Flow |
| `supplier_payout_statement` | UTILITY | Statement | Statement {{1}} ready. Net {{2}} {{3}}. PDF: {{4}} | URL |
| `supplier_bond_notice` | UTILITY | Bond | Reliability bond / oversell fee notice for {{1}}: {{2}} | — |

### 12.5 Dial a Tech — customer

| Name | Category | When | Body shell | Buttons |
| --- | --- | --- | --- | --- |
| `tech_job_received` | UTILITY | Intake | Request {{1}} received. Next: {{2}}. | Track |
| `tech_emergency_ack` | UTILITY | Emergency | Emergency {{1}} received. Help being arranged. {{2}} | — |
| `tech_quote_ready` | UTILITY | Quote | Quote job {{1}}: {{2}}. Holding amount: {{3}} | Pay URL |
| `tech_reserve_held` | UTILITY | Escrow held | Holding funds received for job {{1}}. Matching technician. | Track |
| `tech_assigned` | UTILITY | Assigned | {{1}} assigned. ETA {{2}}. Track: {{3}} | Track |
| `tech_en_route` | UTILITY | En route | Technician en route for job {{1}}. | — |
| `tech_on_site` | UTILITY | On site | Technician on site for job {{1}}. | — |
| `tech_variation` | UTILITY | Variation | Extra work on job {{1}}: {{2}}. Approve/decline: {{3}} | Flow URL |
| `tech_completed` | UTILITY | Done | Job {{1}} completed. {{2}}. Rate: {{3}} | Rate URL |
| `tech_cancelled` | UTILITY | Cancel | Job {{1}} cancelled. Hold/refund: {{2}}. | — |
| `tech_reminder_appointment` | UTILITY | Reminder | Service {{1}} at {{2}}. Manage: {{3}} | URL |
| `tech_no_show_followup` | UTILITY | No-show | We couldn’t complete visit for job {{1}}. Reschedule: {{2}} | URL |
| `tech_rematch` | UTILITY | Rematch | New technician for job {{1}}: {{2}}. ETA {{3}}. | Track |

### 12.6 Dial a Tech — technician ops

| Name | Category | When | Body shell | Buttons |
| --- | --- | --- | --- | --- |
| `tech_ops_offer` | UTILITY | Offer | Job offer {{1}}. {{2}}. Accept by {{3}}. | Accept / Reject |
| `tech_ops_assigned` | UTILITY | Won | You are assigned job {{1}}. Details: {{2}} | Open app URL |
| `tech_ops_parts_needed` | UTILITY | Parts | Job {{1}} needs parts. Open Spare: {{2}} | URL |
| `tech_ops_payout_notice` | UTILITY | Payout | Payout {{1}} {{2}} for job {{3}} (net after fees/WHT as applicable). | Statement URL |

### 12.7 Dial Care

| Name | Category | When | Body shell | Buttons |
| --- | --- | --- | --- | --- |
| `care_status_snapshot` | UTILITY | Status | Cover {{1}}: {{2}}. Renews {{3}}. Manage: {{4}} | URL |
| `care_renewal_reminder` | UTILITY | Expiry notice | Cover {{1}} renews on {{2}}. Manage: {{3}} | URL |
| `care_lapsed` | UTILITY | Lapsed | Cover {{1}} lapsed. Reinstate: {{2}} | URL |
| `care_claim_update` | UTILITY | Claim | Claim {{1}} status: {{2}}. | Track |
| `care_claim_received` | UTILITY | Intake | Claim {{1}} received. Insurer path disclosed in app. | — |
| `care_upgrade_offer` | MARKETING | Promo | Upgrade options for {{1}}. See: {{2}}. STOP to opt out. | URL |
| `care_payment_received` | UTILITY | Paid | Payment received for cover {{1}}. | — |

### 12.8 Dial Fleet

| Name | Category | When | Body shell | Buttons |
| --- | --- | --- | --- | --- |
| `fleet_expiry_alert` | UTILITY | Approaching | {{1}} on {{2}} expires {{3}}. Act: {{4}} | Flow URL |
| `fleet_expiry_overdue` | UTILITY | Overdue | OVERDUE: {{1}} on {{2}}. Act now: {{3}} | Flow |
| `fleet_maintenance_due` | UTILITY | Service | Maintenance due for {{1}}: {{2}}. Book: {{3}} | Book URL |
| `fleet_statement_ready` | UTILITY | Statement | Fleet statement {{1}} ready. PDF: {{2}} | URL |
| `fleet_job_update` | UTILITY | Job | Fleet job {{1}}: {{2}}. | Track |
| `fleet_invite_manager` | UTILITY | Invite | You’re invited to DIAL Fleet {{1}}. Accept: {{2}} | URL |
| `fleet_spend_approve` | UTILITY | Approval | Approve spend {{1}} {{2}} for {{3}}? {{4}} | Approve Flow |
| `fleet_upgrade_offer` | MARKETING | Tier promo | Fleet plan options: {{1}}. STOP to opt out. | URL |

### 12.9 Submission / cost hygiene

1. Submit **AUTHENTICATION** from Meta Template Library (OTP).  
2. Batch **UTILITY** first (order/job/payment/dispatch).  
3. **MARKETING** only after consent store live; expect Rest-of-Africa per-message rates (§4.6).  
4. Cap Utility sends per order/job (Agent Pack / v4 §4.6).  
5. Prefer session messages inside 24h over paid templates.  
6. Never put card numbers, OTPs outside AUTH templates, or national ID images in template bodies.

---

*End of WhatsApp Flows & Templates v1.2 — D-40 / D-41 / D-41a / D-57 / D-60.*

