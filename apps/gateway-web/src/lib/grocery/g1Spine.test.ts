import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import { __resetGroceryForTests } from "@dial/catalogue";
import {
  browseGroceryForSession,
  runG1GroceryThinVertical,
} from "./g1Spine.js";

beforeEach(() => {
  __resetGroceryForTests();
});

test("G1 browse USD food/pantry; B2B hides informal", () => {
  const b2c = browseGroceryForSession("", "b2c");
  assert.equal(b2c.currency, "USD");
  assert.equal(b2c.meiliIndex, "grocery_offers_v1");
  assert.ok(b2c.hits.some((h) => h.supplierFormality === "informal"));
  const b2b = browseGroceryForSession("", "b2b");
  assert.ok(b2b.hits.every((h) => h.supplierFormality === "formal"));
  assert.ok(b2b.hits.every((h) => !h.ageGateRequired));
});

test("G1 thin vertical EcoCash → Job Reserve → delivery job", async () => {
  const result = await runG1GroceryThinVertical({
    offerId: "groc_milk_1l",
    payChoice: "ecocash",
    buyerSegment: "b2c",
  });
  assert.equal(result.currency, "USD");
  assert.equal(result.imttOnCheckoutLines, false);
  assert.ok(result.snapshotId.startsWith("ofs_"));
  assert.match(result.soldBy, /^Sold by /);
  assert.ok(result.intentId);
  assert.ok(result.fxRateId);
  assert.equal(result.displayPayableCurrency, "ZWG");
  assert.ok(result.jobReserveId.startsWith("jr_"));
  assert.ok(result.deliveryJobId.startsWith("dj_"));
  assert.equal(result.webhook, "captured");
  assert.ok(result.journalId);
  assert.ok(result.fiscalIds && result.fiscalIds.length >= 2);
  assert.equal(result.cart.currency, "USD");
});

test("G1 COD path creates delivery with COD + Job Reserve", async () => {
  const result = await runG1GroceryThinVertical({
    offerId: "groc_rice_2kg",
    payChoice: "cod",
    buyerSegment: "b2c",
  });
  assert.ok(result.codOrderId);
  assert.ok(result.fxRateId);
  assert.ok(result.jobReserveId);
  assert.ok(result.deliveryJobId);
});

test("G1 B2B informal checkout denied (D-49)", async () => {
  await assert.rejects(
    () =>
      runG1GroceryThinVertical({
        offerId: "groc_bread_informal",
        payChoice: "ecocash",
        buyerSegment: "b2b",
      }),
    /B2B|informal/,
  );
});
