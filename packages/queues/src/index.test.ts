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

test("S125 pingQueuesHealth fixture ok + sandbox fail-closed without Redis", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetQueuesForTests();
  const { pingQueuesHealth } = await import("./index.js");
  const fx = await pingQueuesHealth();
  assert.equal(fx.ok, true);
  assert.equal(fx.mode, "fixture");
  assert.equal(fx.fixtureEnqueueOk, true);
  assert.equal(fx.queues.searchIndexer, "dial-search-indexer");

  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.REDIS_URL;
  const closed = await pingQueuesHealth();
  assert.equal(closed.ok, false);
  assert.ok(closed.error?.includes("fail closed"));
  process.env.DIAL_INTEGRATION_MODE = "fixture";
});

test("PD121 bull-board inspector thin vertical", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetQueuesForTests();
  const { runPd121BullBoardInspectorThinVertical } = await import("./index.js");
  const out = await runPd121BullBoardInspectorThinVertical();
  assert.equal(out.sawWaitingJob, true);
  assert.equal(out.bullBoardPattern, true);
  assert.equal(out.moneyAuthority, false);
  assert.equal(out.payableFromAi, false);
});
