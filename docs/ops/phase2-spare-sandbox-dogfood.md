# Phase 2 sandbox dogfood â€” Spare web E2E (G2)

**Eng SoR:** [`docs/planning/DIAL_Full_ERP_Completion_Plan.md`](../planning/DIAL_Full_ERP_Completion_Plan.md) Â§Phase 2.  
**Anti-stub:** Map-only carts/orders, `eco_stub_*` alone, skipped fiscal, or desktop-only UI do **not** exit G2.

## G2 DoD (plain language)

Human completes **EcoCash and COD** Spare buys on web against **Meili-seeded** offers; checkout creates **durable** OfferSnapshot + order rows (Postgres via service role when `DIAL_INTEGRATION_MODE=sandbox`); Job Reserve + ledger journals + `FiscalReceiptQueued` / `fdms_outbox`; B2B informal leak probe = 0; desktop **and** mobile web usable; Daily ZiG â†’ EcoCash ZiG payable (D-57).

## Prerequisites (G1 green + keys)

1. Phase 1 runbook: [`phase1-sandbox-dogfood.md`](./phase1-sandbox-dogfood.md)
2. `.env` (gitignored): `DIAL_INTEGRATION_MODE=sandbox`, Supabase URL + service role, Meili, Redis
3. For EcoCash sandbox adapter refs (`eco_sb_*`, not fixture `eco_fx_*`): set Pack Â§6 `ECOCASH_API_KEY`, `ECOCASH_MERCHANT_CODE`, `ECOCASH_WEBHOOK_SECRET` (pretend OK under G2 founder exception â€” `docs/ops/ecocash-pretend-sandbox.md`; leave `ECOCASH_SANDBOX_HTTP` unset for inline `eco_sb_*`)
4. Optional dogfood FX seed when admin four-eyes UI not used: `DIAL_G2_ALLOW_FX_SEED=1` (still audited `setBy=g2_spare_dogfood_seed`)
5. Job Reserve sandbox: Pack Â§6 `PSP_ESCROW_BASE_URL` + `PSP_ESCROW_API_KEY` (+ `PSP_WEBHOOK_SECRET`) with `PSP_ESCROW_SANDBOX_HTTP` unset â†’ `escrow_sb_*` (â‰  ENH-020 live partner)

## Evidence commands

```powershell
# Load .env into process without echoing values
Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $k,$v = $_.Split('=',2); Set-Item -Path "Env:$k" -Value $v
}

pnpm compose:up
pnpm bootstrap:search   # Meili spare_offers_v1 real taskUid

# Fixture-safe G2 spine (always)
pnpm --filter @dial/gateway-web exec node --import tsx --test src/lib/spare/g2Spine.test.ts

# Durable fail-closed without Supabase
pnpm --filter @dial/shared test

# API dogfood (gateway running + session cookie from G1 auth)
# POST /api/spare/checkout Idempotency-Key + { offerId, choice: "ecocash"|"cod" }
# Expect: orderId, snapshotId, jobReserveId, journalId, fiscalIds, durable.*, b2bInformalLeaks=0

# Sandbox durable COD + EcoCash-pretend probe:
$env:DIAL_INTEGRATION_MODE="sandbox"
$env:DIAL_G2_ALLOW_FX_SEED="1"
pnpm --filter @dial/gateway-web exec node --import tsx scripts/g2-sandbox-spine-probe.mts
# Expect eco.providerRefPrefix = "eco_sb_" when ECOCASH_* set

# Signed-in EcoCash (after dogfood:auth):
pnpm --filter @dial/gateway-web exec node --import tsx scripts/g2-signed-in-ecocash-api.mts

# Web recon (gateway on :3000, Meili bootstrapped; no EcoCash keys required for CTA smoke):
pnpm --filter @dial/gateway-web exec node --import tsx scripts/g2-spare-web-recon.mts

# B2B informal leak probe (must exit 0):
pnpm --filter @dial/gateway-web exec node --import tsx scripts/g2-b2b-leak-probe.mts

# Optional Paynow shapes (not G2 exit; fail-closed without PAYNOW_* in sandbox):
pnpm --filter @dial/gateway-web exec node --import tsx scripts/g2-paynow-hosted-probe.mts
```

## Sandbox probe note (2026-08-16) — G2 eng-exception

COD + EcoCash-pretend against hosted sandbox Supabase: `durable.snapshot/order/jr = accepted`, journal+2 fiscal queued, leak=0; EcoCash `providerRefPrefix=eco_sb_*`. Founder exception: pretend Pack §6 keys — **not** live/production EcoCash. See [`ecocash-pretend-sandbox.md`](./ecocash-pretend-sandbox.md) + STATE `G2: eng-exception`.

Meili: prior `pnpm bootstrap:search` returned `taskUid=24` (compose). Docker daemon may be down on some eng machines — leak probe falls back to memory with `meiliSkipped`.

Auth dogfood: `pnpm --filter @dial/identity run dogfood:auth` with optional `DIAL_SANDBOX_AUTH_EMAIL` / `DIAL_SANDBOX_AUTH_PASSWORD` (defaults in script). Signed-in COD + EcoCash:

```powershell
# After loading .env + dogfood:auth
pnpm --filter @dial/gateway-web exec node --import tsx scripts/g2-signed-in-cod-api.mts
pnpm --filter @dial/gateway-web exec node --import tsx scripts/g2-signed-in-ecocash-api.mts
pnpm --filter @dial/gateway-web exec node --import tsx scripts/g2-spare-web-recon.mts
```

Web recon with `DIAL_SANDBOX_AUTH_EMAIL` set: desktop+mobile COD → `/spare/checkout/done`. Anonymous: pay CTA → `/?next=/spare/checkout?cartId=…`. Notes: [`evidence/g2/NOTES.md`](./evidence/g2/NOTES.md).

## Honest G2 status checklist

| Gate item | Evidence |
| --- | --- |
| Durable OfferSnapshot + order rows | `@dial/shared` `persist*Durable` + G2 spine; COD + EcoCash-pretend |
| Meili-backed browse | `searchOffersAsync` / bootstrap `taskUid` ≠ fixture; web subtitle `search meili` |
| Idempotency-Key | `/api/spare/checkout` + spine keys |
| EcoCash + COD + PSP truth | **COD + EcoCash-pretend** (`eco_sb_*`); Paynow shapes key-ready; live EcoCash open |
| Job Reserve + ledger + FiscalReceiptQueued | Spine + signed-in COD/EcoCash API; `escrow_sb_*` |
| B2B informal leak = 0 | `g2-b2b-leak-probe.mts` + spine + catalogue tests |
| Desktop + mobile web | Signed-in COD done screenshots; EcoCash signed-in API green |
| Daily ZiG → EcoCash | Ops rate or `DIAL_G2_ALLOW_FX_SEED=1`; USD browse only |
| **G2 eng-exception** | green for sequencing — see STATE |
| **G2 live EcoCash** | open until portal keys |

## Money-path audit

See `docs/agent-audits/money-path-G2-spare.md`.
