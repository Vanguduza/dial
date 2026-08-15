/**
 * PD8 iOS contract parity — same ERP paths as DialCustomerCore / PD5 Android.
 * Runs on Windows CI without Swift toolchain.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { __resetCatalogueForTests } from "@dial/catalogue";
import { __resetPaymentsForTests, setDailyZigRate } from "@dial/payments";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { POST as spareCheckout } from "../../app/api/spare/checkout/route.js";

const iosRoot = join(process.cwd(), "../customer-ios");

test("PD8 Swift sources exist and forbid body identity on checkout", () => {
  const client = readFileSync(
    join(iosRoot, "Sources/DialCustomerCore/DialGatewayClient.swift"),
    "utf8",
  );
  const app = readFileSync(join(iosRoot, "App/DialCustomerApp.swift"), "utf8");
  const tests = readFileSync(
    join(iosRoot, "Tests/DialCustomerCoreTests/DialGatewayClientTests.swift"),
    "utf8",
  );
  assert.match(client, /api\/search\/spare/);
  assert.match(client, /api\/spare\/checkout/);
  assert.match(client, /dial_session/);
  assert.match(client, /never send userId\/role/);
  assert.match(client, /ecocash/);
  assert.match(app, /SwiftUI/);
  assert.match(app, /Pay EcoCash/);
  assert.match(app, /Cash on delivery/);
  assert.match(tests, /testCheckoutEcoCashWithoutIdentityInBody/);
  const checkoutFn = client.slice(client.indexOf("func checkoutSpare"));
  assert.ok(!/#"\{[^"]*userId/.test(checkoutFn));
  assert.ok(!checkoutFn.includes("\"role\""));
});

test("PD8 gateway spare checkout still USD→ZWG EcoCash for iOS path", async () => {
  __resetCatalogueForTests();
  __resetPaymentsForTests();
  __resetAuthForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "pd8_ios" });
  const { token } = createSession({ email: "ios@dial.test", buyerSegment: "b2c" });
  const res = await spareCheckout(
    new Request("http://localhost/api/spare/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Idempotency-Key": "pd8-ios-eco",
        cookie: `${sessionCookieName()}=${token}`,
      },
      body: JSON.stringify({
        offerId: "off_filter_oil_kun26",
        choice: "ecocash",
      }),
    }),
  );
  assert.equal(res.status, 200);
  const json = (await res.json()) as {
    currency: string;
    displayPayableCurrency?: string;
    imttOnCheckoutLines: boolean;
  };
  assert.equal(json.currency, "USD");
  assert.equal(json.displayPayableCurrency, "ZWG");
  assert.equal(json.imttOnCheckoutLines, false);
});
