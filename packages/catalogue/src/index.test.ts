import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  __resetCatalogueForTests,
  addToCart,
  approveCatalogueReview,
  createCart,
  enqueueCatalogueIngest,
  getCatalogueIngestBatch,
  listCatalogueReviewQueue,
  listMeiliStubDocuments,
  listSearchNoResultEvents,
  MEILI_SPARE_OFFERS_V1_SETTINGS,
  meiliFilterForSession,
  publishApprovedBatchToMeiliStub,
  rejectCatalogueReview,
  searchOffers,
  searchOffersByChassis,
  runPd27SpareDualEntryThinVertical,
  runPd54GroceryDemandGapThinVertical,
  runPd55AdminOrdersThinVertical,
  runPd64CatalogueClaimResolveThinVertical,
  runPd66PendingReviewQueueThinVertical,
} from "./index.js";

describe("catalogue", { concurrency: false }, () => {
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

test("S110 informal B2B leak=0 + search health snapshot", async () => {
  __resetCatalogueForTests();
  const { countInformalB2bLeaks, searchHealthSnapshot } = await import(
    "./index.js"
  );
  assert.equal(countInformalB2bLeaks(""), 0);
  assert.equal(countInformalB2bLeaks("wiper"), 0);
  assert.equal(countInformalB2bLeaks("oil"), 0);
  const health = searchHealthSnapshot();
  assert.equal(health.informalB2bLeaks, 0);
  assert.match(health.meiliFilterB2b, /supplierFormality = "formal"/);
  assert.ok(health.marketplaceDocCount > 0);
});

test("S124 pingMeiliHealth fixture ok + sandbox fail-closed without host", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const { pingMeiliHealth } = await import("./index.js");
  const fx = await pingMeiliHealth();
  assert.equal(fx.ok, true);
  assert.equal(fx.mode, "fixture");
  assert.equal(fx.ensureApplied, true);
  assert.ok(fx.indexUid);

  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.MEILI_HOST;
  delete process.env.MEILI_MASTER_KEY;
  const closed = await pingMeiliHealth();
  assert.equal(closed.ok, false);
  assert.ok(closed.error?.includes("fail closed"));
  process.env.DIAL_INTEGRATION_MODE = "fixture";
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

test("T2 human approve/reject — no auto-publish (D-53/D-54)", () => {
  __resetCatalogueForTests();
  const batch = enqueueCatalogueIngest(2);
  const queued = listCatalogueReviewQueue()[0]!;
  const approved = approveCatalogueReview(queued.reviewId);
  assert.equal(approved.status, "approved");
  assert.equal(getCatalogueIngestBatch(batch.batchId)?.status, "approved");
  assert.throws(() => approveCatalogueReview(queued.reviewId));

  const batch2 = enqueueCatalogueIngest(1);
  const queued2 = listCatalogueReviewQueue().find((r) => r.batchId === batch2.batchId)!;
  const rejected = rejectCatalogueReview(queued2.reviewId);
  assert.equal(rejected.status, "rejected");
  assert.equal(getCatalogueIngestBatch(batch2.batchId)?.status, "rejected");
});

test("E5a CSV→approve→Meili stub; B2B informal leak=0", () => {
  __resetCatalogueForTests();
  assert.throws(() =>
    publishApprovedBatchToMeiliStub({
      batchId: "missing",
      offer: {
        offerId: "x",
        title: "x",
        unitPriceUsdMinor: 1n,
        qualityTier: "OES",
        offerSource: "MARKETPLACE",
        supplierFormality: "formal",
        oem: "X",
        brand: "X",
      },
    }),
  );
  const batch = enqueueCatalogueIngest(1);
  assert.throws(() =>
    publishApprovedBatchToMeiliStub({
      batchId: batch.batchId,
      offer: {
        offerId: "off_e5a_formal",
        title: "E5a formal SKU",
        unitPriceUsdMinor: 15_00n,
        qualityTier: "OES",
        offerSource: "MARKETPLACE",
        supplierFormality: "formal",
        oem: "E5A-1",
        brand: "Test",
      },
    }),
  );
  approveCatalogueReview(listCatalogueReviewQueue()[0]!.reviewId);
  publishApprovedBatchToMeiliStub({
    batchId: batch.batchId,
    offer: {
      offerId: "off_e5a_formal",
      title: "E5a formal SKU",
      unitPriceUsdMinor: 15_00n,
      qualityTier: "OES",
      offerSource: "MARKETPLACE",
      supplierFormality: "formal",
      oem: "E5A-1",
      brand: "Test",
    },
  });
  assert.equal(getCatalogueIngestBatch(batch.batchId)?.status, "published");
  assert.ok(searchOffers("E5a", { sessionRole: "b2c" }).some((o) => o.offerId === "off_e5a_formal"));
  assert.ok(searchOffers("E5a", { sessionRole: "b2b" }).some((o) => o.offerId === "off_e5a_formal"));
  assert.equal(
    searchOffers("wiper", { sessionRole: "b2b" }).filter((o) => o.supplierFormality === "informal")
      .length,
    0,
  );
});

test("Meili HTTP client fixture ensure+upsert without keys", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const { ensureSpareOffersIndex, upsertSpareOfferDocuments } = await import("./meiliClient.js");
  const idx = await ensureSpareOffersIndex();
  assert.equal(idx.applied, true);
  assert.ok(idx.indexUid);
  const task = await upsertSpareOfferDocuments([]);
  assert.equal(task.taskUid, "fixture");
  assert.equal(task.indexUid, idx.indexUid);
});

test("PD2 Factory approve→Meili publish + searchOffersAsync fixture path", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetCatalogueForTests();
  const {
    publishApprovedBatchToMeili,
    searchOffersAsync,
    countInformalB2bLeaks,
    spareOffersIndexName,
  } = await import("./index.js");
  const batch = enqueueCatalogueIngest(1);
  approveCatalogueReview(listCatalogueReviewQueue()[0]!.reviewId);
  const published = await publishApprovedBatchToMeili({
    batchId: batch.batchId,
    offer: {
      offerId: "off_pd2_formal",
      title: "PD2 formal SKU",
      unitPriceUsdMinor: 22_00n,
      qualityTier: "OES",
      offerSource: "MARKETPLACE",
      supplierFormality: "formal",
      oem: "PD2-1",
      brand: "Test",
    },
  });
  assert.equal(published.taskUid, "fixture");
  assert.equal(published.indexUid, spareOffersIndexName());
  assert.equal(published.doc.offerSource, "MARKETPLACE");

  const b2c = await searchOffersAsync("PD2", { sessionRole: "b2c" });
  assert.equal(b2c.source, "memory");
  assert.ok(b2c.hits.some((h) => h.offerId === "off_pd2_formal"));
  assert.match(b2c.meiliFilter, /offerSource = "MARKETPLACE"/);

  const b2b = await searchOffersAsync("wiper", { sessionRole: "b2b" });
  assert.equal(b2b.source, "memory");
  assert.equal(
    b2b.hits.filter((h) => h.supplierFormality === "informal").length,
    0,
  );
  assert.match(b2b.meiliFilter, /supplierFormality = "formal"/);
  assert.equal(countInformalB2bLeaks("wiper"), 0);

  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.MEILI_HOST;
  delete process.env.MEILI_MASTER_KEY;
  await assert.rejects(
    () => searchOffersAsync("oil", { sessionRole: "b2c" }),
    /fail closed|MEILI_/,
  );
  process.env.DIAL_INTEGRATION_MODE = "fixture";
});

test("PD15 CSV Factory → Meili spare+grocery + demand-gap", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const { runPd15CatalogueFactoryThinVertical } = await import("./index.js");
  const out = await runPd15CatalogueFactoryThinVertical();
  assert.equal(out.informalB2bLeaks, 0);
  assert.equal(out.payableFromAi, false);
  assert.ok(out.demandGap.noResultCount >= 1);
  assert.equal(out.spareOfferId, "off_pd15_formal");
  assert.equal(out.groceryOfferId, "groc_pd15_oats");
});

test("PD18 spare customer: Sold by on cart → order → return → garage", async () => {
  const { runPd18SpareWebThinVertical } = await import("./spareCustomer.js");
  const out = await runPd18SpareWebThinVertical();
  assert.equal(out.currency, "USD");
  assert.ok(out.soldBy.includes("Agency"));
  assert.equal(out.returnPayableFromAi, false);
});

test("PD20 customer mobile: same ERP orders/returns/garage path", async () => {
  const { runPd20CustomerMobileThinVertical } = await import("./spareCustomer.js");
  const out = await runPd20CustomerMobileThinVertical();
  assert.equal(out.currency, "USD");
  assert.equal(out.zigOnTrack, false);
  assert.equal(out.returnPayableFromAi, false);
  assert.deepEqual(out.channels, ["android", "ios"]);
  assert.equal(out.noExpo, true);
});

test("PD48 admin returns thin vertical", async () => {
  const { runPd48AdminReturnsThinVertical } = await import("./spareCustomer.js");
  const out = runPd48AdminReturnsThinVertical();
  assert.equal(out.listed, true);
  assert.equal(out.resolvedPath, "refund");
  assert.equal(out.payableFromAi, false);
  assert.equal(out.openCountAfterResolve, 0);
});

test("PD50 Vehicle Hub consent revoke + chassis browse", async () => {
  const { runPd50VehicleHubThinVertical } = await import("./spareCustomer.js");
  const out = runPd50VehicleHubThinVertical();
  assert.equal(out.consentRevoked, true);
  assert.equal(out.auditHasRevoke, true);
  assert.match(out.browsePath, /chassis=KUN26/);
  assert.equal(out.payableFromAi, false);
});

test("PD75 set active garage vehicle", async () => {
  const { runPd75SetActiveGarageVehicleThinVertical } = await import(
    "./spareCustomer.js"
  );
  const out = runPd75SetActiveGarageVehicleThinVertical();
  assert.equal(out.activeCount, 1);
  assert.equal(out.switched, true);
  assert.equal(out.payableFromAi, false);
});

test("PD79 garage CRUD update + delete promote", async () => {
  const { runPd79GarageCrudThinVertical } = await import("./spareCustomer.js");
  const out = runPd79GarageCrudThinVertical();
  assert.equal(out.updatedLabel, "Updated Hilux");
  assert.equal(out.deleted, true);
  assert.equal(out.promotedActive, true);
  assert.equal(out.remainingCount, 1);
  assert.equal(out.payableFromAi, false);
});

test("PD54 grocery Meili demand-gap thin vertical", () => {
  __resetCatalogueForTests();
  const out = runPd54GroceryDemandGapThinVertical();
  assert.equal(out.noResultCount, 3);
  assert.equal(out.topQuery, "exotic quinoa missing");
  assert.equal(out.liquorAllowed, false);
  assert.equal(out.payableFromAi, false);
  assert.equal(out.vertical, "grocery");
});

test("PD55 admin orders thin vertical", () => {
  const out = runPd55AdminOrdersThinVertical();
  assert.equal(out.spareAdvanced, true);
  assert.equal(out.groceryAdvanced, true);
  assert.equal(out.payableFromAi, false);
  assert.equal(out.liquorAllowed, false);
  assert.ok(out.queueCount >= 2);
});

test("PD64 catalogue claim → resolve", () => {
  const out = runPd64CatalogueClaimResolveThinVertical();
  assert.equal(out.claimedThenApproved, true);
  assert.equal(out.claimedBy, "ops_pd64");
  assert.equal(out.payableFromAi, false);
  assert.equal(out.liquorAllowed, false);
});

test("PD66 pending review queue", () => {
  const out = runPd66PendingReviewQueueThinVertical();
  assert.equal(out.claimedVisible, true);
  assert.equal(out.resolvedClearsPending, true);
  assert.ok(out.pendingCount >= 2);
  assert.equal(out.payableFromAi, false);
});

test("PD27 dual entry Select Vehicle + Browse EPC join on chassis; USD; B2B hide informal", () => {
  __resetCatalogueForTests();
  const out = runPd27SpareDualEntryThinVertical();
  assert.equal(out.selectVehicleChassis, "KUN26");
  assert.equal(out.joinKey, "chassis_code");
  assert.equal(out.sameJoin, true);
  assert.equal(out.displayCurrencyUsd, true);
  assert.equal(out.reverseEngineeredEpc, false);
  assert.equal(out.payableFromAi, false);
  const hits = searchOffersByChassis({
    chassisCode: "KUN26",
    sessionRole: "b2c",
    entryPath: "select_vehicle",
  });
  assert.ok(hits.some((h) => h.offerId === "off_filter_oil_kun26"));
  assert.ok(hits.every((h) => h.displayCurrency === "USD"));
  const b2b = searchOffersByChassis({
    chassisCode: "KUN26",
    sessionRole: "b2b",
    entryPath: "browse_epc",
  });
  assert.ok(b2b.every((h) => h.supplierFormality === "formal"));
});
});
