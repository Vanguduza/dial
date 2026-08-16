# G10 sandbox grocery food dogfood — 2026-08-16

**Script:** `apps/gateway-web/scripts/g10-sandbox-grocery-food-dogfood.mts`  
**Claim:** `g10Claimed=false` — G5 ENH-013 maps Tier-2 may still block full G10 exit.

## Spine (in-process)

- Food only (`groc_milk_1l`); liquor publish rejected; B2B leaks=0.
- EcoCash pretend → order → delivery → POD captured; JR + journal + webhook.

## Web Playwright (desktop + mobile)

- browse → cart → slot → checkout (CPA ack + EcoCash CTA) → track.
- Liquor absent on browse; Food & pantry visible.

## Fix applied this session

- `GroceryCheckoutForm.tsx` no longer imports `@dial/adapter-whatsapp` in client bundle (disclosures passed from server page) — unblocked `/grocery/checkout` dev compile.

## Playwright runtime

- Used cached Chromium from `cursor-sandbox-cache` (`PLAYWRIGHT_BROWSERS_PATH`); no fresh `playwright install` (network timeout on this host).
