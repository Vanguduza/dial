import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { __resetCatalogueForTests } from "@dial/catalogue";
import { __resetPaymentsForTests, setDailyZigRate } from "@dial/payments";
import {
  __resetWhatsappForTests,
  admitWebhookEvent,
  assertNoUnofficialWhatsAppDeps,
  CHECKOUT_PAY_BUTTONS,
  EIGHTEEN_ITEM_DISCLOSURES,
  flowConsentCentre,
  flowReferralHome,
  flowSpareCartAdd,
  flowSpareCheckoutPay,
  flowSpareCheckoutReview,
  flowSpareReturns,
  flowSpareSearch,
  flowTechEmergency,
  flowTechIntake,
  openChatwootHandoff,
  startFlow,
  verifyMetaSignature,
} from "./index.js";

const here = dirname(fileURLToPath(import.meta.url));

test("Meta signature verify + webhook idempotency", () => {
  __resetWhatsappForTests();
  const raw = '{"object":"whatsapp_business_account"}';
  const signatureHeader =
    "sha256=" + createHmac("sha256", "test_secret").update(raw).digest("hex");
  assert.equal(
    verifyMetaSignature({
      appSecret: "test_secret",
      rawBody: raw,
      signatureHeader,
    }),
    true,
  );
  assert.equal(
    verifyMetaSignature({
      appSecret: "test_secret",
      rawBody: raw,
      signatureHeader: "sha256=deadbeef",
    }),
    false,
  );
  assert.equal(admitWebhookEvent("del_1"), "accepted");
  assert.equal(admitWebhookEvent("del_1"), "duplicate");
});

test("E2a green path: search → USD cart → checkout EcoCash|COD buttons → intent", async () => {
  __resetWhatsappForTests();
  __resetCatalogueForTests();
  __resetPaymentsForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "ops_e2a" });

  const session = startFlow("FLOW_SPARE_SEARCH", "cust_1");
  const search = flowSpareSearch(session.sessionId, "oil");
  assert.ok(search.offers.length >= 1);
  assert.ok(search.offers.every((o) => o.displayCurrency === "USD"));

  const offerId = search.offers[0]!.offerId;
  const cart = flowSpareCartAdd(session.sessionId, offerId, 1);
  assert.equal(cart.cart.currency, "USD");

  const review = flowSpareCheckoutReview(session.sessionId);
  assert.equal(review.review.disclosures.length, 18);
  assert.equal(EIGHTEEN_ITEM_DISCLOSURES.length, 18);
  assert.equal(review.review.canCorrectOrWithdraw, true);
  assert.deepEqual(
    review.payButtons.map((b) => b.id),
    CHECKOUT_PAY_BUTTONS.map((b) => b.id),
  );
  assert.ok(review.payButtons.some((b) => b.id === "ecocash"));
  assert.ok(review.payButtons.some((b) => b.id === "cod"));
  assert.ok(review.payButtons.some((b) => b.id === "paynow"));

  const paid = await flowSpareCheckoutPay(
    session.sessionId,
    "ecocash",
    "e2a-eco-1",
  );
  assert.equal(paid.intent?.method, "ecocash_direct");
  assert.equal(paid.intent?.displayPayable?.currency, "ZWG");
  assert.ok(paid.intent?.fxRateId);

  const s2 = startFlow("FLOW_SPARE_SEARCH");
  flowSpareSearch(s2.sessionId, "pad");
  flowSpareCartAdd(s2.sessionId, "off_pad_front_zre152", 1);
  flowSpareCheckoutReview(s2.sessionId);
  const cod = await flowSpareCheckoutPay(s2.sessionId, "cod", "e2a-cod-1");
  assert.equal(cod.codOrder?.amountUsd.currency, "USD");
  assert.equal(cod.intent?.method, "cod_cash");

  const s3 = startFlow("FLOW_SPARE_SEARCH");
  flowSpareSearch(s3.sessionId, "oil");
  flowSpareCartAdd(s3.sessionId, offerId, 1);
  flowSpareCheckoutReview(s3.sessionId);
  const pn = await flowSpareCheckoutPay(s3.sessionId, "paynow", "e2a-pn-1");
  assert.ok(pn.paynowUrl?.includes("paynow.stub"));
  assert.ok(pn.paynowUrl?.includes("orderId="));
});

test("Tech intake has no payable; emergency short-circuits without AI block", () => {
  __resetWhatsappForTests();
  const s = startFlow("FLOW_TECH_INTAKE", "cust_tech");
  const intake = flowTechIntake(s.sessionId, {
    tradeHint: "auto",
    description: "engine rattle at idle",
  });
  assert.equal(intake.kind, "intake");
  if (intake.kind !== "intake") throw new Error("expected intake");
  assert.equal(intake.assessment.payableAmount, null);
  assert.equal(intake.assessment.aiPriceForbidden, true);

  const emg = flowTechEmergency(s.sessionId, "smell of gas in cabin");
  assert.equal(emg.dispatch, "deterministic_human");
  assert.equal(emg.aiBlocked, false);
  assert.ok(emg.handoff.jobId);
  assert.equal(emg.handoff.topic, "tech_emergency");
});

test("Chatwoot handoff carries order/job/cart ids; §10 returns/referral/consent", () => {
  __resetWhatsappForTests();
  __resetCatalogueForTests();
  const s = startFlow("FLOW_SPARE_SEARCH", "cust_cw");
  flowSpareSearch(s.sessionId, "filter");
  flowSpareCartAdd(s.sessionId, "off_filter_oil_kun26", 1);
  const review = flowSpareCheckoutReview(s.sessionId);
  const handoff = openChatwootHandoff(s.sessionId, {
    topic: "stuck_search",
    orderId: review.review.orderId,
  });
  assert.equal(handoff.customerId, "cust_cw");
  assert.ok(handoff.orderId);
  assert.ok(handoff.cartId);
  assert.equal(handoff.searchQuery, "filter");
  assert.ok(handoff.chatwootContactId);
  assert.ok(handoff.inboxId);
  assert.ok(handoff.erpTicketId);

  const ret = flowSpareReturns(s.sessionId, {
    orderId: review.review.orderId,
    reason: "wrong fitment",
  });
  assert.equal(ret.claim.statusFrom, "erp");

  const ref = flowReferralHome(s.sessionId, "cust_cw");
  assert.equal(ref.referral.cashOutForbidden, true);

  const cons = flowConsentCentre(s.sessionId, { marketing: true });
  assert.equal(cons.consents.marketing, true);
  assert.equal(cons.consents.vehicleHub, false);
});

test("S111 support ticket flow + Chatwoot id contract", async () => {
  __resetWhatsappForTests();
  const {
    flowSupportTicket,
    assertChatwootHandoffIdContract,
    getSupportTicket,
  } = await import("./index.js");
  const s = startFlow("FLOW_SUPPORT_TICKET", "cust_s111");
  const out = flowSupportTicket(s.sessionId, {
    topic: "payment_help",
    orderId: "ord_s111",
  });
  assertChatwootHandoffIdContract(out.handoff);
  assert.equal(out.ticket.statusFrom, "erp");
  assert.equal(out.ticket.status, "pending_human");
  assert.equal(out.ticket.orderId, "ord_s111");
  assert.equal(getSupportTicket(out.ticket.ticketId)?.conversationKey, out.handoff.conversationKey);
});

test("S112 consent audit + referral promo_credit only", async () => {
  __resetWhatsappForTests();
  const {
    flowConsentCentre,
    flowReferralHome,
    listConsentAudit,
  } = await import("./index.js");
  const s = startFlow("FLOW_CONSENT_CENTRE", "cust_s112");
  const c = flowConsentCentre(s.sessionId, {
    marketing: true,
    referralInvites: true,
  });
  assert.equal(c.consents.marketing, true);
  assert.equal(c.auditLen, 1);
  assert.equal(listConsentAudit().length, 1);
  const ref = flowReferralHome(s.sessionId, "cust_s112");
  assert.equal(ref.referral.cashOutForbidden, true);
  assert.equal(ref.referral.rewardKind, "promo_credit");
  assert.match(ref.referral.code, /^REF-/);
});

test("No Baileys / whatsapp-web.js in workspace package.json files (D-40)", () => {
  const roots = [
    join(here, "../../../package.json"),
    join(here, "../package.json"),
    join(here, "../../../packages/payments/package.json"),
    join(here, "../../../packages/catalogue/package.json"),
    join(here, "../../../apps/gateway-web/package.json"),
  ];
  const texts = roots.map((p) => readFileSync(p, "utf8"));
  assertNoUnofficialWhatsAppDeps(texts);
});

test("Cloud API fixture send + webhook challenge (key-ready)", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  process.env.WHATSAPP_VERIFY_TOKEN = "verify_fx";
  const { MetaCloudApiAdapter, verifyWebhookChallenge } = await import("./cloudApi.js");
  const api = new MetaCloudApiAdapter();
  const tpl = await api.sendUtilityTemplate({
    toE164: "+263771234567",
    templateName: "order_update",
    language: "en",
  });
  assert.ok(tpl.messageId.startsWith("wamid."));
  const txt = await api.sendSessionText({ toE164: "+263771234567", text: "hi" });
  assert.ok(txt.messageId.startsWith("wamid."));
  const ok = verifyWebhookChallenge({
    mode: "subscribe",
    token: "verify_fx",
    challenge: "12345",
  });
  assert.equal(ok.ok, true);
  if (ok.ok) assert.equal(ok.challenge, "12345");
});

test("S106 template registry + sendRegisteredTemplate fixture", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  delete process.env.WA_TEMPLATE_SPARE_ORDER_CONFIRMED;
  const {
    listWaTemplateRegistry,
    resolveWaTemplate,
  } = await import("./templateRegistry.js");
  const list = listWaTemplateRegistry();
  assert.ok(list.length >= 4);
  assert.equal(resolveWaTemplate("SPARE_ORDER_CONFIRMED").status, "stub");
  process.env.WA_TEMPLATE_SPARE_ORDER_CONFIRMED = "spare_order_confirmed_v2";
  assert.equal(resolveWaTemplate("SPARE_ORDER_CONFIRMED").status, "approved");
  assert.equal(
    resolveWaTemplate("SPARE_ORDER_CONFIRMED").templateName,
    "spare_order_confirmed_v2",
  );
  const { MetaCloudApiAdapter } = await import("./cloudApi.js");
  const sent = await new MetaCloudApiAdapter().sendRegisteredTemplate({
    toE164: "+263771234567",
    key: "SPARE_ORDER_CONFIRMED",
  });
  assert.ok(sent.messageId.includes("spare_order_confirmed_v2"));
  delete process.env.WA_TEMPLATE_SPARE_ORDER_CONFIRMED;
});
