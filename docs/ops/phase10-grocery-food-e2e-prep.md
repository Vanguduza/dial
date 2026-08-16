# Phase 10 prep — Grocery food E2E shapes (not G10)

**Status:** Food/pantry shapes + liquor reject contracts. **Do not claim G10** until G5+G8 (and G9 for WA grocery) + sandbox food order→reserve→POD with liquor absent from index/API.

**Non-goals:** Liquor Build (counsel-gated). Age-gate-at-door. Catch-weight.

## Existing spine

| Asset | Role |
| --- | --- |
| `apps/gateway-web/src/lib/grocery/g1Spine.ts` | Food thin vertical: USD cart → EcoCash\|COD → Job Reserve → `createDeliveryJob` |
| `@dial/catalogue` grocery + Meili `grocery_offers_v1` | Browse; B2B informal hide; liquor publish reject |
| `/grocery*` web | Food UI; liquor hidden |

## Phase 10 exit deps (do not skip)

1. **G5** — Temporal delivery / POD rails reused (multi-stop when same band)
2. **G8** — money webhook truth on grocery pay
3. **G9** — WA grocery Flows (optional channel; food web can advance with G5+G8)

## Eng-safe prep checklist

- [x] Liquor reject on publish/search/indexer (existing tests)
- [x] B2B informal leak=0 patterns
- [x] EcoCash\|COD CTAs on grocery checkout (web + native clients)
- [ ] Sandbox Meili `grocery_offers_v1` non-fixture hits (needs Meili up + keys)
- [ ] Durable grocery order + JR on sandbox (needs G2 rails + DB)
- [ ] Delivery job → Temporal history for grocery order (needs G5)
- [ ] Dogfood desktop+mobile food buy evidence

## Explicit non-claims

- G1 thin vertical ≠ G10
- Liquor remains gated/hidden
- `g10Claimed=false` until exit checklist + anti-stub evidence

## Related

- `DIAL_Groceries_Liquor_Branch_Plan.md` (food path)
- Completion Plan Phase 10 / G10
