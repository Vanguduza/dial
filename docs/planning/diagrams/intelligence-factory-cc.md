# Intelligence Factory loop + Command Centre Actual vs Simulated (editorial brief)

**Type:** Loop + quadrant callout (`dial-diagram-editorial`)  
**Audience:** Eng / ops  
**Locks:** D-54 — human+Promptfoo promote; Simulated never auto-pays; MetricContract  
**Bonus diagram** (with money / delivery / dual-capacity set)

```mermaid
flowchart LR
  O[Outcomes / corrections] --> D[Outcome-weighted datasets]
  D --> S[Shadow runs]
  S --> P[Promptfoo gates]
  P --> H[Human promote]
  H --> Prod[Production capability / checklist]
  Prod --> O

  P -->|fail| S
```

```mermaid
quadrantChart
  title Command Centre control plane
  x-axis Observe --> Control
  y-axis Simulated --> Actual
  quadrant-1 Actual control — money rails OK with AuthZ
  quadrant-2 Simulated control — FORBIDDEN auto-pay
  quadrant-3 Simulated observe — watermark only
  quadrant-4 Actual observe — MetricContract KPIs
```

**Lock callouts:** no silent auto-publish; Simulated watermark; every KPI has `MetricContract`; AI never writes payable amounts.
