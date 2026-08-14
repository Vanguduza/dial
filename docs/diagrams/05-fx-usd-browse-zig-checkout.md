# FX — USD browse → ZiG at grocery checkout (D-57)

**Type:** Sequence (`dial-diagram-editorial`)  
**Audience:** Eng / ops  
**Scope:** Grocery food/pantry surfaces (web + WA parity)  
**Locks:** D-57 Spare FX pattern applied to grocery; D-60 COD USD + EcoCash buttons; ops-audited daily rate  
**Must show:** Browse/cart USD only; conversion only at pay; `fx_rate_id` freeze; EcoCash \| COD CTAs  
**Must not show:** Dual-display ZiG on PLP/cart; free-text pay method; AI inventing FX

```mermaid
sequenceDiagram
  autonumber
  actor Cust as Customer
  participant UI as /grocery or WA Flow
  participant Cat as catalogue / Meili
  participant Cart as cart API
  participant Ops as admin Daily ZiG rate
  participant Pay as packages/payments
  participant PSP as EcoCash / COD

  Ops->>Pay: setDailyZigRate → fx_daily_rates audit
  Cust->>UI: Browse / search
  UI->>Cat: Query grocery_offers_v1
  Cat-->>UI: priceMinor USD only
  Cust->>Cart: Add packed lines
  Cart-->>UI: Cart totals USD (amountMinor)
  Cust->>UI: Checkout review (USD + Sold by)
  Cust->>UI: Pay CTA EcoCash or COD
  alt EcoCash
    UI->>Pay: createCheckoutPayment + fx_rate_id
    Pay->>Pay: Convert payable ZiG from daily rate
    Pay->>PSP: Collect ZiG
    Note over Pay: Ledger keeps USD legs<br/>+ fx_rate_id evidence
  else COD
    UI->>Pay: COD intent USD settle
    Pay-->>UI: Indicative ZiG optional on confirm
  end
  PSP->>Pay: Verified webhook / POD reconcile
```

**Surface rules**

| Step | Currency |
| --- | --- |
| Meili / PLP / PDP / cart | **USD only** |
| Review screen | USD totals + agency disclosure |
| EcoCash pay | **ZiG** from ops daily rate |
| COD | **USD** settle; ZiG indicative only |
| IMTT | DIAL opex — never a checkout line |

**Focal accent:** `fx_rate_id` at pay step.  
**Lock callouts:** Same ERP APIs for WA; buttons/CTAs required — not free-text method entry.
