---
name: dial-money-path-review
description: >-
  Audits DIAL money paths for integer minor units, outbox/Temporal usage,
  AI-never-writes-money, ledger SoR, webhook-as-truth, and payments idempotency.
  Use when reviewing payments, Job Reserve, pricing, fiscal/FDMS, refunds, or
  ledger PRs — prefer audit report before fixes. Habits from agency-agents
  Payments (MIT) folded under DIAL locks. Authority: D-47 / D-55.
---

# DIAL money-path review

## When to use

Any change touching `packages/payments`, `ledger`, `pricing`, Job Reserve, FDMS, PSP webhooks, or customer-visible amounts.

## Workflow (audit-then-fix)

Inspired by Ruflo named workflows + Lazy Developer audit prompts — **report first**, fix only after user asks. Payments habits adapted from [agency-agents](https://github.com/msitarzewski/agency-agents) Payments & Billing Engineer (MIT) — **DIAL-authored**; PspAdapter stack (Paynow / ContiPay / EcoCash / PayPal / COD / escrow), not Stripe-as-SoR.

1. List routes/workflows that mutate money or enqueue money side effects.
2. Check each against the checklist below.
3. Output a short report: Critical / High / Medium — **do not auto-fix** unless asked.

## Checklist

### Core money locks

- [ ] Amounts are integer minor units + currency (no float)
- [ ] AI cannot set payable or ledger amounts
- [ ] Mutations go through Temporal/outbox where required
- [ ] PSP adapters only capture; DIAL ledger is SoR
- [ ] No secrets under `NEXT_PUBLIC_` / `VITE_`
- [ ] FDMS path is virtual API (D-40a), not hardware-assumed

### Webhooks as truth + idempotency (agency habit → DIAL)

- [ ] Webhooks: signature verify **and** idempotency key/store before mutate
- [ ] Idempotency key derived from **business operation** (orderId + intent), not random per retry
- [ ] Capture / release / refund driven by **verified webhook** (or explicit poll reconcile) — client redirect is not SoR
- [ ] Duplicate delivery of same PSP event is a no-op (processed_events / equivalent)
- [ ] Reconcile path exists or is ticketed for daily/ops mismatch (ledger vs PSP)

### Agency / WHT / Spare FX touchpoints (when in scope)

- [ ] Marketplace agency only — **no** `DIAL_OWNED` / owned COGS path (**D-58** discarded D-51)
- [ ] Tech payout path respects ITF263 / 30% WHT (D-50) — do not assume WHT disappears
- [ ] Spare browse/cart amounts USD only; ZiG only at checkout from ops daily rate + `fx_rate_id` (D-57)
- [ ] EcoCash/COD checkout uses audited FX path; no silent unaudited bank mid
- [ ] FDMS / e-invoice on **agency** receipt classes `DIAL_FEE` / `GOODS_FORMAL` / `GOODS_INFORMAL` (D-59); WA same `fdms_outbox`
- [ ] In-house Virtual Gateway default — CloudESD only as optional FdmsSigner (D-59)
- [ ] No GMV VAT split-pot; registered goods VAT-inclusive; informal no goods VAT fiscal
- [ ] IMTT never on customer price lines — DIAL opex / `imtt_expense` (D-60)
- [ ] COD settle currency USD; ZiG confirm indicative only (D-60)

## Anti-patterns

- Float amounts; AI-written prices; Medusa/OfferKit/Formance as money SoR
- Trusting return-URL / deep-link success without webhook confirmation
- Installing Stripe-centric agency-agents persona files as project SoR
- Skipping this review on “small” webhook or refund PRs
- Spare PLP/PDP/cart dual-display ZiG; ZiG convert without ops `fx_daily_rates` audit (D-57)
- Scaffolding DIAL-owned principal SKUs / Sold-by-DIAL goods VAT (conflicts **D-58**)

## Authority

v4 §4.1–4.3, §7.1; Agent Pack §2; `.cursor/rules/dial-money-fiscal.mdc`; **D-55** companion; **D-57** Spare FX; **D-58** agency / no owned stock.
