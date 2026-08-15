# DIAL Build — Workplan STATE

**SoR for stage order:** `DIAL_Build_Workplan.md`  
**Updated:** 2026-08-15  
**Auto-advance:** **ON for product-depth band** — through **PD31** green → **PD32** next. OpenAPI invent paused. **S99 = launch only (human)** — not eng next.

| Field | Value |
| --- | --- |
| `current_stage` | **PD32** — Delivery COD float-limit warning (next eng) |
| `current_issue` | _(open when starting PD32)_ |
| `current_branch` | `build/t4-tech-ui` |
| `prior_stage` | **PD31** Technician Bluetooth thermal print hooks — **green** |
| `next_stage` | **PD32** Delivery COD float-limit warning |
| `blocked_on_human` | **S99** customer-open/launch only; liquor counsel gate |

## Completed

| Stage | When | Evidence |
| --- | --- | --- |
| S10–S90 | 2026-08-12/13 | Workplan spine green — eng Build complete |
| S91–S465 | 2026-08-13/14 | **Post-S90 invent** (OpenAPI micro-band) — **paused by founder** — not workplan SoR |
| **PD1** | 2026-08-14 | Supabase Auth + profiles/RLS; [#21](https://github.com/Vanguduza/dial/issues/21) |
| **PD2** | 2026-08-14 | Meili spare_offers_v1 + Factory; [#22](https://github.com/Vanguduza/dial/issues/22) |
| **PD3** | 2026-08-14 | Spare browse/PDP/cart vs session search; [#23](https://github.com/Vanguduza/dial/issues/23) |
| **PD4** | 2026-08-14 | Paynow/EcoCash sandbox spine + webhook settle; [#24](https://github.com/Vanguduza/dial/issues/24) |
| **G1** | 2026-08-14 | grocery_offers_v1 thin vertical; [#25](https://github.com/Vanguduza/dial/issues/25) |
| **PD5** | 2026-08-14 | Customer Android Compose Spare thin vertical; [#26](https://github.com/Vanguduza/dial/issues/26) |
| **PD6** | 2026-08-15 | Supplier-web Pack §9.4 thin vertical; [#27](https://github.com/Vanguduza/dial/issues/27) |
| **PD7** | 2026-08-15 | Delivery Android + MapLibre admin track; [#28](https://github.com/Vanguduza/dial/issues/28) |
| **PD8** | 2026-08-15 | Customer iOS SwiftUI Spare thin vertical; [#29](https://github.com/Vanguduza/dial/issues/29) |
| **PD9** | 2026-08-15 | Technician Android + Cal.com book/`rate_card`/checklist/evidence; [#30](https://github.com/Vanguduza/dial/issues/30) |
| **PD10** | 2026-08-15 | Admin money outbox + dispatch board + CC MetricContracts + durable WHT; [#31](https://github.com/Vanguduza/dial/issues/31) |
| **PD11** | 2026-08-15 | FDMS Virtual Gateway sandbox day + agency receipts on money outbox; [#32](https://github.com/Vanguduza/dial/issues/32) |
| **PD12** | 2026-08-15 | Meta WA Flows sandbox Spare + grocery food Cloud API; [#33](https://github.com/Vanguduza/dial/issues/33) |
| **PD13** | 2026-08-15 | tech-web Pack §9.3 guide/emergency/book/status; [#34](https://github.com/Vanguduza/dial/issues/34) |
| **PD14** | 2026-08-15 | Grocery web deepen slot/cart/checkout/track (food); [#35](https://github.com/Vanguduza/dial/issues/35) |
| **PD15** | 2026-08-15 | Catalogue Factory admin CSV→approve→Meili spare+grocery + demand-gap; [#36](https://github.com/Vanguduza/dial/issues/36) |
| **PD16** | 2026-08-15 | Promotions & referrals admin PLATFORM/FLASH/REFERRAL + SUPPLIER_COOP; no cash-out |
| **PD17** | 2026-08-15 | Intelligence Factory shadow→Promptfoo→human promote; Simulated never pays |
| **PD18** | 2026-08-15 | Spare-web orders/track/returns/garage + Sold by; D-57/D-58 |
| **PD19** | 2026-08-15 | Admin Trade/JobClass lifecycle + Value Score profiles/disputes; no money path |
| **PD20** | 2026-08-15 | Customer Android+iOS orders/returns/garage + grocery; C-5 no Expo |
| **PD21** | 2026-08-15 | Customer mobile promo/referral + tech deep-link; no cash-out (D-42) |
| **PD22** | 2026-08-15 | Admin Daily ZiG audit + Cost & health spend/kill-switch; IMTT opex (D-57/D-60) |
| **PD23** | 2026-08-15 | WHT remittance centre + Commercial Simulation; Simulated never pays (D-50/D-54) |
| **PD24** | 2026-08-15 | Projects client toggle (C-3) + legal compliance hub (§3.8); no money path |
| **PD25** | 2026-08-15 | Tech Android Value Score factors + ITF263 upload/verify + Take-Home (D-50/D-53) |
| **PD26** | 2026-08-15 | Gateway auth home Welcome-back + Shop\|Services; responsive; `/api/home` |
| **PD27** | 2026-08-15 | Spare dual entry Select Vehicle + Browse EPC; chassis join; USD; B2B hide informal |
| **PD28** | 2026-08-15 | Delivery available\|busy\|offline eligibility + Harare/Bulawayo MapLibre offline packs |
| **PD29** | 2026-08-15 | Delivery OSRM ETA banner + navigate stops + VROOM re-optimise |
| **PD30** | 2026-08-15 | Tech mock-location check-in + camera evidence overlay/queue |
| **PD31** | 2026-08-15 | Tech Bluetooth ESC/POS print hooks — ops ticket not ZIMRA SoR |

## Planned (eng next)

| Stage | Intent |
| --- | --- |
| **PD32** | Delivery COD float-limit warning — Pack §9.8 residual (optional) |
| **S99** | Customer-open — founder/ops — **not automatic / not eng next** |

## Note

Founder (2026-08-15): product depth continues — do **not** idle at S99 for eng. Do **not** invent OpenAPI. No liquor Build. Skip `.github/workflows/*` until workflow scope. Eng next after PD31 is **PD32**, not S99. Product is **not** finished at S99.

*Dev Manager updates this file in the same commit as stage transitions.*
