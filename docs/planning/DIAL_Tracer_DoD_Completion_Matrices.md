# Tracer DoD — completion matrices (Plan filled)

**Skill:** `dial-tracer-slice` (D-52) — Plan artifact.  
**Rule:** No merge / Done while required channel cells are blank. Tracer ≠ stub-as-MVP.  
**Fill at Build:** `Y` = done + evidence linked; `N/A` = channel out of scope (justify); blank = incomplete.  
**Agency / FDMS:** **D-58** = agency product model; **D-59** receipt classes + in-house Gateway — stub Build OK; live ZIMRA credentials = Phase-0 / customer-open.  
**Ticket hygiene owner:** **Dev Manager** (Blueprint §8.0/§9) — own a tracer ticket before parallel trains; D-61 adds E7a.

Evidence: link test, screenshot, webhook replay, or Promptfoo run.

---

## Matrix A — Money / Job Reserve / WHT / agency FDMS (E1)

Locks: C-4, D-40a, D-43, D-49, D-50, **D-58** (D-51 discarded)  
**Thin vertical E1a:** OfferSnapshot USD freeze → one PSP authorize → webhook capture → ledger → FiscalReceiptQueued (agency)

| AC | Web | WA (pay URL / status) | Native customer | Evidence |
| --- | --- | --- | --- | --- |
| Checkout freezes OfferSnapshot with `amountMinor` + currency | | | | |
| Seller disclosure Sold by {Supplier} (agency D-58) | | | | |
| B2B cannot purchase informal (D-49) | | | | |
| Job Reserve authorize via PSP escrow adapter | | | | |
| Capture/release on verified webhook only | | | | |
| Duplicate webhook no-op | | | | |
| **No** `DIAL_OWNED` / owned COGS path (D-58) | | | | |
| Tech payout ITF263 or 30% WHT (D-50) | | N/A (ops/tech app) | N/A (tech Android) | |
| FDMS virtual submitReceipt — **agency classes D-59**; e-invoice reflects tax | | | | |
| WA payment success enqueues same `fdms_outbox` as web | N/A | | N/A | |
| In-house Virtual Gateway default (CloudESD optional only) | | | | |
| AI cannot set payable amount (negative test) | | | | |
| PspAdapter stubs: Paynow, ContiPay, EcoCash, PayPal, COD, escrow | | | | |

**DoD 100% sign-off:** _____________ date _____________

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
| Cloud API webhook signature + idempotency | | N/A | N/A | |
| Spare search→cart→checkout (USD browse/cart) | | | | |
| Pay step: **EcoCash** interactive button/CTA required | | N/A or deep-link | N/A or deep-link | |
| Pay step: **COD** interactive button/CTA required | | | | |
| EcoCash: ZiG payable from daily rate | | | | |
| 18-item disclosure + review before pay | | | | |
| Tech guided intake (no AI price) | | | | |
| Emergency short-circuit (no AI block) | | | | |
| Chatwoot handoff with job/order ids | | | | |
| §10 MVP catalog: returns | | | | |
| §10 MVP catalog: referrals (D-41a) | | | | |
| §10 MVP catalog: promos consent | | | | |
| No Baileys / unofficial client in tree | | | | |

**DoD 100% sign-off:** _____________ date _____________

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

## Matrix E — D-61 Hermes Business Agent Fabric foundation (E7)

Locks: D-61 + D-32/D-47/D-48/D-52/D-54
**Thin vertical E7a:** Supervisor → provider-policy stub → opaque context → one H0 read tool → R2 manifest/archive fake → audited result

| AC | Supervisor/API | Admin/ops | Privacy/tool | Intelligence/storage | Evidence |
| --- | --- | --- | --- | --- | --- |
| Play latches RUNNING across >1 item | | | N/A | N/A | T |
| Pause/Resume/Stop checkpoint correctly | | | N/A | N/A | T |
| Emergency Stop fences H2+ writes | | | | N/A | T |
| Lease/fencing stale-worker recovery | | | | N/A | T |
| managerEligible blocks silent downgrade | | | | | T |
| Provider secret is `secretRef`, never client/log/prompt | | | | | T+A |
| Opaque subject/minimum-purpose context | | | | | P+T |
| Direct PII/data-class egress denied | | | | | P+T |
| Health memory denied from commerce profile | | | | | T |
| One H0 business read uses typed tool + object AuthZ | | | | | T+A |
| No raw SQL/service-role/PSP/PII-vault tool | | | | | A |
| R2 manifest checksum/archive/restore fake works; no business truth in R2 | | | | | T |
| Insight has MetricContract/evidence/epistemic label | | | | | T |
| Supplier cohort policy suppresses unsafe benchmark | | | | | T |
| Run trace links context/policy/provider/tool/result/outcome | | | | | T+A |

**DoD 100% sign-off:** _____________ date _____________

## How to use

1. **Dev Manager** opens one owned thin-vertical ticket (E2a/E1a business path or E7a D-61 foundation according to dependency order) with DoD + matrix rows attached.
2. Build that thin vertical first — fill only its path cells with `Y` + evidence; leave siblings blank until Expand.  
3. Mark N/A only when product lock says so.  
4. Ticket stays open until matrix complete + evidence.  
5. Preserve E2a/E1a priorities, but schedule E7a early enough that later AI/conversation/intelligence work cannot grow around an absent Supervisor/privacy/provider/tool foundation.
