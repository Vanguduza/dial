# dial-money-path-review — S11 E1a (2026-08-12)

**Scope:** `@dial/payments`, `@dial/ledger`, `@dial/tax`, gateway `POST /api/webhooks/psp`  
**Mode:** audit evidence for DoD (Dev Manager continues implement; not a wait gate).

## Critical

| Finding | Status |
| --- | --- |
| Float amounts | **Pass** — bigint `amountMinor` only |
| AI sets payable | **Pass** — `freezeOfferSnapshot` rejects `aiSuggestedPayableMinor` |
| Capture without webhook | **Pass** — `admitPspWebhookEvent` / Job Reserve require `signatureValid` |
| Duplicate webhook mutate | **Pass** — `processedPspEvents` no-op |
| DIAL_OWNED path | **Pass** — none exported (D-58) |

## High

| Finding | Status |
| --- | --- |
| PspAdapter rails D-43 | **Pass** — registry lists Paynow/ContiPay/EcoCash/PayPal/COD/escrow |
| Agency FDMS classes D-59 | **Pass** — `DIAL_FEE` / `GOODS_*` → in-house Gateway outbox |
| WHT D-50 | **Pass** — 30% without ITF263; 0 with clearance |
| Spare USD / ZiG D-57 | **Pass** on checkout path; **Admin Daily ZiG UI** deferred to **S12 E1b** |
| Temporal money workflows | **Partial** — in-memory money outbox stub; Temporal worker = T5 expand |

## Medium

| Finding | Status |
| --- | --- |
| Live PSP HMAC | Phase 0 stub (`PSP_WEBHOOK_SECRET` equality) — ENH-020 |
| Reconcile cron ledger vs PSP | Ticket for T5/T9 — not blocking E1a thin path |

**Verdict:** E1a thin path acceptable to continue expand; S12 owns admin FX UI. No Critical open.
