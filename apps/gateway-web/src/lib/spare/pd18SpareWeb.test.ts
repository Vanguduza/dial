/**
 * PD18 Spare-web deepen tests — orders / returns / garage beyond PD3.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  __resetCatalogueForTests,
  __resetSpareCustomerForTests,
  addToCart,
  createCart,
  runPd18SpareWebThinVertical,
} from "@dial/catalogue";
import { GET as ordersGet, POST as ordersPost } from "../../app/api/spare/orders/route.js";
import { POST as returnsPost } from "../../app/api/spare/returns/route.js";
import { POST as garagePost, GET as garageGet } from "../../app/api/spare/garage/route.js";
import { testAuthCookie } from "../auth/session.js";

const spareRoot = join(process.cwd(), "src/app/spare");

test("PD18 spare UI surfaces exist (orders/returns/garage + Sold by)", () => {
  const orders = readFileSync(join(spareRoot, "orders/page.tsx"), "utf8");
  const track = readFileSync(join(spareRoot, "orders/[orderId]/page.tsx"), "utf8");
  const returns = readFileSync(join(spareRoot, "returns/page.tsx"), "utf8");
  const garage = readFileSync(join(spareRoot, "garage/page.tsx"), "utf8");
  const cart = readFileSync(join(spareRoot, "cart/page.tsx"), "utf8");
  assert.match(orders, /Sold by|Orders/);
  assert.match(track, /Track|Sold by|7-day/);
  assert.match(returns, /payableFromAi|return/i);
  assert.match(garage, /consent|Garage|Vehicle/i);
  assert.match(cart, /Sold by/);
});

test("PD18 package thin vertical: order → track → return → garage", async () => {
  const out = await runPd18SpareWebThinVertical();
  assert.equal(out.currency, "USD");
  assert.equal(out.zigOnlyAtCheckout, true);
  assert.ok(out.soldBy.includes("Agency"));
  assert.equal(out.statusFrom, "erp");
  assert.equal(out.returnPayableFromAi, false);
  assert.equal(out.reminderConsentRequired, true);
});

test("PD18 APIs: place order, return, garage consent", async () => {
  __resetCatalogueForTests();
  __resetSpareCustomerForTests();
  const cookie = testAuthCookie({ userId: "cust_api" });
  const cart = createCart();
  addToCart(cart.id, "off_filter_oil_kun26", 1);

  const place = await ordersPost(
    new Request("http://localhost/api/spare/orders", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        cartId: cart.id,
        payChoice: "cod",
      }),
    }),
  );
  assert.equal(place.status, 200);
  const placeJson = (await place.json()) as {
    order: { orderId: string; soldBySummary: string; currency: string };
  };
  assert.equal(placeJson.order.currency, "USD");
  assert.match(placeJson.order.soldBySummary, /Agency/);

  const track = await ordersGet(
    new Request(
      `http://localhost/api/spare/orders?orderId=${encodeURIComponent(placeJson.order.orderId)}`,
      { headers: { cookie } },
    ),
  );
  assert.equal(track.status, 200);
  const trackJson = (await track.json()) as { zigOnTrack: boolean };
  assert.equal(trackJson.zigOnTrack, false);

  const ret = await returnsPost(
    new Request("http://localhost/api/spare/returns", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "open",
        orderId: placeJson.order.orderId,
      }),
    }),
  );
  assert.equal(ret.status, 200);
  const retJson = (await ret.json()) as {
    claim: { payableFromAi: boolean; claimId: string };
  };
  assert.equal(retJson.claim.payableFromAi, false);

  const garage = await garagePost(
    new Request("http://localhost/api/spare/garage", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        label: "Fleet 1",
        chassisHint: "ZRE152",
        reminderConsent: true,
      }),
    }),
  );
  assert.equal(garage.status, 200);
  const list = await garageGet(
    new Request("http://localhost/api/spare/garage", {
      headers: { cookie },
    }),
  );
  assert.equal(list.status, 200);
  const listJson = (await list.json()) as { vehicles: unknown[] };
  assert.equal(listJson.vehicles.length, 1);
});
