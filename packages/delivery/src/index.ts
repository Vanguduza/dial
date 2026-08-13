/**
 * Delivery job SoR (D-45) — packages/delivery + DeliveryDispatchWorkflow stub.
 * Not Fleetbase. Distance/ETA: OSRM/VROOM stubs (D-44) — never Google/Mapbox SoR.
 */
import { type Money, money } from "@dial/shared";

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
 * Route estimate — uses @dial/adapter-maps when not fixture and OSRM_URL set;
 * otherwise deterministic stub (never Google/Mapbox — D-44).
 */
export async function estimateRoute(input: {
  from: string;
  to: string;
}): Promise<{
  distanceMeters: number;
  etaMinutes: number;
  provider: "osrm_vroom_stub" | "osrm" | "fixture" | "vroom";
}> {
  const mode = (process.env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (mode !== "fixture" && process.env.OSRM_URL?.trim()) {
    const maps = await import("@dial/adapter-maps");
    const from = await maps.geocodeNominatim(input.from);
    const to = await maps.geocodeNominatim(input.to);
    const route = await maps.estimateRouteOsrm(from, to);
    return {
      distanceMeters: route.distanceMeters,
      etaMinutes: Math.max(1, Math.round(route.durationSeconds / 60)),
      provider: route.provider,
    };
  }
  return estimateRouteStub(input);
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
  if (available) availableCouriers.add(courierId);
  else availableCouriers.delete(courierId);
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
  const courierId = [...availableCouriers].find((c) => !seen!.has(c));
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

export function capturePod(jobId: string): DeliveryJob {
  const job = jobs.get(jobId);
  if (!job) throw new Error("Unknown job");
  if (job.status !== "assigned" && job.status !== "in_transit") {
    throw new Error("Job not ready for POD");
  }
  job.status = "pod_captured";
  job.podAt = new Date().toISOString();
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

export function __resetDeliveryForTests(): void {
  jobs.clear();
  offers.clear();
  workflows.clear();
  availableCouriers.clear();
  offeredCouriersByJob.clear();
  fifoQueue.length = 0;
}
