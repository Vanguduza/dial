# Tracer DoD — completion matrices (Plan filled)

**Skill:** `dial-tracer-slice` (D-52) — Plan artifact.  
**Rule:** No merge / Done while required channel cells are blank. Tracer ≠ stub-as-MVP.  
**Fill at Build:** `Y` = done + evidence linked; `N/A` = channel out of scope (justify); blank = incomplete.  
**Agency / FDMS:** **D-58** = agency product model; **D-59** receipt classes + in-house Gateway — stub Build OK; live ZIMRA credentials = Phase-0 / customer-open.  
**Ticket hygiene owner:** **Dev Manager** (Blueprint §8.0) — open E1a or E2a before parallel trains.

Evidence: link test, screenshot, webhook replay, or Promptfoo run.

---

## Matrix A — Money / Job Reserve / WHT / agency FDMS (E1)

Locks: C-4, D-40a, D-43, D-49, D-50, **D-58** (D-51 discarded)  
**Thin vertical E1a:** OfferSnapshot USD freeze → one PSP authorize → webhook capture → ledger → FiscalReceiptQueued (agency)

| AC | Web | WA (pay URL / status) | Native customer | Evidence |
| --- | --- | --- | --- | --- |
| Checkout freezes OfferSnapshot with `amountMinor` + currency | Y | Y | Y | T `freezeOfferSnapshot` / `runE1aMoneySpine` |
| Seller disclosure Sold by {Supplier} (agency D-58) | Y | Y | Y | T `soldBy` |
| B2B cannot purchase informal (D-49) | Y | Y | Y | T rejects b2b+informal |
| Job Reserve authorize via PSP escrow adapter | Y | N/A | N/A | T `authorizeJobReserve` |
| Capture/release on verified webhook only | Y | Y | Y | T + `POST /api/webhooks/psp` |
| Duplicate webhook no-op | Y | Y | Y | T |
| **No** `DIAL_OWNED` / owned COGS path (D-58) | Y | Y | Y | T `assertNoDialOwnedPath` |
| Tech payout ITF263 or 30% WHT (D-50) | Y | N/A (ops/tech app) | N/A (tech Android) | T `computeTechPayoutWithholding` |
| FDMS virtual submitReceipt — **agency classes D-59**; e-invoice reflects tax | Y | Y | Y | T `@dial/tax` |
| WA payment success enqueues same `fdms_outbox` as web | N/A | Y | N/A | T channel=`wa` |
| In-house Virtual Gateway default (CloudESD optional only) | Y | Y | Y | T `gateway: zimra_virtual_in_house` |
| AI cannot set payable amount (negative test) | Y | Y | Y | T |
| PspAdapter stubs: Paynow, ContiPay, EcoCash, PayPal, COD, escrow | Y | Y | Y | T `listPspMethods` |

**DoD 100% sign-off:** Dev Manager S11 (E1a) — 2026-08-12 — A2 admin Daily ZiG UI = S12; Temporal worker = T5. Audit: `docs/agent-audits/money-path-S11-E1a-2026-08-12.md`

---

## Matrix A2 — Spare USD browse + ZiG checkout + daily rate (D-57 / E1b+E2)

Locks: D-57 (+ D-43 rails)  
**Thin vertical E1b:** Admin sets daily ZiG rate → EcoCash checkout shows ZiG + `fx_rate_id`

| AC | Web | WA | Native | Admin | Evidence |
| --- | --- | --- | --- | --- | --- |
| PLP/PDP/search/cart lines display USD only (no browse ZiG) | | | | N/A | |
| ZiG conversion only at checkout pay step | | | | N/A | |
| Load active rate from `fx_daily_rates` / `fx_rate_versions`; persist `fx_rate_id` | | | | | |
| Admin **Daily ZiG rate** setter + audit log (who/when/effective) | N/A | N/A | N/A | | |
| EcoCash / ZiG-wallet: payable shown in ZiG | | | | N/A | |
| USD payment methods remain USD | | | | N/A | |
| COD: USD display + indicative ZiG at confirm | | | | N/A | |
| Never silent unaudited bank mid for Spare checkout FX | | | | | |

**DoD 100% sign-off:** _____________ date _____________

---

## Matrix B — WhatsApp Cloud / Flows (E2)

Locks: D-40, D-41, D-41a, D-57  
**Thin vertical E2a:** Spare Flow USD cart → checkout **EcoCash \| COD buttons** → ERP intent

| AC | WA Flow/session | Web parity (same ERP) | Native parity | Evidence |
| --- | --- | --- | --- | --- |
| Cloud API webhook signature + idempotency | Y | N/A | N/A | T (`adapters/whatsapp` + `apps/gateway-web/.../webhooks/whatsapp`) |
| Spare search→cart→checkout (USD browse/cart) | Y | Y | Y | T — WA Flows; web/native = same `@dial/catalogue` ERP (UI shells = T3) |
| Pay step: **EcoCash** interactive button/CTA required | Y | N/A | N/A | T — deep-link later; ERP `createCheckoutPayment` shared |
| Pay step: **COD** interactive button/CTA required | Y | N/A | N/A | T |
| EcoCash: ZiG payable from daily rate | Y | Y | Y | T — `@dial/payments` shared |
| 18-item disclosure + review before pay | Y | Y | Y | T — `EIGHTEEN_ITEM_DISCLOSURES` export for all channels |
| Tech guided intake (no AI price) | Y | Y | Y | T — WA handler; ERP job draft id; UI = T4 |
| Emergency short-circuit (no AI block) | Y | Y | Y | T |
| Chatwoot handoff with job/order ids | Y | N/A | N/A | T — WA/Chatwoot channel |
| §10 MVP catalog: returns | Y | Y | Y | T stub — same claim shape ERP |
| §10 MVP catalog: referrals (D-41a) | Y | Y | Y | T stub + `@dial/promotions` |
| §10 MVP catalog: promos consent | Y | Y | Y | T |
| No Baileys / unofficial client in tree | Y | N/A | N/A | T (`assertNoUnofficialWhatsAppDeps`) |

**DoD 100% sign-off:** Dev Manager (S10) — 2026-08-12 — Meta template IDs remain Phase 0 OPEN (ENH-021); eng DoD otherwise complete.

---

## Matrix C — MapLibre / delivery SoR (E3)

Locks: D-44, D-45, D-45a  
**Thin vertical E3a:** Create job → offer one courier → accept → POD

| AC | delivery-android | admin-web MapLibre | Customer track | Evidence |
| --- | --- | --- | --- | --- |
| Job created in `packages/delivery` (not Fleetbase) | | | | |
| `DeliveryDispatchWorkflow` offers to eligible courier | | | | |
| Accept / reject / timeout → reassign | | | | |
| Zero couriers → FIFO queue | | | | |
| Live GPS + ETA (MapLibre) | | | | |
| Distance/ETA from OSRM/VROOM not Google SoR | | | | |
| POD captured | | | | |
| COD reconcile hook | | | | |
| Multi-stop run (if in MVP AC) | | | | |

**DoD 100% sign-off:** _____________ date _____________

---

## Matrix D — packages/ai (E4) — plan rows

Locks: C-1, D-32, D-54, D-56  
**Thin vertical E4a:** guidedIntake → JobAssessment only

| AC | Tech web | WA Tech | Ops admin | Evidence |
| --- | --- | --- | --- | --- |
| guidedIntake Zod structured output | | | N/A | P |
| No payable / price in customer assessment | | | | P |
| D-32 omit identity in model egress | | | | P |
| opsDraftQuote humanApprovalRequired; no ledger write | N/A | N/A | | P+A |
| `dial-ai-capability-review` before merge | | | | A |
| Promptfoo CI smoke (T7) | | | | P |

**DoD 100% sign-off:** _____________ date _____________

---

## How to use

1. **Dev Manager** opens one owned thin-vertical ticket (E2a default, or E1a) with DoD + matrix rows attached.  
2. Build that thin vertical first — fill only its path cells with `Y` + evidence; leave siblings blank until Expand.  
3. Mark N/A only when product lock says so.  
4. Ticket stays open until matrix complete + evidence.  
5. Prefer **E2a** first unless founder directs money-spine (**E1a**) first.
