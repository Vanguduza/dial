# Dual capacity — MARKETPLACE vs DIAL_OWNED (editorial brief)

**Type:** Nested / venn-style flowchart (`dial-diagram-editorial`)  
**Audience:** Eng / counsel / ops  
**Locks:** D-49 agency default; D-51 owned principal SKUs only  
**Must show:** Separate COGS/inventory; seller disclosure; no marketplace-wide flip  
**Must not show:** Informal→B2B visibility; mixing owned title with agency escrow

```mermaid
flowchart TB
  subgraph Checkout["Checkout disclosure"]
    D1["Sold by {Supplier}"]
    D2["Sold by DIAL"]
  end

  OS["offerSource"]

  OS -->|MARKETPLACE| AG["Agency track D-49"]
  OS -->|DIAL_OWNED| PR["Principal track D-51"]

  AG --> A1["Supplier title"]
  AG --> A2["DIAL fee / commission"]
  AG --> A3["Escrow allocation tables"]
  AG --> A4["Registered: VAT-inclusive goods"]
  AG --> A5["Informal: no goods VAT line"]
  AG --> A6["B2B: hide informal at Meili/APIs"]
  AG --> D1

  PR --> P1["DIAL title"]
  PR --> P2["Goods VAT + FDMS in DIAL name"]
  PR --> P3["owned_stock_* + COGS ledger"]
  PR --> P4["Visible B2B + B2C"]
  PR --> D2

  A3 -.-x P3
```

**Focal accent:** `DIAL_OWNED` + ring-fenced COGS — never reuse agency escrow tables for title.  
**OPEN (not shown as settled):** D-2 counsel may require entity split — product default remains same entity + cost centre until counsel says otherwise.
