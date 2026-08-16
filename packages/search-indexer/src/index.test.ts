import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bootstrapLocalSearchIndex,
  drainIndexerOutbox,
  enqueueAndProcessIndexerJob,
  processIndexerJob,
} from "./index.js";

test("S93 search-indexer fixture reindex without Redis", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const one = await processIndexerJob({ type: "ReindexAll" });
  assert.ok(one.indexUid);
  assert.equal(one.taskUid, "fixture");
  assert.ok(one.documentsUpserted >= 0);

  const batch = await drainIndexerOutbox([
    { type: "OfferInvalidated", offerId: "missing" },
    { type: "StockHeartbeatReceived", supplierId: "sup_1" },
  ]);
  assert.equal(batch.length, 2);

  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.REDIS_URL;
  await assert.rejects(() => processIndexerJob({ type: "ReindexAll" }));
  process.env.DIAL_INTEGRATION_MODE = "fixture";
});

test("S94 enqueueAndProcessIndexerJob via BullMQ fixture queue", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const results = await enqueueAndProcessIndexerJob({ type: "ReindexAll" });
  assert.equal(results.length, 1);
  assert.equal(results[0]?.job.type, "ReindexAll");
});

test("S100 bootstrapLocalSearchIndex fixture", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const boot = await bootstrapLocalSearchIndex();
  assert.ok(boot.indexUid);
  assert.ok(boot.groceryIndexUid);
  assert.equal(boot.mode, "fixture");
  assert.equal(boot.taskUid, "fixture");
  assert.equal(boot.searchSource, "fixture_skip");
});

test("S100 sandbox bootstrap fail-closed without MEILI_*", async () => {
  const prevHost = process.env.MEILI_HOST;
  const prevKey = process.env.MEILI_MASTER_KEY;
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.MEILI_HOST;
  delete process.env.MEILI_MASTER_KEY;
  await assert.rejects(() => bootstrapLocalSearchIndex(), /fail closed|MEILI_/);
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  if (prevHost !== undefined) process.env.MEILI_HOST = prevHost;
  if (prevKey !== undefined) process.env.MEILI_MASTER_KEY = prevKey;
});

test("G1 Meili sandbox bootstrap returns non-fixture taskUid when host up", async () => {
  const host = process.env.MEILI_HOST?.trim();
  const key = process.env.MEILI_MASTER_KEY?.trim();
  if (!host || !key || process.env.DIAL_SANDBOX_EVIDENCE !== "1") {
    return;
  }
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  const out = await bootstrapLocalSearchIndex();
  assert.equal(out.mode, "sandbox");
  assert.notEqual(out.taskUid, "fixture");
  assert.match(out.taskUid, /^\d+$/);
  assert.equal(out.searchSource, "meili");
  process.env.DIAL_INTEGRATION_MODE = "fixture";
});

test("Phase4-prep Factory publishViaIndexer fixture + sandbox fail-closed", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const {
    enqueueCatalogueIngest,
    approveCatalogueReview,
    listCatalogueReviewQueue,
    __resetCatalogueForTests,
  } = await import("@dial/catalogue");
  __resetCatalogueForTests();
  const { publishFactoryOfferViaIndexer } = await import("./index.js");
  const batch = enqueueCatalogueIngest(1);
  approveCatalogueReview(listCatalogueReviewQueue()[0]!.reviewId);
  const out = await publishFactoryOfferViaIndexer({
    batchId: batch.batchId,
    offer: {
      offerId: "off_factory_indexer_prep",
      title: "Factory indexer prep",
      unitPriceUsdMinor: 19_00n,
      qualityTier: "OES",
      offerSource: "MARKETPLACE",
      supplierFormality: "formal",
      oem: "FX-1",
      brand: "Prep",
    },
  });
  assert.equal(out.publishTaskUid, "fixture");
  assert.equal(out.doc.offerSource, "MARKETPLACE");
  assert.ok(out.indexerResults.length >= 1);

  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.REDIS_URL;
  await assert.rejects(
    () =>
      publishFactoryOfferViaIndexer({
        batchId: batch.batchId,
        offer: {
          offerId: "off_factory_indexer_sb",
          title: "Should fail",
          unitPriceUsdMinor: 1n,
          qualityTier: "OES",
          offerSource: "MARKETPLACE",
          supplierFormality: "formal",
          oem: "X",
          brand: "X",
        },
      }),
    /REDIS_URL|fail closed/,
  );
  process.env.DIAL_INTEGRATION_MODE = "fixture";
});

test("Phase4-prep CSV→approve→Meili via indexer; B2B leak=0", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const { runPhase4PrepFactoryCsvPublishThinVertical } = await import("./index.js");
  const out = await runPhase4PrepFactoryCsvPublishThinVertical();
  assert.equal(out.offerId, "off_p4prep_idx");
  assert.equal(out.publishTaskUid, "fixture");
  assert.equal(out.informalB2bLeaks, 0);
  assert.equal(out.liquorRejected, true);
  assert.equal(out.autoPublishForbidden, true);
  assert.equal(out.payableFromAi, false);
  assert.equal(out.offerSource, "MARKETPLACE");
});
