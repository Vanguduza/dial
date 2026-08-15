import assert from "node:assert/strict";
import { test } from "node:test";
import { __resetCatalogueForTests } from "@dial/catalogue";
import { __resetPaymentsForTests, setDailyZigRate } from "@dial/payments";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { POST as spareCheckout } from "../../app/api/spare/checkout/route.js";

test("PD5 spare checkout API: session SoR; EcoCash USD→ZWG; no body identity", async () => {
  __resetCatalogueForTests();
  __resetPaymentsForTests();
  __resetAuthForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "pd5_test" });
  const { token } = createSession({
    email: "android@dial.test",
    buyerSegment: "b2c",
  });

  const bad = await spareCheckout(
    new Request("http://localhost/api/spare/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Idempotency-Key": "pd5-bad-id",
        cookie: `${sessionCookieName()}=${token}`,
      },
      body: JSON.stringify({
        offerId: "off_filter_oil_kun26",
        choice: "ecocash",
        userId: "attacker",
      }),
    }),
  );
  assert.equal(bad.status, 400);

  const unauth = await spareCheckout(
    new Request("http://localhost/api/spare/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Idempotency-Key": "pd5-unauth",
      },
      body: JSON.stringify({
        offerId: "off_filter_oil_kun26",
        choice: "ecocash",
      }),
    }),
  );
  assert.equal(unauth.status, 401);

  const missingKey = await spareCheckout(
    new Request("http://localhost/api/spare/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${sessionCookieName()}=${token}`,
      },
      body: JSON.stringify({
        offerId: "off_filter_oil_kun26",
        choice: "ecocash",
      }),
    }),
  );
  assert.equal(missingKey.status, 400);

  const ok = await spareCheckout(
    new Request("http://localhost/api/spare/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Idempotency-Key": "pd5-eco-1",
        cookie: `${sessionCookieName()}=${token}`,
      },
      body: JSON.stringify({
        offerId: "off_filter_oil_kun26",
        choice: "ecocash",
      }),
    }),
  );
  assert.equal(ok.status, 200);
  const json = (await ok.json()) as {
    currency: string;
    displayPayableCurrency?: string;
    fxRateId?: string;
    imttOnCheckoutLines: boolean;
  };
  assert.equal(json.currency, "USD");
  assert.equal(json.displayPayableCurrency, "ZWG");
  assert.ok(json.fxRateId);
  assert.equal(json.imttOnCheckoutLines, false);
});
