# Dial Laundry — grill session (D-56)

**Status:** Wave 1 **OPEN** (recommended defaults ready) · Wave 2 **OPEN** · Founder frontier **not closed**  
**Opened:** 2026-08-16  
**Skill:** `.cursor/skills/dial-grill-locks`  
**Plan SoR:** [`DIAL_Laundry_Branch_Plan.md`](./DIAL_Laundry_Branch_Plan.md)  
**Template pattern:** [`DIAL_Groceries_Liquor_Grill_Session.md`](./DIAL_Groceries_Liquor_Grill_Session.md)  
**Authority:** v4 D-38…D-61 → Pack → companions → branch plan.

---

## Session status

| Field | Value |
| --- | --- |
| Phase | Plan diligence — **grill Waves open**; founder may answer or say **“use recommended”** |
| L1 Plan→Build thin vertical | **Blocked** until Wave 1 frontier closed (or founder accepts recommended) **and** Dev Manager opens L1 ticket with DoD |
| Completion Plan slot | Proposed **Phase 10b** after Phase 10 groceries food — **does not reopen Phase 1** |
| Scaffold code this turn | **No** — Plan artifacts only |
| Counsel leftovers | Always remain for FDMS service class + municipal licensing (not founder-only) |

---

## How this grill works

1. Facts already explored in-repo (catalogue verticals spare|grocery, E1a money, `@dial/tax` D-59 classes, `DeliveryDispatchWorkflow`, D-57/D-49/D-58 locks, groceries absorb pattern, Full ERP Phases 0–12).  
2. Below questions are **human decisions only**.  
3. Each question has a **➡️ recommended** default — founder can later reply **“use recommended”** for a wave (same groceries pattern).  
4. Hard stops: no Expo, Baileys, Mapbox SoR, AI payable amounts, `DIAL_OWNED` wash plants, second money/delivery SoR, inventing endless PD stages.

---

## Wave 1 — Product / money / liability frontier

❓ **W1-Q1** — **Launch geography**: Harare metro single `deliveryBandId` first, or multi-city day one?

➡️ **Recommended:** Harare metro, single band first (align groceries grill).

❓ **W1-Q2** — **Agency model**: Partner laundries (+ optional home washers) only, or Dial-owned wash plants?

➡️ **Recommended:** **Agency only** (**D-58**). Do not scaffold Dial-owned plants. Home washers = optional informal capacity under policy — not principal inventory.

❓ **W1-Q3** — **Hub placement**: Services (peer Dial a Tech) vs Shop (peer Groceries)?

➡️ **Recommended:** **Services** tab — Dial Laundry peer to Dial a Tech; one account; `/laundry/*` on `gateway-web`.

❓ **W1-Q4** — **FX / checkout UX**: Follow D-57 for laundry?

➡️ **Recommended:** Yes — USD browse/cart; ZiG at pay from daily rate + `fx_rate_id`; EcoCash\|COD **buttons** (web + WA).

❓ **W1-Q5** — **Informal / home washers**: Visibility policy?

➡️ **Recommended:** **Formal-first** launch; informal home washers deferred or limited B2C with disclosure; **B2B always hide informal** (**D-49**).

❓ **W1-Q6** — **Logistics fee owner + textile liability**?

➡️ **Recommended:** Customer-facing pickup/return = **`DIAL_FEE`** (Option A). Textile risk **supplier until return POD**; Dial-caused pickup/delivery fail / lost-in-transit under Dial custody → **Dial** (grocery spoilage logic adapted — cold-chain N/A).

❓ **W1-Q7** — **Escrow rule + provisional thresholds**?

➡️ **Recommended:** COD direct → return POD reconcile. EcoCash/card single-laundry below **T** → direct capture. Multi-laundry OR total ≥ **T** → Job Reserve. High-value delicate ≥ **T_hv** → prefer escrow.  
**Provisional numbers (ops-tunable, not statute):** T = **5000** USD minor ($50.00); T_hv = **10000** USD minor ($100.00).

❓ **W1-Q8** — **Weight / bag pricing MVP**?

➡️ **Recommended:** Declared **bag tiers / kg steps / unit garment** only; intake scale reprice = phase 2 with human pricing engine + customer accept. AI never writes payable.

---

## Wave 2 — Ops / WA / sequencing frontier

❓ **W2-Q1** — **WA in MVP**?

➡️ **Recommended:** Full `FLOW_LAUNDRY_*` (plan Part 8) when Phase 9 WA rails ready — not free-text pay.

❓ **W2-Q2** — **Laundry merchant WHT + payout cadence**?

➡️ **Recommended:** **No** auto application of Tech **D-50** 30% WHT; pluggable strategy pending counsel. Provisional payout **T+3** calendar days after capture/escrow release (ops may tune).

❓ **W2-Q3** — **Licence holder (engineering posture until counsel)**?

➡️ **Recommended:** **Merchant/plant holds** premises licence; DIAL terms + fail-closed publish gates for dry-clean / formal plants. **Not Verified ZW law** — counsel confirms platform duty.

❓ **W2-Q4** — **FDMS for laundry service lines**?

➡️ **Recommended:** Always enqueue Dial logistics/commission as **`DIAL_FEE`**. Supplier wash/dry-clean characterisation = **configurable strategy pending counsel** — **do not invent** a fourth receipt class in Build. Soft-launch fee-only fiscal path acceptable only with explicit founder+ops flag (still agency disclosure).

❓ **W2-Q5** — **Claim window after return POD**?

➡️ **Recommended:** Provisional **48 hours** (config); counsel may adjust copy.

❓ **W2-Q6** — **Where laundry sits vs Full ERP Completion Plan**?

➡️ **Recommended:** **Phase 10b** after **Phase 10 groceries food**; open only when **G5 delivery** + **G8 payments/FDMS** green (preferably G10 green). **Do not reopen Phase 1.** Do not schedule laundry inside G10 liquor-gated work. Phase 11 Intelligence may proceed in parallel if capacity allows — laundry is not a substitute for G11.

❓ **W2-Q7** — **B2B linen / hospitality at launch**?

➡️ **Recommended:** **B2C first**; if B2B launches, formal-only + TIN path.

❓ **W2-Q8** — **Multi-stop vs split jobs**?

➡️ **Recommended:** One multi-stop job when same band/slot; else split (align groceries).

❓ **W2-Q9** — **Take-rate launch bps**?

➡️ **Recommended:** Founder publishes ladder to supply before customer-open — eng ships configurable bps; **no** invented live % in this grill.

❓ **W2-Q10** — **SLA turnaround honesty**?

➡️ **Recommended:** Per-`serviceKind` hour bands frozen on OfferSnapshot; `in_plant` status without fake indoor GPS; missed slots → reschedule Flow + utility template.

---

## Recommended defaults summary (founder “use recommended” pack)

| ID | Topic | Recommended default | Maps to L-log |
| --- | --- | --- | --- |
| R1 | Geography | Harare metro single band | L-14 |
| R2 | Agency | Partners only; no Dial plants | L-1 / D-58 |
| R3 | Hub | Services tab | L-16 |
| R4 | D-57 | USD browse; ZiG pay; EcoCash\|COD buttons | L-2 |
| R5 | Informal | Formal-first; B2B hide | L-7 |
| R6 | Fee + liability | `DIAL_FEE`; supplier until return POD | L-5 / L-15 |
| R7 | Escrow | Rule + T=5000 / T_hv=10000 | L-6 |
| R8 | Bag pricing | Declared tiers MVP | L-8 |
| R9 | WA | Full FLOW_LAUNDRY_* when Phase 9 ready | L-10 |
| R10 | WHT / T+N | No auto tech WHT; T+3 | L-11 |
| R11 | Sequencing | Phase 10b after groceries food; gate G5+G8 | L-17 |
| R12 | FDMS | DIAL_FEE now; supplier class counsel | L-13 |

---

## Counsel-only blockers (not closed by “use recommended”)

1. Harare municipal laundry/launderette/depot licence matrix for marketplace agent (**L-12**).  
2. Whether platform needs any laundry licence category.  
3. Dry-cleaning / controlled-equipment obligations for listed suppliers.  
4. FDMS/VAT characterisation of **laundry service** vs goods vs Dial fee (**L-13**).  
5. CPA mid-wash cancellation + damage/lost statutory copy.  
6. Optional: confirm laundry commission WHT remains none under tax advice.

---

## Scaffold / Build gate

| Path | Status |
| --- | --- |
| **L1 thin vertical** (catalogue → checkout money → pickup job stub) | **Blocked** until Wave 1 accepted + ticket with DoD (**D-52**) |
| Dry-clean customer-open | **Counsel-gated** (or keep dry-clean dormant) |
| Informal home washers customer-open | Policy + counsel |
| Phase 10b eng start | After G5+G8 (prefer G10); never Phase 1 reopen |
| Code scaffold this session | **Do not** |

---

## Answer log (append)

| When | Item | Answer |
| --- | --- | --- |
| 2026-08-16 | — | Session opened; awaiting founder (or “use recommended”) |

---

## Hard stops (unchanged)

No Expo shell, Baileys, Google/Mapbox SoR, AI writing payable amounts, prod agent host for fees (**D-61**), principal/`DIAL_OWNED` wash plants, second money/delivery SoR, endless PD invent (use **L0–Ln** only).
