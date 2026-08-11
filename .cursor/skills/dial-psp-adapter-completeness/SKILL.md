---
name: dial-psp-adapter-completeness
description: >-
  Checks PspAdapter registry completeness for Paynow, ContiPay, EcoCash, PayPal,
  COD, and escrow stubs (D-43). Use when adding payment methods, webhook handlers,
  or reviewing packages/payments adapters.
---

# PspAdapter completeness

## Workflow

1. Open the common `PspAdapter` / payment-method interface.
2. For each method (Paynow, ContiPay, EcoCash optional, PayPal Orders v2, COD, escrow): confirm stub or impl covers initiate/capture/cancel/webhook verify as designed in stitch §2.
3. Confirm **no second ledger**; adapters are Tier-3 rails only.
4. Webhook routes: signature + idempotency acceptance criteria.
5. Report gaps; do not invent live PSP behaviour without Phase 0 contracts.

## Must not

- Treat Medusa/OfferKit/Formance as money SoR
- Put PSP secrets in client bundles
- Skip hash/signature validation on Paynow (or peer) result posts

## Authority

D-43, `DIAL_Deep_Engineering_and_OSS_Stitch.md` §2, Agent Pack §6.6 / adapter stubs.
