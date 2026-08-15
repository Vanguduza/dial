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
export {
  __resetPromoAdminForTests,
  acceptSupplierCoop,
  activatePromoCampaign,
  approveSupplierCoop,
  attachReferralForAdmin,
  attemptPromoCreditCashOut,
  createPromoCampaign,
  getPromoCampaign,
  listPromoAdminSnapshot,
  placeFraudHold,
  proposeSupplierCoop,
  recordBudgetUsage,
  recordCoopSpend,
  listCoopAgreementsForSupplier,
  rejectSupplierCoop,
  releaseFraudHold,
  runPd16PromotionsAdminThinVertical,
  runPd46SupplierCoopSpendThinVertical,
  type FraudHoldStatus,
  type PromoAdminSnapshot,
  type ReferralEdgeAdmin,
} from './admin.js'
export {
  __resetPromoCustomerForTests,
  applyPromoCodeDraft,
  attachReferralAsCustomer,
  attemptCustomerPromoCashOut,
  getAppliedPromoDraft,
  getPromoCreditBalance,
  grantPromoCredit,
  registerPromoCode,
  runPd21CustomerMobilePromoThinVertical,
  runPd70CustomerPromoBalanceThinVertical,
  shareReferral,
  validatePromoCode,
  type PromoCodeReject,
  type PromoCodeValidation,
  type PromoCreditBalance,
  type ReferralSharePayload,
} from './customer.js'
