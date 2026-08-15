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
| 141 | `PD35` | **Grocery brand polish + KYC cert badge** — Wave 3 leftover | [#39](https://github.com/Vanguduza/dial/issues/39) | formal cert display; brand polish | expand |

**Paused (not SoR):** OpenAPI invent S91–S465+ — do **not** invent S466+. Skip `.github/workflows/*` in pushes until token has `workflow` scope. **No liquor Build** (counsel gate). Eng next after PD35 is Wave 3 expand / human gates — **not S99**. Product ≠ finished at S99.


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
| Green → | Wave 3 eng leftovers closed; next ≠ S99 (human staging URL / counsel) |

### Pack / product gap audit (after PD35)

| Gap | Stage |
| --- | --- |
| Multi-stop delivery detail deepen | defer / fold later |
| Playwright live staging networkidle (ENH-011) | defer until staging URL (human) |
| Liquor Build | counsel gate — not eng |

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
