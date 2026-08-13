import assert from "node:assert/strict";
import { test } from "node:test";
import {
  __resetQueuesForTests,
  drainFixtureFdmsDayJobs,
  drainFixtureOutboxJobs,
  drainFixtureSearchJobs,
  enqueueFdmsDayJob,
  enqueueOutboxSideEffect,
  enqueueSearchIndexerJob,
  startFdmsDayWorker,
  startSearchIndexerWorker,
} from "./index.js";

test("S94 BullMQ fixture enqueue/drain without Redis", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetQueuesForTests();
  const a = await enqueueSearchIndexerJob({ type: "ReindexAll" });
  assert.equal(a.mode, "fixture");
  assert.ok(a.jobId.startsWith("fx_si_"));
  const drained = drainFixtureSearchJobs();
  assert.equal(drained.length, 1);
  assert.equal(drained[0]?.type, "ReindexAll");

  const b = await enqueueOutboxSideEffect({
    topic: "fdms.submit",
    payload: { orderId: "ord_1" },
  });
  assert.ok(b.jobId.startsWith("fx_ob_"));
  assert.equal(drainFixtureOutboxJobs().length, 1);

  const worker = await startSearchIndexerWorker({
    processor: async () => undefined,
  });
  assert.equal(worker.mode, "fixture");
  await worker.stop();
});

test("S97 FDMS day queue fixture enqueue/drain", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetQueuesForTests();
  const q = await enqueueFdmsDayJob({ action: "open", requestedBy: "ops" });
  assert.equal(q.mode, "fixture");
  assert.ok(q.jobId.startsWith("fx_fd_"));
  const drained = drainFixtureFdmsDayJobs();
  assert.equal(drained.length, 1);
  assert.equal(drained[0]?.action, "open");
  const worker = await startFdmsDayWorker({
    processor: async () => undefined,
  });
  assert.equal(worker.mode, "fixture");
  await worker.stop();
});

test("S94 sandbox fail closed without REDIS_URL / INTERNAL_API_SECRET", async () => {
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.REDIS_URL;
  await assert.rejects(() => enqueueSearchIndexerJob({ type: "ReindexAll" }));
  delete process.env.INTERNAL_API_SECRET;
  await assert.rejects(() =>
    enqueueOutboxSideEffect({
      topic: "x",
      payload: {},
      requireInternalSecret: true,
    }),
  );
  process.env.DIAL_INTEGRATION_MODE = "fixture";
});
