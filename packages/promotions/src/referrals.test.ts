import assert from "node:assert/strict";
import { test } from "node:test";
import { formatReferralCode, assertReferralRewardNonCash } from "./referrals.js";

test("formatReferralCode builds prefixed code", () => {
  assert.equal(formatReferralCode("DIAL", "ab12"), "DIAL-AB12");
});

test("assertReferralRewardNonCash accepts promo_credit", () => {
  assert.doesNotThrow(() =>
    assertReferralRewardNonCash({
      kind: "promo_credit",
      amountMinor: 500n,
      currency: "USD",
    }),
  );
});

test("assertReferralRewardNonCash rejects cash-out", () => {
  assert.throws(
    () =>
      assertReferralRewardNonCash({
        kind: "cash" as "promo_credit",
        amountMinor: 1n,
        currency: "USD",
      }),
    /non_cash/,
  );
});
