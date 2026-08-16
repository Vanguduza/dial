import assert from "node:assert/strict";
import { test } from "node:test";
import {
  __resetCatalogueForTests,
  __resetSpareCustomerForTests,
  addToCart,
  createCart,
} from "@dial/catalogue";
import { GET as groceryTrack } from "../../app/api/grocery/track/route.js";
import { GET as garageGet } from "../../app/api/spare/garage/route.js";
import { GET as returnsGet } from "../../app/api/spare/returns/route.js";
import { GET as ordersGet, POST as ordersPost } from "../../app/api/spare/orders/route.js";
import { POST as slotPost } from "../../app/api/grocery/slot/route.js";
import { testAuthCookie, __resetAuthForTests } from "../auth/session.js";

test("IDOR: grocery track / garage / returns / slot require a session", async () => {
  __resetAuthForTests();
  const anonTrack = await groceryTrack(
    new Request("http://localhost/api/grocery/track?orderId=ord_x"),
  );
  assert.equal(anonTrack.status, 401);

  const other = testAuthCookie({ userId: "usr_other" });
  const garage = await garageGet(
    new Request("http://localhost/api/spare/garage?customerId=usr_victim", {
      headers: { cookie: other },
    }),
  );
  assert.equal(garage.status, 400);

  const anonReturns = await returnsGet(
    new Request("http://localhost/api/spare/returns?claimId=sret_x"),
  );
  assert.equal(anonReturns.status, 401);

  const anonSlot = await slotPost(
    new Request("http://localhost/api/grocery/slot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slotId: "slot_1" }),
    }),
  );
  assert.equal(anonSlot.status, 401);
});

test("IDOR: spare orders list/track/place use session owner, not query/body customerId", async () => {
  __resetAuthForTests();
  __resetCatalogueForTests();
  __resetSpareCustomerForTests();

  const anon = await ordersGet(
    new Request("http://localhost/api/spare/orders?orderId=ord_x"),
  );
  assert.equal(anon.status, 401);

  const owner = testAuthCookie({ userId: "usr_owner" });
  const cart = createCart();
  addToCart(cart.id, "off_filter_oil_kun26", 1);
  const place = await ordersPost(
    new Request("http://localhost/api/spare/orders", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: owner },
      body: JSON.stringify({ cartId: cart.id, payChoice: "cod" }),
    }),
  );
  assert.equal(place.status, 200);
  const placed = (await place.json()) as { order: { orderId: string; customerId: string } };
  assert.equal(placed.order.customerId, "usr_owner");

  const withBodyOwner = await ordersPost(
    new Request("http://localhost/api/spare/orders", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: owner },
      body: JSON.stringify({
        cartId: cart.id,
        payChoice: "cod",
        customerId: "usr_victim",
      }),
    }),
  );
  assert.equal(withBodyOwner.status, 400);

  const other = testAuthCookie({ userId: "usr_other" });
  const leak = await ordersGet(
    new Request(
      `http://localhost/api/spare/orders?orderId=${encodeURIComponent(placed.order.orderId)}`,
      { headers: { cookie: other } },
    ),
  );
  assert.equal(leak.status, 403);

  const querySpoof = await ordersGet(
    new Request("http://localhost/api/spare/orders?customerId=usr_victim", {
      headers: { cookie: other },
    }),
  );
  assert.equal(querySpoof.status, 400);
});
