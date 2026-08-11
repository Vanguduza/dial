/**
 * Medusa-style computeActions: evaluate promotions against cart/job context.
 * Returns adjustments only — @dial/pricing applies them into price_quotes.
 *
 * Stacking: buyget → standard; within type by campaign priority then value desc;
 * each promo applies to remaining amount (never below zero).
 */

import type {
  ComputeActionsResult,
  PromoAction,
  PromoContext,
  Promotion,
  PromoCampaign,
  ApplicationMethod,
  FundParty,
} from './types.js'

export interface PromotionRepository {
  listActiveForContext(ctx: PromoContext): Promise<{
    campaigns: PromoCampaign[]
    promotions: Promotion[]
  }>
  resolveCodes(codes: string[]): Promise<Promotion[]>
}

export interface CoopFundingResolver {
  /** Split discount across dial vs supplier for SUPPLIER_COOP lines */
  fund(
    campaignId: string,
    supplierId: string | undefined,
    amountMinor: bigint,
  ): Promise<FundParty[]>
}

function remainingAfter(actions: PromoAction[], lineId: string, original: bigint): bigint {
  let used = 0n
  for (const a of actions) {
    if (a.action === 'addItemAdjustment' && a.lineId === lineId) {
      used += a.amountMinor
    }
  }
  const left = original - used
  return left < 0n ? 0n : left
}

function discountFromMethod(
  method: ApplicationMethod,
  baseMinor: bigint,
): bigint {
  if (baseMinor <= 0n) return 0n
  let raw: bigint
  if (method.type === 'percentage') {
    raw = (baseMinor * BigInt(Math.min(100, Math.max(0, method.value)))) / 100n
  } else {
    raw = BigInt(method.value)
  }
  if (method.maxDiscountMinor !== undefined && raw > method.maxDiscountMinor) {
    raw = method.maxDiscountMinor
  }
  return raw > baseMinor ? baseMinor : raw
}

/**
 * Pure-ish evaluator. Repository/coop are injected for ERP wiring.
 * MVP stub: applies automatic + code promotions with Medusa remaining-amount semantics.
 * Full rule/budget/buyget engines land in subsequent PRs — see design doc §4–5.
 */
export async function computeActions(
  ctx: PromoContext,
  deps: {
    repo: PromotionRepository
    coop: CoopFundingResolver
  },
): Promise<ComputeActionsResult> {
  const trace: ComputeActionsResult['trace'] = []
  const actions: PromoAction[] = []

  const { campaigns, promotions: automatic } = await deps.repo.listActiveForContext(ctx)
  const fromCodes = ctx.codes.length ? await deps.repo.resolveCodes(ctx.codes) : []

  const foundCodes = new Set(fromCodes.map((p) => p.code).filter(Boolean))
  for (const code of ctx.codes) {
    if (!foundCodes.has(code)) {
      actions.push({ action: 'rejectCode', code, reason: 'unknown_or_inactive_code' })
      trace.push({ step: 'resolve_code', detail: `reject ${code}` })
    }
  }

  const campaignById = new Map(campaigns.map((c) => [c.id, c]))
  const candidates = [...automatic, ...fromCodes].filter((p) => p.status === 'active')

  candidates.sort((a, b) => {
    const typeRank = (t: string) => (t === 'buyget' ? 0 : 1)
    const tr = typeRank(a.type) - typeRank(b.type)
    if (tr !== 0) return tr
    const ca = campaignById.get(a.campaignId)?.priority ?? 0
    const cb = campaignById.get(b.campaignId)?.priority ?? 0
    if (cb !== ca) return cb - ca
    return b.applicationMethod.value - a.applicationMethod.value
  })

  trace.push({ step: 'candidates', detail: `${candidates.length} promotions ordered` })

  for (const promo of candidates) {
    const method = promo.applicationMethod
    const campaign = campaignById.get(promo.campaignId)
    if (!campaign || campaign.status !== 'active') continue
    if (!campaign.verticals.includes(ctx.vertical)) continue

    // Rule evaluation + budgets: implement against promo_rules / budgets tables (design §3–5).
    // Segment JSON Logic: optional via promo_segments.

    if (method.targetType === 'items') {
      for (const item of ctx.items) {
        if (!item.isDiscountable) continue
        const base = item.unitAmountMinor * BigInt(item.quantity)
        const left = remainingAfter(actions, item.lineId, base)
        const amount = discountFromMethod(method, left)
        if (amount <= 0n) continue
        const fundedBy = await deps.coop.fund(promo.campaignId, item.supplierId, amount)
        actions.push({
          action: 'addItemAdjustment',
          lineId: item.lineId,
          amountMinor: amount,
          promotionId: promo.id,
          campaignId: promo.campaignId,
          fundedBy,
        })
        trace.push({
          step: 'item_adjustment',
          detail: `${promo.id} line=${item.lineId} -${amount}`,
        })
        if (campaign.stackingMode === 'exclusive') {
          trace.push({ step: 'exclusive', detail: `stop after ${promo.id}` })
          return { actions, trace }
        }
      }
    } else if (method.targetType === 'service_fee' && ctx.serviceFeeMinor !== undefined) {
      const amount = discountFromMethod(method, ctx.serviceFeeMinor)
      if (amount > 0n) {
        actions.push({
          action: 'addServiceFeeAdjustment',
          amountMinor: amount,
          promotionId: promo.id,
          campaignId: promo.campaignId,
          fundedBy: [{ party: 'dial', amountMinor: amount }],
        })
      }
    } else if (method.targetType === 'delivery' && ctx.deliveryAmountMinor !== undefined) {
      const amount = discountFromMethod(method, ctx.deliveryAmountMinor)
      if (amount > 0n) {
        actions.push({
          action: 'addDeliveryAdjustment',
          amountMinor: amount,
          promotionId: promo.id,
          campaignId: promo.campaignId,
          fundedBy: [{ party: 'dial', amountMinor: amount }],
        })
      }
    } else if (method.targetType === 'order') {
      const amount = discountFromMethod(method, ctx.subtotalMinor)
      if (amount > 0n) {
        actions.push({
          action: 'addOrderAdjustment',
          amountMinor: amount,
          promotionId: promo.id,
          campaignId: promo.campaignId,
          fundedBy: [{ party: 'dial', amountMinor: amount }],
        })
      }
    } else if (
      method.targetType === 'job_reserve' &&
      ctx.jobReserveDiscountableMinor !== undefined
    ) {
      const amount = discountFromMethod(method, ctx.jobReserveDiscountableMinor)
      if (amount > 0n) {
        actions.push({
          action: 'addJobReserveAdjustment',
          amountMinor: amount,
          promotionId: promo.id,
          campaignId: promo.campaignId,
          fundedBy: [{ party: 'dial', amountMinor: amount }],
        })
      }
    }
  }

  return { actions, trace }
}

/** Default coop: all dial-funded unless a live SUPPLIER_COOP agreement exists (wired in ERP). */
export const dialOnlyCoop: CoopFundingResolver = {
  async fund(_campaignId, _supplierId, amountMinor) {
    return [{ party: 'dial', amountMinor }]
  },
}
