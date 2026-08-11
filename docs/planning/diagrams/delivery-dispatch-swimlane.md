# Delivery dispatch swimlane (editorial brief)

**Type:** Swimlane / sequence (`dial-diagram-editorial`)  
**Audience:** Eng  
**Locks:** D-44 MapLibre/OSRM/VROOM; D-45 `packages/delivery` + Temporal  
**Must show:** Offer → accept → pickup → POD; FIFO when none  
**Must not show:** Fleetbase as job SoR; Google/Mapbox as distance SoR

```mermaid
sequenceDiagram
  autonumber
  actor Cust as Customer
  participant ERP as packages/delivery
  participant Tw as Temporal DeliveryDispatchWorkflow
  participant Cour as delivery-android (MapLibre)
  participant Admin as admin-web MapLibre

  Cust->>ERP: Create delivery job
  ERP->>Tw: Start workflow
  Tw->>Tw: Eligibility → rank
  alt Couriers available
    Tw->>Cour: Offer job
    alt Accept
      Cour->>Tw: Accept
      Cour->>ERP: Pickup + GPS (MapLibre)
      Admin-->>Admin: Live track
      Cour->>ERP: POD
      Tw->>ERP: Complete
    else Reject / timeout
      Tw->>Tw: Reassign next ranked
    end
  else None available
    Tw->>Tw: FIFO queue wait
    Tw->>Cour: Dequeue on available
  end
  ERP-->>Cust: Realtime status
```

**Focal accent:** Temporal workflow node — job engine SoR.
