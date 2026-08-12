import assert from "node:assert/strict";
import { test } from "node:test";
import {
  __resetCatalogueForTests,
  addToCart,
  createCart,
  enqueueCatalogueIngest,
  listCatalogueReviewQueue,
  listMeiliStubDocuments,
  listSearchNoResultEvents,
  MEILI_SPARE_OFFERS_V1_SETTINGS,
  meiliFilterForSession,
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

test("T2 Meili settings expose offerSource + supplierFormality; docs searchable", () => {
  assert.ok(
    MEILI_SPARE_OFFERS_V1_SETTINGS.filterableAttributes.includes("offerSource"),
  );
  assert.ok(
    MEILI_SPARE_OFFERS_V1_SETTINGS.filterableAttributes.includes(
      "supplierFormality",
    ),
  );
  const docs = listMeiliStubDocuments();
  assert.ok(docs.length >= 2);
  assert.ok(docs.every((d) => d.offerSource === "MARKETPLACE"));
  assert.ok(docs.every((d) => d.currency === "USD"));
  assert.ok(!("supplierId" in docs[0]!));
});

test("T2 B2B Meili filter excludes informal (D-49)", () => {
  __resetCatalogueForTests();
  const b2c = searchOffers("wiper", { sessionRole: "b2c" });
  assert.ok(b2c.some((o) => o.supplierFormality === "informal"));
  const b2b = searchOffers("wiper", { sessionRole: "b2b" });
  assert.equal(b2b.length, 0);
  assert.equal(
    meiliFilterForSession("b2b"),
    'offerSource = "MARKETPLACE" AND supplierFormality = "formal"',
  );
  const formalB2b = searchOffers("oil", { sessionRole: "b2b" });
  assert.ok(formalB2b.every((o) => o.supplierFormality === "formal"));
});

test("T2 Catalogue Factory ingest/review + search_no_result_events (D-53)", () => {
  __resetCatalogueForTests();
  const batch = enqueueCatalogueIngest(3);
  assert.equal(batch.status, "pending_review");
  assert.equal(listCatalogueReviewQueue().length, 1);
  searchOffers("totally-missing-sku-xyz", { sessionRole: "b2c" });
  const events = listSearchNoResultEvents();
  assert.equal(events.length, 1);
  assert.equal(events[0]?.query, "totally-missing-sku-xyz");
});
