import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TEMPORAL_TASK_QUEUE,
  WORKFLOW_DELIVERY_DISPATCH,
  assertInternalSecretForSideEffects,
  createTemporalWorkerOptions,
  runDeliveryDispatchInProcess,
} from "./index.js";

test("Temporal worker options + in-process DeliveryDispatchWorkflow", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  delete process.env.TEMPORAL_ADDRESS;
  const opts = createTemporalWorkerOptions();
  assert.equal(opts.taskQueue, TEMPORAL_TASK_QUEUE);
  assert.ok(opts.workflows.includes(WORKFLOW_DELIVERY_DISPATCH));

  const result = await runDeliveryDispatchInProcess({
    orderId: "ord_wf_1",
    from: "A",
    to: "B",
    courierId: "c_1",
    codUsdMinor: 5_00n,
  });
  assert.ok(result.workflowId);
  assert.equal(result.job.status, "pod_captured");
});

test("sandbox/live fail closed without TEMPORAL_ADDRESS / INTERNAL_API_SECRET", () => {
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.TEMPORAL_ADDRESS;
  assert.throws(() => createTemporalWorkerOptions());
  delete process.env.INTERNAL_API_SECRET;
  assert.throws(() => assertInternalSecretForSideEffects());
  process.env.DIAL_INTEGRATION_MODE = "fixture";
});
