import assert from "node:assert/strict";
import { test } from "node:test";
import {
  __resetDeliveryForTests,
  acceptOffer,
  capturePod,
  createDeliveryJob,
  estimateRoute,
  estimateRouteStub,
  getDeliveryJob,
  listCourierLocations,
  listFifoQueue,
  getDispatchBoardSnapshot,
  reconcileCodAfterPod,
  rejectOffer,
  runPd7DeliveryThinVertical,
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

test("S103 estimateRoute bridges @dial/adapter-maps in fixture", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const r = await estimateRoute({ from: "Harare CBD", to: "Avondale" });
  assert.equal(r.provider, "fixture");
  assert.ok(r.distanceMeters > 0);
  assert.ok(r.etaMinutes >= 1);
});

test("S109 VROOM plan + maps ETA on createDeliveryJobWithMaps", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetDeliveryForTests();
  const { planDeliveryWithVroom, createDeliveryJobWithMaps } = await import(
    "./index.js"
  );
  const plan = await planDeliveryWithVroom({
    courierStarts: [{ courierId: "c1", address: "Harare CBD" }],
    dropoff: "Avondale",
  });
  assert.equal(plan.provider, "fixture");
  assert.match(plan.summary, /vehicles=1/);
  assert.ok(plan.etaMinutes >= 1);
  const job = await createDeliveryJobWithMaps({
    orderId: "ord_s109",
    from: "Harare CBD",
    to: "Avondale",
  });
  assert.equal(job.etaMinutes, plan.etaMinutes);
  assert.ok((job.distanceMeters ?? 0) > 0);
});

test("PD7 thin: available → offer → accept → POD → COD + courier location", () => {
  const result = runPd7DeliveryThinVertical({ courierId: "cour_pd7_t" });
  assert.equal(result.jobStatus, "pod_captured");
  assert.equal(result.workflowPhase, "complete");
  assert.equal(result.codReconciled, true);
  assert.equal(result.codUsdMinor, "2500");
  assert.equal(result.location.courierId, "cour_pd7_t");
  assert.ok(listCourierLocations().some((l) => l.courierId === "cour_pd7_t"));
});

test("PD10 dispatch board snapshot exposes FIFO + jobs", () => {
  __resetDeliveryForTests();
  const job = createDeliveryJob({
    orderId: "ord_pd10_board",
    from: "a",
    to: "b",
  });
  startDeliveryDispatchWorkflow(job.id);
  const board = getDispatchBoardSnapshot();
  assert.equal(board.mapSor, "maplibre");
  assert.equal(board.jobEngine, "packages/delivery");
  assert.ok(board.fifoJobIds.includes(job.id) || board.jobs.some((j) => j.id === job.id));
  assert.ok(board.jobs.length >= 1);
});
