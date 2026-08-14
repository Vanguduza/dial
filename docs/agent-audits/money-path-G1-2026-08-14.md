# Money-path audit — G1 Groceries thin vertical (2026-08-14)

**Scope:** Food/pantry agency checkout via `runG1GroceryThinVertical` — absorb into `@dial/catalogue` + `@dial/payments` + `@dial/delivery`. No parallel money SoR. No liquor.

## Checklist (dial-money-path habits)

| Gate | Result |
| --- | --- |
| Integer `amountMinor` + currency | Pass — cart/total USD bigint; EcoCash display ZWG from daily rate |
| AI never writes payable | Pass — `freezeOfferSnapshot` rejects `aiSuggestedPayableMinor` |
| Ledger / Job Reserve SoR = DIAL packages | Pass — `authorizeJobReserve` + `completePspCaptureSettlement` / ledger |
| Webhook-as-truth before settle | Pass — EcoCash `admitPspWebhookEvent` then settle (PD4 reuse) |
| Idempotency on capture settle | Pass — `settledPspCaptures` / `claimProcessedEvent` |
| IMTT not on checkout lines (D-60) | Pass — `imttOnCheckoutLines: false` |
| D-57 USD browse / ZiG-at-checkout | Pass — browse/cart USD; EcoCash `fx_rate_id` + ZWG displayPayable |
| D-49 B2B informal hide | Pass — search filter + `assertB2bMayPurchase` + cart deny |
| D-58 agency only | Pass — `offerSource=MARKETPLACE`; DIAL_OWNED publish rejected |
| FDMS agency classes | Pass — GOODS_FORMAL/INFORMAL + DIAL_FEE via `enqueueFiscalReceipt` |
| Delivery job SoR | Pass — `createDeliveryJob` from `@dial/delivery` |

## Out of scope

Liquor / age-gate SKUs · owned-stock principal · OpenAPI invent · S99
