/**
 * OfferKit-shaped referral helpers — rewards always land as non-cash promo_credit.
 * Fraud graph checks belong in ERP (shared device/phone/payout) before grant.
 */

import type { ReferralProgram, ReferralReward, Currency } from './types.js'

export function formatReferralCode(prefix: string, raw: string): string {
  const clean = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const p = prefix.endsWith('-') ? prefix : `${prefix}-`
  return `${p}${clean}`
}

export function assertReferralRewardNonCash(reward: ReferralReward): void {
  if (reward.kind !== 'promo_credit' && reward.kind !== 'percent_service_fee') {
    throw new Error('referral_reward_must_be_non_cash')
  }
}

export interface ReferralAttachInput {
  program: ReferralProgram
  referrerCustomerId: string
  refereeCustomerId: string
  code: string
  now?: Date
}

export type ReferralAttachResult =
  | { ok: true; edgeId: string }
  | { ok: false; reason: string }

/**
 * Pure validation before persistence. Does not grant credit — redeem path does after paid job.
 */
export function validateReferralAttach(input: ReferralAttachInput): ReferralAttachResult {
  const { program, referrerCustomerId, refereeCustomerId, code } = input
  if (referrerCustomerId === refereeCustomerId) {
    return { ok: false, reason: 'self_referral' }
  }
  const expectedPrefix = program.codePrefix.endsWith('-')
    ? program.codePrefix
    : `${program.codePrefix}-`
  if (!code.toUpperCase().startsWith(expectedPrefix.toUpperCase())) {
    return { ok: false, reason: 'invalid_prefix' }
  }
  assertReferralRewardNonCash(program.referrerReward)
  assertReferralRewardNonCash(program.refereeReward)
  return { ok: true, edgeId: 'pending' }
}

export function creditGrantMinor(
  reward: ReferralReward,
  serviceFeeMinor: bigint,
): { amountMinor: bigint; currency?: Currency } {
  if (reward.kind === 'promo_credit') {
    return { amountMinor: reward.amountMinor, currency: reward.currency }
  }
  let amount = (serviceFeeMinor * BigInt(reward.percent)) / 100n
  if (reward.maxMinor !== undefined && amount > reward.maxMinor) amount = reward.maxMinor
  return { amountMinor: amount }
}
