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
  runPd28AvailabilityOfflinePacksThinVertical,
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

test("PD28 availability + Harare/Bulawayo offline packs; MapLibre SoR", () => {
  const out = runPd28AvailabilityOfflinePacksThinVertical({
    courierId: "cour_pd28_t",
  });
  assert.equal(out.offlineIneligible, true);
  assert.equal(out.availableEligible, true);
  assert.equal(out.hararePackInstalled, true);
  assert.equal(out.bulawayoPackInstalled, true);
  assert.equal(out.busyAfterAccept, true);
  assert.equal(out.mapSor, "maplibre");
  assert.equal(out.googleMapsSor, false);
  assert.equal(out.payableFromAi, false);
});

test("Phase5-prep: offline pack URLs from MAP_OFFLINE_PACK_BASE_URL (MapLibre)", async () => {
  const {
    __resetOfflinePacksForTests,
    activateOfflinePack,
    listOfflinePackDefinitions,
  } = await import("./offlinePacks.js");
  __resetOfflinePacksForTests();
  const prev = process.env.MAP_OFFLINE_PACK_BASE_URL;
  process.env.MAP_OFFLINE_PACK_BASE_URL = "https://tiles.example.local/packs";
  try {
    const defs = listOfflinePackDefinitions();
    const harare = defs.find((d) => d.packId === "harare_metro");
    assert.ok(harare);
    assert.equal(harare.tileSchema, "maplibre_vector");
    assert.equal(
      harare.packUrl,
      "https://tiles.example.local/packs/harare_metro.mbtiles",
    );
    assert.equal(
      harare.styleUrl,
      "https://tiles.example.local/packs/harare_metro/style.json",
    );
    assert.equal(harare.mapSor, "maplibre");
    const installed = activateOfflinePack({
      courierId: "cour_p5_pack",
      packId: "harare_metro",
    });
    assert.equal(installed.packUrl, harare.packUrl);
    assert.equal(installed.styleUrl, harare.styleUrl);
  } finally {
    if (prev === undefined) delete process.env.MAP_OFFLINE_PACK_BASE_URL;
    else process.env.MAP_OFFLINE_PACK_BASE_URL = prev;
    __resetOfflinePacksForTests();
  }
});


test("PD29 ETA banner + navigate stops + VROOM re-optimise", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const { runPd29EtaStopsVroomThinVertical } = await import("./index.js");
  const out = await runPd29EtaStopsVroomThinVertical({ courierId: "cour_pd29_t" });
  assert.ok(out.stopCount >= 3);
  assert.ok(out.etaMinutes >= 1);
  assert.equal(out.orderChanged, true);
  assert.equal(out.optimiseProvider, "fixture");
  assert.equal(out.mapSor, "maplibre");
  assert.equal(out.googleMapsSor, false);
  assert.equal(out.payableFromAi, false);
});

test("PD32 COD float-limit warning + ack gate", async () => {
  const { runPd32CodFloatLimitThinVertical } = await import("./index.js");
  const out = runPd32CodFloatLimitThinVertical({ courierId: "cour_pd32_t" });
  assert.equal(out.withinLimitNoWarn, true);
  assert.equal(out.overLimitWarned, true);
  assert.equal(out.blockedWithoutAck, true);
  assert.equal(out.recordedWithAck, true);
  assert.equal(out.payableFromAi, false);
  assert.equal(out.currency, "USD");
});

test("PD51 courier UX: POD photo + float banner ack", async () => {
  const { runPd51CourierUxThinVertical } = await import("./index.js");
  const out = runPd51CourierUxThinVertical({ courierId: "cour_pd51_t" });
  assert.equal(out.podPhotoCaptured, true);
  assert.equal(out.floatBannerShown, true);
  assert.equal(out.codAckRecorded, true);
  assert.equal(out.mapSor, "maplibre");
  assert.equal(out.payableFromAi, false);
});

test("PD56 manual override assign from FIFO", async () => {
  const { runPd56ManualOverrideAssignThinVertical } = await import("./index.js");
  const out = runPd56ManualOverrideAssignThinVertical({
    courierId: "cour_pd56_t",
  });
  assert.equal(out.status, "assigned");
  assert.equal(out.removedFromFifo, true);
  assert.equal(out.payableFromAi, false);
});

test("PD58 customer delivery track read-only", async () => {
  const { runPd58CustomerDeliveryTrackThinVertical } = await import("./index.js");
  const out = runPd58CustomerDeliveryTrackThinVertical();
  assert.equal(out.readOnly, true);
  assert.equal(out.hasLocation, true);
  assert.equal(out.mapSor, "maplibre");
  assert.equal(out.payableFromAi, false);
});

test("PD59 assignment event timeline", async () => {
  const { runPd59AssignmentEventsThinVertical } = await import("./index.js");
  const out = runPd59AssignmentEventsThinVertical();
  assert.equal(out.hasOfferRejectFifoOverride, true);
  assert.ok(out.eventTypes.includes("offered"));
  assert.ok(out.eventTypes.includes("rejected"));
  assert.ok(out.eventTypes.includes("fifo_queued"));
  assert.ok(out.eventTypes.includes("manual_override"));
  assert.equal(out.payableFromAi, false);
});

test("PD61 COD failure reason on attempt", async () => {
  const { runPd61CodFailureReasonThinVertical } = await import("./index.js");
  const out = runPd61CodFailureReasonThinVertical();
  assert.equal(out.failureRecorded, true);
  assert.equal(out.failureReason, "customer_refused");
  assert.equal(out.floatWarnStillWorks, true);
  assert.equal(out.currency, "USD");
});

test("PD63 POD signature + GPS → pod_media", async () => {
  const { runPd63PodSignatureGpsThinVertical } = await import("./index.js");
  const out = runPd63PodSignatureGpsThinVertical();
  assert.equal(out.hasPhoto, true);
  assert.equal(out.hasSignature, true);
  assert.equal(out.hasGps, true);
  assert.ok(out.podMediaId);
  assert.equal(out.mapSor, "maplibre");
  assert.equal(out.payableFromAi, false);
});

test("PD67 delivery run inbox", async () => {
  const { runPd67DeliveryRunInboxThinVertical } = await import("./index.js");
  const out = runPd67DeliveryRunInboxThinVertical();
  assert.equal(out.started, true);
  assert.ok(out.inboxCount >= 1);
  assert.ok(out.runId);
  assert.equal(out.mapSor, "maplibre");
  assert.equal(out.payableFromAi, false);
});

test("PD68 offer countdown timeout", async () => {
  const { runPd68OfferCountdownTimeoutThinVertical } = await import("./index.js");
  const out = runPd68OfferCountdownTimeoutThinVertical();
  assert.equal(out.countdownOk, true);
  assert.equal(out.timedOut, true);
  assert.equal(out.payableFromAi, false);
});

test("PD74 active run polyline MapLibre", async () => {
  const { runPd74ActiveRunPolylineThinVertical } = await import("./index.js");
  const out = await runPd74ActiveRunPolylineThinVertical({
    courierId: "cour_pd74_t",
  });
  assert.ok(out.stopCount >= 2);
  assert.ok(out.coordinateCount >= 2);
  assert.equal(out.mapSor, "maplibre");
  assert.equal(out.googleMapsSor, false);
  assert.equal(out.payableFromAi, false);
});

test("PD77 complete stop completes delivery_run", async () => {
  const { runPd77CompleteStopThinVertical } = await import("./index.js");
  const out = await runPd77CompleteStopThinVertical({
    courierId: "cour_pd77_t",
  });
  assert.equal(out.allStopsCompleted, true);
  assert.equal(out.runCompleted, true);
  assert.equal(out.mapSor, "maplibre");
  assert.equal(out.payableFromAi, false);
});

test("PD80 COD confirm thin vertical", async () => {
  const { runPd80CodConfirmThinVertical } = await import("./index.js");
  const out = runPd80CodConfirmThinVertical({ courierId: "cour_pd80_t" });
  assert.equal(out.confirmed, true);
  assert.equal(out.settleUsdMinor, "1500");
  assert.equal(out.currency, "USD");
  assert.equal(out.payableFromAi, false);
});

test("PD36 multi-vendor same band/slot consolidates; split on slot; POD unchanged", async () => {
  const { runPd36MultiStopDeliveryThinVertical } = await import("./index.js");
  const out = await runPd36MultiStopDeliveryThinVertical({
    courierId: "cour_pd36_t",
  });
  assert.equal(out.consolidatedJobCount, 1);
  assert.equal(out.splitJobCount, 2);
  assert.equal(out.multiStopPickupCount, 2);
  assert.equal(out.podStatus, "pod_captured");
  assert.equal(out.liquorAllowed, false);
  assert.equal(out.podSpoilageRulesUnchanged, true);
  assert.equal(out.payableFromAi, false);
  assert.equal(out.mapSor, "maplibre");
  assert.equal(out.googleMapsSor, false);
});

test("PD36 planMultiStopDeliveries groups by band|slot", async () => {
  const { planMultiStopDeliveries } = await import("./multiStopPlan.js");
  const plans = planMultiStopDeliveries({
    orderId: "ord_plan",
    dropoffAddress: "customer_avondale",
    vendors: [
      {
        supplierId: "a",
        supplierDisplayName: "A Agency",
        pickupAddress: "supplier_hub_harare",
        deliveryBandId: "harare_metro",
        slotId: "slot_am",
        vertical: "spare",
        ageGateRequired: false,
        hasRestrictedSku: false,
      },
      {
        supplierId: "b",
        supplierDisplayName: "B Agency",
        pickupAddress: "waypoint_borrowdale",
        deliveryBandId: "harare_metro",
        slotId: "slot_am",
        vertical: "spare",
        ageGateRequired: false,
        hasRestrictedSku: false,
      },
    ],
  });
  assert.equal(plans.length, 1);
  assert.equal(plans[0]!.mode, "one_multi_stop");
  assert.equal(plans[0]!.stopSequence.length, 3);
});
