# DIAL Promotions Package Design — v1.0

**Companion to `DIAL_Consolidated_Plan_v4.md` §4.1.1.** Locked by **D-41a** + **D-42**.

**Doctrine:** DIAL owns promotions **inside** `packages/promotions`. We **do not** run OfferKit or Medusa as a second money/pricing SoR. We **combine their best models** (MIT pattern mining) into DIAL’s deterministic pricing engine and ledger.  
**Agent hygiene:** money/IDOR Cursor rules are **D-47** — see `DIAL_Cursor_Rules_and_Skills.md` and `.cursor/rules/dial-promotions.mdc`.

| Source | What we take | What we leave |
| --- | --- | --- |
| **Medusa Promotion Module** (MIT) | `Promotion` + `ApplicationMethod` + rules/operators; `Campaign` + spend/usage/attribute budgets; **`computeActions`** → adjustments; stacking on *remaining* amount; `standard` + `buyget`; auto vs code | Medusa cart/order modules as runtime; Medusa DB as SoR |
| **OfferKit** (MIT) | Dual-reward **referrals**; stackable multi-code redeem with **idempotency**; voucher instance limits; **credit/points ledger** pattern (mapped to non-cash `promo_credit`); JSON Logic **segments**; redemption **validation traces**; mutation **audit log** | OfferKit gift-card cash semantics; OfferKit as deployed sidecar for payable amounts; MCP as required launch surface |
| **DIAL-native** | `SUPPLIER_COOP` funding split; vertical scope (spare/tech/care/fleet); fraud graph (§2B-30); `price_quotes` logged components; WhatsApp Flows apply; restricted-SKU immunity | — |

---

## 1. Integration shape

```text
Cart / Job quote context
        │
        ▼
packages/pricing  ──calls──►  packages/promotions.computeActions(...)
        │                              │
        │                              ├─ evaluate rules + budgets
        │                              ├─ referrals / credits
        │                              └─ supplier coop floors
        ▼
price_quotes row (every component logged, incl. promo_*)
        │
        ▼
orders / job_reserves / ledger  (promo_credit never cash-out)
```

Hard rules (unchanged from v4):

1. Only `packages/pricing` may produce payable amounts.  
2. Promotions return **actions/adjustments**, never a final opaque total.  
3. Promotional credit is **never redeemable to cash** (§2B-30).  
4. Idempotency-Key on every redeem / credit grant / coop accrual.  
5. AI never invents discount amounts.

---

## 2. Feature matrix (combined MVP)

| Feature | Medusa | OfferKit | DIAL MVP |
| --- | --- | --- | --- |
| % / fixed discount | ✓ | ✓ | ✓ |
| Target: items / shipping / order (fee) | ✓ | partial | ✓ (`items` \| `delivery` \| `order` \| `service_fee` \| `job_reserve`) |
| Allocation: each / across / once | ✓ | — | ✓ |
| Buy X get Y | ✓ | — | ✓ (Spare flash; optional Tech known-service) |
| Campaign budgets (spend / usage / per-customer) | ✓ | partial | ✓ |
| Attribute rules (`eq` `in` `gte`…) | ✓ | JSON Logic | ✓ both: structured rules + optional JSON Logic segment |
| Auto-apply + code | ✓ | ✓ | ✓ |
| Stackable codes (atomic) | limited | ✓ | ✓ (policy per campaign) |
| Referrals dual-reward | — | ✓ | ✓ (Tech primary) |
| Credit / points ledger | gift card | ✓ | ✓ as `promo_credit` only |
| Supplier co-funded promo | — | — | ✓ `SUPPLIER_COOP` |
| Redemption debug trace | — | ✓ | ✓ |
| Audit log | — | ✓ | ✓ (`audit_events` + promo-specific) |
| Fraud graph on referrals | — | — | ✓ (§2B-30) |

**Parked (not MVP unless budget allows):** full loyalty tiers, gift cards as cash-like store credit, OfferKit MCP in production.

---

## 3. Domain model

### 3.1 Campaign types

```ts
export type PromoCampaignType =
  | 'PLATFORM'       // DIAL-funded
  | 'FLASH'          // time-boxed PLATFORM subset
  | 'REFERRAL'       // dual-reward; Tech primary
  | 'SUPPLIER_COOP'  // supplier ± DIAL funding on Spare SKUs
```

### 3.2 Promotion (Medusa-shaped)

```ts
export type PromotionType = 'standard' | 'buyget'
export type PromotionStatus = 'draft' | 'active' | 'paused' | 'expired' | 'archived'
export type TriggerMode = 'code' | 'automatic' | 'referral_conversion'

export type ApplicationMethodType = 'percentage' | 'fixed'
export type TargetType =
  | 'items'          // Spare line items / parts on a job
  | 'delivery'       // delivery band
  | 'order'          // whole Spare cart
  | 'service_fee'    // DIAL Tech fee
  | 'job_reserve'    // holding amount components that are discountable
export type Allocation = 'each' | 'across' | 'once'
export type StackingMode = 'exclusive' | 'stackable'

export interface ApplicationMethod {
  type: ApplicationMethodType
  targetType: TargetType
  allocation: Allocation
  value: number              // percent 0–100 OR minor units when fixed
  currency?: 'USD' | 'ZWG'   // required when type === 'fixed'
  maxDiscountMinor?: bigint  // cap (OfferKit-style)
  maxQuantity?: number       // Medusa once/each
}

export interface PromoRule {
  attribute: string          // e.g. customer.segment, items.offerId, vertical, fleetId
  operator: 'eq' | 'ne' | 'in' | 'nin' | 'gt' | 'gte' | 'lt' | 'lte'
  values: string[]
}
```

### 3.3 Budgets (Medusa campaigns)

```ts
export type BudgetKind = 'spend' | 'usage' | 'use_by_attribute'

export interface CampaignBudget {
  kind: BudgetKind
  limit: bigint              // spend = minor units; usage = count
  used: bigint
  currency?: 'USD' | 'ZWG'   // spend budgets
  attribute?: 'customer_id' | 'customer_phone' | 'supplier_id'
}
```

### 3.4 Referral (OfferKit-shaped)

```ts
export interface ReferralProgram {
  campaignId: string
  codePrefix: string         // e.g. TECH-
  attributionWindowDays: number
  referrerReward: { kind: 'promo_credit' | 'percent_service_fee'; amountMinor?: bigint; percent?: number }
  refereeReward: { kind: 'promo_credit' | 'percent_service_fee'; amountMinor?: bigint; percent?: number }
  maxReferralsPerReferrerMonth: number
}
```

Rewards always land in `promo_credits` / `promo_credit_ledger` — never PSP payout.

### 3.5 Supplier co-op (DIAL-native)

```ts
export interface SupplierCoopAgreement {
  campaignId: string
  supplierId: string
  offerIds: string[]         // or categoryPath rules
  supplierFundShareBps: number  // 0–10000
  dialFundShareBps: number
  floorNetMinor?: bigint     // cannot price below funded floor
  status: 'proposed' | 'supplier_accepted' | 'ops_approved' | 'live' | 'ended' | 'rejected'
}
```

---

## 4. `computeActions` contract (Medusa core + OfferKit redeem)

```ts
export interface PromoContext {
  vertical: 'spare' | 'tech' | 'care' | 'fleet'
  currency: 'USD' | 'ZWG'
  customerId: string
  codes: string[]                    // may be empty (auto-only)
  items: Array<{
    lineId: string
    offerId?: string
    masterProductId?: string
    supplierId?: string
    quantity: number
    unitAmountMinor: bigint          // pre-promo
    isDiscountable: boolean          // false for restricted SKUs when policy says so
  }>
  deliveryAmountMinor?: bigint
  serviceFeeMinor?: bigint
  jobReserveDiscountableMinor?: bigint
  subtotalMinor: bigint
  metadata?: Record<string, string>
}

export type PromoAction =
  | {
      action: 'addItemAdjustment'
      lineId: string
      amountMinor: bigint            // positive = discount
      promotionId: string
      campaignId: string
      fundedBy: Array<{ party: 'dial' | 'supplier'; supplierId?: string; amountMinor: bigint }>
    }
  | {
      action: 'addDeliveryAdjustment' | 'addOrderAdjustment' | 'addServiceFeeAdjustment' | 'addJobReserveAdjustment'
      amountMinor: bigint
      promotionId: string
      campaignId: string
      fundedBy: Array<{ party: 'dial' | 'supplier'; supplierId?: string; amountMinor: bigint }>
    }
  | {
      action: 'applyPromoCredit'
      amountMinor: bigint
      creditId: string
      promotionId?: string
    }
  | {
      action: 'rejectCode'
      code: string
      reason: string                 // for WA/UI + validation trace
    }

export interface ComputeActionsResult {
  actions: PromoAction[]
  trace: Array<{ step: string; detail: string }>  // OfferKit-style debuggability
}
```

**Stacking algorithm (Medusa):**

1. Expand automatic promotions + validated codes.  
2. Sort: `buyget` first, then `standard`; within type by value desc (or campaign priority).  
3. Apply each against **remaining** line/target amount; never below zero.  
4. Enforce campaign budgets and per-attribute usage.  
5. If any `stackable` set fails mid-way and campaign requires atomic multi-code → rollback all (OfferKit).  
6. Persist tentative holds until order/job paid; commit redemptions on payment webhook.

---

## 5. Postgres tables (canonical)

Extends Agent Pack inventory:

| Table | Role |
| --- | --- |
| `promo_campaigns` | type, status, window, stacking_mode, verticals[], priority |
| `promo_campaign_budgets` | spend/usage/use_by_attribute + used |
| `promo_budget_usages` | per attribute_value used count/spend |
| `promo_promotions` | code?, type standard\|buyget, trigger, status, campaign_id |
| `promo_application_methods` | type, target, allocation, value, currency, caps |
| `promo_rules` | attribute, operator |
| `promo_rule_values` | values[] |
| `promo_segments` | JSON Logic body (OfferKit-style), optional |
| `promo_buyget_rules` | buy qty / get qty / target filters |
| `promo_redemptions` | order_id / job_id, promotion_id, amounts, idempotency_key, trace_json |
| `promo_credits` | customer_id, balance_minor, currency, expires_at |
| `promo_credit_ledger` | append-only grant/spend/expire (no cash-out) |
| `referral_programs` | campaign_id + reward config |
| `referral_codes` | customer_id, code, prefix |
| `referral_edges` | referrer, referee, attributed_at, status, fraud_flags |
| `supplier_coop_agreements` | funding bps, offers, status |
| `promo_validation_traces` | optional hot store for last N rejects (ops) |

Money: `amount_minor bigint`, `currency text`.

---

## 6. Package layout (monorepo)

```text
packages/promotions/
  package.json
  src/
    index.ts
    types.ts
    compute-actions.ts      # pure evaluation
    redeem.ts               # idempotent commit on payment
    referrals.ts
    supplier-coop.ts
    segments.ts             # JSON Logic eval (json-logic-js or equivalent MIT)
    audit.ts
  tests/
    compute-actions.test.ts
    referral-fraud.test.ts
    coop-funding.test.ts
```

Depends on: shared money types, not on Medusa/OfferKit packages at runtime.

**Pattern attribution:** module README cites Medusa Promotion Module + OfferKit as conceptual sources (MIT). No copied GPL/AGPL code.

---

## 7. API surface (ERP)

| Method | Purpose |
| --- | --- |
| `POST /api/v1/promotions/validate` | codes + context → preview actions + trace (no commit) |
| `POST /api/v1/promotions/compute` | used by pricing internally |
| `POST /api/v1/promotions/redeem` | after paid; Idempotency-Key |
| `GET /api/v1/promotions/credits/:customerId` | balance |
| `POST /api/v1/referrals/codes` | ensure code for customer |
| `POST /api/v1/referrals/attach` | referee enters code |
| `POST /api/v1/suppliers/coop` | propose / accept |
| Admin CRUD | campaigns, budgets, approve coop, freeze fraud edges |

WhatsApp: `FLOW_PROMO_APPLY`, `FLOW_REFERRAL_HOME`, `FLOW_SUPPLIER_COOP_ACK` call validate/attach only.

---

## 8. Admin UX notes

- Reuse Medusa Admin mental model: Campaign → Promotions → Conditions → Budget.  
- Add DIAL tabs: Referrals, Supplier co-op approval queue, Credit ledger, Fraud holds.  
- Donor UI: Mercur/admin patterns only — amounts still from DIAL APIs.

---

## 9. Test gates before customer-open

- [ ] Stacking never discounts below zero  
- [ ] Restricted SKU `isDiscountable: false` ignored by item promos  
- [ ] Coop funding shares sum to 10000 bps; statement lines match  
- [ ] Referral self-ref / shared device rejected  
- [ ] Promo credit cannot be paid out via PSP  
- [ ] Idempotent double redeem  
- [ ] Budget exhaustion mid-checkout behaviour documented  
- [ ] FDMS receipt shows post-promo totals only (tax counsel D-2)

---

## 10. Explicit non-goals

- Running `ghcr.io/offerkit/offerkit` as production pricing authority  
- Importing `@medusajs/promotion` as a live dependency (pattern only; avoids Medusa runtime coupling)  
- Cash gift cards / wallet withdrawals  
- AI-generated discount percentages  

---

*End of Promotions Package Design v1.0 — D-42.*
