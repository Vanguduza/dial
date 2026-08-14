# Dial Groceries & Liquor — grill session (D-56)

**Status:** Wave 1 **CLOSED** · Wave 2 **CLOSED** · Founder frontier for G1 money/catalogue **empty** (counsel-only leftovers remain)  
**Opened:** 2026-08-14  
**Wave 2 closed:** 2026-08-14 (founder: “use recommended” for R1–R5)  
**Skill:** `.cursor/skills/dial-grill-locks`  
**Plan SoR:** [`DIAL_Groceries_Liquor_Branch_Plan.md`](./DIAL_Groceries_Liquor_Branch_Plan.md)  
**Authority:** v4 D-38…D-61 → Pack → companions → branch plan.

---

## Session status

| Field | Value |
| --- | --- |
| Phase | Plan diligence **complete for founder grill Waves 1–2** |
| G1 Plan→Build thin vertical | **Unblocked** for design/ticket/DoD (food/pantry agency path) |
| Liquor customer-open | **Still counsel-gated** (licence statute + final age/hours copy) |
| Scaffold code this turn | **No** — next = G-log sync / G1 tracer ticket outline (human/Dev Manager) |

---

## All locked grill decisions (Wave 1 + 2)

| ID | Decision | Source | G-log |
| --- | --- | --- | --- |
| Geography | Harare metro, single `deliveryBandId` first | W1-Q1 accepted | — |
| Liquor licence | Merchant holds; DIAL terms + fail-closed `liquor_licence_ref` publish gates; **not Verified ZW law** | W1-Q2 recommended → accepted as provisional eng | **G-13** pending counsel |
| Age / hours | Config `liquor_order_window` + server age gate; eng placeholder **min_age=18** labelled pending counsel | W1-Q3 accepted | **G-14** |
| Delivery fee owner | Customer-facing delivery = **`DIAL_FEE`** (Option A); PLATFORM free-delivery promos OK | R2 / W1-Q4 accepted | **G-5** |
| Spoilage | Goods risk **supplier until POD**; Dial-caused cold-chain / delivery fail → **Dial** | R2 accepted | **G-5** |
| Informal | Food **formal-first**; liquor **formal-only**; B2B hide informal (**D-49**) | W1-Q5 accepted | **G-7 / G-8** |
| Delivery fee SoR | Deterministic **multi-factor pricing engine** → `amountMinor`; **no** weight-only; **no** LLM live fees | R1 accepted | **G-16** |
| AI role on fees | Optional `packages/ai` capability: draft rate-card params / explain fees; Promptfoo + human promote; **D-61** no prod agent host | R1 accepted | **G-16** |
| Escrow rule | Direct EcoCash/COD below T; escrow if **multi-vendor OR ≥ T**; liquor-high ≥ **T_liq** | R3 accepted | **G-6** |
| Escrow numbers | **Provisional:** T = **5000** USD minor ($50.00); T_liq = **10000** USD minor ($100.00). Ops may tune via config — **not** statutory | R3 “use recommended”; plan had no numbers | **G-6** |
| FX / checkout UX | **D-57** for grocery: USD browse/cart; ZiG at pay; EcoCash\|COD buttons | R4 accepted | **G-2** |
| WA | **Full MVP** Part 8 (`FLOW_GROCERY_*`, templates, EcoCash\|COD, age-gate) | W2-Q4 accepted | **G-11** |
| Grocery WHT | **None** on grocery merchants (Tech D-50 unchanged) | W2-Q5 accepted | **G-12** |
| Payout cadence | **Provisional T+3** calendar days after capture/escrow release (plan had no number; ops may tune) | R5 “use recommended” | **G-12** addendum |
| Goods catch-weight | Plan default stands: **packed fixed weights only** MVP (not re-asked in R1–R5) | Plan G-9 | **G-9** |

### Pricing-engine factors (R1 — brief)

Distance (`distanceMinorMeters` / OSRM), band, billable mass/volume as *one input*, basket `amountMinor`, cold-chain surcharge, liquor handling, slot / multi-stop, rate-card version — plus **floors/ceilings** and **value-aware** dampening (cheap-heavy fairness). Output freezes into OfferSnapshot / Intent / Job Reserve as **`DIAL_FEE`**.

### Escrow provisional defaults (R3)

Plan Part 5.4 defined the **rule** but left `T, T_liq = [Founder-input]` (no numeric recommendation). Founder accepted “use recommended” → grill provisional anchors (editable config; **not** ZW regulation):

| Key | USD | `amountMinor` (cents) | Notes |
| --- | --- | --- | --- |
| **T** | $50.00 | **5000** | Single-vendor EcoCash/card below → direct capture |
| **T_liq** | $100.00 | **10000** | Liquor-only high ticket prefers escrow |

Engineering: strategy interface / config — **no** magic hard-code in PSP adapters.

---

## Wave 2 close-out (R1–R5) — ACCEPTED

| # | Topic | Resolution |
| --- | --- | --- |
| **R1** | Pricing engine + AI drafts | **ACCEPTED** — engine SoR; AI drafts only; LLM live fees **REFUSED** |
| **R2** | Option A + spoilage | **ACCEPTED** — `DIAL_FEE`; supplier until POD; Dial-caused cold-chain → Dial |
| **R3** | Escrow + T / T_liq | **ACCEPTED** rule + provisional **5000 / 10000** USD minor |
| **R4** | D-57 | **ACCEPTED** |
| **R5** | T+N (WHT already none) | **ACCEPTED** provisional **T+3** |

---

## Scaffold / Build gate

| Path | Status |
| --- | --- |
| **G1 food/pantry thin vertical** (catalogue → checkout money → delivery slot stub) | **Unblocked** for Plan→Build ticket + tracer (**D-52**) after Dev Manager opens ticket with DoD |
| Liquor **SKU customer-open** | **Blocked** until counsel green (or keep liquor dormant) |
| Final age/hours **copy & statute numbers** | Counsel / ops — eng placeholders OK to scaffold gates |
| Take-rate bps ladder, brand polish, B2B grocery, multi-stop detail, KYC certs, OFF | Wave 3 / ops — **not** G1 money blockers |
| Code scaffold this session | **Do not** — grill only |

### Counsel-only blockers (not founder grill)

1. Liquor Act / remote-sale / whether platform needs a licence category (**G-13**).  
2. Final min age, order hours, ID types, customer T&Cs alcohol copy (**G-14**).  
3. Food-safety / CPA perishables counsel as needed for refund SOP (plan Part 6.10).  
4. Optional: confirm grocery commission WHT remains none under tax advice (founder product posture already **no WHT**).

---

## G-log sync (grill → plan Part 13)

| ID | Status after grill |
| --- | --- |
| G-2 | **Accepted** (R4) |
| G-5 | **Accepted** (R2) |
| G-6 | **Accepted** + provisional T=5000 / T_liq=10000 |
| G-7 / G-8 | **Accepted** (W1-Q5) |
| G-9 | Plan default stands (packed fixed) |
| G-11 | **Accepted** full WA MVP |
| G-12 | **Accepted** no grocery WHT + provisional **T+3** payout |
| G-13 | Provisional eng; **counsel pending** |
| G-14 | Eng placeholder accepted; counsel for finals |
| **G-16** (new) | **Accepted** — multi-factor delivery pricing engine SoR; AI drafts only; no prod agent host |

**Next step (recommended):** Dev Manager / founder — promote Part 13 rows to “grill-accepted” in plan, then open **G1 tracer ticket** (Plan→thin vertical→expand) with DoD citing G-2…G-16. **Do not** start code until that ticket exists (**D-52**).

---

## Answer log (append)

| When | Item | Answer |
| --- | --- | --- |
| 2026-08-14 | R1–R5 | **Use recommended** — all accepted as above |

---

## Hard stops (unchanged)

No Expo shell, Baileys, Google/Mapbox SoR, AI writing payable amounts, prod agent host for fees (**D-61**), principal/`DIAL_OWNED` stock, second money/delivery SoR.
