import assert from "node:assert/strict";
import { test } from "node:test";
import {
  __resetDeliveryForTests,
  acceptOffer,
  capturePod,
  createDeliveryJob,
  estimateRouteStub,
  getDeliveryJob,
  listFifoQueue,
  reconcileCodAfterPod,
  rejectOffer,
  setCourierAvailable,
  startDeliveryDispatchWorkflow,
  startTransit,
  timeoutOffer,
} from "./index.js";

test("E3a thin: create job → offer → accept → POD (packages/delivery SoR)", () => {
  __resetDeliveryForTests();
  setCourierAvailable("cour_1", true);
  const job = createDeliveryJob({
    orderId: "ord_e3a",
    from: "harare_a",
    to: "harare_b",
    codUsdMinor: 25_00n,
  });
  assert.equal(job.status, "created");
  assert.ok(job.distanceMeters);
  assert.equal(estimateRouteStub({ from: "a", to: "b" }).provider, "osrm_vroom_stub");

  const wf = startDeliveryDispatchWorkflow(job.id);
  assert.equal(wf.phase, "offer");
  const offered = getDeliveryJob(job.id);
  assert.equal(offered?.status, "offered");
  assert.ok(offered?.offerId);

  const assigned = acceptOffer(offered!.offerId!, "cour_1");
  assert.equal(assigned.status, "assigned");
  startTransit(job.id);
  const pod = capturePod(job.id);
  assert.equal(pod.status, "pod_captured");
  assert.ok(pod.podAt);
  const cod = reconcileCodAfterPod(job.id);
  assert.equal(cod.reconciled, true);
  assert.equal(cod.amountUsd?.amountMinor, 25_00n);
});

test("E3a reject/timeout → reassign; zero couriers → FIFO", () => {
  __resetDeliveryForTests();
  setCourierAvailable("cour_a", true);
  setCourierAvailable("cour_b", true);
  const job = createDeliveryJob({
    orderId: "ord_re",
    from: "x",
    to: "y",
  });
  startDeliveryDispatchWorkflow(job.id);
  const firstOfferId = getDeliveryJob(job.id)!.offerId!;
  rejectOffer(firstOfferId, "cour_a");
  const afterReject = getDeliveryJob(job.id);
  assert.equal(afterReject?.status, "offered");
  assert.notEqual(afterReject?.offerId, firstOfferId);

  __resetDeliveryForTests();
  const queued = createDeliveryJob({ orderId: "ord_fifo", from: "f", to: "t" });
  const wf = startDeliveryDispatchWorkflow(queued.id);
  assert.equal(wf.phase, "fifo");
  assert.deepEqual(listFifoQueue(), [queued.id]);
  assert.equal(getDeliveryJob(queued.id)?.status, "queued_fifo");

  setCourierAvailable("cour_late", true);
  assert.equal(listFifoQueue().length, 0);
  assert.equal(getDeliveryJob(queued.id)?.status, "offered");

  __resetDeliveryForTests();
  setCourierAvailable("cour_t", true);
  const j2 = createDeliveryJob({ orderId: "ord_to", from: "a", to: "b" });
  startDeliveryDispatchWorkflow(j2.id);
  const oid = getDeliveryJob(j2.id)!.offerId!;
  timeoutOffer(oid);
  assert.equal(getDeliveryJob(j2.id)?.status, "queued_fifo");
});

test("S92 estimateRoute uses stub in fixture mode", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const { estimateRoute } = await import("./index.js");
  const r = await estimateRoute({ from: "A", to: "B" });
  assert.equal(r.provider, "osrm_vroom_stub");
  assert.ok(r.distanceMeters > 0);
});
