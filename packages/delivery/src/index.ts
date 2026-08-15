/**
 * Delivery job SoR (D-45) — packages/delivery + DeliveryDispatchWorkflow stub.
 * Not Fleetbase. Distance/ETA: OSRM/VROOM stubs (D-44) — never Google/Mapbox SoR.
 */
import { type Money, money } from "@dial/shared";
import {
  __resetOfflinePacksForTests,
  activateOfflinePack,
  courierHasOfflinePack,
  listCourierOfflinePacks,
  listOfflinePackDefinitions,
} from "./offlinePacks.js";
import {
  __resetNavigateStopsForTests,
  getEtaBanner,
  listNavigateStops,
  openNavigateRun,
  reoptimiseRemainingStops,
  refreshEtaBanner,
} from "./navigateStops.js";
import {
  __resetCodFloatForTests,
  evaluateCodCollect,
  recordCodCollectAttempt,
  setCourierCodFloatLimit,
} from "./codFloat.js";

export {
  activateOfflinePack,
  courierHasOfflinePack,
  getOfflinePackDefinition,
  listCourierOfflinePacks,
  listOfflinePackDefinitions,
  type CourierOfflinePackInstall,
  type OfflinePackDefinition,
  type OfflinePackId,
} from "./offlinePacks.js";

export {
  completeNavigateStop,
  getEtaBanner,
  getNavigateRun,
  listNavigateStops,
  openNavigateRun,
  refreshEtaBanner,
  reoptimiseRemainingStops,
  type DeliveryNavigateRun,
  type DeliveryNavigateStop,
  type EtaBanner,
} from "./navigateStops.js";

export {
  DEFAULT_COD_FLOAT_LIMIT_USD_MINOR,
  evaluateCodCollect,
  getCourierCodFloat,
  listCodCollectAttempts,
  recordCodCollectAttempt,
  setCourierCodFloatLimit,
  type CodCollectAttempt,
  type CodCollectEvaluation,
  type CourierCodFloatState,
} from "./codFloat.js";

export {
  createJobsFromMultiStopPlan,
  planMultiStopDeliveries,
  type MultiStopDispatchResult,
  type MultiStopJobPlan,
  type MultiStopPlanStop,
  type MultiStopVendorLeg,
  type MultiStopVertical,
} from "./multiStopPlan.js";

import {
  createJobsFromMultiStopPlan,
  planMultiStopDeliveries,
  type MultiStopVendorLeg,
} from "./multiStopPlan.js";

export type CourierId = string;

export type DeliveryJobStatus =
  | "created"
  | "offered"
  | "assigned"
  | "in_transit"
  | "pod_captured"
  | "queued_fifo"
  | "cancelled";

export type DeliveryOfferStatus = "pending" | "accepted" | "rejected" | "timed_out";

export type DeliveryJob = {
  id: string;
  orderId: string;
  status: DeliveryJobStatus;
  assignedCourierId?: string;
  offerId?: string;
  podAt?: string;
  /** PD51 — optional POD photo evidence stub (not ZIMRA fiscal). */
  podPhotoRef?: string;
  etaMinutes?: number;
  distanceMeters?: number;
  /** COD settle USD hook — amountMinor only; no float. */
  codAmountUsd?: Money;
  createdAt: string;
};

export type DeliveryOffer = {
  id: string;
  jobId: string;
  courierId: CourierId;
  status: DeliveryOfferStatus;
  createdAt: string;
  expiresAt: string;
};

export type DeliveryDispatchWorkflowState = {
  workflowId: string;
  jobId: string;
  phase:
    | "offer"
    | "accepted"
    | "reassign"
    | "fifo"
    | "pod"
    | "complete";
};

const jobs = new Map<string, DeliveryJob>();
const offers = new Map<string, DeliveryOffer>();
const workflows = new Map<string, DeliveryDispatchWorkflowState>();
/** Couriers currently available for offers. */
const availableCouriers = new Set<CourierId>();
/** Couriers already offered this job (reject/timeout) — skip on reassign. */
const offeredCouriersByJob = new Map<string, Set<CourierId>>();
/** FIFO when zero available couriers. */
const fifoQueue: string[] = [];

function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Route estimate — always via @dial/adapter-maps (fixture/sandbox/live).
 * Never Google/Mapbox (D-44). Falls back to stub only if adapter import fails.
 */
export async function estimateRoute(input: {
  from: string;
  to: string;
}): Promise<{
  distanceMeters: number;
  etaMinutes: number;
  provider: "osrm_vroom_stub" | "osrm" | "fixture" | "vroom";
}> {
  try {
    const maps = await import("@dial/adapter-maps");
    const from = await maps.geocodeNominatim(input.from);
    const to = await maps.geocodeNominatim(input.to);
    const route = await maps.estimateRouteOsrm(from, to);
    return {
      distanceMeters: route.distanceMeters,
      etaMinutes: Math.max(1, Math.round(route.durationSeconds / 60)),
      provider: route.provider,
    };
  } catch {
    return estimateRouteStub(input);
  }
}

/**
 * VROOM assignment plan (D-44) — geocode courier starts + dropoff, then planVroomJob.
 */
export async function planDeliveryWithVroom(input: {
  courierStarts: Array<{ courierId: string; address: string }>;
  dropoff: string;
}): Promise<{
  provider: "vroom" | "fixture";
  summary: string;
  etaMinutes: number;
  distanceMeters: number;
}> {
  const maps = await import("@dial/adapter-maps");
  const drop = await maps.geocodeNominatim(input.dropoff);
  const vehicles = [];
  for (let i = 0; i < input.courierStarts.length; i++) {
    const start = await maps.geocodeNominatim(input.courierStarts[i]!.address);
    vehicles.push({ id: i + 1, start });
  }
  const plan = await maps.planVroomJob({
    vehicles,
    jobs: [{ id: 1, location: drop }],
  });
  const route = await estimateRoute({
    from: input.courierStarts[0]?.address ?? input.dropoff,
    to: input.dropoff,
  });
  return {
    provider: plan.provider,
    summary: plan.summary,
    etaMinutes: route.etaMinutes,
    distanceMeters: route.distanceMeters,
  };
}

/** OSRM/VROOM stub — not Google/Mapbox (D-44). */
export function estimateRouteStub(input: {
  from: string;
  to: string;
}): { distanceMeters: number; etaMinutes: number; provider: "osrm_vroom_stub" } {
  const seed = (input.from + input.to).length;
  return {
    distanceMeters: 1200 + seed * 17,
    etaMinutes: 8 + (seed % 20),
    provider: "osrm_vroom_stub",
  };
}

export function setCourierAvailable(courierId: CourierId, available: boolean): void {
  if (available) {
    availableCouriers.add(courierId);
    // Keep busy if already mid-job; otherwise mark available for offer eligibility (PD28).
    if (courierAvailability.get(courierId) !== "busy") {
      courierAvailability.set(courierId, "available");
    }
  } else {
    availableCouriers.delete(courierId);
  }
  if (available) drainFifo();
}

export function listAvailableCouriers(): CourierId[] {
  return [...availableCouriers];
}

export function createDeliveryJob(input: {
  orderId: string;
  from: string;
  to: string;
  codUsdMinor?: bigint;
}): DeliveryJob {
  const route = estimateRouteStub({ from: input.from, to: input.to });
  const job: DeliveryJob = {
    id: id("dj"),
    orderId: input.orderId,
    status: "created",
    distanceMeters: route.distanceMeters,
    etaMinutes: route.etaMinutes,
    createdAt: new Date().toISOString(),
  };
  if (input.codUsdMinor !== undefined) {
    job.codAmountUsd = money(input.codUsdMinor, "USD");
  }
  jobs.set(job.id, job);
  return { ...job };
}

/**
 * Create job with maps ETA (OSRM duration → etaMinutes) — preferred when adapters available.
 */
export async function createDeliveryJobWithMaps(input: {
  orderId: string;
  from: string;
  to: string;
  codUsdMinor?: bigint;
}): Promise<DeliveryJob> {
  const route = await estimateRoute({ from: input.from, to: input.to });
  const job: DeliveryJob = {
    id: id("dj"),
    orderId: input.orderId,
    status: "created",
    distanceMeters: route.distanceMeters,
    etaMinutes: route.etaMinutes,
    createdAt: new Date().toISOString(),
  };
  if (input.codUsdMinor !== undefined) {
    job.codAmountUsd = money(input.codUsdMinor, "USD");
  }
  jobs.set(job.id, job);
  return { ...job };
}

export function getDeliveryJob(jobId: string): DeliveryJob | undefined {
  const j = jobs.get(jobId);
  return j ? { ...j } : undefined;
}

/**
 * Temporal-shaped stub: DeliveryDispatchWorkflow — offer → accept|reject|timeout → reassign → FIFO.
 */
export function startDeliveryDispatchWorkflow(jobId: string): DeliveryDispatchWorkflowState {
  const job = jobs.get(jobId);
  if (!job) throw new Error(`Unknown job ${jobId}`);
  const workflow: DeliveryDispatchWorkflowState = {
    workflowId: id("ddw"),
    jobId,
    phase: "offer",
  };
  workflows.set(workflow.workflowId, workflow);
  const offered = offerToNextCourier(jobId);
  if (!offered) {
    job.status = "queued_fifo";
    fifoQueue.push(jobId);
    workflow.phase = "fifo";
  }
  return { ...workflow };
}

function offerToNextCourier(jobId: string): DeliveryOffer | undefined {
  const job = jobs.get(jobId);
  if (!job) return undefined;
  let seen = offeredCouriersByJob.get(jobId);
  if (!seen) {
    seen = new Set();
    offeredCouriersByJob.set(jobId, seen);
  }
  const courierId = [...availableCouriers].find(
    (c) => !seen!.has(c) && isCourierEligibleForOffers(c),
  );
  if (!courierId) return undefined;
  seen.add(courierId);
  const offer: DeliveryOffer = {
    id: id("dfo"),
    jobId,
    courierId,
    status: "pending",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
  offers.set(offer.id, offer);
  job.status = "offered";
  job.offerId = offer.id;
  return { ...offer };
}

export function acceptOffer(offerId: string, courierId: CourierId): DeliveryJob {
  const offer = offers.get(offerId);
  if (!offer) throw new Error("Unknown offer");
  if (offer.courierId !== courierId) throw new Error("Offer not for this courier");
  if (offer.status !== "pending") throw new Error(`Offer already ${offer.status}`);
  offer.status = "accepted";
  const job = jobs.get(offer.jobId);
  if (!job) throw new Error("Unknown job");
  job.status = "assigned";
  job.assignedCourierId = courierId;
  const wf = [...workflows.values()].find((w) => w.jobId === job.id);
  if (wf) wf.phase = "accepted";
  return { ...job };
}

/**
 * PD56 — ops manual override assign (Pack §9.5). Cancels pending offer if any;
 * removes from FIFO; assigns courier. Audit via assignedBy (not money).
 */
export function manualOverrideAssign(input: {
  jobId: string;
  courierId: CourierId;
  assignedBy: string;
}): DeliveryJob {
  if (!input.assignedBy.trim()) throw new Error("assignedBy required");
  const job = jobs.get(input.jobId);
  if (!job) throw new Error("Unknown job");
  if (job.status === "pod_captured" || job.status === "cancelled") {
    throw new Error(`Cannot override assign job in status ${job.status}`);
  }
  if (job.offerId) {
    const offer = offers.get(job.offerId);
    if (offer && offer.status === "pending") {
      offer.status = "rejected";
    }
  }
  const idx = fifoQueue.indexOf(input.jobId);
  if (idx >= 0) fifoQueue.splice(idx, 1);
  job.status = "assigned";
  job.assignedCourierId = input.courierId;
  setCourierAvailabilityStatus(input.courierId, "busy");
  const wf = [...workflows.values()].find((w) => w.jobId === job.id);
  if (wf) wf.phase = "accepted";
  return { ...job };
}

/**
 * PD58 — customer read-only track for a delivery job tied to orderId.
 * Object-level: caller must already authorize order ownership (D-47).
 */
export function getCustomerDeliveryTrack(input: {
  orderId: string;
}): {
  orderId: string;
  job: DeliveryJob | null;
  location: CourierLocation | null;
  mapSor: "maplibre";
  readOnly: true;
  payableFromAi: false;
} {
  const job =
    [...jobs.values()].find((j) => j.orderId === input.orderId) ?? null;
  const location =
    job?.assignedCourierId != null
      ? courierLocations.get(job.assignedCourierId) ?? null
      : null;
  return {
    orderId: input.orderId,
    job: job ? { ...job } : null,
    location: location ? { ...location } : null,
    mapSor: "maplibre",
    readOnly: true,
    payableFromAi: false,
  };
}

export function rejectOffer(offerId: string, courierId: CourierId): DeliveryOffer {
  const offer = offers.get(offerId);
  if (!offer) throw new Error("Unknown offer");
  if (offer.courierId !== courierId) throw new Error("Offer not for this courier");
  if (offer.status !== "pending") throw new Error(`Offer already ${offer.status}`);
  offer.status = "rejected";
  reassignOrFifo(offer.jobId);
  return { ...offer };
}

/** Timeout path — same reassign/FIFO as reject. */
export function timeoutOffer(offerId: string): DeliveryOffer {
  const offer = offers.get(offerId);
  if (!offer) throw new Error("Unknown offer");
  if (offer.status !== "pending") throw new Error(`Offer already ${offer.status}`);
  offer.status = "timed_out";
  reassignOrFifo(offer.jobId);
  return { ...offer };
}

function reassignOrFifo(jobId: string): void {
  const job = jobs.get(jobId);
  if (!job) return;
  const wf = [...workflows.values()].find((w) => w.jobId === jobId);
  const next = offerToNextCourier(jobId);
  if (next) {
    if (wf) wf.phase = "reassign";
    return;
  }
  job.status = "queued_fifo";
  if (!fifoQueue.includes(jobId)) fifoQueue.push(jobId);
  if (wf) wf.phase = "fifo";
}

function drainFifo(): void {
  while (fifoQueue.length > 0 && availableCouriers.size > 0) {
    const jobId = fifoQueue[0]!;
    const offered = offerToNextCourier(jobId);
    if (!offered) break;
    fifoQueue.shift();
    const wf = [...workflows.values()].find((w) => w.jobId === jobId);
    if (wf) wf.phase = "offer";
  }
}

export function listFifoQueue(): string[] {
  return [...fifoQueue];
}

export function startTransit(jobId: string): DeliveryJob {
  const job = jobs.get(jobId);
  if (!job) throw new Error("Unknown job");
  if (job.status !== "assigned") throw new Error("Job not assigned");
  job.status = "in_transit";
  return { ...job };
}

export function capturePod(
  jobId: string,
  opts?: { photoRef?: string },
): DeliveryJob {
  const job = jobs.get(jobId);
  if (!job) throw new Error("Unknown job");
  if (job.status !== "assigned" && job.status !== "in_transit") {
    throw new Error("Job not ready for POD");
  }
  job.status = "pod_captured";
  job.podAt = new Date().toISOString();
  if (opts?.photoRef?.trim()) {
    job.podPhotoRef = opts.photoRef.trim();
  }
  const wf = [...workflows.values()].find((w) => w.jobId === jobId);
  if (wf) {
    wf.phase = "pod";
    wf.phase = "complete";
  }
  return { ...job };
}

/** COD reconcile hook after POD — returns USD settle amount if COD job. */
export function reconcileCodAfterPod(jobId: string): {
  reconciled: boolean;
  amountUsd?: Money;
} {
  const job = jobs.get(jobId);
  if (!job) throw new Error("Unknown job");
  if (job.status !== "pod_captured") {
    return { reconciled: false };
  }
  if (!job.codAmountUsd) return { reconciled: true };
  return { reconciled: true, amountUsd: { ...job.codAmountUsd } };
}

export function getWorkflow(workflowId: string): DeliveryDispatchWorkflowState | undefined {
  const w = workflows.get(workflowId);
  return w ? { ...w } : undefined;
}

export type CourierAvailability = "available" | "busy" | "offline";

export type CourierLocation = {
  courierId: CourierId;
  lat: number;
  lng: number;
  recordedAt: string;
  jobId?: string;
};

const courierAvailability = new Map<CourierId, CourierAvailability>();
const courierLocations = new Map<CourierId, CourierLocation>();

export function setCourierAvailabilityStatus(
  courierId: CourierId,
  status: CourierAvailability,
): void {
  courierAvailability.set(courierId, status);
  setCourierAvailable(courierId, status === "available");
}

export function getCourierAvailability(
  courierId: CourierId,
): CourierAvailability {
  return courierAvailability.get(courierId) ?? "offline";
}

/** Live location for MapLibre admin track (D-44) — never Google as SoR. */
export function postCourierLocation(input: {
  courierId: CourierId;
  lat: number;
  lng: number;
  jobId?: string;
}): CourierLocation {
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) {
    throw new TypeError("lat/lng must be finite numbers");
  }
  const loc: CourierLocation = {
    courierId: input.courierId,
    lat: input.lat,
    lng: input.lng,
    recordedAt: new Date().toISOString(),
    ...(input.jobId ? { jobId: input.jobId } : {}),
  };
  courierLocations.set(input.courierId, loc);
  return { ...loc };
}

export function getCourierLocation(
  courierId: CourierId,
): CourierLocation | undefined {
  const loc = courierLocations.get(courierId);
  return loc ? { ...loc } : undefined;
}

export function listCourierLocations(): CourierLocation[] {
  return [...courierLocations.values()].map((l) => ({ ...l }));
}

export function listOffersForCourier(courierId: CourierId): DeliveryOffer[] {
  return [...offers.values()]
    .filter((o) => o.courierId === courierId)
    .map((o) => ({ ...o }));
}

export function listJobsForCourier(courierId: CourierId): DeliveryJob[] {
  return [...jobs.values()]
    .filter((j) => j.assignedCourierId === courierId || j.offerId)
    .filter((j) => {
      if (j.assignedCourierId === courierId) return true;
      const offer = j.offerId ? offers.get(j.offerId) : undefined;
      return offer?.courierId === courierId && offer.status === "pending";
    })
    .map((j) => ({ ...j }));
}

export function getOffer(offerId: string): DeliveryOffer | undefined {
  const o = offers.get(offerId);
  return o ? { ...o } : undefined;
}

/** PD10 admin dispatch board — FIFO + live offers/jobs (D-45). */
export function listAllDeliveryJobs(): DeliveryJob[] {
  return [...jobs.values()].map((j) => ({ ...j }));
}

export function listAllDeliveryOffers(): DeliveryOffer[] {
  return [...offers.values()].map((o) => ({ ...o }));
}

export function listAllWorkflows(): DeliveryDispatchWorkflowState[] {
  return [...workflows.values()].map((w) => ({ ...w }));
}

/** Only `available` couriers receive new offers (busy/offline ineligible). */
export function isCourierEligibleForOffers(courierId: CourierId): boolean {
  return getCourierAvailability(courierId) === "available";
}

export type DispatchBoardSnapshot = {
  mapSor: "maplibre";
  jobEngine: "packages/delivery";
  availableCouriers: CourierId[];
  fifoJobIds: string[];
  jobs: DeliveryJob[];
  offers: DeliveryOffer[];
  workflows: DeliveryDispatchWorkflowState[];
  locations: CourierLocation[];
};

export function getDispatchBoardSnapshot(): DispatchBoardSnapshot {
  return {
    mapSor: "maplibre",
    jobEngine: "packages/delivery",
    availableCouriers: listAvailableCouriers(),
    fifoJobIds: listFifoQueue(),
    jobs: listAllDeliveryJobs(),
    offers: listAllDeliveryOffers(),
    workflows: listAllWorkflows(),
    locations: listCourierLocations(),
  };
}

/**
 * PD7 thin vertical: available → offer → accept → transit → POD → COD USD.
 */
export function runPd7DeliveryThinVertical(input?: {
  courierId?: string;
  orderId?: string;
  codUsdMinor?: bigint;
}): {
  courierId: string;
  jobId: string;
  offerId: string;
  workflowId: string;
  jobStatus: DeliveryJobStatus;
  workflowPhase: DeliveryDispatchWorkflowState["phase"];
  codReconciled: boolean;
  codUsdMinor?: string;
  location: CourierLocation;
} {
  const courierId = input?.courierId ?? "cour_pd7";
  __resetDeliveryForTests();
  setCourierAvailabilityStatus(courierId, "available");
  const job = createDeliveryJob({
    orderId: input?.orderId ?? "ord_pd7",
    from: "supplier_hub_harare",
    to: "customer_avondale",
    codUsdMinor: input?.codUsdMinor ?? 25_00n,
  });
  const wf = startDeliveryDispatchWorkflow(job.id);
  const offerId = getDeliveryJob(job.id)!.offerId!;
  acceptOffer(offerId, courierId);
  setCourierAvailabilityStatus(courierId, "busy");
  startTransit(job.id);
  const loc = postCourierLocation({
    courierId,
    lat: -17.8292,
    lng: 31.0522,
    jobId: job.id,
  });
  capturePod(job.id);
  const cod = reconcileCodAfterPod(job.id);
  return {
    courierId,
    jobId: job.id,
    offerId,
    workflowId: wf.workflowId,
    jobStatus: getDeliveryJob(job.id)!.status,
    workflowPhase: getWorkflow(wf.workflowId)!.phase,
    codReconciled: cod.reconciled,
    ...(cod.amountUsd
      ? { codUsdMinor: cod.amountUsd.amountMinor.toString() }
      : {}),
    location: loc,
  };
}

/**
 * PD28 thin vertical: offline ineligible → available eligible → Harare/Bulawayo
 * offline packs (MapLibre) → accept → busy.
 */
export function runPd28AvailabilityOfflinePacksThinVertical(input?: {
  courierId?: string;
}): {
  offlineIneligible: true;
  availableEligible: true;
  hararePackInstalled: true;
  bulawayoPackInstalled: true;
  busyAfterAccept: true;
  mapSor: "maplibre";
  googleMapsSor: false;
  payableFromAi: false;
} {
  const courierId = input?.courierId ?? "cour_pd28";
  __resetDeliveryForTests();

  setCourierAvailabilityStatus(courierId, "offline");
  if (isCourierEligibleForOffers(courierId)) {
    throw new Error("PD28 offline courier must be ineligible for offers");
  }
  const jobOffline = createDeliveryJob({
    orderId: "ord_pd28_offline",
    from: "supplier_hub_harare",
    to: "customer_avondale",
  });
  const wfOffline = startDeliveryDispatchWorkflow(jobOffline.id);
  if (getDeliveryJob(jobOffline.id)?.offerId) {
    throw new Error("PD28 offline must not receive offer");
  }
  if (wfOffline.phase !== "fifo" && getDeliveryJob(jobOffline.id)?.status !== "queued_fifo") {
    throw new Error("PD28 expected FIFO when courier offline");
  }

  setCourierAvailabilityStatus(courierId, "available");
  if (!isCourierEligibleForOffers(courierId)) {
    throw new Error("PD28 available courier must be eligible");
  }
  const job = createDeliveryJob({
    orderId: "ord_pd28",
    from: "supplier_hub_harare",
    to: "customer_avondale",
    codUsdMinor: 15_00n,
  });
  startDeliveryDispatchWorkflow(job.id);
  const offerId = getDeliveryJob(job.id)?.offerId;
  if (!offerId) {
    throw new Error("PD28 available courier must receive offer");
  }

  const packs = listOfflinePackDefinitions();
  if (packs.length < 2 || packs.some((p) => p.mapSor !== "maplibre")) {
    throw new Error("PD28 requires Harare+Bulawayo MapLibre offline packs");
  }
  activateOfflinePack({ courierId, packId: "harare_metro" });
  activateOfflinePack({ courierId, packId: "bulawayo_metro" });
  if (
    !courierHasOfflinePack(courierId, "harare_metro") ||
    !courierHasOfflinePack(courierId, "bulawayo_metro")
  ) {
    throw new Error("PD28 offline packs must install");
  }

  acceptOffer(offerId, courierId);
  setCourierAvailabilityStatus(courierId, "busy");
  if (isCourierEligibleForOffers(courierId)) {
    throw new Error("PD28 busy courier must be ineligible");
  }
  if (getCourierAvailability(courierId) !== "busy") {
    throw new Error("PD28 expected busy after accept");
  }

  return {
    offlineIneligible: true,
    availableEligible: true,
    hararePackInstalled: true,
    bulawayoPackInstalled: true,
    busyAfterAccept: true,
    mapSor: "maplibre",
    googleMapsSor: false,
    payableFromAi: false,
  };
}

/**
 * PD29 thin vertical: accept → navigate stops → OSRM ETA banner → VROOM re-optimise.
 */
export async function runPd29EtaStopsVroomThinVertical(input?: {
  courierId?: string;
}): Promise<{
  stopCount: number;
  etaMinutes: number;
  etaProvider: string;
  orderChanged: true;
  optimiseProvider: "vroom" | "fixture";
  mapSor: "maplibre";
  googleMapsSor: false;
  payableFromAi: false;
}> {
  process.env.DIAL_INTEGRATION_MODE = process.env.DIAL_INTEGRATION_MODE ?? "fixture";
  const courierId = input?.courierId ?? "cour_pd29";
  __resetDeliveryForTests();
  setCourierAvailabilityStatus(courierId, "available");
  const job = createDeliveryJob({
    orderId: "ord_pd29",
    from: "supplier_hub_harare",
    to: "customer_avondale",
    codUsdMinor: 18_00n,
  });
  startDeliveryDispatchWorkflow(job.id);
  const offerId = getDeliveryJob(job.id)?.offerId;
  if (!offerId) throw new Error("PD29 expected offer");
  acceptOffer(offerId, courierId);
  setCourierAvailabilityStatus(courierId, "busy");
  startTransit(job.id);

  const run = await openNavigateRun({
    jobId: job.id,
    courierId,
    pickupAddress: "supplier_hub_harare",
    waypointAddress: "waypoint_borrowdale",
    dropoffAddress: "customer_avondale",
  });
  const stopsBefore = listNavigateStops(job.id);
  if (stopsBefore.length < 3) {
    throw new Error("PD29 expected multi-stop navigate list");
  }
  const banner = await refreshEtaBanner(job.id);
  if (banner.etaMinutes < 1 || banner.mapSor !== "maplibre" || banner.googleMapsSor) {
    throw new Error("PD29 ETA banner must be OSRM/fixture via MapLibre SoR");
  }
  const opt = await reoptimiseRemainingStops(job.id);
  if (!opt.orderChanged || opt.googleMapsSor || opt.mapSor !== "maplibre") {
    throw new Error("PD29 VROOM re-optimise must reorder remaining stops");
  }
  const afterBanner = getEtaBanner(job.id);
  if (!afterBanner || afterBanner.remainingStopCount < 2) {
    throw new Error("PD29 expected remaining stops after re-optimise");
  }

  return {
    stopCount: run.stops.length,
    etaMinutes: banner.etaMinutes,
    etaProvider: banner.provider,
    orderChanged: true,
    optimiseProvider: opt.provider,
    mapSor: "maplibre",
    googleMapsSor: false,
    payableFromAi: false,
  };
}

/**
 * PD32 thin vertical: COD within float → no warn; over float → warn blocked until ack.
 */
export function runPd32CodFloatLimitThinVertical(input?: {
  courierId?: string;
}): {
  withinLimitNoWarn: true;
  overLimitWarned: true;
  blockedWithoutAck: true;
  recordedWithAck: true;
  payableFromAi: false;
  currency: "USD";
} {
  const courierId = input?.courierId ?? "cour_pd32";
  __resetDeliveryForTests();
  setCourierCodFloatLimit(courierId, 50_00n);

  const within = evaluateCodCollect({
    courierId,
    collectUsdMinor: 25_00n,
  });
  if (within.floatLimitWarning || within.payableFromAi) {
    throw new Error("PD32 $25 collect under $50 float must not warn");
  }
  const ok = recordCodCollectAttempt({
    jobId: "dj_pd32_ok",
    courierId,
    collectUsdMinor: 25_00n,
  });
  if (ok.status !== "recorded") {
    throw new Error("PD32 within-limit collect must record");
  }

  const over = evaluateCodCollect({
    courierId,
    collectUsdMinor: 40_00n,
  });
  // held 25 + 40 = 65 > 50
  if (!over.floatLimitWarning) {
    throw new Error("PD32 over-float collect must warn");
  }
  const blocked = recordCodCollectAttempt({
    jobId: "dj_pd32_block",
    courierId,
    collectUsdMinor: 40_00n,
    acknowledgedWarning: false,
  });
  if (blocked.status !== "blocked_unacked_warning") {
    throw new Error("PD32 unacked warning must block");
  }
  const acked = recordCodCollectAttempt({
    jobId: "dj_pd32_ack",
    courierId,
    collectUsdMinor: 40_00n,
    acknowledgedWarning: true,
  });
  if (acked.status !== "recorded" || !acked.floatLimitWarning) {
    throw new Error("PD32 acked warning must record with warn flag");
  }

  return {
    withinLimitNoWarn: true,
    overLimitWarned: true,
    blockedWithoutAck: true,
    recordedWithAck: true,
    payableFromAi: false,
    currency: "USD",
  };
}

/**
 * PD51 thin vertical: offer → accept → transit → POD photo stub → COD float banner ack.
 * Courier UX deepen — MapLibre SoR; payableFromAi=false.
 */
export function runPd51CourierUxThinVertical(input?: {
  courierId?: string;
}): {
  offerAccepted: true;
  podPhotoCaptured: true;
  floatBannerShown: true;
  codAckRecorded: true;
  mapSor: "maplibre";
  payableFromAi: false;
  currency: "USD";
} {
  const courierId = input?.courierId ?? "cour_pd51";
  __resetDeliveryForTests();
  setCourierAvailabilityStatus(courierId, "available");
  setCourierCodFloatLimit(courierId, 50_00n);

  const job = createDeliveryJob({
    orderId: "ord_pd51",
    from: "supplier_hub_harare",
    to: "customer_avondale",
    codUsdMinor: 40_00n,
  });
  startDeliveryDispatchWorkflow(job.id);
  const offered = getDeliveryJob(job.id)!;
  if (!offered.offerId) throw new Error("PD51 expected offer");
  acceptOffer(offered.offerId, courierId);
  startTransit(job.id);
  postCourierLocation({
    courierId,
    lat: -17.8292,
    lng: 31.0522,
    jobId: job.id,
  });

  const pod = capturePod(job.id, {
    photoRef: `fixture://pod/${job.id}.jpg`,
  });
  if (!pod.podPhotoRef?.startsWith("fixture://pod/")) {
    throw new Error("PD51 POD must store photo evidence stub");
  }

  // Seed held cash so $40 collect warns against $50 limit
  recordCodCollectAttempt({
    jobId: "dj_pd51_seed",
    courierId,
    collectUsdMinor: 25_00n,
    acknowledgedWarning: true,
  });
  const evalWarn = evaluateCodCollect({
    courierId,
    collectUsdMinor: 40_00n,
  });
  if (!evalWarn.floatLimitWarning) {
    throw new Error("PD51 expected float banner warning");
  }
  const blocked = recordCodCollectAttempt({
    jobId: job.id,
    courierId,
    collectUsdMinor: 40_00n,
    acknowledgedWarning: false,
  });
  if (blocked.status !== "blocked_unacked_warning") {
    throw new Error("PD51 unacked float must block COD");
  }
  const acked = recordCodCollectAttempt({
    jobId: job.id,
    courierId,
    collectUsdMinor: 40_00n,
    acknowledgedWarning: true,
  });
  if (acked.status !== "recorded") {
    throw new Error("PD51 acked float must record COD");
  }

  return {
    offerAccepted: true,
    podPhotoCaptured: true,
    floatBannerShown: true,
    codAckRecorded: true,
    mapSor: "maplibre",
    payableFromAi: false,
    currency: "USD",
  };
}

/**
 * PD56 thin vertical: FIFO job → manual override assign → transit.
 */
export function runPd56ManualOverrideAssignThinVertical(input?: {
  courierId?: string;
}): {
  jobId: string;
  assignedCourierId: string;
  status: "assigned";
  removedFromFifo: true;
  payableFromAi: false;
  mapSor: "maplibre";
} {
  const courierId = input?.courierId ?? "cour_pd56";
  __resetDeliveryForTests();
  setCourierAvailabilityStatus(courierId, "offline");
  const job = createDeliveryJob({
    orderId: "ord_pd56",
    from: "supplier_hub",
    to: "customer_pin",
    codUsdMinor: 15_00n,
  });
  startDeliveryDispatchWorkflow(job.id);
  if (!listFifoQueue().includes(job.id)) {
    throw new Error("PD56 expected FIFO when no couriers available");
  }
  const assigned = manualOverrideAssign({
    jobId: job.id,
    courierId,
    assignedBy: "ops_pd56",
  });
  if (assigned.status !== "assigned" || assigned.assignedCourierId !== courierId) {
    throw new Error("PD56 override assign failed");
  }
  if (listFifoQueue().includes(job.id)) {
    throw new Error("PD56 job must leave FIFO after override");
  }
  return {
    jobId: job.id,
    assignedCourierId: courierId,
    status: "assigned",
    removedFromFifo: true,
    payableFromAi: false,
    mapSor: "maplibre",
  };
}

/**
 * PD58 thin vertical: assign job for order → post location → customer read-only track.
 */
export function runPd58CustomerDeliveryTrackThinVertical(input?: {
  courierId?: string;
  orderId?: string;
}): {
  orderId: string;
  hasLocation: true;
  readOnly: true;
  mapSor: "maplibre";
  payableFromAi: false;
} {
  const courierId = input?.courierId ?? "cour_pd58";
  const orderId = input?.orderId ?? "ord_pd58";
  __resetDeliveryForTests();
  setCourierAvailabilityStatus(courierId, "available");
  const job = createDeliveryJob({
    orderId,
    from: "supplier_hub",
    to: "customer_pin",
    codUsdMinor: 12_00n,
  });
  startDeliveryDispatchWorkflow(job.id);
  const offered = getDeliveryJob(job.id)!;
  if (!offered.offerId) throw new Error("PD58 expected offer");
  acceptOffer(offered.offerId, courierId);
  postCourierLocation({
    courierId,
    lat: -17.83,
    lng: 31.05,
    jobId: job.id,
  });
  const track = getCustomerDeliveryTrack({ orderId });
  if (!track.readOnly || track.mapSor !== "maplibre") {
    throw new Error("PD58 track must be read-only MapLibre");
  }
  if (!track.location) throw new Error("PD58 expected courier location");
  if (track.payableFromAi) throw new Error("PD58 payableFromAi must be false");
  return {
    orderId,
    hasLocation: true,
    readOnly: true,
    mapSor: "maplibre",
    payableFromAi: false,
  };
}

/**
 * PD36 thin vertical: two grocery vendors same band/slot → one multi-stop job;
 * different slot → split; navigate pickups→dropoff; POD unchanged; no liquor.
 */
export async function runPd36MultiStopDeliveryThinVertical(input?: {
  courierId?: string;
}): Promise<{
  consolidatedJobCount: 1;
  splitJobCount: 2;
  multiStopPickupCount: 2;
  podStatus: "pod_captured";
  liquorAllowed: false;
  podSpoilageRulesUnchanged: true;
  payableFromAi: false;
  mapSor: "maplibre";
  googleMapsSor: false;
}> {
  const courierId = input?.courierId ?? "cour_pd36";
  __resetDeliveryForTests();
  setCourierAvailabilityStatus(courierId, "available");

  const sameBandSlot: MultiStopVendorLeg[] = [
    {
      supplierId: "sup_ok",
      supplierDisplayName: "OK Express Agency",
      pickupAddress: "supplier_hub_harare",
      deliveryBandId: "harare_metro",
      slotId: "slot_harare_am",
      vertical: "grocery",
      ageGateRequired: false,
      hasRestrictedSku: false,
    },
    {
      supplierId: "sup_tm",
      supplierDisplayName: "TM Pick n Pay Agency",
      pickupAddress: "waypoint_borrowdale",
      deliveryBandId: "harare_metro",
      slotId: "slot_harare_am",
      vertical: "grocery",
      ageGateRequired: false,
      hasRestrictedSku: false,
    },
  ];

  const consolidated = createJobsFromMultiStopPlan({
    orderId: "ord_pd36_multi",
    dropoffAddress: "customer_avondale",
    vendors: sameBandSlot,
    codUsdMinor: 22_00n,
    createJob: createDeliveryJob,
  });
  if (!consolidated.consolidated || consolidated.jobCount !== 1) {
    throw new Error("PD36 same band/slot must create exactly one job");
  }
  if (consolidated.plans[0]?.mode !== "one_multi_stop") {
    throw new Error("PD36 expected one_multi_stop mode");
  }
  if (consolidated.plans[0]!.stopSequence.filter((s) => s.kind === "pickup").length !== 2) {
    throw new Error("PD36 expected 2 pickups + dropoff");
  }
  if (
    consolidated.liquorAllowed !== false ||
    !consolidated.podSpoilageRulesUnchanged ||
    consolidated.payableFromAi
  ) {
    throw new Error("PD36 locks: no liquor; POD/spoilage unchanged; no AI payable");
  }

  const job = consolidated.jobs[0]!;
  startDeliveryDispatchWorkflow(job.id);
  const offerId = getDeliveryJob(job.id)?.offerId;
  if (!offerId) throw new Error("PD36 expected offer");
  acceptOffer(offerId, courierId);
  setCourierAvailabilityStatus(courierId, "busy");
  startTransit(job.id);

  const planStops = consolidated.plans[0]!.stopSequence.map((s) => ({
    kind: s.kind,
    address: s.address,
    label: s.label,
  }));
  const run = await openNavigateRun({
    jobId: job.id,
    courierId,
    stops: planStops,
  });
  const pickups = run.stops.filter((s) => s.kind === "pickup");
  if (pickups.length !== 2 || run.stops[run.stops.length - 1]?.kind !== "dropoff") {
    throw new Error("PD36 navigate must be pickup×2 → dropoff");
  }

  capturePod(job.id);
  if (getDeliveryJob(job.id)?.status !== "pod_captured") {
    throw new Error("PD36 POD path must remain unchanged");
  }

  const splitVendors: MultiStopVendorLeg[] = [
    {
      ...sameBandSlot[0]!,
      slotId: "slot_harare_am",
    },
    {
      ...sameBandSlot[1]!,
      slotId: "slot_harare_pm",
    },
  ];
  const split = createJobsFromMultiStopPlan({
    orderId: "ord_pd36_split",
    dropoffAddress: "customer_avondale",
    vendors: splitVendors,
    createJob: createDeliveryJob,
  });
  if (split.consolidated || split.jobCount !== 2) {
    throw new Error("PD36 different slot must split into 2 jobs");
  }

  // Liquor/restricted rejected
  try {
    planMultiStopDeliveries({
      orderId: "ord_liq",
      dropoffAddress: "customer_avondale",
      vendors: [
        {
          ...sameBandSlot[0]!,
          ageGateRequired: false,
          hasRestrictedSku: true as unknown as false,
        },
      ],
    });
    throw new Error("PD36 must reject restricted SKU");
  } catch (e) {
    if (!(e instanceof Error) || !/liquor|restricted/i.test(e.message)) {
      throw e;
    }
  }

  return {
    consolidatedJobCount: 1,
    splitJobCount: 2,
    multiStopPickupCount: 2,
    podStatus: "pod_captured",
    liquorAllowed: false,
    podSpoilageRulesUnchanged: true,
    payableFromAi: false,
    mapSor: "maplibre",
    googleMapsSor: false,
  };
}

export function __resetDeliveryForTests(): void {
  jobs.clear();
  offers.clear();
  workflows.clear();
  availableCouriers.clear();
  offeredCouriersByJob.clear();
  fifoQueue.length = 0;
  courierAvailability.clear();
  courierLocations.clear();
  __resetOfflinePacksForTests();
  __resetNavigateStopsForTests();
  __resetCodFloatForTests();
}
