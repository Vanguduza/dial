/**
 * Supplier co-op funding split (DIAL-native).
 * supplierFundShareBps + dialFundShareBps must equal 10000.
 */

import type { FundParty, SupplierCoopAgreement } from './types.js'

export function assertCoopShares(agreement: SupplierCoopAgreement): void {
  const sum = agreement.supplierFundShareBps + agreement.dialFundShareBps
  if (sum !== 10000) {
    throw new Error(`coop_shares_must_sum_10000_got_${sum}`)
  }
  if (agreement.status !== 'live' && agreement.status !== 'ops_approved') {
    throw new Error(`coop_not_live_${agreement.status}`)
  }
}

export function splitCoopFunding(
  agreement: SupplierCoopAgreement,
  discountMinor: bigint,
): FundParty[] {
  assertCoopShares(agreement)
  const supplierPart =
    (discountMinor * BigInt(agreement.supplierFundShareBps)) / 10000n
  const dialPart = discountMinor - supplierPart
  return [
    { party: 'supplier', supplierId: agreement.supplierId, amountMinor: supplierPart },
    { party: 'dial', amountMinor: dialPart },
  ]
}

export function respectsFloor(
  agreement: SupplierCoopAgreement,
  proposedNetMinor: bigint,
): boolean {
  if (agreement.floorNetMinor === undefined) return true
  return proposedNetMinor >= agreement.floorNetMinor
}
