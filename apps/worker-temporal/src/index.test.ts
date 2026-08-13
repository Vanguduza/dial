import assert from "node:assert/strict";
import { test } from "node:test";
import { __resetDeliveryForTests } from "@dial/delivery";
import {
  TEMPORAL_TASK_QUEUE,
  WORKFLOW_DELIVERY_DISPATCH,
  assertInternalSecretForSideEffects,
  createTemporalWorkerOptions,
  runDeliveryDispatchInProcess,
  startDeliveryDispatch,
  temporalWorkerBootstrap,
} from "./index.js";

test("Temporal worker options + in-process DeliveryDispatchWorkflow", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  delete process.env.TEMPORAL_ADDRESS;
  __resetDeliveryForTests();
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

test("S94 startDeliveryDispatch uses in-process path in fixture", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetDeliveryForTests();
  const started = await startDeliveryDispatch({
    orderId: "ord_s94",
    from: "A",
    to: "B",
    courierId: "c_s94",
  });
  assert.equal(started.path, "in_process");
  assert.ok(started.workflowId);
  const boot = temporalWorkerBootstrap();
  assert.equal(boot.taskQueue, TEMPORAL_TASK_QUEUE);
  assert.ok(boot.workflows.includes(WORKFLOW_DELIVERY_DISPATCH));
});

test("S101 Temporal SDK worker fixture registers without NativeConnection", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const { createTemporalSdkWorker } = await import("./index.js");
  const sdk = await createTemporalSdkWorker();
  assert.equal(sdk.mode, "fixture");
  assert.equal(sdk.taskQueue, TEMPORAL_TASK_QUEUE);
  assert.ok(sdk.workflows.includes(WORKFLOW_DELIVERY_DISPATCH));
  await sdk.run();
  await sdk.stop();
});
