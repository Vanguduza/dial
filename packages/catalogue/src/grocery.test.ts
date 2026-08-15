import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import {
  MEILI_GROCERY_INDEX_DEFAULT,
  MEILI_GROCERY_OFFERS_V1_SETTINGS,
  __resetGroceryForTests,
  addToGroceryCart,
  assertGroceryPublishAllowed,
  countGroceryInformalB2bLeaks,
  createGroceryCart,
  groceryMeiliFilterForSession,
  listGroceryDeliverySlots,
  listGroceryMeiliDocuments,
  placeGroceryOrder,
  searchGroceryOffers,
  setGroceryCartSlot,
  trackGroceryOrder,
} from "./grocery.js";

beforeEach(() => {
  __resetGroceryForTests();
});

test("G1 Meili grocery_offers_v1 settings + index name", () => {
  assert.equal(MEILI_GROCERY_INDEX_DEFAULT, "grocery_offers_v1");
  assert.ok(
    MEILI_GROCERY_OFFERS_V1_SETTINGS.filterableAttributes.includes(
      "supplierFormality",
    ),
  );
  assert.ok(
    MEILI_GROCERY_OFFERS_V1_SETTINGS.filterableAttributes.includes(
      "supplierKycStatus",
    ),
  );
  assert.ok(
    MEILI_GROCERY_OFFERS_V1_SETTINGS.filterableAttributes.includes("vertical"),
  );
  const docs = listGroceryMeiliDocuments();
  assert.ok(docs.every((d) => d.currency === "USD" && d.offerSource === "MARKETPLACE"));
  assert.ok(docs.every((d) => d.vertical === "grocery"));
});

test("G1 B2B informal leak=0 (D-49)", () => {
  assert.equal(countGroceryInformalB2bLeaks(""), 0);
  assert.equal(countGroceryInformalB2bLeaks("bread"), 0);
  const b2c = searchGroceryOffers("bread", { sessionRole: "b2c" });
  assert.ok(b2c.some((o) => o.supplierFormality === "informal"));
  const b2b = searchGroceryOffers("bread", { sessionRole: "b2b" });
  assert.ok(b2b.every((o) => o.supplierFormality === "formal"));
  assert.match(
    groceryMeiliFilterForSession("b2b"),
    /supplierFormality = "formal"/,
  );
});

test("G1 USD cart only; B2B cannot add informal", () => {
  const cart = createGroceryCart();
  assert.equal(cart.currency, "USD");
  const withMilk = addToGroceryCart(cart.id, "groc_milk_1l", 2);
  assert.equal(withMilk.currency, "USD");
  assert.equal(withMilk.total.amountMinor, 360n);
  assert.throws(
    () =>
      addToGroceryCart(cart.id, "groc_bread_informal", 1, {
        buyerSegment: "b2b",
      }),
    /B2B cannot purchase informal/,
  );
});

test("G1 rejects DIAL_OWNED and liquor/age-gate publish", () => {
  assert.throws(
    () =>
      assertGroceryPublishAllowed({
        offerSource: "DIAL_OWNED",
        vertical: "grocery",
      }),
    /DIAL_OWNED/,
  );
  assert.throws(
    () =>
      assertGroceryPublishAllowed({
        offerSource: "MARKETPLACE",
        vertical: "liquor",
      }),
    /Liquor/,
  );
  assert.throws(
    () =>
      assertGroceryPublishAllowed({
        offerSource: "MARKETPLACE",
        vertical: "grocery",
        ageGateRequired: true,
      }),
    /Liquor/,
  );
});

test("PD14 slot + place order + track (food; liquorAllowed false)", () => {
  const slots = listGroceryDeliverySlots();
  assert.ok(slots.length >= 1);
  assert.ok(slots.every((s) => s.liquorAllowed === false));
  const cart = createGroceryCart();
  addToGroceryCart(cart.id, "groc_milk_1l", 1);
  assert.throws(() =>
    placeGroceryOrder({
      cartId: cart.id,
      payChoice: "cod",
      soldBy: "OK Express Agency",
    }),
  );
  const withSlot = setGroceryCartSlot(cart.id, slots[0]!.slotId);
  assert.equal(withSlot.slotId, slots[0]!.slotId);
  const order = placeGroceryOrder({
    cartId: cart.id,
    payChoice: "ecocash",
    soldBy: "OK Express Agency",
    deliveryJobId: "dj_test",
  });
  assert.equal(order.currency, "USD");
  assert.equal(order.status, "confirmed");
  const track = trackGroceryOrder(order.orderId);
  assert.equal(track.statusFrom, "erp");
  assert.equal(track.slot.liquorAllowed, false);
  assert.equal(track.liquorAllowed, false);
  assert.ok(track.timeline.length >= 1);
});

test("PD119 grocery order track timeline", async () => {
  const { runPd119GroceryOrderTrackTimelineThinVertical } = await import(
    "./grocery.js"
  );
  const out = runPd119GroceryOrderTrackTimelineThinVertical();
  assert.ok(out.timelineLen >= 3);
  assert.equal(out.statusFrom, "erp");
  assert.equal(out.liquorAllowed, false);
  assert.equal(out.payableFromAi, false);
});

test("PD134 grocery collections thin vertical", async () => {
  const { runPd134GroceryCollectionsThinVertical } = await import("./grocery.js");
  const out = runPd134GroceryCollectionsThinVertical();
  assert.ok(out.collectionCount >= 1);
  assert.equal(out.liquorAllowed, false);
  assert.equal(out.b2bInformalLeak, 0);
  assert.equal(out.payableFromAi, false);
});
