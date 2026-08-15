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
| 117 | `PD11` | **FDMS sandbox** — Virtual Gateway agency receipts | [#32](https://github.com/Vanguduza/dial/issues/32) | Agency receipt types (D-59); sandbox day open/close; fiscal outbox | `PD12` |
| 118 | `PD12` | **Meta WA Flows** — Spare + grocery food Cloud API | [#33](https://github.com/Vanguduza/dial/issues/33) | Official Cloud API Flows (D-40); EcoCash\|COD buttons (D-57); no Baileys / no liquor | `PD13` |
| 119 | `PD13` | **tech-web** — Pack §9.3 FixItNow patterns | [#34](https://github.com/Vanguduza/dial/issues/34) | Guide / emergency / diagnose / book vs `@dial/jobs`; no AI payable | `PD14` |
| 120 | `PD14` | **Grocery web deepen** — slot + track + checkout (food) | [#35](https://github.com/Vanguduza/dial/issues/35) | Beyond G1 browse; USD; EcoCash\|COD; no liquor | `PD15` |
| 121 | `PD15` | **Catalogue Factory admin** — D-53 queues + demand-gap | [#36](https://github.com/Vanguduza/dial/issues/36) | CSV→approve→Meili spare+grocery; B2B leak=0 | `PD16` |
| 122 | `PD16` | **Promotions & referrals admin** — Pack §9.5 | workplan | REFERRAL/PLATFORM/FLASH create; SUPPLIER_COOP approve; budgets; fraud holds; no cash-out | `PD17` |
| 123 | `PD17` | **Intelligence Factory shadow/promote** — D-54 | workplan | Shadow eval → human+Promptfoo promote; AI drafts only; never payable | `PD18` |
| 124 | `PD18` | **Spare-web deepen** — Pack §9.2 orders/returns/garage | workplan | Beyond PD3 browse; returns claim; garage vehicles; USD; EcoCash\|COD | `PD19` |
| 125 | `PD19` | **Admin Trade/JobClass + Value Score** — Pack §9.5 / D-53 | workplan | TradeDefinition editor + lifecycle; technician Value Score profiles/disputes | `PD20` |
| 126 | `PD20` | **Customer mobile deepen** — Pack §9.6 | workplan | Android/iOS orders/returns/garage + grocery parity vs PD18; USD; EcoCash\|COD; C-5 | `PD21` |
| 127 | `PD21` | **Customer mobile promo/referral + tech deep-link** — Pack §9.6 remainder | workplan | Promo code + referral share; deep-link Tech critical paths; no cash-out | `PD22` |
| 128 | `PD22` | **Admin Daily ZiG rate + Cost & health** — Pack §9.5 | workplan | Daily ZiG rate UI + audit; AI/cloud/SMS spend + kill-switch; IMTT opex | `PD23` |
| 129 | `PD23` | **Admin Compliance/WHT + Commercial Simulation** — Pack §9.5 / D-53 | workplan | WHT remittance centre; Simulated never auto-pays | `PD24` |
| 130 | `PD24` | **Admin Projects toggle + legal compliance hub** — Pack §9.5 residual | workplan | Projects feature toggle; legal/compliance hub screens | `PD25` |
| 131 | `PD25` | **Technician Android Value Score + ITF263** — Pack §9.7 / D-53 | workplan | Value Score factors on device; ITF263 status/upload deepen | `PD26` |
| 132 | `PD26` | **Gateway home Shop\|Services** — Pack §9.1 residual | workplan | Auth home Welcome-back + Shop \| Services | `PD27` |
| 133 | `PD27` | **Spare Select Vehicle / Browse EPC** — Pack §9.2 residual | workplan | Dual entry vehicle + EPC browse | `PD28` |
| 134 | `PD28` | **Delivery Android availability + offline packs** — Pack §9.8 residual | workplan | available/busy/offline + offline packs deepen | `PD29` |
| 135 | `PD29` | **Delivery ETA + stops / VROOM re-optimise** — Pack §9.8 residual | new issue | ETA banner (OSRM); navigate stop list; request re-optimise | `PD30` |
| 136 | `PD30` | **Technician mock-location / camera deepen** — Pack §9.7 residual | new issue | Mock-location detection; evidence camera polish | `PD31` |
| 137 | `PD31` | **Technician Bluetooth print hooks** — Pack §9.7 residual | workplan | Thermal print receipt/job ticket | `PD32` |
| 138 | `PD32` | **Delivery COD float-limit warning** — Pack §9.8 residual | workplan | optional COD float warn | `PD33` |
| 139 | `PD33` | **Staging recon / dogfood harden** — Spare + grocery food + Meta WA | [#37](https://github.com/Vanguduza/dial/issues/37) | dial-webapp-recon; sandbox rails | `PD34` |
| 140 | `PD34` | **B2B grocery polish + take-rate admin** — Wave 3 leftovers | [#38](https://github.com/Vanguduza/dial/issues/38) | formal-only UX deepen; take-rate scaffold | `PD35` |
| 141 | `PD35` | **Grocery brand polish + KYC cert badge** — Wave 3 leftover | [#39](https://github.com/Vanguduza/dial/issues/39) | formal cert display; brand polish | `PD36` |
| 142 | `PD36` | **Grocery/Spare multi-stop delivery** — one job same band/slot | [#40](https://github.com/Vanguduza/dial/issues/40) | multi-vendor consolidate; POD unchanged | `PD37` |
| 143 | `PD37` | **Local Playwright recon** — Spare+grocery+WA localhost | [#41](https://github.com/Vanguduza/dial/issues/41) | dial-webapp-recon ENH-011 local | `PD38` |
| 144 | `PD38` | **Supplier heartbeat + confirm SLA harden** | [#42](https://github.com/Vanguduza/dial/issues/42) | stale/missing heartbeat + confirm breach escalations | `PD39` |
| 145 | `PD39` | **ContiPay + PayPal sandbox deepen** | [#43](https://github.com/Vanguduza/dial/issues/43) | sandbox fail-closed without keys; fixture unchanged | expand |

**Paused (not SoR):** OpenAPI invent S91–S465+ — do **not** invent S466+. Skip `.github/workflows/*` in pushes until token has `workflow` scope. **No liquor Build** (counsel gate). Eng next after PD39 ≠ S99. Product ≠ finished at S99.


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

### PD11 — FDMS sandbox (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Issue | [#32](https://github.com/Vanguduza/dial/issues/32) |
| Branch | `build/t4-tech-ui` |
| Thin path | Sandbox Virtual Gateway open/close day → agency GOODS_*/DIAL_FEE on money outbox → fiscalCode; admin `/admin/fdms` |
| Evidence | `runPd11FdmsSandboxThinVertical`; `pd11FdmsSandbox.test.ts`; adapter sandbox day-gated submit |
| Green → | **PD12** Meta WA Flows |

### PD12 — Meta WA Flows (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Issue | [#33](https://github.com/Vanguduza/dial/issues/33) |
| Branch | `build/t4-tech-ui` |
| Thin path | Sandbox Cloud API `FLOW_SPARE_*` + `FLOW_GROCERY_*` food → interactive EcoCash\|COD → same payment intents as web; registered templates; webhook button_reply |
| Evidence | `runPd12WaFlowsSandboxThinVertical`; `pd12WaFlows.test.ts`; no Baileys / no liquor |
| Green → | **PD13** tech-web |

### PD13 — tech-web (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Issue | [#34](https://github.com/Vanguduza/dial/issues/34) |
| Branch | `build/t4-tech-ui` |
| Thin path | Guide → Cal.com book (rate_card) → emergency book (AI bypass) → customer `/tech/jobs` status; `/api/tech/services` |
| Evidence | `runPd13TechWebThinVertical`; `pd13TechWeb.test.ts`; design-tokens responsive |
| Green → | **PD14** grocery web deepen |

### PD14 — Grocery web deepen (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Issue | [#35](https://github.com/Vanguduza/dial/issues/35) |
| Branch | `build/t4-tech-ui` |
| Thin path | Browse ATC → USD cart → delivery slot → EcoCash\|COD (ZiG at pay) → ERP track; G1 money spine reused |
| Evidence | `runPd14GroceryWebThinVertical`; `pd14GroceryWeb.test.ts`; slot liquorAllowed=false |
| Green → | **PD15** Catalogue Factory admin |

### PD15 — Catalogue Factory admin (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Issue | [#36](https://github.com/Vanguduza/dial/issues/36) |
| Branch | `build/t4-tech-ui` |
| Thin path | CSV ingest → human approve → Meili spare_offers + grocery_offers; demand-gap KPIs; admin `/admin/catalogue/factory` |
| Evidence | `runPd15CatalogueFactoryThinVertical`; `pd15CatalogueFactory.test.ts`; liquor reject; payableFromAi=false; B2B leak=0 |
| Green → | **PD16** Promotions & referrals admin |

### PD16 — Promotions & referrals admin (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Branch | `build/t4-tech-ui` |
| Thin path | Create PLATFORM/FLASH/REFERRAL → activate; SUPPLIER_COOP propose→accept→ops approve live; fraud hold; cash-out blocked; budgets |
| Evidence | `runPd16PromotionsAdminThinVertical`; `pd16PromotionsAdmin.test.ts`; `/admin/promotions` |
| Green → | **PD17** Intelligence Factory shadow/promote |

### PD17 — Intelligence Factory shadow/promote (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Branch | `build/t4-tech-ui` |
| Thin path | Shadow checklist draft → Promptfoo → human approve → promote dataset; auto-publish blocked; Simulated never pays |
| Evidence | `runPd17IntelligenceFactoryThinVertical`; `pd17IntelligenceFactory.test.ts`; capability audit PD17; `/admin/intelligence/factory` |
| Green → | **PD18** Spare-web deepen |

### PD18 — Spare-web deepen (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Branch | `build/t4-tech-ui` |
| Thin path | USD cart Sold by → EcoCash\|COD → ERP order/track → return claim → garage (+consent) |
| Evidence | `runPd18SpareWebThinVertical`; `pd18SpareWeb.test.ts`; `/spare/orders|returns|garage` |
| Green → | **PD19** Admin Trade/JobClass + Value Score |

### PD19 — Admin Trade/JobClass + Value Score (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Branch | `build/t4-tech-ui` |
| Thin path | Trade+JobClass draft→active→retire; Value Score factors/confidence; dispute uphold; high score ≠ draft JC eligibility; no money writes |
| Evidence | `runPd19AdminTradeValueScoreThinVertical`; `pd19TradesValueScore.test.ts`; `/admin/trades` |
| Green → | **PD20** Customer mobile deepen |

### PD20 — Customer mobile deepen (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Branch | `build/t4-tech-ui` |
| Thin path | Android+iOS: Spare checkout → ERP order/track/return → garage consent; grocery USD browse + EcoCash\|COD; no Expo |
| Evidence | `runPd20CustomerMobileThinVertical`; `pd20CustomerMobile.test.ts`; DialGatewayClient Kotlin/Swift |
| Green → | **PD21** Customer mobile promo/referral + tech deep-link |

### Pack §9 gap audit (after PD20)

| § | Gap remaining | Stage |
| --- | --- | --- |
| 9.6 | Promo code + referral share; Tech deep-link on mobile | **PD21** |
| 9.5 | Daily ZiG rate admin + Cost & health kill-switch | **PD22** |
| 9.5 / D-53 | Compliance/WHT remittance + Commercial Simulation | **PD23** |

Do **not** treat S99 as eng-complete / product-finished.

### PD21 — Customer mobile promo/referral + tech deep-link (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Branch | `build/t4-tech-ui` |
| Thin path | Android+iOS: validate promo draft → referral share → cash-out blocked; tech deep-link rate_card book (payableFromAi=false) |
| Evidence | `runPd21CustomerMobilePromoThinVertical`; `pd21PromoTechMobile.test.ts`; `/api/promo` |
| Green → | **PD22** Admin Daily ZiG rate + Cost & health |

### Pack §9 gap audit (after PD20)

| § | Gap remaining | Stage |
| --- | --- | --- |
| 9.6 | Promo code + referral share; Tech deep-link on mobile | **PD21 GREEN** |
| 9.5 | Daily ZiG rate admin + Cost & health kill-switch | **PD22** |
| 9.5 / D-53 | Compliance/WHT remittance + Commercial Simulation | **PD23** |

Do **not** treat S99 as eng-complete / product-finished.

### PD22 — Admin Daily ZiG rate + Cost & health (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Branch | `build/t4-tech-ui` |
| Thin path | Audited Daily ZiG set → EcoCash fx_rate_id; AI/cloud/SMS spend thresholds → kill-switch rate-limit links; IMTT opex never checkout |
| Evidence | `runPd22AdminZigCostHealthThinVertical`; `pd22ZigCostHealth.test.ts`; `/admin/fx/daily-zig` + `/admin/cost-health` |
| Green → | **PD23** Admin Compliance/WHT + Commercial Simulation |

### Pack §9 gap audit (after PD20)

| § | Gap remaining | Stage |
| --- | --- | --- |
| 9.6 | Promo code + referral share; Tech deep-link on mobile | **PD21 GREEN** |
| 9.5 | Daily ZiG rate admin + Cost & health kill-switch | **PD22 GREEN** |
| 9.5 / D-53 | Compliance/WHT remittance + Commercial Simulation | **PD23** |

Do **not** treat S99 as eng-complete / product-finished.

### PD23 — Admin Compliance/WHT + Commercial Simulation (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Branch | `build/t4-tech-ui` |
| Thin path | 30% WHT → remittance draft→submit→ack; Commercial Sim Actual/Simulated; Simulated payout blocked |
| Evidence | `runPd23WhtRemittanceThinVertical`; `runPd23CommercialSimThinVertical`; `pd23ComplianceSim.test.ts`; capability audit PD23 |
| Green → | **PD24** Admin Projects toggle + legal compliance hub |

### Pack §9 gap audit (after PD23)

| § | Gap remaining | Stage |
| --- | --- | --- |
| 9.5 | Projects toggle + legal compliance hub | **PD24** |
| 9.7 / D-53 | Technician Android Value Score + ITF263 deepen | **PD25** |
| 9.1–9.2 / 9.8 | Home polish / EPC facets / offline packs | defer — not blocking; founder may prioritize |

Do **not** invent OpenAPI stages. Do **not** treat S99 as eng-complete / product-finished.

### PD24 — Admin Projects toggle + legal compliance hub (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Branch | `build/t4-tech-ui` |
| Thin path | coming_soon default → staff internal draft → live blocked without gates → gates + live; legal checklist + T&C publish/accept |
| Evidence | `runPd24AdminProjectsLegalThinVertical`; `pd24ProjectsLegal.test.ts`; `/admin/projects` + `/admin/compliance/legal` |
| Green → | **PD25** Technician Android Value Score + ITF263 |

### PD25 — Technician Android Value Score + ITF263 (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Branch | `build/t4-tech-ui` |
| Thin path | Value Score factors on device → Take-Home 30% without ITF → upload/verify → 0% WHT; certificate PDF stub |
| Evidence | `runPd25ValueScoreDeviceThinVertical`; `runPd25Itf263TakeHomeThinVertical`; `pd25TechnicianValueScoreItf263.test.ts`; Compose client |
| Green → | **PD26** Gateway home Shop\|Services |

### Pack §9 gap audit (after PD25)

| § | Gap remaining | Stage |
| --- | --- | --- |
| 9.1 | Auth home Shop\|Services | **PD26** |
| 9.2 | Select Vehicle / Browse EPC dual entry | **PD27** |
| 9.8 | Delivery availability + offline packs | **PD28** |

Do **not** invent OpenAPI stages. Do **not** treat S99 as eng-complete / product-finished.

### PD26 — Gateway home Shop|Services (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Branch | `build/t4-tech-ui` |
| Thin path | AuthN → Welcome-back → Shop\|Services lanes → session restore; responsive stacked→dual |
| Evidence | `runPd26GatewayHomeThinVertical`; `pd26GatewayHome.test.ts`; `/home` + `/api/home` |
| Green → | **PD27** Spare Select Vehicle / Browse EPC |

### PD27 — Spare Select Vehicle / Browse EPC (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Branch | `build/t4-tech-ui` |
| Thin path | Select Vehicle cascade → chassis → offers; Browse EPC groups → same chassis join; B2B informal hide; USD |
| Evidence | `runPd27SpareDualEntryThinVertical`; `pd27DualEntry.test.ts`; `/spare/entry` + `/api/spare/entry` |
| Green → | **PD28** Delivery Android availability + offline packs |

### PD28 — Delivery Android availability + offline packs (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Branch | `build/t4-tech-ui` |
| Thin path | offline ineligible → available offer → Harare+Bulawayo MapLibre packs → accept → busy |
| Evidence | `runPd28AvailabilityOfflinePacksThinVertical`; `pd28AvailabilityOffline.test.ts`; Compose client |
| Green → | **PD29** Delivery ETA + stops / VROOM |

### PD29 — Delivery ETA + stops / VROOM (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Branch | `build/t4-tech-ui` |
| Thin path | accept → start run → OSRM ETA banner → navigate stop list → VROOM re-optimise remaining |
| Evidence | `runPd29EtaStopsVroomThinVertical`; `pd29EtaStopsVroom.test.ts`; Compose ETA/stops/VROOM |
| Green → | **PD30** Technician mock-location / evidence-camera |

### PD30 — Technician mock-location / camera deepen (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Branch | `build/t4-tech-ui` |
| Thin path | mock GPS check-in blocked → genuine geofence accept → device camera + checklist overlay → offline queue flush |
| Evidence | `runPd30MockLocationCameraThinVertical`; `pd30MockLocationCamera.test.ts`; Compose check-in/camera |
| Green → | **PD31** Technician Bluetooth print hooks |

### PD31 — Technician Bluetooth print hooks (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Branch | `build/t4-tech-ui` |
| Thin path | pair ESC/POS Bluetooth printer → print job ticket (ops) — zimraFiscalSor=false; FDMS virtual only (D-40a) |
| Evidence | `runPd31BluetoothPrintThinVertical`; `pd31BluetoothPrint.test.ts`; Compose pair/print |
| Green → | **PD32** Delivery COD float-limit warning |

### PD32 — Delivery COD float-limit warning (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Branch | `build/t4-tech-ui` |
| Thin path | set float limit → under-limit collect OK → over-limit warn blocks until ack → recorded with warn flag |
| Evidence | `runPd32CodFloatLimitThinVertical`; `pd32CodFloatLimit.test.ts`; Compose COD float check |
| Green → | Pack §9 residual band closed — expand/polish (not S99) |

### Pack §9 gap audit (after PD32) — **CLOSED**

Primary Pack §9 residuals covered PD1–PD32. Founder default next = **PD33** staging dogfood.

### PD33 — Staging recon / dogfood harden (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Issue | [#37](https://github.com/Vanguduza/dial/issues/37) |
| Branch | `build/t4-tech-ui` |
| Thin path | recon Spare/grocery/WA surfaces → grocery+WA+FDMS sandbox rails → B2B informal cart 403 |
| Evidence | `runPd33StagingDogfoodThinVertical`; `pd33StagingDogfood.test.ts` |
| Green → | **PD34** B2B grocery polish + take-rate admin |

### Pack / product gap audit (after PD33)

| Gap | Stage |
| --- | --- |
| B2B grocery polish + take-rate admin scaffold (Wave 3) | **PD34** |
| Playwright live staging networkidle (ENH-011) | defer until staging URL |

### PD34 — B2B grocery polish + take-rate admin (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Issue | [#38](https://github.com/Vanguduza/dial/issues/38) |
| Thin path | B2B formal-only banner; take-rate draft→publish→resolve bps; admin UI |
| Evidence | `runPd34B2bTakeRateThinVertical`; `takeRate.test.ts`; `pd34B2bTakeRate.test.ts` |
| Green → | **PD35** grocery brand polish + KYC cert badge |

### Pack / product gap audit (after PD34)

| Gap | Stage |
| --- | --- |
| Grocery brand polish + formal KYC cert badge (display) | **PD35** |
| Multi-stop delivery detail deepen | defer / fold later |
| Playwright live staging networkidle (ENH-011) | defer until staging URL |

### PD35 — Grocery brand polish + KYC cert badge (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Issue | [#39](https://github.com/Vanguduza/dial/issues/39) |
| Thin path | formal chilled food-safety badge → ambient KYC badge → informal never; Dial Groceries brand polish |
| Evidence | `runPd35GroceryBrandKycThinVertical`; `groceryCert.test.ts`; `pd35GroceryBrandKyc.test.ts` |
| Green → | **PD36** multi-stop delivery |

### Pack / product gap audit (after PD35)

| Gap | Stage |
| --- | --- |
| Multi-stop delivery (same band/slot consolidate) | **PD36** |
| Playwright local recon (ENH-011 without remote URL) | **PD37** |
| Liquor Build | counsel gate — not eng |

### PD36 — Grocery/Spare multi-stop delivery (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Issue | [#40](https://github.com/Vanguduza/dial/issues/40) |
| Thin path | same band/slot → one multi-stop job; different slot → split; navigate pickups→dropoff; POD unchanged |
| Evidence | `runPd36MultiStopDeliveryThinVertical`; `pd36MultiStop.test.ts`; Temporal `activityCreateMultiStopDispatch` |
| Green → | **PD37** local Playwright recon |

### Pack / product gap audit (after PD36)

| Gap | Stage |
| --- | --- |
| Local Playwright recon Spare+grocery+WA | **PD37** |
| Liquor Build | counsel gate — not eng |

### PD37 — Local Playwright recon (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Issue | [#41](https://github.com/Vanguduza/dial/issues/41) |
| Thin path | Playwright Chromium → Spare/grocery/WA (live localhost or harness); networkidle wait; spare-browse testid fix |
| Evidence | `runPd37LocalPlaywrightReconThinVertical`; `pd37LocalRecon.test.ts` |
| Green → | **PD38** supplier heartbeat SLA |

### Pack / product gap audit (after PD37)

| Gap | Stage |
| --- | --- |
| Supplier heartbeat + confirm SLA harden | **PD38** |
| ContiPay/PayPal sandbox deepen | **PD39** |
| WA template registry admin polish (sandbox) | **PD40** |
| FDMS day ops UX deepen | **PD41** |
| iOS/Android customer parity holes | **PD42** |
| Remote staging Playwright matrix | ENH-011 remainder (optional human URL) |
| Liquor Build | counsel gate — not eng |

### PD38 — Supplier heartbeat + confirm SLA harden (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Issue | [#42](https://github.com/Vanguduza/dial/issues/42) |
| Thin path | missing/stale heartbeat → escalate; confirm SLA breach → escalate; ack; healthy after heartbeat |
| Evidence | `runPd38HeartbeatSlaThinVertical`; `pd38HeartbeatSla.test.ts` |
| Green → | **PD39** ContiPay/PayPal sandbox |

### PD39 — ContiPay + PayPal sandbox deepen (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Issue | [#43](https://github.com/Vanguduza/dial/issues/43) |
| Thin path | sandbox createPayment+verifyWebhook fail-closed without keys; fixture path unchanged |
| Evidence | `runPd39ContiPayPaypalSandboxThinVertical` |
| Green → | **PD40** WA template registry |

### PD40 — WA template registry admin polish (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | env key hints; FLOW_SPARE_* + FLOW_GROCERY_*; sandbox template send; Cloud API only; no Baileys/liquor |
| Evidence | `runPd40WaTemplateRegistryThinVertical`; `pd40WaTemplateRegistry.test.ts` |
| Green → | **PD41** FDMS day ops |

### PD41 — FDMS day ops UX deepen (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | day banner + agency receipt-class counts + drain-only + auto-refresh; Virtual Gateway (D-59) |
| Evidence | `runPd41FdmsDayOpsThinVertical`; `pd41FdmsDayOps.test.ts` |
| Green → | **PD42** mobile parity |

### PD42 — iOS/Android customer parity (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | Spare `soldBy` on search; grocery `supplierDisplayName` + `trackGrocery`; USD EcoCash\|COD; C-5 |
| Evidence | `pd42MobileParity.test.ts`; DialGatewayClient iOS/Android contract tests |
| Green → | eng-safe continue ≠ S99 |

### Pack / product gap audit (after PD42)

| Gap | Stage |
| --- | --- |
| Spare web/native CPA §7.5 18-item review-before-pay (Pack §9.2 / v4 §7.5) | **PD43** |
| Grocery checkout CPA disclosure parity (food; no liquor) | **PD44** |
| Admin support tickets + consent audit (ENH-049/050 ops UX) | **PD45** |
| Remote staging Playwright | ENH-011 optional human |
| Liquor Build | counsel gate — not eng |

### PD43 — Spare CPA §7.5 disclosure + review-before-pay (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | `EIGHTEEN_ITEM_DISCLOSURES` ×18 → web DisclosureReviewGate → EcoCash\|COD unlock; native ack toggle |
| Evidence | `runPd43CpaDisclosureThinVertical`; `pd43CpaDisclosure.test.ts` |
| Green → | **PD44** grocery CPA |

### PD44 — Grocery CPA disclosure (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | same gate on grocery checkout; liquorSkus=false |
| Evidence | `runPd44GroceryCpaDisclosureThinVertical`; `pd43CpaDisclosure.test.ts` |
| Green → | **PD45** support/consent admin |

### PD45 — Support + consent admin (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | listSupportTickets + listConsentAudit → `/admin/support`; Chatwoot ≠ status SoR |
| Evidence | `runPd45SupportConsentAdminThinVertical`; `pd43CpaDisclosure.test.ts` |
| Green → | eng-safe continue ≠ S99 |

### Pack / product gap audit (after PD45)

| Gap | Stage |
| --- | --- |
| Supplier co-op spend / statements UX deepen | **PD46** |
| Command Centre severity → recommended actions | **PD47** |
| Remote staging Playwright | ENH-011 optional human |
| Liquor Build | counsel gate — not eng |

### PD46 — Supplier co-op spend / promo co-op UX (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | propose→accept→ops approve→`record_coop_spend` → budget + statement `coop_spend`; cash-out blocked |
| Evidence | `runPd46SupplierCoopSpendThinVertical`; `pd46Pd47Ops.test.ts` |
| Green → | **PD47** Command Centre actions |

### PD47 — Command Centre recommended actions (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | MetricContract warn/critical → recommendedActions (`autoPay=false`); Simulated never pays |
| Evidence | `runPd47CommandCentreActionsThinVertical`; `pd46Pd47Ops.test.ts` |
| Green → | eng-safe continue ≠ S99 |

### Pack / product gap audit (after PD47)

| Gap | Stage |
| --- | --- |
| Admin spare returns / refunds ops queue | **PD48** |
| Escrow sandbox Job Reserve (≠ live partner ENH-020) | **PD49** |
| Vehicle Hub consent audit + chassis browse | **PD50** |
| Remote staging Playwright | ENH-011 optional human |
| Liquor Build | counsel gate — not eng |

### PD48 — Admin spare returns / refunds (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | open claim → `/admin/returns` list → human refund\|replace; `payableFromAi=false` |
| Evidence | `runPd48AdminReturnsThinVertical`; `pd48Pd50Ops.test.ts` |
| Green → | **PD49** Escrow sandbox |

### PD49 — Escrow sandbox Job Reserve (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | sandbox fail-closed without `PSP_ESCROW_*`; fixture hold→release→webhook; admin `/admin/money/escrow` |
| Evidence | `runPd49EscrowSandboxThinVertical`; `pd48Pd50Ops.test.ts` |
| Green → | **PD50** Vehicle Hub |
| Note | ≠ ENH-020 live partner contract (human) |

### PD50 — Vehicle Hub deepen (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | grant/revoke reminder consent + audit; `/spare?chassis=` browse from garage |
| Evidence | `runPd50VehicleHubThinVertical`; `pd48Pd50Ops.test.ts` |
| Green → | eng-safe continue ≠ S99 |

### Pack / product gap audit (after PD50)

| Gap | Stage |
| --- | --- |
| Delivery courier UX deepen | **PD51** |
| Technician Take-Home polish | **PD52** |
| Admin disputes queue | **PD53** |
| Grocery Meili demand-gap admin | **PD54** |
| Remote staging Playwright | ENH-011 optional human |
| Liquor Build | counsel gate — not eng |

### PD51 — Delivery courier UX deepen (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | offer→accept→transit→POD photo stub→COD float banner ack; web `/delivery/courier` + Android |
| Evidence | `runPd51CourierUxThinVertical`; `pd51Pd54Ops.test.ts` |
| Green → | **PD52** Take-Home polish |

### PD52 — Technician Take-Home polish (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | breakdown → upload ITF263 → verify → 0% WHT; admin Take-Home UI |
| Evidence | `runPd52TakeHomePolishThinVertical`; `pd51Pd54Ops.test.ts` |
| Green → | **PD53** disputes |

### PD53 — Admin disputes queue (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | open Value Score dispute → `/admin/disputes` → uphold|reject (append-only) |
| Evidence | `runPd53AdminDisputesThinVertical`; `pd51Pd54Ops.test.ts` |
| Green → | **PD54** grocery demand-gap |

### PD54 — Grocery Meili demand-gap admin (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | grocery vertical no-result events → `/admin/grocery/demand-gap`; liquorAllowed=false |
| Evidence | `runPd54GroceryDemandGapThinVertical`; `pd51Pd54Ops.test.ts` |
| Green → | eng-safe continue ≠ S99 |

### Pack / product gap audit (after PD54)

| Gap | Stage |
| --- | --- |
| Admin orders queue (spare + grocery) | **PD55** |
| Dispatch manual override assign | **PD56** |
| Daily ZiG four-eyes approve | **PD57** |
| Customer delivery track read-only | **PD58** |
| Remote staging Playwright | ENH-011 optional human |
| Liquor Build | counsel gate — not eng |

### PD55 — Admin orders queue (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | spare+grocery list → `/admin/orders` → advance status; no liquor; payableFromAi=false |
| Evidence | `runPd55AdminOrdersThinVertical`; `pd55Pd58Ops.test.ts` |
| Green → | **PD56** manual override |

### PD56 — Dispatch manual override assign (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | FIFO job → `manualOverrideAssign` → assigned; leave FIFO |
| Evidence | `runPd56ManualOverrideAssignThinVertical`; `pd55Pd58Ops.test.ts` |
| Green → | **PD57** ZiG four-eyes |

### PD57 — Daily ZiG four-eyes (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | propose → same-actor blocked → second ops approve → active rate |
| Evidence | `runPd57DailyZigFourEyesThinVertical`; `pd55Pd58Ops.test.ts` |
| Green → | **PD58** customer track |

### PD58 — Customer delivery track (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | session + order ownership → read-only MapLibre pin `/delivery/track` |
| Evidence | `runPd58CustomerDeliveryTrackThinVertical`; `pd55Pd58Ops.test.ts` |
| Green → | eng-safe continue ≠ S99 |

### Pack / product gap audit (after PD58)

| Gap | Stage |
| --- | --- |
| Assignment-event timeline | **PD59** |
| Domain module registry (≠ Unleash) | **PD60** |
| COD collect failure reasons | **PD61** |
| Unified four-eyes queue | **PD62** |
| Remote staging Playwright | ENH-011 optional human |
| Liquor Build | counsel gate — not eng |

### PD59 — Assignment-event timeline (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | offer → reject → FIFO → override → `listAssignmentEvents` on dispatch board |
| Evidence | `runPd59AssignmentEventsThinVertical`; `pd59Pd62Ops.test.ts` |
| Green → | **PD60** domain modules |

### PD60 — Domain module registry (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | seeded modules → certify/dormant; `publicMvpLadder=false`; not Unleash SoR |
| Evidence | `runPd60DomainModuleRegistryThinVertical`; `pd59Pd62Ops.test.ts` |
| Green → | **PD61** COD failure reasons |

### PD61 — COD failure reasons (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | `recordCodCollectFailure` with reason → attempt status failed; float warn intact |
| Evidence | `runPd61CodFailureReasonThinVertical`; `pd59Pd62Ops.test.ts` |
| Green → | **PD62** four-eyes queue |

### PD62 — Unified four-eyes queue (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | pending Daily ZiG → `/admin/four-eyes` approve|reject; same-actor still blocked in SoR |
| Evidence | `runPd62FourEyesQueueThinVertical`; `pd59Pd62Ops.test.ts` |
| Green → | eng-safe continue ≠ S99 |

### Pack / product gap audit (after PD62)

| Gap | Stage |
| --- | --- |
| POD signature + GPS → pod_media | **PD63** |
| Catalogue pending_review claim/resolve | **PD64** |
| Supplier bonds hold/release | **PD65** |
| Admin pending_review queue UI | **PD66** |
| Remote staging Playwright | ENH-011 optional human |
| Liquor Build | counsel gate — not eng |
| Live Meta/ZIMRA/PSP contracts | ENH-020–022 human |

### PD63 — POD signature + GPS (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | photo + signature + GPS → `pod_media` (MapLibre SoR) |
| Evidence | `runPd63PodSignatureGpsThinVertical`; `pd63Pd66Ops.test.ts` |
| Green → | **PD64** catalogue claim |

### PD64 — Catalogue claim → resolve (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | enqueue → claim → approve; no AI auto-publish |
| Evidence | `runPd64CatalogueClaimResolveThinVertical`; `pd63Pd66Ops.test.ts` |
| Green → | **PD65** supplier bonds |

### PD65 — Supplier bonds (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | hold → release → bond statement lines (USD minor) |
| Evidence | `runPd65SupplierBondThinVertical`; `pd63Pd66Ops.test.ts` |
| Green → | **PD66** pending-review UI |

### PD66 — Admin pending_review queue (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | list pending → claim remains visible → resolve clears `/admin/pending-review` |
| Evidence | `runPd66PendingReviewQueueThinVertical`; `pd63Pd66Ops.test.ts` |
| Green → | eng-safe continue ≠ S99 |

### Pack / product gap audit (after PD66)

| Gap | Stage |
| --- | --- |
| Delivery run inbox (`delivery_runs`) | **PD67** |
| Offer countdown → timeout | **PD68** |
| Job variation propose/approve | **PD69** |
| Customer promo credit balance UI | **PD70** |
| Remote staging Playwright | ENH-011 optional human |
| Liquor Build | counsel gate — not eng |
| Live Meta/ZIMRA/PSP contracts | ENH-020–022 human |

### PD67 — Delivery run inbox (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | accept offer → `delivery_runs` inbox → start run (MapLibre SoR) |
| Evidence | `runPd67DeliveryRunInboxThinVertical`; `pd67Pd70Ops.test.ts` |
| Green → | **PD68** offer countdown |

### PD68 — Offer countdown timeout (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | countdown remainingMs → expire past offer → timed_out |
| Evidence | `runPd68OfferCountdownTimeoutThinVertical`; `pd67Pd70Ops.test.ts` |
| Green → | **PD69** job variations |

### PD69 — Job variation approve (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | human propose draft delta → AI blocked → ops approve; `/admin/jobs/variations` |
| Evidence | `runPd69JobVariationApproveThinVertical`; `pd67Pd70Ops.test.ts` |
| Green → | **PD70** promo balance |

### PD70 — Customer promo credit balance (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | grant promo_credit → `/account/promo` balance → cash-out blocked (D-42) |
| Evidence | `runPd70CustomerPromoBalanceThinVertical`; `pd67Pd70Ops.test.ts` |
| Green → | eng-safe continue ≠ S99 |

### Pack / product gap audit (after PD70)

| Gap | Stage |
| --- | --- |
| Order failover accept | **PD71** |
| Promo approve queue (SUPPLIER_COOP) | **PD72** |
| Identity step-up | **PD73** |
| Active run MapLibre polyline | **PD74** |
| Remote staging Playwright | ENH-011 optional human |
| Liquor Build | counsel gate — not eng |
| Live Meta/ZIMRA/PSP contracts | ENH-020–022 human |

### PD71 — Order failover accept (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | confirm SLA breach → failover accept to alternate supplier |
| Evidence | `runPd71OrderFailoverAcceptThinVertical`; `pd71Pd74Ops.test.ts` |
| Green → | **PD72** promo approve |

### PD72 — Promo approve queue (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | SUPPLIER_COOP pending → `/admin/promotions/approve` → ops approve clears |
| Evidence | `runPd72PromoApproveQueueThinVertical`; `pd71Pd74Ops.test.ts` |
| Green → | **PD73** step-up |

### PD73 — Identity step-up (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | request → bad code blocked → verify → assert gate (session SoR) |
| Evidence | `runPd73IdentityStepUpThinVertical`; `pd71Pd74Ops.test.ts` |
| Green → | **PD74** polyline |

### PD74 — Active run polyline (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | navigate stops → GeoJSON LineString; MapLibre SoR; not Google |
| Evidence | `runPd74ActiveRunPolylineThinVertical`; `pd71Pd74Ops.test.ts` |
| Green → | **PD75** set active vehicle |

### Pack / product gap audit (after PD74)

| Gap | Stage |
| --- | --- |
| Garage set active vehicle | **PD75** |
| WHT YTD certificate download | **PD76** |
| Complete navigate stop → run | **PD77** |
| Customer marketing consent | **PD78** |
| Remote staging Playwright | ENH-011 optional human |
| Liquor Build | counsel gate — not eng |
| Live Meta/ZIMRA/PSP contracts | ENH-020–022 human |

### PD75 — Garage set active vehicle (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | add vehicles → `setActiveGarageVehicle` → exactly one active (Pack §10) |
| Evidence | `runPd75SetActiveGarageVehicleThinVertical`; `pd75Pd78Ops.test.ts` |
| Green → | **PD76** WHT cert |

### PD76 — WHT YTD certificate download (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | 30% WHT → YTD → stub PDF download on Take-Home (Pack §9.7; ≠ fiscal SoR) |
| Evidence | `runPd76WhtCertificateDownloadThinVertical`; `pd75Pd78Ops.test.ts` |
| Green → | **PD77** complete stop |

### PD77 — Complete navigate stop → run (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | complete each stop → last stop completes `delivery_run` (Pack §10 / §9.8) |
| Evidence | `runPd77CompleteStopThinVertical`; `pd75Pd78Ops.test.ts` |
| Green → | **PD78** marketing consent |

### PD78 — Customer marketing consent (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | grant → revoke → audit on `/account/consent` (Pack Matrix B; session SoR) |
| Evidence | `runPd78MarketingConsentThinVertical`; `pd75Pd78Ops.test.ts` |
| Green → | **PD79** garage CRUD |

### Pack / product gap audit (after PD78)

| Gap | Stage |
| --- | --- |
| Garage CRUD update/delete | **PD79** |
| COD confirm settle | **PD80** |
| Checklist by symptom + answers | **PD81** |
| Customer account profile | **PD82** |
| Remote staging Playwright | ENH-011 optional human |
| Liquor Build | counsel gate — not eng |
| Live Meta/ZIMRA/PSP contracts | ENH-020–022 human |

### PD79 — Garage CRUD update + delete (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | update label/chassis → delete active → promote remaining (Pack §10 Vehicles) |
| Evidence | `runPd79GarageCrudThinVertical`; `pd79Pd82Ops.test.ts` |
| Green → | **PD80** COD confirm |

### PD80 — COD confirm settle (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | recorded COD attempt → `confirmCodCollect` USD settle (Pack §10) |
| Evidence | `runPd80CodConfirmThinVertical`; `pd79Pd82Ops.test.ts` |
| Green → | **PD81** checklist symptom |

### PD81 — Checklist by symptom (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | symptom → checklist → submit answers → completed (Pack §10) |
| Evidence | `runPd81ChecklistBySymptomThinVertical`; `pd79Pd82Ops.test.ts` |
| Green → | **PD82** account profile |

### PD82 — Customer account profile (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | session profile get/update; cross-tenant deny (Pack §10 Identity) |
| Evidence | `runPd82AccountProfileThinVertical`; `pd79Pd82Ops.test.ts` |
| Green → | **PD83** addresses |

### Pack / product gap audit (after PD82)

| Gap | Stage |
| --- | --- |
| Customer delivery addresses | **PD83** |
| Supplier stock upload | **PD84** |
| Referral status | **PD85** |
| Manager's choice flag | **PD86** |
| Remote staging Playwright | ENH-011 optional human |
| Liquor Build | counsel gate — not eng |
| Live Meta/ZIMRA/PSP contracts | ENH-020–022 human |

### PD83 — Customer delivery addresses (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | add pin+landmark+phone → default → delete promotes (MapLibre) |
| Evidence | `runPd83CustomerAddressesThinVertical`; `pd83Pd86Ops.test.ts` |
| Green → | **PD84** stock upload |

### PD84 — Supplier stock upload (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | onboard → upload stock → pending_review (agency MARKETPLACE; D-58) |
| Evidence | `runPd84SupplierStockUploadThinVertical`; `pd83Pd86Ops.test.ts` |
| Green → | **PD85** referral status |

### PD85 — Referral status (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | share → attach → getReferralStatus; cash-out forbidden (D-42) |
| Evidence | `runPd85ReferralStatusThinVertical`; `pd83Pd86Ops.test.ts` |
| Green → | **PD86** managers choice |

### PD86 — Manager's choice flag (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | Value Score profile → set/clear Manager's choice (not money) |
| Evidence | `runPd86ManagersChoiceThinVertical`; `pd83Pd86Ops.test.ts` |
| Green → | **PD87** supplier coop propose/ack |

### Pack / product gap audit (after PD86)

| Gap | Stage |
| --- | --- |
| Supplier coop propose → accept → ops live | **PD87** |
| Guided intake + client assessment HTTP | **PD88** |
| Ops draft quote HTTP (no ledger) | **PD89** |
| Technician availability | **PD90** |
| Remote staging Playwright | ENH-011 optional human |
| Liquor Build | counsel gate — not eng |
| Live Meta/ZIMRA/PSP contracts | ENH-020–022 human |

### PD87 — Supplier coop propose/ack (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | propose → accept → ops approve → live; cash-out forbidden |
| Evidence | `runPd87SupplierCoopProposeAckThinVertical`; portal `propose_coop`/`accept_coop`; `pd87Pd90Ops.test.ts` |
| Green → | **PD88** guided intake |

### PD88 — Guided intake HTTP (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | `/api/ai/guided-intake` + client-assessment; Zod JobAssessment; no money |
| Evidence | `runPd88GuidedIntakeThinVertical`; `ai-capability-PD88-PD89-2026-08-15.md` |
| Green → | **PD89** ops draft quote |

### PD89 — Ops draft quote HTTP (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | `/api/ai/ops-draft-quote` internal; humanApprovalRequired; ledgerWrite=false |
| Evidence | `runPd89OpsDraftQuoteThinVertical`; dogfood |
| Green → | **PD90** tech availability |

### PD90 — Technician availability (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | available\|busy\|offline on tech API (≠ delivery courier) |
| Evidence | `runPd90TechnicianAvailabilityThinVertical`; `pd87Pd90Ops.test.ts` |
| Green → | eng-safe Pack gap ≠ S99 |

### Pack / product gap audit (after PD90)

| Gap | Stage |
| --- | --- |
| Spare PDP fitment / quality / availability | **PD91** |
| 7-day order cancellation | **PD92** |
| Customer shadow-failover UX | **PD93** |
| emergency.triage.v1 checklist | **PD94** |
| Remote staging Playwright | ENH-011 optional human |
| Liquor Build | counsel gate — not eng |
| Live Meta/ZIMRA/PSP contracts | ENH-020–022 human |

### PD91 — Spare PDP attrs (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | fitmentConfidence + qualityTier + availability state (not raw qty) |
| Evidence | `runPd91SparePdpAttrsThinVertical`; search hits; PDP; `pd91Pd94Ops.test.ts` |
| Green → | **PD92** 7-day cancel |

### PD92 — 7-day order cancel (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | cancel while `cancellableUntil` open; deny after |
| Evidence | `runPd92SevenDayCancelThinVertical`; `/api/spare/orders` action=cancel |
| Green → | **PD93** shadow failover |

### PD93 — Customer shadow failover (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | list SLA-breached confirms → accept alternate supplier |
| Evidence | `runPd93CustomerShadowFailoverThinVertical`; `/api/spare/failover` |
| Green → | **PD94** emergency triage |

### PD94 — emergency.triage.v1 (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | seed + resolve + run checklist; AI price bypassed |
| Evidence | `runPd94EmergencyTriageThinVertical`; tech services checklists |
| Green → | eng-safe Pack gap ≠ S99 |

### Pack / product gap audit (after PD94)

| Gap | Stage |
| --- | --- |
| Spare collections + Meili facets | **PD95** |
| Promo validate/apply → checkout draft | **PD96** |
| Idempotency-Key on pay | **PD97** |
| Technician credentials eligibility | **PD98** |
| Remote staging Playwright | ENH-011 optional human |
| Liquor Build | counsel gate — not eng |
| Live Meta/ZIMRA/PSP contracts | ENH-020–022 human |

### PD95 — Spare facets + collections (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | collections + quality/availability/brand/chassis facets |
| Evidence | `runPd95SpareFacetsCollectionsThinVertical`; `/api/search/spare`; `pd95Pd98Ops.test.ts` |
| Green → | **PD96** promo cart wire |

### PD96 — Promo draft → checkout (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | validate/apply draft on cart; checkout echoes draft (not payable) |
| Evidence | `runPd96PromoCartCheckoutThinVertical`; spare checkout `promoDraft` |
| Green → | **PD97** Idempotency-Key |

### PD97 — Idempotency-Key on pay (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | require header; same key replays intent |
| Evidence | `runPd97IdempotencyKeyThinVertical`; spare checkout |
| Green → | **PD98** tech credentials |

### PD98 — Technician credentials (**GREEN** 2026-08-15)

| | |
| --- | --- |
| Thin path | trade_licence verified gates `isTechnicianEligible` |
| Evidence | `runPd98TechnicianCredentialsThinVertical`; tech API |
| Green → | eng-safe Pack gap ≠ S99 |

### Pack / product gap audit (after PD98)

| Gap | Stage |
| --- | --- |
| Remote staging Playwright | ENH-011 optional human |
| Liquor Build | counsel gate — not eng |
| Live Meta/ZIMRA/PSP contracts | ENH-020–022 human |

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
