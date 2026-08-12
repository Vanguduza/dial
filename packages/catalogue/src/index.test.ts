import assert from "node:assert/strict";
import { test } from "node:test";
import {
  __resetCatalogueForTests,
  addToCart,
  createCart,
  searchOffers,
} from "./index.js";

test("search returns stub offers", () => {
  const hits = searchOffers("oil");
  assert.ok(hits.length >= 1);
  assert.ok(hits.every((h) => typeof h.unitPriceUsdMinor === "bigint"));
});

test("cart lines and total are USD only", () => {
  __resetCatalogueForTests();
  const cart = createCart();
  addToCart(cart.id, "off_filter_oil_kun26", 2);
  const updated = addToCart(cart.id, "off_pad_front_zre152", 1);
  assert.equal(updated.currency, "USD");
  assert.ok(updated.lines.every((l) => l.unitPrice.currency === "USD"));
  assert.equal(updated.total.currency, "USD");
  assert.equal(updated.total.amountMinor, 12_00n * 2n + 45_00n);
});
