# ERP layer stack — Grocery branch (food / pantry)

**Type:** Layer stack (`dial-diagram-editorial` ← diagram-design)  
**Audience:** Eng  
**Scope:** Groceries **without liquor** — absorb into existing catalogue / payments / delivery / tax SoR  
**Locks:** D-58 agency; C-5 no Expo; D-44 maps; D-45 Temporal delivery; D-40 WA Cloud API only  
**Must show:** Grocery as Shop vertical on shared packages — not a parallel OMS/money SoR  
**Must not show:** `DIAL_OWNED` / principal stock; Medusa/Fleetbase as SoR; liquor licence layer

```mermaid
flowchart TB
  subgraph Surfaces["Surfaces"]
    direction LR
    GW["gateway-web<br/>/spare · /grocery · /tech"]
    NAT["customer-android / ios<br/>native — no Expo"]
    WA["adapter-whatsapp<br/>Cloud API Flows"]
    ADM["admin-web · MapLibre"]
  end

  subgraph Packages["packages/* — shared ERP"]
    direction TB
    CAT["catalogue<br/>+ grocery_offers path"]
    PAY["payments · Job Reserve"]
    LED["ledger"]
    DEL["delivery + Temporal"]
    TAX["tax · FDMS Virtual Gateway"]
    PRC["pricing engine<br/>DIAL_FEE"]
    PRO["promotions"]
    AI["ai drafts only"]
  end

  subgraph Infra["Infra"]
    direction LR
    PG["Postgres SoR"]
    ME["Meili grocery_offers_v1"]
    TW["Temporal"]
    OB["outbox"]
    MAP["Nominatim / OSRM / VROOM"]
  end

  Surfaces --> Packages
  Packages --> Infra

  CAT -.->|food / pantry<br/>MARKETPLACE only| ME
  PAY -.->|amountMinor| LED
  DEL -.-> TW
  TAX -.-> OB
```

**Node / edge inventory**

| Layer | Nodes | Grocery note |
| --- | --- | --- |
| Surfaces | gateway-web, native, WA, admin | `/grocery/*` Shop tab; Harare metro |
| Packages | catalogue, payments, ledger, delivery, tax, pricing, promotions, ai | Grocery **reuses** E1a money spine; fee = `DIAL_FEE` |
| Infra | Postgres, Meili, Temporal, outbox, OSRM | Separate `grocery_offers_v1` index; same Temporal workflow |

**Focal accent:** `payments · Job Reserve` + `ledger` — money SoR stays DIAL packages.  
**Lock callouts:** AI drafts only (never payable); no Baileys; MapLibre client ≠ distance SoR.
