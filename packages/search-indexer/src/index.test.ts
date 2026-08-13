import assert from "node:assert/strict";
import { test } from "node:test";
import { drainIndexerOutbox, processIndexerJob } from "./index.js";

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
