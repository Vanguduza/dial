# Grocery order → money → escrow (food / pantry)

**Type:** Swimlane / sequence (`dial-diagram-editorial`)  
**Audience:** Eng / ops  
**Scope:** Agency grocery checkout — **no liquor**, no `T_liq`  
**Locks:** amountMinor; webhook-as-truth; D-58; D-59 FDMS; D-60 IMTT opex + COD USD; G-5 `DIAL_FEE`; G-6 escrow rule (food)  
**Must show:** OfferSnapshot freeze → direct vs Job Reserve → verified webhook → ledger → FDMS → delivery job  
**Must not show:** AI writing capture amounts; client return URL as truth; liquor high-ticket escrow path

```mermaid
sequenceDiagram
  autonumber
  actor Cust as Customer
  participant GW as gateway-web /grocery
  participant Cat as catalogue
  participant Prc as pricing engine
  participant Pay as packages/payments
  participant PSP as PspAdapter
  participant Led as ledger
  participant Tax as tax / FDMS
  participant Del as delivery + Temporal

  Cust->>GW: Cart USD lines (amountMinor)
  GW->>Cat: assertB2bMayPurchase (D-49)
  GW->>Prc: Quote DIAL_FEE (band × coldChain × …)
  Note over Prc: Deterministic engine only<br/>AI never writes payable
  GW->>Pay: freeze OfferSnapshot(s) + fee + promo
  alt COD
    Pay->>Pay: COD intent (USD settle)
  else EcoCash / card AND single-vendor AND total under T
    Pay->>PSP: createCheckoutPayment (direct)
  else Multi-vendor OR total ≥ T (provisional T=5000 USD minor)
    Pay->>PSP: authorizeJobReserve (escrow)
  end
  Cust-->>PSP: Client action (not truth)
  PSP->>Pay: Verified webhook + idempotency
  Pay->>Led: Journal amountMinor legs
  Pay->>Tax: GOODS_* + DIAL_FEE outbox
  Pay->>Del: createDeliveryJob + slot bind
```

### Escrow decision (food only — grill G-6 minus liquor)

| Condition | Path |
| --- | --- |
| COD | Direct COD intent → POD reconcile (D-60) |
| EcoCash / card, single vendor, total **< T** | Direct capture |
| Multi-vendor **OR** total **≥ T** | Job Reserve / escrow |
| ~~Liquor ≥ T_liq~~ | **Out of scope** this set |

**Provisional T:** 5000 USD minor ($50.00) — ops-tunable config, not statute.  
**Focal accent:** verified webhook → ledger.  
**After capture:** supplier payables + `DIAL_FEE` revenue; IMTT booked as DIAL opex (never customer line). Spoilage risk: supplier until POD; Dial-caused cold-chain fail → Dial (G-5).
