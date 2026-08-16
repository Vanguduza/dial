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

test("Phase4-prep adjacent: Temporal sandbox start path fail-closed without secrets", async () => {
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.TEMPORAL_ADDRESS;
  delete process.env.INTERNAL_API_SECRET;
  const { startDeliveryDispatch } = await import("./index.js");
  await assert.rejects(
    () =>
      startDeliveryDispatch({
        orderId: "ord_p4prep_fail",
        from: "A",
        to: "B",
        courierId: "c_fail",
      }),
    /fail closed|TEMPORAL|INTERNAL/,
  );
  process.env.DIAL_INTEGRATION_MODE = "fixture";
});

test("Phase5-prep: sandbox path label is temporal when address+secret set (no live connect)", async () => {
  // Contract only: createTemporalWorkerOptions + assertInternalSecret succeed;
  // startDeliveryDispatch would dial Temporal — do not claim G5 without UI history.
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  process.env.TEMPORAL_ADDRESS = "127.0.0.1:7233";
  process.env.INTERNAL_API_SECRET = "phase5_prep_test_secret";
  process.env.TEMPORAL_NAMESPACE = "dial_p5prep";
  const opts = createTemporalWorkerOptions();
  assert.equal(opts.address, "127.0.0.1:7233");
  assert.equal(opts.namespace, "dial_p5prep");
  assert.ok(opts.workflows.includes(WORKFLOW_DELIVERY_DISPATCH));
  assertInternalSecretForSideEffects();
  const health = (await import("./index.js")).pingTemporalHealth();
  assert.equal(health.ok, true);
  assert.equal(health.mode, "sandbox");
  assert.equal(health.addressConfigured, true);
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  delete process.env.TEMPORAL_ADDRESS;
  delete process.env.INTERNAL_API_SECRET;
  delete process.env.TEMPORAL_NAMESPACE;
});

test("S126 pingTemporalHealth fixture ok + sandbox fail-closed without address", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  delete process.env.TEMPORAL_ADDRESS;
  process.env.TEMPORAL_NAMESPACE = "dial_s126";
  const { pingTemporalHealth } = await import("./index.js");
  const fx = pingTemporalHealth();
  assert.equal(fx.ok, true);
  assert.equal(fx.mode, "fixture");
  assert.equal(fx.namespace, "dial_s126");
  assert.equal(fx.taskQueue, TEMPORAL_TASK_QUEUE);
  assert.ok(fx.workflows.includes(WORKFLOW_DELIVERY_DISPATCH));

  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.TEMPORAL_ADDRESS;
  const closed = pingTemporalHealth();
  assert.equal(closed.ok, false);
  assert.ok(closed.error?.includes("fail closed"));
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  delete process.env.TEMPORAL_NAMESPACE;
});
