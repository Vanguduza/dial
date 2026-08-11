# Job Reserve state machine (editorial brief)

**Type:** State machine (`dial-diagram-editorial`)  
**Audience:** Eng / ops  
**Locks:** C-4, amountMinor, webhook-as-truth, AI never writes money  
**Must show:** PSP holds float; DIAL ledger; webhooks as truth  
**Must not show:** Medusa/OfferKit as money SoR; AI writing capture amounts

```mermaid
stateDiagram-v2
  [*] --> Draft: pricing engine quote\n(amountMinor)
  Draft --> Authorized: PSP escrow auth\n(client redirect ≠ truth)
  Authorized --> Captured: verified webhook\ncapture + idempotency
  Authorized --> Released: cancel / fail\nverified webhook
  Captured --> Settled: payout instruction\n→ supplier/tech (WHT gate)
  Captured --> Refunded: verified refund webhook
  Released --> [*]
  Settled --> [*]
  Refunded --> [*]

  note right of Authorized
    DIAL ledger SoR
    PSP holds float (C-4)
  end note
  note right of Settled
    Tech: ITF263 or 30% WHT (D-50)
    Owned vs agency split (D-51)
  end note
```

**Focal accent:** `Captured` / webhook edge — never trust return URL alone.
