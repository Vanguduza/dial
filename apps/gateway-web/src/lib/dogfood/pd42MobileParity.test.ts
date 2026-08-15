/**
 * PD42 — iOS/Android customer parity holes vs web (Sold by + grocery track).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  __resetGroceryForTests,
  addToGroceryCart,
  createGroceryCart,
  listGroceryDeliverySlots,
  placeGroceryOrder,
  setGroceryCartSlot,
} from "@dial/catalogue";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { GET as spareSearch } from "../../app/api/search/spare/route.js";
import { GET as grocerySearch } from "../../app/api/search/grocery/route.js";
import { GET as groceryTrack } from "../../app/api/grocery/track/route.js";

describe("PD42 mobile parity contracts", () => {
  it("spare search hits include soldBy agency disclosure", async () => {
    __resetAuthForTests();
    const { token } = createSession({ email: "pd42@dial.local" });
    const res = await spareSearch(
      new Request("http://localhost/api/search/spare?q=filter", {
        headers: { cookie: `${sessionCookieName()}=${token}` },
      }),
    );
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      currency: string;
      hits: Array<{ soldBy?: string; brand: string }>;
    };
    assert.equal(body.currency, "USD");
    assert.ok(body.hits.length >= 1);
    assert.ok(body.hits.every((h) => h.soldBy === `${h.brand} Agency`));
  });

  it("grocery search has supplierDisplayName; track returns soldBy", async () => {
    __resetGroceryForTests();
    __resetAuthForTests();
    const { token } = createSession({ email: "pd42g@dial.local" });
    const search = await grocerySearch(
      new Request("http://localhost/api/search/grocery?q=", {
        headers: { cookie: `${sessionCookieName()}=${token}` },
      }),
    );
    assert.equal(search.status, 200);
    const sBody = (await search.json()) as {
      currency: string;
      liquorSkus: boolean;
      hits: Array<{ offerId: string; supplierDisplayName?: string }>;
    };
    assert.equal(sBody.currency, "USD");
    assert.equal(sBody.liquorSkus, false);
    assert.ok(sBody.hits.length >= 1);
    assert.ok(sBody.hits.every((h) => Boolean(h.supplierDisplayName)));

    const cart = createGroceryCart();
    addToGroceryCart(cart.id, sBody.hits[0]!.offerId, 1);
    const slots = listGroceryDeliverySlots();
    const slot = slots.find((s) => s.liquorAllowed === false) ?? slots[0]!;
    setGroceryCartSlot(cart.id, slot.slotId);
    const order = placeGroceryOrder({
      cartId: cart.id,
      payChoice: "cod",
      soldBy: "OK Express Agency",
      customerId: "pd42_cust",
    });
    const track = await groceryTrack(
      new Request(
        `http://localhost/api/grocery/track?orderId=${encodeURIComponent(order.orderId)}`,
      ),
    );
    assert.equal(track.status, 200);
    const tBody = (await track.json()) as {
      currency: string;
      soldBy: string;
      liquorAllowed: boolean;
    };
    assert.equal(tBody.currency, "USD");
    assert.equal(tBody.soldBy, "OK Express Agency");
    assert.equal(tBody.liquorAllowed, false);
  });
});
