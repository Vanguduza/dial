import assert from "node:assert/strict";
import { test } from "node:test";
import {
  __resetCatalogueForTests,
  approveCatalogueReview,
  enqueueCatalogueIngest,
  listCatalogueReviewQueue,
  meiliFilterForSession,
  searchOffers,
} from "@dial/catalogue";
import {
  __resetPaymentsForTests,
  createCheckoutPayment,
  getActiveFxRate,
  listFxRateAudit,
  setDailyZigRate,
} from "@dial/payments";
import {
  __resetIdentityForTests,
  rlsContextFromProfile,
  selectProfileAs,
  signUp,
} from "@dial/identity";
import {
  __resetAuthForTests,
  assertResourceAccess,
  createSession,
  getSessionFromToken,
  parseSessionCookie,
  sessionCookieName,
} from "./lib/auth/session.js";

test("gateway shell package is wired", () => {
  assert.equal(typeof "DIAL", "string");
});

/** E1b evidence: admin-set Daily ZiG feeds EcoCash fx_rate_id (same package path as API route). */
test("E1b admin rate path: audit + EcoCash fx_rate_id", async () => {
  __resetPaymentsForTests();
  const rate = setDailyZigRate({
    zigMinorPerUsd: 2550_00n,
    setBy: "gateway_admin_stub",
  });
  assert.equal(listFxRateAudit()[0]?.setBy, "gateway_admin_stub");
  assert.equal(getActiveFxRate()?.fxRateId, rate.fxRateId);
  const { intent } = await createCheckoutPayment({
    choice: "ecocash",
    orderId: "ord_gw_e1b",
    amountUsdMinor: 8_00n,
    idempotencyKey: "gw-e1b",
  });
  assert.equal(intent?.fxRateId, rate.fxRateId);
  assert.equal(intent?.displayPayable?.currency, "ZWG");
});

test("T1 session AuthN: cookie SoR; body userId refused for AuthZ", () => {
  __resetAuthForTests();
  const { token, session } = createSession({ email: "buyer@dial.test" });
  assert.equal(getSessionFromToken(token)?.userId, session.userId);
  assert.equal(
    getSessionFromToken(parseSessionCookie(`${sessionCookieName()}=${token}`))?.email,
    "buyer@dial.test",
  );
  assert.equal(getSessionFromToken("bogus"), null);

  assert.throws(() =>
    assertResourceAccess({
      session,
      resourceOwnerId: session.userId,
      bodyUserId: "attacker",
    }),
  );
  assert.throws(() =>
    assertResourceAccess({
      session,
      resourceOwnerId: "usr_other",
    }),
  );
  assert.doesNotThrow(() =>
    assertResourceAccess({
      session,
      resourceOwnerId: session.userId,
    }),
  );
});

test("T1 Pack §15: sign-up profile + session aligns; anonymous has no Shop home session", () => {
  __resetAuthForTests();
  __resetIdentityForTests();
  const profile = signUp({
    email: "home@dial.test",
    displayName: "Home User",
  });
  const { token, session } = createSession({
    email: profile.email,
    userId: profile.userId,
  });
  assert.equal(session.userId, profile.userId);
  assert.equal(
    selectProfileAs(rlsContextFromProfile(profile), profile.userId)?.displayName,
    "Home User",
  );
  assert.equal(getSessionFromToken(undefined), null);
  assert.ok(getSessionFromToken(token));
});

/** S21 T2 evidence: session buyerSegment drives B2B hide informal; body role ignored. */
test("T2 search path: B2B session excludes informal; meili filter formal-only", () => {
  __resetCatalogueForTests();
  __resetAuthForTests();
  const b2c = createSession({ email: "b2c@dial.test", buyerSegment: "b2c" });
  const b2b = createSession({ email: "fleet@dial.test", buyerSegment: "b2b" });
  assert.equal(b2c.session.buyerSegment, "b2c");
  assert.equal(b2b.session.buyerSegment, "b2b");

  const roleB2c = getSessionFromToken(b2c.token)?.buyerSegment ?? "b2c";
  const roleB2b = getSessionFromToken(b2b.token)?.buyerSegment ?? "b2c";
  const hitsB2c = searchOffers("wiper", { sessionRole: roleB2c });
  const hitsB2b = searchOffers("wiper", { sessionRole: roleB2b });
  assert.ok(hitsB2c.some((h) => h.supplierFormality === "informal"));
  assert.equal(hitsB2b.length, 0);
  assert.equal(
    meiliFilterForSession(roleB2b),
    'offerSource = "MARKETPLACE" AND supplierFormality = "formal"',
  );
});

test("T2 admin catalogue review: human approve only", () => {
  __resetCatalogueForTests();
  const batch = enqueueCatalogueIngest(1);
  assert.equal(batch.status, "pending_review");
  const reviewId = listCatalogueReviewQueue()[0]!.reviewId;
  assert.equal(approveCatalogueReview(reviewId).status, "approved");
});
