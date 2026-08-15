/**
 * PD16 promotions admin package tests.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  __resetPromoAdminForTests,
  attemptPromoCreditCashOut,
  createPromoCampaign,
  runPd16PromotionsAdminThinVertical,
  runPd72PromoApproveQueueThinVertical,
  runPd87SupplierCoopProposeAckThinVertical,
} from "./admin.js";

test("PD16 thin vertical: PLATFORM/FLASH/REFERRAL + coop approve + fraud + no cash-out", () => {
  const out = runPd16PromotionsAdminThinVertical();
  assert.ok(out.platformId.startsWith("pcamp_"));
  assert.ok(out.flashId.startsWith("pcamp_"));
  assert.ok(out.referralId.startsWith("pcamp_"));
  assert.equal(out.coopStatus, "live");
  assert.equal(out.edgeFraudHeld, true);
  assert.equal(out.cashOutForbidden, true);
  assert.equal(out.budgetUsedMinor, "1200");
  assert.equal(out.campaignStatuses.platform, "active");
  assert.equal(out.campaignStatuses.flash, "active");
  assert.equal(out.campaignStatuses.referral, "active");
  assert.equal(out.campaignStatuses.coop, "active");
});

test("PD16 REFERRAL rejects cash reward kind", () => {
  __resetPromoAdminForTests();
  assert.throws(
    () =>
      createPromoCampaign({
        type: "REFERRAL",
        name: "bad",
        budgetSpendLimitMinor: 100n,
        referral: {
          codePrefix: "X",
          referrerReward: {
            kind: "cash" as "promo_credit",
            amountMinor: 1n,
            currency: "USD",
          },
          refereeReward: {
            kind: "promo_credit",
            amountMinor: 1n,
            currency: "USD",
          },
        },
      }),
    /non_cash/,
  );
});

test("PD16 cash-out always forbidden", () => {
  __resetPromoAdminForTests();
  assert.throws(
    () =>
      attemptPromoCreditCashOut({ customerId: "c1", amountMinor: 100n }),
    /promo_credit_cash_out_forbidden/,
  );
});

test("PD46 coop spend thin vertical — live spend + cash-out blocked", async () => {
  const { runPd46SupplierCoopSpendThinVertical } = await import("./admin.js");
  const out = runPd46SupplierCoopSpendThinVertical();
  assert.equal(out.coopStatus, "live");
  assert.equal(out.cashOutForbidden, true);
  assert.equal(out.payableFromAi, false);
  assert.equal(out.budgetUsedMinor, "1500");
});

test("PD72 promo approve queue thin vertical", () => {
  const out = runPd72PromoApproveQueueThinVertical();
  assert.equal(out.queuedThenCleared, true);
  assert.ok(out.approvedCampaignId);
  assert.equal(out.payableFromAi, false);
  assert.equal(out.cashOutForbidden, true);
});

test("PD87 supplier coop propose → accept → ops live", () => {
  const out = runPd87SupplierCoopProposeAckThinVertical();
  assert.equal(out.afterAccept, "supplier_accepted");
  assert.equal(out.afterOps, "live");
  assert.equal(out.cashOutForbidden, true);
  assert.equal(out.payableFromAi, false);
});
