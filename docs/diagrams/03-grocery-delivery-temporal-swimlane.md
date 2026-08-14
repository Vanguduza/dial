# Grocery delivery Temporal — POD / spoilage (food)

**Type:** Swimlane / sequence (`dial-diagram-editorial`)  
**Audience:** Eng / ops  
**Scope:** Harare metro grocery jobs; cold-chain checklist; **no** liquor age-check-at-door  
**Locks:** D-45 `packages/delivery` + `DeliveryDispatchWorkflow`; D-44 MapLibre/OSRM/VROOM; G-5 spoilage  
**Must show:** Extend existing workflow; cold-chain eligibility; POD + handling checklist; liability fork  
**Must not show:** Fleetbase as job SoR; Google/Mapbox distance SoR; liquor door ID flow

```mermaid
sequenceDiagram
  autonumber
  actor Cust as Customer
  participant ERP as packages/delivery
  participant Tw as Temporal DeliveryDispatchWorkflow
  participant Cour as delivery-android MapLibre
  participant Sup as Supplier merchant
  participant Pay as payments / ledger

  Note over ERP: Paid grocery order<br/>slot bound · coldChainMax set
  ERP->>Tw: Start / continue workflow
  Tw->>Tw: validateColdChainCapacity
  Tw->>Tw: Rank eligible couriers<br/>(canChilled / canFrozen)
  Tw->>Cour: Offer job
  alt Accept
    Cour->>Tw: Accept
    Cour->>Sup: Pickup stops (multi-stop if same band)
    Cour->>ERP: GPS track (MapLibre client)
    Cour->>ERP: POD + handling checklist<br/>(chilled/frozen)
    Tw->>ERP: Complete
    Note over Sup,Pay: Goods risk: supplier until POD
  else Reject / timeout
    Tw->>Tw: Reassign / FIFO
  end

  opt Thaw / damage dispute
    Cust->>ERP: Report + evidence
    ERP->>Pay: Classify liability
    alt Dial-caused cold-chain / delivery fail
      Pay->>Pay: Dial absorb / refund
    else Supplier quality / oversell
      Pay->>Pay: Supplier payable adjust
    end
  end
```

**Activities added on grocery (extend, do not fork SoR)**

| Activity | Role |
| --- | --- |
| `validateColdChainCapacity` | Filter before offer |
| `multiStopPlanVroom` | Multi-supplier same band/slot |
| `recordHandlingChecklist` | Chilled/frozen POD evidence |
| Offer → accept → reassign → FIFO | Unchanged D-45 core |

**Focal accent:** Temporal workflow — job engine SoR.  
**Lock callouts:** MVP checklist ≠ IoT temperature SoR; packed fixed weights only (no catch-weight payable adjust by AI).
