# DIAL grill session — plan phase (D-56)

**Date:** 2026-08-11  
**Skill:** `.cursor/skills/dial-grill-locks`  
**Authority:** `DIAL_Consolidated_Plan_v4.md` D-38…D-61 + §0.2; `DIAL_Development_Agent_Pack.md` §2 / §2.2; `AGENTS.md`; `.cursor/rules/dial-non-negotiables.mdc`  
**Mode:** Plan diligence **complete** (D-56). Product locks through **D-61**. Build orchestration = **Dev Manager** (Blueprint §8.0) — ticket hygiene first.

**Legend**

| Tag | Meaning |
| --- | --- |
| **FACT (locked)** | Settled in v4 / Pack / companion — do not reopen |
| **OPEN (needs founder)** | Decision or counsel handoff only a human can settle |
| **DEFER** | Explicitly out of plan-phase critical path; revisit later without reopening locks |

---

## Open founder questions (rollup)

Crisp list only — counsel opinions are **not** settled by this grill.

1. **D-2 characterisation (agency):** **RESOLVED (D-58)** — founder confirms DIAL is an **agent**. FDMS on agency receipt model. Field-level invoice mapping + buy-vs-build signer still with tax adviser / commercial (not characterisation).
2. **~~D-2 + D-51 entity~~:** **MOOT (D-58)** — D-51 owned-stock principal track **discarded** so it cannot threaten agency. No second entity for owned stock.
3. **C-4 PSP escrow:** **LOCKED path (D-60)** — Paynow escrow-like **first ask**; else licensed equivalent. Signed contract remains commercial Phase-0 for *live* float (scaffold on stub OK).
4. **IMTT:** **LOCKED (D-60)** — **DIAL opex / books**, never customer checkout line. Escrow/PSP mediated legs typically attract IMTT (FI remits; may recover). Negotiate fees + counsel on leg *opex* only. See §2B-4.
5. **Meta WA go-live:** **Ops launch gate (D-60)** — product templates comprehensively registered in WA companion §12; approval/rates still ops before open launch.
6. **FDMS buy vs build:** **RESOLVED (D-59)**.
7. **B2C informal:** **LOCKED (D-60)** — B2C-visible at launch; B2B hide (D-49).
8. **Flash-Lite:** **LOCKED P1 (D-60)** — post-dogfood; not MVP DoD.
9. **COD settle currency:** **LOCKED (D-60)** — **USD** settle; ZiG at confirm = indicative (D-57).

Remaining pre-open: signed PSP contract, Meta template IDs live, ZIMRA field map at integrate, IMTT counsel memo on leg opex (not customer pricing).

---

## Topic 1 — Money / Job Reserve / WHT (D-50) / agency (D-49 + D-58) / FDMS (D-59)

### Design tree

```text
Money SoR
├── amountMinor + currency (never float)
├── Job Reserve + PSP escrow (C-4 / D-60 Paynow-first) — DIAL ledger, PSP holds float
├── Webhooks as truth + outbox + Temporal
├── Agency only MARKETPLACE (D-49 + D-58) — D-51 owned-stock DISCARDED
│   ├── B2B hide informal at Meili/search/APIs; B2C informal visible (D-60)
│   ├── VAT-inclusive registered; informal no goods VAT line
│   └── No DIAL_OWNED / owned COGS / principal SKUs
├── Tech WHT 30% / ITF263 (D-50) — first-class payout gate
├── IMTT = DIAL opex — never customer price line (D-60)
└── FDMS virtual API (D-40a) + agency receipt classes + in-house Gateway (D-59)
```

### Round 1 — frontier

❓ **Q1** - **Money representation:** Float decimals for ZWL/USD display math?

➡️ **No.** Integer `amountMinor` + `currency` everywhere. **FACT (locked)** — non-negotiable #1; Pack money contracts.

❓ **Q2** - **Who holds Job Reserve cash?** DIAL bank account vs licensed PSP escrow?

➡️ **PSP escrow / float; DIAL runs ledger only (C-4).** Path = **FACT (locked)** Paynow-first (D-60); signed contract = Phase-0 commercial for *live* float (scaffold stub OK).

❓ **Q3** - **Can AI / opsDraftQuote write payable amounts into ledger?**

➡️ **Never.** Drafts only; human + pricing engine. **FACT (locked)** — C-1, §5.1, D-54/D-56.

❓ **Q4** - **Marketplace commercial model for third-party suppliers?**

➡️ **Agency (`offerSource = MARKETPLACE`)** — not marketplace-wide principal. **FACT (locked)** — D-49 + **D-58** (D-2 = agent).

❓ **Q5** - **Owned stock in MVP?** Flip whole marketplace to principal?

➡️ **No.** D-51 owned-stock principal track **DISCARDED (D-58)** — do not scaffold `DIAL_OWNED` / `FIRST_PARTY` / owned COGS. Agency only. **FACT (locked)**.

❓ **Q6** - **Tech payouts without ITF263?**

➡️ Prefer ITF263; else withhold **30%** of tech share when threshold met; remit + certificate. Do not design as if WHT disappears because of PSP escrow. **FACT (locked)** — D-50 / §7.2.

❓ **Q7** - **B2B and informal stock?**

➡️ Hide + reject at search/Meili/browse/offer APIs **and** checkout — never B2B-visible/sellable. **FACT (locked)** — D-49. B2C informal **visible** at launch — **FACT (locked)** D-60.

❓ **Q8** - **FDMS path?**

➡️ Virtual fiscalisation via API (D-40a); agency receipt classes + **in-house** ZIMRA Virtual Gateway default (D-59); CloudESD optional `FdmsSigner` only. Stub OK; live device credentials = Phase-0. **FACT (locked)**.

❓ **Q9** - **Webhook / capture truth?**

➡️ Signature verify + idempotency (business op key) before mutate; client redirect not SoR. **FACT (locked)** — D-47 / money-path skill / D-55 habits.

### Topic 1 verdict

Product/money locks: **frontier empty — locks confirmed** (C-4, D-40a, D-43, D-49, D-50, **D-58**, **D-59**, **D-60**, amountMinor, AI-never-writes-money).  
**Remaining commercial (not product reopen):** signed PSP contract, ZIMRA field map at integrate, optional IMTT counsel on leg *opex*.

---

## Topic 2 — WhatsApp Cloud / Flows (D-40 / D-41)

### Design tree

```text
Customer channels
├── Official WhatsApp Cloud API only (no Baileys / unofficial)
├── Same ERP APIs as web/native — WA never second SoR
├── Flows + templates + Chatwoot handoff (D-40)
├── Full §10 surface in single launch (D-41) — not Phase 2
├── Payments = Paynow/PSP URL (not WA Pay for ZW launch)
└── AI on Tech intake server-side — no AI payable price
```

### Round 1 — frontier

❓ **Q1** - **Unofficial WA clients for cost / reliability?**

➡️ **Hard stop.** Cloud API only. **FACT (locked)** — D-40; Semgrep ban Baileys/`whatsapp-web.js`.

❓ **Q2** - **Defer Flows past open launch?**

➡️ **No.** D-41 + D-37: full companion §§2–6 and §10 in single customer launch. **FACT (locked)**.

❓ **Q3** - **WhatsApp Pay checkout button for ZW?**

➡️ **Not launch.** Hosted Paynow/escrow payment URL at end of Flow. **FACT (locked)** — WA companion §1.1.

❓ **Q4** - **Emergency Tech path via long Flow + AI?**

➡️ Short-circuit to human/deterministic dispatch; AI must not block emergency. **FACT (locked)** — WA §1.2; v4 §5.10.

❓ **Q5** - **Card numbers / ID docs in Flows?**

➡️ Never; payment hosted; secrets/radioactive rules apply. **FACT (locked)**.

### Topic 2 verdict

**Frontier empty — locks confirmed** (D-40, D-40a cross-link, D-41, D-41a promotions via ERP not WA SoR).  
**OPEN:** Meta template approval + RoA rates (#5) — ops go-live, not product reopen.

---

## Topic 3 — MapLibre / delivery SoR (D-44 / D-45)

### Design tree

```text
Delivery
├── job SoR = packages/delivery + Temporal DeliveryDispatchWorkflow + BullMQ (D-45)
├── maps SoR = MapLibre + Nominatim/OSRM/VROOM (D-44)
├── courier app = delivery-android (does not reopen C-5)
├── offer → accept/reject/timeout→reassign → FIFO if none
└── donors: foodhub-compose UX pattern; Fleetbase NOT job engine; AWS Last Mile Hyperlocal MIT-0 algorithm donor (D-45a)
```

### Round 1 — frontier

❓ **Q1** - **Google Maps / Mapbox as distance or courier map SoR?**

➡️ **Hard stop.** MapLibre + OSRM/VROOM/Nominatim. **FACT (locked)** — D-44.

❓ **Q2** - **Fleetbase / Navigator as job engine?**

➡️ **Hard stop.** Pattern-only at most; SoR = `packages/delivery` + Temporal. **FACT (locked)** — D-45.

❓ **Q3** - **Customer shell for courier maps via Expo?**

➡️ **No.** `delivery-android` additional surface; C-5 customer shells unchanged. **FACT (locked)** — D-44 / C-5.

❓ **Q4** - **No couriers available?**

➡️ Job stays FIFO queued; Temporal waits; dequeue on first available. **FACT (locked)** — D-45 / Pack.

❓ **Q5** - **OR-Tools as routing SoR (v7 idea)?**

➡️ **Reject as SoR** (D-53). VROOM/OSRM remain. **FACT (locked)**.

### Topic 3 verdict

**Frontier empty — locks confirmed** (D-44, D-45, D-45a, D-53 anti-OR-Tools-SoR). No founder product OPEN for this topic.

---

## Topic 4 — `packages/ai` (D-32 / D-54 / D-56 capability review)

### Design tree

```text
packages/ai
├── Composition: Policy → Privacy → … → Gemini (LiteLLM) → Zod → Langfuse/Promptfoo (§5.15)
├── Public capabilities only (guidedIntake, clientAssessment, opsDraftQuote, Spare CRM/perf, optional translate)
├── D-32 / §5.7: omit name/phone/address/ID; Presidio free-text only
├── No payable amounts / ledger writes
├── Part match deterministic (pg_trgm/RapidFuzz) — not LLM SoR
├── Merge gate: dial-ai-capability-review (D-56)
└── Factory promote: shadow → Promptfoo → human (D-54) — complementary
```

### Round 1 — frontier

❓ **Q1** - **Generic “ask the AI” chat endpoint?**

➡️ **No.** Typed capability API only. **FACT (locked)** — §5.15.

❓ **Q2** - **Tokenise CRM identity and send to Gemini?**

➡️ **No.** Omit identity fields entirely; opaque IDs only; Presidio for accidental free-text PII. **FACT (locked)** — D-32 / §5.7.

❓ **Q3** - **Customer-visible AI price before §5.9 gates?**

➡️ **No.** Ops draft + human approval until gates. **FACT (locked)** — C-1.

❓ **Q4** - **Auto-publish checklists / datasets from Factory?**

➡️ **No.** Shadow → Promptfoo → **human promote**. **FACT (locked)** — D-54.

❓ **Q5** - **Flash-Lite as mandatory Policy organ in MVP?**

➡️ Remains **P1 backlog** — additive optional; not locked product SoR. **OPEN** #8 / **DEFER** scaffold until founder picks timing.

❓ **Q6** - **Evalite/Braintrust as eval SoR?**

➡️ **No.** Promptfoo + Langfuse. **FACT (locked)** — Pack §2.2 / D-56 affirm.

### Topic 4 verdict

Capability / privacy / money boundaries: **frontier empty — locks confirmed** (C-1, §5.7–5.15, D-32, D-54, D-56).  
**OPEN:** Flash-Lite timing (#8). Plan-phase capability review notes: `DIAL_AI_Capability_Plan_Phase_Review.md`.

---

## Topic 5 — Catalogue Factory + B2B hide informal (D-53 / D-49)

### Design tree

```text
Catalogue
├── Catalogue Factory ingest → review queue → human approve → Meili (D-53)
├── demand-gap / search_no_result_events
├── AI candidates never auto-publish to Meili
├── B2B filter: supplierFormality / informal excluded (D-49)
├── offerSource MARKETPLACE | DIAL_OWNED (D-51) on offers + Meili
└── Reject: v7 as SoR; CERTIFIED–DORMANT as public MVP ladder
```

### Round 1 — frontier

❓ **Q1** - **AI catalogue enrichment straight to Meili?**

➡️ **No.** Human approve in Catalogue Factory; Factory gates (D-54) still apply. **FACT (locked)** — D-53 §3.

❓ **Q2** - **B2B informal enforcement only at checkout?**

➡️ **Insufficient.** Filter search/browse/Meili/offer APIs **and** checkout. **FACT (locked)** — D-49.

❓ **Q3** - **Treat v7 master doc / Train 0–10 as SoR?**

➡️ **Hard stop.** Absorb only via adopted companion; T0–T9 stand. **FACT (locked)** — D-53.

❓ **Q4** - **CERTIFIED–DORMANT as customer-facing multi-phase MVP?**

➡️ **No.** Internal §8.1 readiness only. **FACT (locked)** — D-53.

### Topic 5 verdict

**Frontier empty — locks confirmed** (D-49, **D-58** agency-only / no DIAL_OWNED, D-53 Catalogue Factory).  
**B2C informal:** visible at launch — **FACT (locked)** D-60.

---

## Topic 6 — Intelligence Factory / Command Centre Actual vs Simulated (D-54)

### Design tree

```text
Intelligence + CC
├── Loop: outcomes → datasets → shadow → Promptfoo → human promote → monitor
├── Outcome-weighted datasets (not volume-only)
├── MetricContract registry on every CC KPI
├── Actual vs Simulated quadrant — Simulated never auto-pays
└── Commercial Sim offline — no ledger mutators from Sim
```

### Round 1 — frontier

❓ **Q1** - **Silent auto-promote of checklist / troubleshooting models?**

➡️ **Hard stop.** Human + Promptfoo. **FACT (locked)** — D-54.

❓ **Q2** - **Simulated Command Centre drives payouts / pause money rails?**

➡️ **Hard stop.** Watermark + integration test forbid Simulated→payout. **FACT (locked)** — D-54 §14.5; Pack T9.

❓ **Q3** - **Ad-hoc KPI formulas on admin pages?**

➡️ Reject; every tile registers `MetricContract`. **FACT (locked)** — D-54.

❓ **Q4** - **Intelligence Factory writes payable amounts / pricing SoR?**

➡️ **No.** Rename/draft/forecast only; money stays DIAL packages. **FACT (locked)** — D-53/D-54.

### Topic 6 verdict

**Frontier empty — locks confirmed** (D-54 §§13–15; D-53 Factory money mod). No product OPEN beyond shared counsel/commercial items above.

---

## Cross-cutting hard stops (all topics)

Refused if proposed during grill (cite lock; offer compliant alternative only):

Expo/RN customer shell (C-5); Baileys; Google/Mapbox map SoR; AI payable amounts; Medusa/OfferKit/Formance money SoR; marketplace-wide principal; informal→B2B; drop tech WHT; reintroduce discarded D-51 owned-stock (D-58); stub-as-MVP / skip DoD (D-52); v7 SoR / Train 0–10 / Unleash-OR-Tools SoR; auto-publish AI; Simulated auto-pays; full upstream skill tree dumps (D-55); skip plan grill or `packages/ai` merge without capability review (D-56); ZiG on Spare browse/cart or unaudited FX / skip WA EcoCash+COD buttons (D-57); IMTT as customer checkout line (D-60).

---

## Session close

| Topic | Frontier | Cite |
| --- | --- | --- |
| 1 Money / WHT / agency / FDMS | Locks confirmed; commercial = Phase-0 | C-4, D-40a, D-49, D-50, D-58, D-59, D-60 |
| 2 WhatsApp | Locks confirmed; Meta ops launch gate | D-40, D-41, D-60 |
| 3 Maps / delivery | Locks confirmed | D-44, D-45 |
| 4 packages/ai | Locks confirmed; Flash-Lite P1 | §5.15, D-32, D-54, D-56, D-60 |
| 5 Catalogue + B2B | Locks confirmed | D-49, D-53, D-58, D-60 |
| 6 Factory / CC | Locks confirmed | D-54 |

**Human confirmation:** Product locks stand through **D-60**. Customer-open still Appendix C / §8.1. DoD backlog + completion matrices **filled** (tracer Phase B). **Next:** Dev Manager (Blueprint §8.0) closes **ticket hygiene** — open owned **E2a** (default) or **E1a** with DoD + owner before parallel trains.

**Artifacts:** this file; `docs/planning/diagrams/`; AI capability plan review; Promptfoo outline; today queue; DoD backlog; completion matrices; session handoff.
