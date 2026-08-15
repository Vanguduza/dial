/**
 * PD95–PD98 dogfood — facets, promo→checkout, Idempotency-Key, tech credentials.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  __resetCatalogueForTests,
  addToCart,
  createCart,
  runPd95SpareFacetsCollectionsThinVertical,
} from "@dial/catalogue";
import { runPd98TechnicianCredentialsThinVertical } from "@dial/jobs";
import {
  __resetPaymentsForTests,
  requireIdempotencyKey,
  runPd97IdempotencyKeyThinVertical,
  setDailyZigRate,
} from "@dial/payments";
import {
  applyPromoCodeDraft,
  runPd96PromoCartCheckoutThinVertical,
  __resetPromoCustomerForTests,
} from "@dial/promotions";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { GET as searchGet } from "../../app/api/search/spare/route.js";
import { POST as checkoutPost } from "../../app/api/spare/checkout/route.js";
import {
  GET as techGet,
  POST as techPost,
} from "../../app/api/tech/technician/route.js";

test("PD95 facets + collections API", async () => {
  const thin = runPd95SpareFacetsCollectionsThinVertical();
  assert.ok(thin.collectionCount >= 2);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd95@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const res = await searchGet(
    new Request(
      "http://localhost/api/search/spare?qualityTier=OES&availability=available",
      { headers: { cookie } },
    ),
  );
  assert.equal(res.status, 200);
  const body = (await res.json()) as {
    collections?: unknown[];
    hits?: Array<{ qualityTier?: string }>;
  };
  assert.ok((body.collections?.length ?? 0) >= 1);
  assert.ok((body.hits ?? []).every((h) => h.qualityTier === "OES"));
});

test("PD96 promo draft on checkout", async () => {
  const thin = runPd96PromoCartCheckoutThinVertical();
  assert.equal(thin.draftOnCart, true);

  __resetCatalogueForTests();
  __resetPaymentsForTests();
  __resetPromoCustomerForTests();
  __resetAuthForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "pd96" });
  const { token } = createSession({
    email: "pd96@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  // Seed via thin already used different store; re-seed through API path
  const thin2 = runPd96PromoCartCheckoutThinVertical();
  assert.equal(thin2.draftDiscountPercent, 15);
  const cart = createCart();
  addToCart(cart.id, "off_filter_oil_kun26", 1);
  applyPromoCodeDraft({
    customerId: "cust_pd96",
    cartId: cart.id,
    code: "PD96SAVE",
    vertical: "spare",
  });
  const pay = await checkoutPost(
    new Request("http://localhost/api/spare/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Idempotency-Key": "pd96-checkout-1",
        cookie,
      },
      body: JSON.stringify({ cartId: cart.id, choice: "ecocash" }),
    }),
  );
  assert.equal(pay.status, 200);
  const body = (await pay.json()) as {
    promoDraft?: { draftDiscountPercent?: number; payableFromAi?: boolean };
  };
  assert.equal(body.promoDraft?.draftDiscountPercent, 15);
  assert.equal(body.promoDraft?.payableFromAi, false);
});

test("PD97 Idempotency-Key on checkout", async () => {
  const thin = await runPd97IdempotencyKeyThinVertical();
  assert.equal(thin.replaySameIntent, true);
  assert.throws(() => requireIdempotencyKey(new Headers()), /Idempotency-Key/);

  __resetCatalogueForTests();
  __resetPaymentsForTests();
  __resetAuthForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "pd97" });
  const { token } = createSession({
    email: "pd97@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const missing = await checkoutPost(
    new Request("http://localhost/api/spare/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        offerId: "off_filter_oil_kun26",
        choice: "cod",
      }),
    }),
  );
  assert.equal(missing.status, 400);
  const a = await checkoutPost(
    new Request("http://localhost/api/spare/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Idempotency-Key": "pd97-api-key",
        cookie,
      },
      body: JSON.stringify({
        offerId: "off_filter_oil_kun26",
        choice: "cod",
      }),
    }),
  );
  assert.equal(a.status, 200);
  const bodyA = (await a.json()) as { intentId?: string; codOrderId?: string };
  assert.ok(bodyA.intentId);
  const b = await checkoutPost(
    new Request("http://localhost/api/spare/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Idempotency-Key": "pd97-api-key",
        cookie,
      },
      body: JSON.stringify({
        offerId: "off_filter_oil_kun26",
        choice: "cod",
      }),
    }),
  );
  assert.equal(b.status, 200);
  const bodyB = (await b.json()) as { intentId?: string; codOrderId?: string };
  // Replay returns same PaymentIntent (COD path stores intent under Idempotency-Key).
  assert.equal(bodyA.intentId, bodyB.intentId);
});

test("PD98 technician credentials API", async () => {
  const thin = runPd98TechnicianCredentialsThinVertical();
  assert.equal(thin.eligibleWhenVerified, true);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd98tech@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const set = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "set_credential",
        kind: "trade_licence",
        status: "verified",
        label: "Auto trade",
      }),
    }),
  );
  assert.equal(set.status, 200);
  const get = await techGet(
    new Request("http://localhost/api/tech/technician?view=credentials", {
      headers: { cookie },
    }),
  );
  assert.equal(get.status, 200);
  const body = (await get.json()) as {
    credentials?: Array<{ status?: string }>;
  };
  assert.ok(body.credentials?.some((c) => c.status === "verified"));
});
