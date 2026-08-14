# Money-path audit — PD4 sandbox PSP (2026-08-14)

**Scope:** `runPd4MoneySpine`, Paynow/EcoCash adapters, webhook settle bridge  
**Skill:** `dial-money-path-review` / `dial-psp-adapter-completeness`  
**Verdict:** Pass for PD4 thin vertical (fixture CI; sandbox fail-closed)

| Check | Result |
| --- | --- |
| Integer `amountMinor` + currency | Pass — USD ledger; EcoCash display ZWG via Daily ZiG |
| AI never writes payable | Pass — freezeOfferSnapshot rejects aiSuggestedPayable |
| Webhook sig + idempotency before mutate | Pass — adapter verifyWebhook; claimProcessedEventDurable; admitPspWebhookEvent |
| Capture → DIAL ledger SoR | Pass — `completePspCaptureSettlement` → `postPspCaptureSimple` |
| FiscalReceiptQueued agency classes | Pass — GOODS_FORMAL/INFORMAL + DIAL_FEE |
| Sandbox fail-closed without keys | Pass — PAYNOW_* / ECOCASH_* requireSecret tests |
| No Medusa/second ledger | Pass |

**Residual (not PD4 block):** live HTTP createPayment still needs Phase 0 keys (ENH-020); ContiPay/PayPal not expanded in this stage.
