# Money-path review — G2 Spare web

**Date:** 2026-08-16 (refreshed — G2 eng-exception pretend EcoCash `eco_sb_*`)  
**Scope:** Spare checkout API + web pay CTAs + `runG2SpareThinVertical` / `runG2SparePaynowHosted` + durable commerce writes  
**Skill:** `dial-money-path-review` (audit)

## Routes / workflows

| Path | Mutates money? |
| --- | --- |
| `POST /api/spare/checkout` (EcoCash\|COD) | Yes — freeze snapshot, payment intent/COD, JR, ledger, fiscal |
| `POST /api/spare/checkout` (Paynow) | Durable snapshot + `pending_payment` order + intent; **no** JR/ledger until RESULT_URL webhook |
| Web `/spare/checkout` EcoCash\|COD server actions | Same G2 spine |
| `POST /api/webhooks/ecocash` | Capture settle → ledger + fiscal (durable claim) |
| `POST /api/webhooks/paynow` | Capture settle when intent resolves (SHA512 + idempotency) |

## Checklist

### Core money locks

- [x] Amounts integer minor + currency (no float)
- [x] AI cannot set payable (`freezeOfferSnapshot` rejects `aiSuggestedPayableMinor`)
- [x] Mutations go through payments/ledger/tax + outbox hooks (Temporal delivery not required for G2 web settle)
- [x] PSP adapters capture; DIAL ledger SoR
- [x] No `NEXT_PUBLIC_`/`VITE_` on service_role/PSP
- [x] FDMS virtual API / outbox (D-40a)

### Webhooks + idempotency

- [x] EcoCash webhook: signature verify + `claimProcessedEventDurable`
- [x] Paynow webhook: SHA512 + durable claim → settle bridge
- [x] Idempotency-Key on checkout HTTP (Pack §10)
- [x] Capture driven by admit webhook (spine simulates verified EcoCash for dogfood; live uses `/api/webhooks/*`)
- [x] Duplicate PSP event no-op (`settledPspCaptures` / durable processed_events)
- [ ] Reconcile daily ops mismatch — still ticketed (not G2 blocker if path green)

### Agency / Spare FX

- [x] Agency only — MARKETPLACE offer_source on durable snapshots
- [x] Browse/cart USD; ZiG only at pay from Daily ZiG + `fx_rate_id` (D-57)
- [x] COD settle USD; indicative ZiG (D-60)
- [x] Agency receipt classes GOODS_* + DIAL_FEE (D-59)
- [x] IMTT not on checkout lines

## Findings

| Severity | Note |
| --- | --- |
| Medium | Web EcoCash dogfood simulates verified webhook in-process; live still needs PSP callback to `/api/webhooks/ecocash` with portal secrets |
| Medium | Sandbox durable writes fail closed without Supabase — correct |
| Low | Pretend Pack §6 EcoCash → `eco_sb_*` (G2 eng-exception) — not live/production EcoCash |
| Low | In-memory cart Map on `globalThis` (process-local; not Postgres SoR) |
| Low | Paynow optional: durable pending + Pack §6 RESULT/RETURN; JR deferred until webhook (correct) |

## Verdict

**Pass for G2 eng-exception sequencing** (COD + EcoCash-pretend `eco_sb_*` + durable JR/ledger/fiscal + leak=0). **Live/production EcoCash** still open until founder portal keys. Do not conflate eng-exception with live EcoCash green.
