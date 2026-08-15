# DIAL Build — End-to-End Workplan (auto-advance)

**Authority:** Pack §15 (T0–T9) · DoD backlog E1–E6 · Blueprint §8.0 · D-52 / D-56 / D-61  
**Companion:** `DIAL_Dev_Manager_Autonomous_Runbook.md` (decision policy)  
**State pointer:** `DIAL_Build_Workplan_STATE.md` (current stage — update every landing)  
**Rule:** When a stage goes **green**, Dev Manager **immediately** opens and starts the next stage. **No human confirm. No idle wait.**

---

## 0. Auto-advance contract

```text
on stage_green(stage):
  1. Attach evidence (T/W/P/S/A as required)
  2. Flip DoD/matrix cells to Y on the owning issue
  3. Comment issue + update STATE.md + CHANGELOG/ENHANCEMENTS as needed
  4. Commit + auto-push
  5. OPEN next stage ticket (gh issue) with DoD + matrix attached
  6. START next stage Build in the same session (or next agent turn without pausing for humans)
```

| Green means | Not green |
| --- | --- |
| Feature DoD checklist 100% **or** Pack train AC table for that stage | Thin-vertical-only (“tracer done”) |
| Matrix cells for in-scope channels = `Y` + evidence codes | Blank matrix cells |
| `pnpm typecheck` + `pnpm test` green on landed packages | Hooks failing |
| Required skills run when in scope (`dial-money-path-review`, `dial-grill-locks` already Plan-done, `dial-ai-capability-review` before `packages/ai` merge) | Skipping gates |

**Parallel (non-blocking):** Phase 0 commercial ENH-020…022 stay `proposed` forever until ops lands — eng continues on stubs.  
**Hard stop (only):** secrets, force-push main, lock reopen, customer-open declaration, production data.

---

## 1. Stage graph (serial spine)

Stages are ordered. **Do not skip ahead** except where noted (E2a may land WA against payment stubs while E1 expands later).

| # | Stage ID | Name | Owns | Green when | Next (auto) |
| ---: | --- | --- | --- | --- | --- |
| 0 | `S00` | PRIORITY 0 — env + auto-push | Dev Manager | Node/pnpm/typecheck/test/lefthook/origin/push script OK | `S01` |
| 1 | `S01` | Ticket hygiene | Dev Manager | One owned E2a **or** E1a issue with DoD+matrix+owner | `S10` (prefer E2a) |
| 10 | `S10` | **E2a** Spare WA USD→EcoCash\|COD→intent | #1 | Matrix B (+ A2 checkout cells) 100% + evidence | `S11` |
| 11 | `S11` | **E1a** Money spine OfferSnapshot→PSP→ledger→FiscalReceiptQueued | new issue | Matrix A money rows for thin path 100% + `dial-money-path-review` | `S12` |
| 12 | `S12` | **E1b** Daily ZiG admin + EcoCash ZiG/`fx_rate_id` | new issue | Matrix A2 admin+EcoCash cells 100% | `S20` |
| 20 | `S20` | **T1** Identity | new issue | Pack §15 T1 AC | `S21` |
| 21 | `S21` | **T2** Catalogue+Search (Meili, B2B hide informal, Factory ingest stubs) | new issue | Pack §15 T2 AC | `S22` |
| 22 | `S22` | **T3** Spare UI (web/native patterns + responsive DoD; closes remaining Spare channel parity) | new issue | Pack §15 T3 AC + §8.0.1 evidence | `S23` |
| 23 | `S23` | **T5** Money spine full (ledger, all PspAdapters, JobReserve, WHT, FDMS Gateway stub) | new issue | Pack §15 T5 AC + money-path review | `S24` |
| 24 | `S24` | **T4** Tech UI | new issue | Pack §15 T4 AC + §8.0.1 | `S25` |
| 25 | `S25` | **E3a** Delivery job→offer→POD | new issue | Matrix C thin path 100% | `S26` |
| 26 | `S26` | **T6** Jobs (classification, rate-card quote, JobClass/Trade stubs) | new issue | Pack §15 T6 AC | `S27` |
| 27 | `S27` | **E4a** / **T7** AI guidedIntake (no price) + Promptfoo smoke | new issue | Matrix / Pack T7 + `dial-ai-capability-review` | `S28` |
| 28 | `S28` | **E5a** Catalogue Factory CSV→approve→Meili; B2B informal leak=0 | new issue | E5 DoD 100% | `S29` |
| 29 | `S29` | **E6a** / **T8** Factory shadow+MetricContract + CC Actual/Simulated | new issue | E6 DoD + Pack T8 | `S30` |
| 30 | `S30` | **T9** Hardening (IDOR, webhooks, Semgrep baseline, Simulated≠pay) | new issue | Pack §15 T9 + Appendix A.1 | `S90` |
| 90 | `S90` | **Eng Build complete** | Dev Manager | All S10–S30 green; living docs current | **`PD1`** (product depth) — not S99 yet |
| 99 | `S99` | **Customer-open** | Founder/ops | Appendix C / Blueprint §8.1 — **not auto** | END |

**Note on order S22→S23→S24:** Pack narrative is T3 then T4 then T5, but money spine T5 is required before deep Tech money and jobs. This workplan runs **T3 Spare UI → T5 Money full → T4 Tech UI** so Tech booking can bind to real quote/money stubs. Do not reopen locks.

**D-53 Commercial Simulation:** scaffold after `S23` green (optional overlay; not a new stage number).

### 1b. Product-depth band (post-S90 eng spine)

Founder directive (2026-08-14): after S90, **do not invent OpenAPI micro-stages**. Auto-advance follows this authored band only. **S99 remains human-only (launch)** — not eng next after G1. Founder (2026-08-15): continue **product depth** with **PD5–PD9**, then **PD10–PD12** ops/experience depth.

| # | Stage ID | Name | Owns | Green when | Next (auto) |
| ---: | --- | --- | --- | --- | --- |
| 101 | `PD1` | **Auth depth** — live Supabase Auth + Postgres profiles/RLS | [#21](https://github.com/Vanguduza/dial/issues/21) | Sign-in/up password→GoTrue; DialSession; profiles RLS; fixture CI | `PD2` |
| 102 | `PD2` | **Search depth** — live Meili + Catalogue Factory → `spare_offers` | [#22](https://github.com/Vanguduza/dial/issues/22) | Index bootstrap; Factory approve→upsert; B2B leak=0 | `PD3` |
| 103 | `PD3` | **Spare depth** — browse/cart against live search path | [#23](https://github.com/Vanguduza/dial/issues/23) | `/spare` USD browse; EcoCash\|COD | `PD4` |
| 104 | `PD4` | **PSP sandbox** — Paynow/EcoCash sandbox adapters | [#24](https://github.com/Vanguduza/dial/issues/24) | Sandbox fail-closed; webhook→ledger→FiscalReceiptQueued | `G1` |
| 110 | `G1` | **Groceries thin vertical** (food/pantry) | [#25](https://github.com/Vanguduza/dial/issues/25) | `grocery_offers_v1` → USD → EcoCash\|COD → Job Reserve → delivery | `PD5` |
| 111 | `PD5` | **Customer Android** — Compose Spare browse/cart/checkout | [#26](https://github.com/Vanguduza/dial/issues/26) | Native Compose (C-5); gateway auth+search+checkout; USD; EcoCash\|COD | `PD6` |
| 112 | `PD6` | **Supplier-web** — Mercur vendor-panel patterns | [#27](https://github.com/Vanguduza/dial/issues/27) | Onboard/costs/heartbeat/confirm-SLA/statements vs `@dial/suppliers` | `PD7` |
| 113 | `PD7` | **Delivery Android** — foodhub-compose patterns + MapLibre | [#28](https://github.com/Vanguduza/dial/issues/28) | Offer accept/reject → POD/COD vs `@dial/delivery`; admin MapLibre track | `PD8` |
| 114 | `PD8` | **Customer iOS** — SwiftUI Spare parity | [#29](https://github.com/Vanguduza/dial/issues/29) | Same ERP APIs as PD5; tunacosgun patterns; USD + EcoCash\|COD | `PD9` |
| 115 | `PD9` | **Technician Android** — Now in Android | [#30](https://github.com/Vanguduza/dial/issues/30) | Jobs/checklist/evidence/Cal.com book; `rate_card` (not stub); Take-Home WHT | `PD10` |
| 116 | `PD10` | **Admin money / dispatch / Command Centre** | [#31](https://github.com/Vanguduza/dial/issues/31) | Money ops + delivery dispatch board + MetricContract Actual vs Simulated (D-54) | `PD11` |
| 117 | `PD11` | **FDMS sandbox** — Virtual Gateway agency receipts | new issue | Agency receipt types (D-59); sandbox day open/close; fiscal outbox | `PD12` |
| 118 | `PD12` | **Meta WA Flows** — Spare + Tech critical Flows | new issue | Official Cloud API Flows (D-40); EcoCash\|COD buttons (D-57); no Baileys | expand / next band |

**Paused (not SoR):** OpenAPI invent S91–S465+ — do **not** invent S466+. Skip `.github/workflows/*` in pushes until token has `workflow` scope. **No liquor Build** (counsel gate). Eng next after PD9 is **PD10**, not S99.

---

## 2. Stage detail — active / near

### PD1 — Auth depth (**GREEN** 2026-08-14)

| | |
| --- | --- |
| Issue | [#21](https://github.com/Vanguduza/dial/issues/21) |
| Branch | `build/t4-tech-ui` |
| Evidence | Password sign-up/in → GoTrue fixture; profiles RLS + `0002_profiles_auth_rls.sql`; DialSession + `/home` Shop\|Services; `GET /api/auth/me` object AuthZ; T |
| Green → | Auto-open **PD2** Meili + Catalogue Factory |

### PD2 — Search depth (**GREEN** 2026-08-14)

| | |
| --- | --- |
| Issue | [#22](https://github.com/Vanguduza/dial/issues/22) |
| Branch | `build/t4-tech-ui` |
| Evidence | `searchOffersAsync` + Meili client search/upsert; Factory `publishApprovedBatchToMeili`; gateway search session SoR; B2B informal leak=0; index `spare_offers_v1`; T |
| Green → | Auto-open **PD3** Spare depth |

### PD3 — Spare depth (**GREEN** 2026-08-14)

| | |
| --- | --- |
| Issue | [#23](https://github.com/Vanguduza/dial/issues/23) |
| Branch | `build/t4-tech-ui` |
| Evidence | `searchSpareForSession` / `findOfferForSession`; USD cart; EcoCash\|COD CTAs; B2B informal deep-link deny; T |
| Green → | Auto-open **PD4** PSP sandbox |

### PD4 — PSP sandbox (**GREEN** 2026-08-14)

| | |
| --- | --- |
| Issue | [#24](https://github.com/Vanguduza/dial/issues/24) |
| Branch | `build/t4-tech-ui` |
| Evidence | `runPd4MoneySpine`; sandbox fail-closed; Paynow/EcoCash webhook → ledger + FiscalReceiptQueued; T + money-path audit |
| Green → | Open **G1** groceries ticket (deps PD1–PD4 green) |

### G1 — Groceries (**GREEN** 2026-08-14)

| | |
| --- | --- |
| Issue | [#25](https://github.com/Vanguduza/dial/issues/25) |
| Branch | `build/t4-tech-ui` |
| Thin path | `grocery_offers_v1` → `/grocery` USD → EcoCash\|COD → Job Reserve → delivery create; food/pantry only |
| Evidence | catalogue grocery tests; `runG1GroceryThinVertical`; money-path-G1 audit; no DIAL_OWNED / no liquor |
| Green → | **PD5** Customer Android (product-depth band continues; S99 stays human/launch only) |

### PD5 — Customer Android (CURRENT)

| | |
| --- | --- |
| Issue | [#26](https://github.com/Vanguduza/dial/issues/26) |
| Branch | `build/t4-tech-ui` |
| Thin path | Compose `:app` + `:core:network` → auth cookie → Spare USD browse → EcoCash\|COD `POST /api/spare/checkout` |
| Evidence | `apps/customer-android/`; gateway `pd5CheckoutApi.test.ts`; CoolMall patterns / C-5 no Expo |
| Green → | **PD6** supplier-web |

### PD6 — Supplier-web (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Issue | [#27](https://github.com/Vanguduza/dial/issues/27) |
| Branch | `build/t4-tech-ui` |
| Thin path | `@dial/suppliers` + `/supplier` portal: onboard → costs USD → heartbeat → confirm SLA → statements |
| Evidence | `runPd6SupplierThinVertical`; `pd6Portal.test.ts`; Pack §9.4 screens |
| Green → | **PD7** Delivery Android |

### PD7 — Delivery Android (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Issue | [#28](https://github.com/Vanguduza/dial/issues/28) |
| Branch | `build/t4-tech-ui` |
| Thin path | `apps/delivery-android` + `/api/delivery/courier` → accept/reject → POD/COD; admin MapLibre pins from `courier_locations` |
| Evidence | `runPd7DeliveryThinVertical`; `pd7CourierApi.test.ts`; `:core:network` DialDeliveryClient tests |
| Green → | **PD8** Customer iOS |

### PD8 — Customer iOS (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Issue | [#29](https://github.com/Vanguduza/dial/issues/29) |
| Branch | `build/t4-tech-ui` |
| Thin path | `apps/customer-ios` SwiftUI + DialCustomerCore → auth → Spare USD browse → EcoCash\|COD |
| Evidence | SPM DialGatewayClient + XCTest; Node `pd8IosContract.test.ts`; C-5 no Expo |
| Green → | **PD9** Technician Android |

### PD9 — Technician Android (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Issue | [#30](https://github.com/Vanguduza/dial/issues/30) |
| Branch | `build/t4-tech-ui` |
| Thin path | `apps/technician-android` Compose + `/api/tech/technician` → Cal.com slots + `rate_card` book → checklist → evidence → Take-Home WHT |
| Evidence | `runPd9TechThinVertical`; `pd9TechnicianApi.test.ts`; `:core:network` DialTechnicianClient tests; `/tech/book` slots UI |
| Green → | **PD10** Admin money / dispatch / Command Centre |

### PD10 — Admin money / dispatch / Command Centre (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Issue | [#31](https://github.com/Vanguduza/dial/issues/31) |
| Branch | `build/t4-tech-ui` |
| Thin path | Money outbox ops UI + drain; dispatch board FIFO/offers; Command Centre MetricContract tiles; Take-Home durable WHT; Simulated never auto-pays |
| Evidence | `pd10AdminOps.test.ts`; `@dial/ai` tiles; `@dial/delivery` `getDispatchBoardSnapshot` |
| Green → | **PD11** FDMS sandbox |

### PD11 — FDMS sandbox (NEXT)

Virtual Gateway agency receipts (D-59); sandbox fiscal day.

### PD12 — Meta WA Flows

Official Cloud API Flows for Spare + Tech critical paths (D-40 / D-57).

### S10 — E2a (historical)

| | |
| --- | --- |
| Issue | https://github.com/Vanguduza/dial/issues/1 |
| Branch | `build/e2a-spare-wa-checkout` / PR #2 |
| Thin path | Done (packages + green-path test) |
| Expand remaining | Full Matrix B: 18-item disclosure, tech intake + emergency, §10 catalog Flows, Chatwoot handoff ids, marketing consent, Paynow URL button, gateway webhook HTTP routes, dep-grep Baileys=0 evidence |
| Green → | Auto-open **S11 E1a** and start OfferSnapshot→PSP stub→ledger→FiscalReceiptQueued |

### S11 — E1a (NEXT after S10)

OfferSnapshot USD → one PspAdapter authorize → webhook capture (sig+idempotency) → ledger entries → `FiscalReceiptQueued` (agency D-59).  
Gates: `dial-money-path-review` before merge.

### S12 — E1b

Admin Daily ZiG rate + audit; EcoCash checkout shows ZiG + persists `fx_rate_id`.

### S20–S30

Pack §15 ACs are the Done definition. Epic DoD from `DIAL_Plan_Phase_DoD_Backlog.md` attaches when the stage is an E* thin vertical.

### S99 — not automatic

Customer-open requires humans (contracts, licences, live Meta/ZIMRA/PSP). Eng must not declare launch.

---

## 3. Session bootstrap (every Dev Manager turn)

1. Read `DIAL_Build_Workplan_STATE.md` → `current_stage`  
2. If current stage not green → continue expand/build (no ask)  
3. If current stage green → execute auto-advance contract (§0)  
4. Never stop between stages for founder preference when prefer/lock exists  

---

## 4. Evidence codes (DoD backlog)

| Code | Meaning |
| --- | --- |
| T | tests / typecheck |
| W | webhook replay / idempotency |
| P | Promptfoo |
| S | screenshot / dial-webapp-recon |
| A | audit skill report (money-path / capability / IDOR) |

---

## 5. Parallel ops track (never blocks S10–S90)

| ID | Track | Blocks |
| --- | --- | --- |
| ENH-020 | PSP escrow contract | Customer-open only |
| ENH-021 | Meta template IDs | Customer-open only |
| ENH-022 | ZIMRA Gateway credentials | Customer-open only |
| ENH-023 | POTRAZ / AI transfer | As required for live photo→foreign model |

Eng uses stubs until these land.

---

*End of workplan. Update STATE.md on every stage transition.*
