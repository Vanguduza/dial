# G2 evidence notes — 2026-08-16 (G2 eng-exception)

## Founder exception (G2 EcoCash only)

Pretend Pack §6 `ECOCASH_*` in gitignored `.env` (values never printed/committed).  
`ECOCASH_SANDBOX_HTTP` unset → `EcoCashDirectAdapter` returns `eco_sb_*`.  
Ops: `docs/ops/ecocash-pretend-sandbox.md`. Rules: `dial-autonomous-completion.mdc`.  
STATE: `G2: eng-exception (pretend/sandbox EcoCash)`. Live/production EcoCash still `blocked_on_human`.

Companion JR: Pack §6 `PSP_ESCROW_*` pretend + `PSP_ESCROW_SANDBOX_HTTP` unset → `escrow_sb_*` (≠ ENH-020 live partner).

## EcoCash keys (presence only)

`ECOCASH_API_KEY` / `ECOCASH_MERCHANT_CODE` / `ECOCASH_WEBHOOK_SECRET` — **SET** (pretend).  
`ECOCASH_SANDBOX_HTTP` — **ABSENT** (inline `eco_sb_*` path).

## Meili bootstrap + Factory publish (live — 2026-08-16)

Docker Desktop started (`LocalAppData\Programs\DockerDesktop`); `docker compose up -d redis meilisearch`.

Bootstrap (load `.env` first):

```json
{"ok":true,"indexUid":"spare_offers_v1","groceryIndexUid":"grocery_offers_v1","mode":"sandbox","taskUid":"29","documentsUpserted":3,"searchHits":3,"searchSource":"meili"}
```

Factory publish (`packages/search-indexer/scripts/phase4-sandbox-meili-publish.mjs`):

```json
{"ok":true,"publishTaskUid":"32","offerId":"off_p4sb_formal","searchHits":1,"searchSource":"meili","b2bLeaks":0,"not_G4":true}
```

B2B leak probe: `meiliSkipped=false`; all probes `source=meili`.

## Sandbox spine probe (pretend EcoCash)

```json
{
  "mode": "sandbox",
  "cod": {
    "orderId": "sord_g2_cart_msv8xoes",
    "snapshot": "accepted",
    "order": "accepted",
    "jr": "accepted",
    "webhook": "skipped_cod",
    "journal": true,
    "fiscal": 2,
    "leaks": 0
  },
  "eco": {
    "orderId": "sord_g2_cart_msv8xrw0",
    "snapshot": "accepted",
    "order": "accepted",
    "jr": "accepted",
    "webhook": "captured",
    "journal": true,
    "fiscal": 2,
    "providerRefPrefix": "eco_sb_s",
    "leaks": 0
  }
}
```

## Signed-in API (Auth + durable)

- COD: `scripts/g2-signed-in-cod-api.mts` → durable accepted, journal + 2 fiscal, leaks=0.
- EcoCash: `scripts/g2-signed-in-ecocash-api.mts` → `providerRef_eco_sb=true`, durable accepted, journal + 2 fiscal, leaks=0.

## EcoCash web done-page Playwright (2026-08-16)

Script: `apps/gateway-web/scripts/g2-signed-in-ecocash-web.mts` (FX seed via admin API; pretend `eco_sb_*`).

| Viewport | Result |
| --- | --- |
| Desktop | `/spare/checkout/done?method=ecocash` — order + intent + JR + journal |
| Mobile | same |

PNG prefix `spare-ecocash-*` (does not overwrite COD `spare-cod-after-*` / browse matrix).

```json
{
  "eco_keys_present": true,
  "sandbox_http": false,
  "desktop_ecocash_done": true,
  "mobile_ecocash_done": true,
  "done_has_intent": true
}
```

## B2B leak probe

Memory leak=0; Meili unreachable this session (documented skip). Prior Meili session hits=0.

## G2 status

| Label | Status |
| --- | --- |
| Eng-exception sequencing | **green** |
| Live/production EcoCash | **open** (founder portal keys) |

## Auth return URL (BUG-042)

Anonymous pay CTAs redirect to `/?next=/spare/checkout?cartId=…`. Form sign-in honors `next` (same-origin relative only).
