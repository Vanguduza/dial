/**
 * @dial/promotions — domain types
 *
 * Conceptual sources (MIT pattern mining, not runtime deps):
 * - Medusa Promotion Module (application methods, rules, budgets, computeActions)
 * - OfferKit (referrals, stackable redeem, credit ledger, validation traces)
 *
 * Authority: DIAL_Promotions_Package_Design.md (D-42), v4 §4.1.1 (D-41a)
 */

export type Currency = 'USD' | 'ZWG'
export type Vertical = 'spare' | 'tech' | 'care' | 'fleet'

export type PromoCampaignType = 'PLATFORM' | 'FLASH' | 'REFERRAL' | 'SUPPLIER_COOP'
export type PromotionType = 'standard' | 'buyget'
export type PromotionStatus = 'draft' | 'active' | 'paused' | 'expired' | 'archived'
export type TriggerMode = 'code' | 'automatic' | 'referral_conversion'

export type ApplicationMethodType = 'percentage' | 'fixed'
export type TargetType = 'items' | 'delivery' | 'order' | 'service_fee' | 'job_reserve'
export type Allocation = 'each' | 'across' | 'once'
export type StackingMode = 'exclusive' | 'stackable'

export type RuleOperator = 'eq' | 'ne' | 'in' | 'nin' | 'gt' | 'gte' | 'lt' | 'lte'
export type BudgetKind = 'spend' | 'usage' | 'use_by_attribute'

export interface PromoRule {
  attribute: string
  operator: RuleOperator
  values: string[]
}

export interface ApplicationMethod {
  type: ApplicationMethodType
  targetType: TargetType
  allocation: Allocation
  /** Percent 0–100 or minor units when fixed */
  value: number
  currency?: Currency
  maxDiscountMinor?: bigint
  maxQuantity?: number
}

export interface CampaignBudget {
  kind: BudgetKind
  limit: bigint
  used: bigint
  currency?: Currency
  attribute?: 'customer_id' | 'customer_phone' | 'supplier_id'
}

export interface PromoCampaign {
  id: string
  type: PromoCampaignType
  name: string
  status: PromotionStatus
  verticals: Vertical[]
  stackingMode: StackingMode
  priority: number
  startsAt: Date
  endsAt: Date | null
  budgets: CampaignBudget[]
}

export interface Promotion {
  id: string
  campaignId: string
  code: string | null
  type: PromotionType
  trigger: TriggerMode
  status: PromotionStatus
  applicationMethod: ApplicationMethod
  rules: PromoRule[]
  /** OfferKit-style optional JSON Logic segment id */
  segmentId: string | null
}

export interface ReferralProgram {
  campaignId: string
  codePrefix: string
  attributionWindowDays: number
  referrerReward: ReferralReward
  refereeReward: ReferralReward
  maxReferralsPerReferrerMonth: number
}

export type ReferralReward =
  | { kind: 'promo_credit'; amountMinor: bigint; currency: Currency }
  | { kind: 'percent_service_fee'; percent: number; maxMinor?: bigint }

export interface SupplierCoopAgreement {
  campaignId: string
  supplierId: string
  offerIds: string[]
  supplierFundShareBps: number
  dialFundShareBps: number
  floorNetMinor?: bigint
  status:
    | 'proposed'
    | 'supplier_accepted'
    | 'ops_approved'
    | 'live'
    | 'ended'
    | 'rejected'
}

export interface PromoLineItem {
  lineId: string
  offerId?: string
  masterProductId?: string
  supplierId?: string
  quantity: number
  unitAmountMinor: bigint
  isDiscountable: boolean
}

export interface PromoContext {
  vertical: Vertical
  currency: Currency
  customerId: string
  codes: string[]
  items: PromoLineItem[]
  deliveryAmountMinor?: bigint
  serviceFeeMinor?: bigint
  jobReserveDiscountableMinor?: bigint
  subtotalMinor: bigint
  metadata?: Record<string, string>
}

export type FundParty =
  | { party: 'dial'; amountMinor: bigint }
  | { party: 'supplier'; supplierId: string; amountMinor: bigint }

export type PromoAction =
  | {
      action: 'addItemAdjustment'
      lineId: string
      amountMinor: bigint
      promotionId: string
      campaignId: string
      fundedBy: FundParty[]
    }
  | {
      action:
        | 'addDeliveryAdjustment'
        | 'addOrderAdjustment'
        | 'addServiceFeeAdjustment'
        | 'addJobReserveAdjustment'
      amountMinor: bigint
      promotionId: string
      campaignId: string
      fundedBy: FundParty[]
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
      reason: string
    }

export interface ComputeActionsResult {
  actions: PromoAction[]
  trace: Array<{ step: string; detail: string }>
}

export interface RedeemInput {
  idempotencyKey: string
  orderId?: string
  jobId?: string
  customerId: string
  actions: PromoAction[]
}

export interface PromoCreditBalance {
  customerId: string
  balanceMinor: bigint
  currency: Currency
  expiresAt: Date | null
}
