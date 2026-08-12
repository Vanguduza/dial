import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { __resetCatalogueForTests } from "@dial/catalogue";
import { __resetPaymentsForTests, setDailyZigRate } from "@dial/payments";
import {
  __resetWhatsappForTests,
  admitWebhookEvent,
  CHECKOUT_PAY_BUTTONS,
  flowSpareCartAdd,
  flowSpareCheckoutPay,
  flowSpareCheckoutReview,
  flowSpareSearch,
  startFlow,
  verifyMetaSignature,
} from "./index.js";

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

  const session = startFlow("FLOW_SPARE_SEARCH");
  const search = flowSpareSearch(session.sessionId, "oil");
  assert.ok(search.offers.length >= 1);
  assert.ok(search.offers.every((o) => o.displayCurrency === "USD"));

  const offerId = search.offers[0]!.offerId;
  const cart = flowSpareCartAdd(session.sessionId, offerId, 1);
  assert.equal(cart.cart.currency, "USD");

  const review = flowSpareCheckoutReview(session.sessionId);
  assert.deepEqual(
    review.payButtons.map((b) => b.id),
    CHECKOUT_PAY_BUTTONS.map((b) => b.id),
  );
  assert.ok(review.payButtons.some((b) => b.id === "ecocash"));
  assert.ok(review.payButtons.some((b) => b.id === "cod"));

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
});
