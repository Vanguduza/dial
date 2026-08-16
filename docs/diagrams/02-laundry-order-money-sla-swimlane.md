# Laundry order → money → textile SLA (pickup / wash / return)

**Type:** Swimlane / sequence (`dial-diagram-editorial`)  
**Audience:** Eng / ops  
**Scope:** Agency laundry checkout + multi-phase SLA — cold-chain N/A  
**Locks:** amountMinor; webhook-as-truth; D-58; D-59 FDMS; D-60 IMTT opex + COD USD; recommended `DIAL_FEE`; escrow rule (laundry)  
**Must show:** OfferSnapshot freeze → direct vs Job Reserve → verified webhook → ledger → FDMS → pickup → in_plant → return POD  
**Must not show:** AI writing capture amounts; client return URL as truth; Dial-owned plant as inventory SoR

```mermaid
sequenceDiagram
  autonumber
  actor Cust as Customer
  participant GW as gateway-web /laundry
  participant Cat as catalogue
  participant Prc as pricing engine
  participant Pay as packages/payments
  participant PSP as PspAdapter
  participant Led as ledger
  participant Tax as tax / FDMS
  participant Del as delivery + Temporal
  participant Plant as Partner laundry

  Cust->>GW: Cart USD lines (amountMinor)
  GW->>Cat: assertB2bMayPurchase (D-49)
  GW->>Prc: Quote DIAL_FEE (pickup + return)
  Note over Prc: Deterministic engine only<br/>AI never writes payable
  GW->>Pay: freeze OfferSnapshot(s) + fee + promo
  alt COD
    Pay->>Pay: COD intent (USD settle at return POD)
  else EcoCash / card AND single laundry AND total under T
    Pay->>PSP: createCheckoutPayment (direct)
  else Multi-laundry OR total ≥ T (provisional T=5000)
    Pay->>PSP: authorizeJobReserve (escrow)
  end
  Cust-->>PSP: Client action (not truth)
  PSP->>Pay: Verified webhook + idempotency
  Pay->>Led: Journal amountMinor legs
  Pay->>Tax: DIAL_FEE + supplier class strategy outbox
  Pay->>Del: createDeliveryJob + pickup/return slots
  Del->>Cust: Pickup window
  Del->>Plant: Intake checklist (photo/count)
  Plant-->>Del: in_plant / ready
  Del->>Cust: Return window → return POD
  Note over Del,Plant: Textile risk: supplier until return POD<br/>Dial-caused logistics fail → Dial
```

### Escrow decision (recommended — grill L-6)

| Condition | Path |
| --- | --- |
| COD | Direct COD intent → return POD reconcile (D-60) |
| EcoCash / card, single laundry, total **< T** | Direct capture |
| Multi-laundry **OR** total **≥ T** | Job Reserve / escrow |
| High-value / delicate ≥ **T_hv** | Prefer escrow |

**Provisional T / T_hv:** 5000 / 10000 USD minor — ops-tunable config, not statute.  
**Focal accent:** verified webhook → ledger; SLA phases after money truth.  
**After capture:** supplier payables + `DIAL_FEE` revenue; IMTT = DIAL opex (never customer line).
