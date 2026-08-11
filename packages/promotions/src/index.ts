/**
 * @dial/promotions
 *
 * Combined Medusa + OfferKit patterns in-process.
 * See DIAL_Promotions_Package_Design.md (D-42).
 */

export * from './types.js'
export {
  computeActions,
  dialOnlyCoop,
  type PromotionRepository,
  type CoopFundingResolver,
} from './compute-actions.js'
export {
  formatReferralCode,
  validateReferralAttach,
  creditGrantMinor,
  assertReferralRewardNonCash,
} from './referrals.js'
export {
  assertCoopShares,
  splitCoopFunding,
  respectsFloor,
} from './supplier-coop.js'
