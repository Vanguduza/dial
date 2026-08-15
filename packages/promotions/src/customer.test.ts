/**
 * PD21 customer promo / referral package tests (D-42).
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  attemptCustomerPromoCashOut,
  runPd21CustomerMobilePromoThinVertical,
  runPd70CustomerPromoBalanceThinVertical,
  validatePromoCode,
  __resetPromoCustomerForTests,
} from "./customer.js";

test("PD21 thin vertical: promo code draft + referral share + no cash-out", () => {
  const out = runPd21CustomerMobilePromoThinVertical();
  assert.equal(out.code, "SPARE10");
  assert.equal(out.draftDiscountPercent, 10);
  assert.equal(out.payableFromAi, false);
  assert.equal(out.cashOutForbidden, true);
  assert.ok(out.shareCode.startsWith("PD21-"));
  assert.equal(out.refereeBalanceMinor, "300");
  assert.deepEqual(out.channels, ["android", "ios"]);
  assert.equal(out.noExpo, true);
});

test("PD70 customer promo credit balance", () => {
  const out = runPd70CustomerPromoBalanceThinVertical();
  assert.equal(out.balanceMinor, "1500");
  assert.equal(out.cashOutForbidden, true);
  assert.equal(out.currency, "USD");
  assert.equal(out.payableFromAi, false);
});

test("PD21 unknown code rejected; cash-out always forbidden", () => {
  __resetPromoCustomerForTests();
  const bad = validatePromoCode({ code: "NOPE" });
  assert.equal(bad.ok, false);
  assert.equal(bad.cashOutAllowed, false);
  assert.throws(
    () => attemptCustomerPromoCashOut({ customerId: "c1", amountMinor: 1n }),
    /promo_credit_cash_out_forbidden/,
  );
});
