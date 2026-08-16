# EcoCash pretend / sandbox — G2 founder exception

**Authority:** Founder exception for **G2 only** (encode in `.cursor/rules/dial-autonomous-completion.mdc`).  
**Not:** live/production EcoCash green. Meta / ZIMRA / escrow stay honestly open unless separately excepted.

## What this unblocks

Eng may complete G2 **sequencing** and advance dependent Phase 3+ **work** without waiting for real EcoCash merchant portal secrets. STATE must label:

`G2: eng-exception (pretend/sandbox EcoCash)`

Keep real EcoCash on `blocked_on_human` until founder drops portal keys for production-intent evidence.

## Pack §6 env names only (never invent alternate names)

| Name | Role |
| --- | --- |
| `ECOCASH_API_KEY` | Bearer / `X-API-KEY` style credential |
| `ECOCASH_MERCHANT_CODE` | Merchant header / body merchant code |
| `ECOCASH_ENVIRONMENT` | `sandbox` (default) or `live` |
| `ECOCASH_WEBHOOK_SECRET` | HMAC for `/api/webhooks/ecocash` |
| `ECOCASH_SANDBOX_HTTP` | Optional `1` = real outbound HTTP to sandbox base |

Never commit values. Never print `.env`. Never put these behind `NEXT_PUBLIC_` / `VITE_`.

## Documented sandbox URL shapes (community + portal research)

Official portal: [developers.ecocash.co.zw](https://developers.ecocash.co.zw/) (sandbox environment for integration testing; credentials from developer account — **not published as fixed public test keys**).

Community SDK shapes (payload pattern only — reimplemented in `adapters/psp/src/EcoCashDirectAdapter.ts`):

| Source | Base / path notes |
| --- | --- |
| Portal marketing | Sandbox for testing; no public fixed API key in docs |
| `kinsleykajiva/ecocash-with-java` (MIT) | Base `https://developers.ecocash.co.zw/api/ecocash_pay`; C2B charge `…/api/v2/payment/instant/c2b/{sandbox\|live}`; status `…/api/v1/transaction/c2b/status/{mode}`; headers `X-API-KEY` + `Merchant` |
| DIAL adapter (key-drop-in) | Sandbox base `https://developers.ecocash.co.zw/api/sandbox`; live `https://api.ecocash.co.zw`; charge `/v1/transactions/charge` when `ECOCASH_SANDBOX_HTTP=1` |

**No published public pretend credential string** exists on the official portal. Eng therefore uses **local pretend values** in gitignored `.env` that satisfy Pack §6 presence checks.

## Pretend vs real sandbox HTTP

| Mode | How | Provider ref | Counts as |
| --- | --- | --- | --- |
| **Pretend (G2 eng-exception)** | Set Pack §6 `ECOCASH_*` in local `.env`; leave `ECOCASH_SANDBOX_HTTP` **unset**; `DIAL_INTEGRATION_MODE=sandbox` | `eco_sb_*` from `EcoCashDirectAdapter` | Eng sequencing evidence (verify + idempotency + ledger/fiscal settle via spine/webhook dogfood) |
| **Portal sandbox HTTP** | Real keys from developer portal + `ECOCASH_SANDBOX_HTTP=1` | Vendor `transactionId` | Stronger sandbox evidence; still not production |
| **Fixture** | `DIAL_INTEGRATION_MODE=fixture` | `eco_fx_*` | CI only — **not** G2 eng-exception |
| **Live** | Portal live keys + `ECOCASH_ENVIRONMENT=live` | Live refs | Production-intent — founder secrets |

**Job Reserve companion (not ENH-020 live):** Sandbox JR authorize uses Pack §6 `PSP_ESCROW_BASE_URL` + `PSP_ESCROW_API_KEY` with `PSP_ESCROW_SANDBOX_HTTP` unset → `escrow_sb_*` inline (same pattern as EcoCash). Live escrow partner remains `blocked_on_human` (ENH-020).

Pretend values must be **non-empty** Pack §6 fields in `.env` only. Suggested pattern names (ops fills local file; **do not paste into git**):

- API key: local string marked pretend/sandbox-docs-only  
- Merchant code: local pretend merchant code  
- Webhook secret: local HMAC secret for signed webhook dogfood  
- Escrow base/key: local pretend placeholders for JR shapes only  

## Evidence commands (no secret echo)

```powershell
# Load .env without printing values
Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $k,$v = $_.Split('=',2); Set-Item -Path "Env:$k" -Value $v
}

$env:DIAL_G2_ALLOW_FX_SEED = "1"
pnpm --filter @dial/gateway-web exec node --import tsx scripts/g2-sandbox-spine-probe.mts
# Expect eco.providerRefPrefix = "eco_sb_" (not fail-closed; not eco_fx_)

pnpm --filter @dial/gateway-web exec node --import tsx scripts/g2-signed-in-ecocash-api.mts
# Expect durable accepted + providerRef eco_sb_*

pnpm --filter @dial/gateway-web exec node --import tsx scripts/g2-b2b-leak-probe.mts
```

## Anti-stub

- Empty `ECOCASH_*` fail-closed ≠ eng-exception green.  
- Fixture `eco_fx_*` alone ≠ eng-exception green.  
- Eng-exception ≠ live EcoCash / customer-open.  
- Plugging **real** portal keys later must require **zero further coding** (`dial-key-drop-in.mdc`).

## Related

- `docs/ops/phase2-spare-sandbox-dogfood.md`  
- `docs/integrations/key-drop-in-readiness.md`  
- `docs/planning/DIAL_Build_Workplan_STATE.md`  
