# DIAL diagrams — Groceries (food / pantry) + Laundry

**Grocery scope:** Agency grocery vertical — fresh, pantry, beverages (non-liquor), household. **No liquor** (no licence gates, no `T_liq`, no age-at-door liquor paths, no `FLOW_GROCERY` liquor screens).

**Authority (grocery):** `dial-diagram-editorial` (D-55) · plan [`docs/planning/DIAL_Groceries_Liquor_Branch_Plan.md`](../planning/DIAL_Groceries_Liquor_Branch_Plan.md) · grill [`docs/planning/DIAL_Groceries_Liquor_Grill_Session.md`](../planning/DIAL_Groceries_Liquor_Grill_Session.md) (food path only).  
**Upstream habits:** [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) (MIT) — type pick, density ~4/10, one accent, deletion over decoration. **Not vendored** into this repo.

**Audience:** Eng / ops (Plan → tracer).  
**Format:** Mermaid editorial briefs (same pattern as `docs/planning/diagrams/`). HTML+SVG export optional if a personal diagram-design install is available later.

| Diagram | Type | Focal accent | File |
| --- | --- | --- | --- |
| ERP layer stack + Grocery branch | Layer stack | Money packages + ledger | [01-layer-stack-grocery.md](./01-layer-stack-grocery.md) |
| Grocery order → money → escrow | Swimlane / sequence | Job Reserve / webhook | [02-grocery-money-escrow-swimlane.md](./02-grocery-money-escrow-swimlane.md) |
| Grocery delivery + POD / spoilage | Swimlane | Temporal `DeliveryDispatchWorkflow` | [03-grocery-delivery-temporal-swimlane.md](./03-grocery-delivery-temporal-swimlane.md) |
| Catalogue → Meili + D-49 hide | Data flow | B2B formal filter | [04-catalogue-meili-d49.md](./04-catalogue-meili-d49.md) |
| USD browse → ZiG checkout | Sequence | `fx_rate_id` at pay only | [05-fx-usd-browse-zig-checkout.md](./05-fx-usd-browse-zig-checkout.md) |
| WA grocery Flows (food only) | Sequence | Official Cloud API | [06-wa-grocery-flow-food.md](./06-wa-grocery-flow-food.md) |

**Related (core ERP, not grocery-specific):** [`docs/planning/diagrams/`](../planning/diagrams/) — Job Reserve, delivery dispatch, Intelligence Factory / CC, dual-capacity brief.

**Hard locks annotated across this set:** D-58 agency only · amountMinor + DIAL money SoR · AI never writes payable · WA Cloud API only · MapLibre/OSRM SoR · D-49 B2B hide informal · D-57 USD browse / ZiG at pay · delivery fee = `DIAL_FEE` · Harare metro · packed fixed weights MVP.

---

## Dial Laundry (agency — pickup / wash / return)

**Scope:** Partner laundries / home washers — service catalogue + textile SLA. **No** Dial-owned wash plants. Cold-chain N/A.  
**Authority:** plan [`docs/planning/DIAL_Laundry_Branch_Plan.md`](../planning/DIAL_Laundry_Branch_Plan.md) · grill [`docs/planning/DIAL_Laundry_Grill_Session.md`](../planning/DIAL_Laundry_Grill_Session.md).

| Diagram | Type | Focal accent | File |
| --- | --- | --- | --- |
| ERP layer stack + Laundry branch | Layer stack | Money packages + ledger | [01-layer-stack-laundry.md](./01-layer-stack-laundry.md) |
| Laundry order → money → SLA | Swimlane / sequence | Job Reserve / webhook + pickup→wash→return | [02-laundry-order-money-sla-swimlane.md](./02-laundry-order-money-sla-swimlane.md) |
