/**
 * PD91–PD94 dogfood — PDP attrs, 7-day cancel, shadow failover, emergency triage.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  __resetCatalogueForTests,
  __resetSpareCustomerForTests,
  createCart,
  addToCart,
  placeSpareOrder,
  runPd91SparePdpAttrsThinVertical,
  runPd92SevenDayCancelThinVertical,
} from "@dial/catalogue";
import { runPd94EmergencyTriageThinVertical } from "@dial/jobs";
import { runPd93CustomerShadowFailoverThinVertical } from "@dial/suppliers";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { GET as searchGet } from "../../app/api/search/spare/route.js";
import { POST as ordersPost } from "../../app/api/spare/orders/route.js";
import {
  GET as failoverGet,
  POST as failoverPost,
} from "../../app/api/spare/failover/route.js";
import { GET as techServicesGet } from "../../app/api/tech/services/route.js";

test("PD91 spare PDP / search attrs", async () => {
  const thin = runPd91SparePdpAttrsThinVertical();
  assert.equal(thin.rawQtyExposed, false);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd91@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const res = await searchGet(
    new Request("http://localhost/api/search/spare?q=oil", {
      headers: { cookie },
    }),
  );
  assert.equal(res.status, 200);
  const body = (await res.json()) as {
    hits?: Array<{
      availability?: string;
      fitmentConfidence?: number;
      rawQtyExposed?: boolean;
    }>;
  };
  assert.ok((body.hits?.length ?? 0) >= 1);
  assert.equal(body.hits?.[0]?.rawQtyExposed, false);
  assert.ok(body.hits?.[0]?.availability);
  assert.ok(typeof body.hits?.[0]?.fitmentConfidence === "number");
});

test("PD92 seven-day cancel API", async () => {
  const thin = runPd92SevenDayCancelThinVertical();
  assert.equal(thin.cancelledInWindow, true);

  __resetCatalogueForTests();
  __resetSpareCustomerForTests();
  __resetAuthForTests();
  const { token } = createSession({
    email: "pd92@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const cart = createCart();
  addToCart(cart.id, "off_filter_oil_kun26", 1);
  const placed = placeSpareOrder({
    cart: {
      id: cart.id,
      currency: "USD",
      totalUsdMinor: cart.total.amountMinor,
      lines: cart.lines.map((l) => ({
        offerId: l.offerId,
        title: l.title,
        qty: l.qty,
        unitPriceUsdMinor: l.unitPrice.amountMinor,
        lineTotalUsdMinor: l.lineTotal.amountMinor,
        soldBy: l.soldBy,
        supplierFormality: l.supplierFormality,
      })),
    },
    customerId: "cust_pd92",
    payChoice: "ecocash",
  });
  // Session customer id is cust_pd92 from email pd92@…
  const cancel = await ordersPost(
    new Request("http://localhost/api/spare/orders", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "cancel",
        orderId: placed.orderId,
      }),
    }),
  );
  assert.equal(cancel.status, 200);
  const body = (await cancel.json()) as { order?: { status?: string } };
  assert.equal(body.order?.status, "cancelled");
});

test("PD93 customer shadow failover API", async () => {
  const thin = runPd93CustomerShadowFailoverThinVertical();
  assert.equal(thin.accepted, true);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd93@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const seed = await failoverPost(
    new Request("http://localhost/api/spare/failover", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "seed_breach",
        fromSupplierId: "sup_pd93_api_a",
        toSupplierId: "sup_pd93_api_b",
      }),
    }),
  );
  assert.equal(seed.status, 200);
  const seeded = (await seed.json()) as { orderId?: string };
  const list = await failoverGet(
    new Request("http://localhost/api/spare/failover", {
      headers: { cookie },
    }),
  );
  assert.equal(list.status, 200);
  const accept = await failoverPost(
    new Request("http://localhost/api/spare/failover", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "accept",
        orderId: seeded.orderId,
        toSupplierId: "sup_pd93_api_b",
      }),
    }),
  );
  assert.equal(accept.status, 200);
});

test("PD94 emergency triage checklist", async () => {
  const thin = runPd94EmergencyTriageThinVertical();
  assert.equal(thin.catalogId, "emergency.triage.v1");

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd94@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const res = await techServicesGet(
    new Request("http://localhost/api/tech/services?view=checklists", {
      headers: { cookie },
    }),
  );
  assert.equal(res.status, 200);
  const body = (await res.json()) as {
    checklists?: Array<{ id?: string; catalogId?: string }>;
  };
  assert.ok(body.checklists?.some((c) => c.id === "emergency_triage"));
  assert.ok(
    body.checklists?.some((c) => c.catalogId === "emergency.triage.v1"),
  );
});
