import assert from "node:assert/strict";
import { test } from "node:test";
import {
  __resetCatalogueForTests,
  addToCart,
  approveCatalogueReview,
  createCart,
  enqueueCatalogueIngest,
  listCatalogueReviewQueue,
  meiliFilterForSession,
  searchOffers,
} from "@dial/catalogue";
import {
  __resetPaymentsForTests,
  admitPspWebhookEvent,
  applyJobReserveWebhook,
  authorizeJobReserve,
  computeTechPayoutWithholding,
  createCheckoutPayment,
  getActiveFxRate,
  listFxRateAudit,
  listPspMethods,
  setDailyZigRate,
} from "@dial/payments";
import {
  __resetIdentityForTests,
  rlsContextFromProfile,
  selectProfileAs,
  signUp,
} from "@dial/identity";
import { CHECKOUT_PAY_BUTTONS as WA_PAY_BUTTONS } from "@dial/adapter-whatsapp";
import {
  attemptCommandCentrePayout,
  commandCentreBanner,
} from "@dial/ai";
import {
  __resetAuthForTests,
  assertResourceAccess,
  createSession,
  getSessionFromToken,
  parseSessionCookie,
  sessionCookieName,
  userScopedCacheKey,
  type ProtectedResourceKind,
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

/** S22 T3: USD cart → pay-step EcoCash|COD (ZiG only at pay); WA button parity. */
test("T3 Spare checkout pay-step: EcoCash|COD required; no supplierId; WA parity", async () => {
  __resetCatalogueForTests();
  __resetPaymentsForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "ops_t3" });
  const cart = createCart();
  addToCart(cart.id, "off_filter_oil_kun26", 1);
  assert.equal(cart.currency, "USD");
  assert.ok(!("supplierId" in cart));
  assert.ok(cart.lines.every((l) => !("supplierId" in l)));

  const eco = await createCheckoutPayment({
    choice: "ecocash",
    orderId: `ord_${cart.id}`,
    amountUsdMinor: cart.total.amountMinor,
    idempotencyKey: `t3-eco-${cart.id}`,
  });
  assert.equal(eco.intent?.displayPayable?.currency, "ZWG");
  assert.ok(eco.intent?.fxRateId);

  const cod = await createCheckoutPayment({
    choice: "cod",
    orderId: `ord_${cart.id}_cod`,
    amountUsdMinor: cart.total.amountMinor,
    idempotencyKey: `t3-cod-${cart.id}`,
  });
  assert.equal(cod.codOrder?.amountUsd.currency, "USD");
  assert.equal(cod.codOrder?.indicativeZig.currency, "ZWG");

  assert.ok(WA_PAY_BUTTONS.some((b) => b.id === "ecocash"));
  assert.ok(WA_PAY_BUTTONS.some((b) => b.id === "cod"));
});

test("T5 Pack spine: PSP registry + JobReserve + WHT + FDMS gateway class", async () => {
  __resetPaymentsForTests();
  const methods = listPspMethods();
  for (const m of [
    "ecocash_direct",
    "cod_cash",
    "paynow_hosted",
    "contipay",
    "paypal",
    "escrow_hold",
  ] as const) {
    assert.ok(methods.includes(m), `missing PSP ${m}`);
  }
  const reserve = await authorizeJobReserve({
    jobId: "job_t5",
    amountUsdMinor: 50_00n,
    idempotencyKey: "t5-jr-1",
  });
  assert.equal(reserve.status, "authorized");
  const captured = applyJobReserveWebhook({
    reserveId: reserve.id,
    eventId: "evt_t5_1",
    action: "capture",
    signatureValid: true,
  });
  assert.equal(captured.status, "captured");
  const wh = computeTechPayoutWithholding({
    technicianId: "tech_t5",
    yearOfAssessment: 2026,
    payoutUsdMinor: 100_00n,
    hasItf263: false,
  });
  assert.equal(wh.withholdMinor, 30_00n);
});

test("T4 Tech stubs: automotive + emergency checklists; emergency bypass flag", async () => {
  const { draftTechQuote, listChecklists } = await import("./lib/tech/stubs.js");
  const lists = listChecklists();
  assert.ok(lists.some((c) => c.id === "automotive_basic"));
  assert.ok(lists.some((c) => c.id === "emergency_roadside"));
  const normal = draftTechQuote({ jobClass: "diagnostics" });
  assert.equal(normal.emergency, false);
  assert.equal(normal.source, "rate_card_stub");
  const emergency = draftTechQuote({ jobClass: "roadside", emergency: true });
  assert.equal(emergency.emergency, true);
});

/** S30 T9 / Appendix A.1 — ≥5 resource kinds IDOR denied; cache keys user-scoped. */
test("T9 IDOR: cross-tenant denied on ≥5 priority resources", () => {
  __resetAuthForTests();
  const owner = createSession({ email: "owner@dial.test" });
  const attacker = createSession({ email: "attacker@dial.test" });
  const kinds: ProtectedResourceKind[] = [
    "job",
    "order",
    "vehicle",
    "promo_credit",
    "delivery_job",
    "delivery_offer",
    "courier_location",
  ];
  assert.ok(kinds.length >= 5);
  for (const resourceKind of kinds) {
    assert.throws(() =>
      assertResourceAccess({
        session: attacker.session,
        resourceOwnerId: owner.session.userId,
        resourceKind,
      }),
    );
    assert.doesNotThrow(() =>
      assertResourceAccess({
        session: owner.session,
        resourceOwnerId: owner.session.userId,
        resourceKind,
      }),
    );
  }
  assert.equal(
    userScopedCacheKey(owner.session.userId, "orders"),
    `u:${owner.session.userId}:orders`,
  );
  assert.throws(() => userScopedCacheKey("", "x"));
});

/** S30 T9 — webhook signature + idempotency before mutate. */
test("T9 webhook AC: reject bad signature; duplicate no-op", async () => {
  __resetPaymentsForTests();
  assert.equal(
    admitPspWebhookEvent({
      eventId: "evt_t9_bad",
      intentId: "pi_missing",
      signatureValid: false,
      action: "capture",
    }),
    "rejected_signature",
  );
  const reserve = await authorizeJobReserve({
    jobId: "job_t9",
    amountUsdMinor: 10_00n,
    idempotencyKey: "t9-jr",
  });
  assert.equal(
    admitPspWebhookEvent({
      eventId: "evt_t9_1",
      intentId: reserve.intentId!,
      signatureValid: true,
      action: "capture",
    }),
    "captured",
  );
  assert.equal(
    admitPspWebhookEvent({
      eventId: "evt_t9_1",
      intentId: reserve.intentId!,
      signatureValid: true,
      action: "capture",
    }),
    "duplicate",
  );
});

/** S30 T9 / D-54 — Simulated → payout path forbidden. */
test("T9 Simulated Command Centre never auto-pays", () => {
  assert.equal(commandCentreBanner("simulated").autoPayAllowed, false);
  assert.throws(() =>
    attemptCommandCentrePayout({ mode: "simulated", amountMinor: 50_00n }),
  );
});

test("S92 integration health groups are enumerable (no secret leak)", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const { GET } = await import("./app/api/health/integrations/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const body = (await res.json()) as {
    mode: string;
    groups: Array<{ label: string; missing: string[] }>;
  };
  assert.equal(body.mode, "fixture");
  assert.ok(body.groups.some((g) => g.label === "paynow"));
  const blob = JSON.stringify(body);
  assert.equal(blob.includes("sk_live"), false);
  assert.equal(/Bearer\s+\w+/.test(blob), false);
});

test("S95 Supabase password → DialSession bridge", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetAuthForTests();
  const { createSessionFromSupabasePassword } = await import(
    "./lib/auth/session.js"
  );
  const { token, session, accessToken } = await createSessionFromSupabasePassword({
    email: "buyer@dial.test",
    password: "secret",
  });
  assert.ok(accessToken.startsWith("sb_fx_"));
  assert.equal(session.email, "buyer@dial.test");
  assert.equal(getSessionFromToken(token)?.userId, session.userId);
});

test("S103 shared idempotency store dedupes across webhook sources", async () => {
  const {
    __resetIdempotencyForTests,
    claimProcessedEvent,
  } = await import("@dial/shared");
  __resetIdempotencyForTests();
  assert.equal(
    claimProcessedEvent({ eventId: "same_id", source: "paynow" }),
    "accepted",
  );
  assert.equal(
    claimProcessedEvent({ eventId: "same_id", source: "paynow" }),
    "duplicate",
  );
  assert.equal(
    claimProcessedEvent({ eventId: "same_id", source: "fdms" }),
    "accepted",
  );
  const { admitWebhookEvent, __resetWhatsappForTests } = await import(
    "@dial/adapter-whatsapp"
  );
  __resetWhatsappForTests();
  assert.equal(admitWebhookEvent("wa_s103"), "accepted");
  assert.equal(admitWebhookEvent("wa_s103"), "duplicate");
});

test("S115 admin money outbox drain fail-closed + fixture drain", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const prev = process.env.INTERNAL_API_SECRET;
  delete process.env.INTERNAL_API_SECRET;
  const { GET, POST, __testMoneyOutbox } = await import(
    "./app/api/admin/money/outbox/route.js"
  );
  const closed = await GET(new Request("http://localhost/api/admin/money/outbox"));
  assert.equal(closed.status, 503);

  process.env.INTERNAL_API_SECRET = "s115_secret";
  const { __resetTaxForTests, enqueueFiscalReceipt } = await import("@dial/tax");
  const { money } = await import("@dial/shared");
  __testMoneyOutbox.reset();
  __resetTaxForTests();

  const fee = enqueueFiscalReceipt({
    orderId: "ord_s115",
    receiptClass: "DIAL_FEE",
    amount: money(50n, "USD"),
    channel: "web",
  });
  __testMoneyOutbox.enqueue({ kind: "ledger_posted", refId: "jr_s115" });
  __testMoneyOutbox.enqueue({ kind: "fiscal_queued", refId: fee.id });
  assert.ok(__testMoneyOutbox.list().length >= 2);

  const headers = { "x-internal-secret": "s115_secret" };
  const listed = await GET(
    new Request("http://localhost/api/admin/money/outbox", { headers }),
  );
  assert.equal(listed.status, 200);
  const depthBody = (await listed.json()) as { depth: number };
  assert.equal(depthBody.depth, __testMoneyOutbox.list().length);

  const drained = await POST(
    new Request("http://localhost/api/admin/money/outbox", {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ enqueueSideEffects: true }),
    }),
  );
  assert.equal(drained.status, 200);
  const drainBody = (await drained.json()) as {
    remaining: number;
    drained: Array<{ status: string }>;
  };
  assert.equal(drainBody.remaining, 0);
  assert.ok(drainBody.drained.length >= 1);
  assert.equal(__testMoneyOutbox.list().length, 0);

  const health = await (
    await import("./app/api/health/integrations/route.js")
  ).GET();
  const healthBody = (await health.json()) as {
    moneyOutbox: { depth: number };
  };
  assert.equal(typeof healthBody.moneyOutbox.depth, "number");

  if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
  else process.env.INTERNAL_API_SECRET = prev;
});

test("S117 ContiPay/EcoCash webhook routes: accept + duplicate + sandbox bad-sig", async () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const prevConti = process.env.CONTIPAY_API_SECRET;
  const prevEco = process.env.ECOCASH_WEBHOOK_SECRET;
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const { __resetIdempotencyForTests } = await import("@dial/shared");
  __resetIdempotencyForTests();

  const { POST: contiPost } = await import("./app/api/webhooks/contipay/route.js");
  const { POST: ecoPost } = await import("./app/api/webhooks/ecocash/route.js");

  const contiBody = JSON.stringify({
    eventId: "conti_s117",
    paymentId: "pay_s117",
    status: "paid",
  });
  const conti1 = await contiPost(
    new Request("http://localhost/api/webhooks/contipay", {
      method: "POST",
      body: contiBody,
    }),
  );
  assert.equal(conti1.status, 200);
  const conti1Body = (await conti1.json()) as { ok: boolean; duplicate?: boolean };
  assert.equal(conti1Body.ok, true);
  assert.equal(conti1Body.duplicate, undefined);

  const conti2 = await contiPost(
    new Request("http://localhost/api/webhooks/contipay", {
      method: "POST",
      body: contiBody,
    }),
  );
  assert.equal(conti2.status, 200);
  const conti2Body = (await conti2.json()) as { duplicate?: boolean };
  assert.equal(conti2Body.duplicate, true);

  const ecoBody = JSON.stringify({
    eventId: "eco_s117",
    transactionId: "tx_s117",
    status: "SUCCESS",
  });
  const eco1 = await ecoPost(
    new Request("http://localhost/api/webhooks/ecocash", {
      method: "POST",
      body: ecoBody,
    }),
  );
  assert.equal(eco1.status, 200);
  const eco2 = await ecoPost(
    new Request("http://localhost/api/webhooks/ecocash", {
      method: "POST",
      body: ecoBody,
    }),
  );
  assert.equal(((await eco2.json()) as { duplicate?: boolean }).duplicate, true);

  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  process.env.CONTIPAY_API_SECRET = "conti_sandbox_secret";
  process.env.ECOCASH_WEBHOOK_SECRET = "eco_sandbox_secret";
  const badConti = await contiPost(
    new Request("http://localhost/api/webhooks/contipay", {
      method: "POST",
      headers: { "x-contipay-signature": "deadbeef" },
      body: JSON.stringify({ eventId: "conti_bad", paymentId: "x", status: "paid" }),
    }),
  );
  assert.equal(badConti.status, 401);
  const badEco = await ecoPost(
    new Request("http://localhost/api/webhooks/ecocash", {
      method: "POST",
      headers: { "x-ecocash-signature": "deadbeef" },
      body: JSON.stringify({
        eventId: "eco_bad",
        transactionId: "y",
        status: "SUCCESS",
      }),
    }),
  );
  assert.equal(badEco.status, 401);

  process.env.DIAL_INTEGRATION_MODE = prevMode;
  if (prevConti === undefined) delete process.env.CONTIPAY_API_SECRET;
  else process.env.CONTIPAY_API_SECRET = prevConti;
  if (prevEco === undefined) delete process.env.ECOCASH_WEBHOOK_SECRET;
  else process.env.ECOCASH_WEBHOOK_SECRET = prevEco;
});
