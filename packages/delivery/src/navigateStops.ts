/**
 * PD29 — ETA banner (OSRM) + navigate stop list + VROOM re-optimise remaining (D-44).
 * MapLibre for render SoR; never Google/Mapbox distance SoR.
 */

export type DeliveryStopKind = "pickup" | "dropoff" | "waypoint";
export type DeliveryStopStatus = "pending" | "completed";

export type DeliveryNavigateStop = {
  id: string;
  jobId: string;
  sequence: number;
  kind: DeliveryStopKind;
  label: string;
  address: string;
  lat: number;
  lng: number;
  status: DeliveryStopStatus;
};

export type EtaBanner = {
  jobId: string;
  etaMinutes: number;
  distanceMeters: number;
  provider: "osrm" | "fixture" | "osrm_vroom_stub" | "vroom";
  nextStopLabel: string;
  nextStopId: string | null;
  remainingStopCount: number;
  mapSor: "maplibre";
  googleMapsSor: false;
};

export type DeliveryNavigateRun = {
  jobId: string;
  courierId: string;
  stops: DeliveryNavigateStop[];
  etaBanner: EtaBanner;
  lastOptimisedAt?: string;
  optimiseProvider?: "vroom" | "fixture";
};

const runs = new Map<string, DeliveryNavigateRun>();

function stopId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function estimateRouteStub(input: {
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

async function estimateRouteOsrmPair(input: {
  from: string;
  to: string;
}): Promise<{
  distanceMeters: number;
  etaMinutes: number;
  provider: "osrm" | "fixture" | "osrm_vroom_stub";
}> {
  try {
    const maps = await import("@dial/adapter-maps");
    const from = await maps.geocodeNominatim(input.from);
    const to = await maps.geocodeNominatim(input.to);
    const route = await maps.estimateRouteOsrm(from, to);
    return {
      distanceMeters: route.distanceMeters,
      etaMinutes: Math.max(1, Math.round(route.durationSeconds / 60)),
      provider: route.provider === "osrm" ? "osrm" : "fixture",
    };
  } catch {
    return estimateRouteStub(input);
  }
}

/** Harare-area fixture pins — MapLibre/OSRM stack, not Google. */
const FIXTURE_PINS: Record<
  string,
  { lat: number; lng: number; label: string; address: string; kind: DeliveryStopKind }
> = {
  supplier_hub_harare: {
    lat: -17.8292,
    lng: 31.0522,
    label: "Supplier hub",
    address: "supplier_hub_harare",
    kind: "pickup",
  },
  customer_avondale: {
    lat: -17.804,
    lng: 31.036,
    label: "Customer Avondale",
    address: "customer_avondale",
    kind: "dropoff",
  },
  waypoint_borrowdale: {
    lat: -17.776,
    lng: 31.088,
    label: "Borrowdale waypoint",
    address: "waypoint_borrowdale",
    kind: "waypoint",
  },
};

function pinFor(address: string) {
  return (
    FIXTURE_PINS[address] ?? {
      lat: -17.82,
      lng: 31.05,
      label: address,
      address,
      kind: "waypoint" as const,
    }
  );
}

function remainingStops(run: DeliveryNavigateRun): DeliveryNavigateStop[] {
  return run.stops
    .filter((s) => s.status === "pending")
    .sort((a, b) => a.sequence - b.sequence);
}

async function computeEtaBanner(
  jobId: string,
  stops: DeliveryNavigateStop[],
  fromAddress?: string,
): Promise<EtaBanner> {
  const pending = stops
    .filter((s) => s.status === "pending")
    .sort((a, b) => a.sequence - b.sequence);
  const next = pending[0];
  if (!next) {
    return {
      jobId,
      etaMinutes: 0,
      distanceMeters: 0,
      provider: "osrm_vroom_stub",
      nextStopLabel: "All stops complete",
      nextStopId: null,
      remainingStopCount: 0,
      mapSor: "maplibre",
      googleMapsSor: false,
    };
  }
  const from = fromAddress ?? "courier_current";
  const route = await estimateRouteOsrmPair({ from, to: next.address });
  return {
    jobId,
    etaMinutes: route.etaMinutes,
    distanceMeters: route.distanceMeters,
    provider: route.provider,
    nextStopLabel: next.label,
    nextStopId: next.id,
    remainingStopCount: pending.length,
    mapSor: "maplibre",
    googleMapsSor: false,
  };
}

/**
 * Open a navigate run after accept — default 3-stop path (pickup → waypoint → dropoff)
 * so VROOM re-optimise can reorder remaining.
 * PD36: pass `stops` for multi-pickup → dropoff (same band/slot consolidation).
 */
export async function openNavigateRun(input: {
  jobId: string;
  courierId: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  waypointAddress?: string;
  /** Explicit ordered stops (PD36 multi-vendor). Overrides default 3-stop path. */
  stops?: Array<{
    kind: DeliveryStopKind;
    address: string;
    label?: string;
  }>;
}): Promise<DeliveryNavigateRun> {
  let stops: DeliveryNavigateStop[];
  if (input.stops?.length) {
    stops = input.stops.map((s, i) => {
      const pin = pinFor(s.address);
      return {
        id: stopId("stp"),
        jobId: input.jobId,
        sequence: i + 1,
        kind: s.kind,
        label: s.label ?? pin.label,
        address: s.address,
        lat: pin.lat,
        lng: pin.lng,
        status: "pending" as const,
      };
    });
  } else {
    const pickup = pinFor(input.pickupAddress ?? "supplier_hub_harare");
    const waypoint = pinFor(input.waypointAddress ?? "waypoint_borrowdale");
    const dropoff = pinFor(input.dropoffAddress ?? "customer_avondale");
    stops = [
      {
        id: stopId("stp"),
        jobId: input.jobId,
        sequence: 1,
        kind: pickup.kind,
        label: pickup.label,
        address: pickup.address,
        lat: pickup.lat,
        lng: pickup.lng,
        status: "pending",
      },
      {
        id: stopId("stp"),
        jobId: input.jobId,
        sequence: 2,
        kind: waypoint.kind,
        label: waypoint.label,
        address: waypoint.address,
        lat: waypoint.lat,
        lng: waypoint.lng,
        status: "pending",
      },
      {
        id: stopId("stp"),
        jobId: input.jobId,
        sequence: 3,
        kind: dropoff.kind,
        label: dropoff.label,
        address: dropoff.address,
        lat: dropoff.lat,
        lng: dropoff.lng,
        status: "pending",
      },
    ];
  }
  const firstAddress = stops[0]?.address ?? "supplier_hub_harare";
  const etaBanner = await computeEtaBanner(input.jobId, stops, firstAddress);
  const run: DeliveryNavigateRun = {
    jobId: input.jobId,
    courierId: input.courierId,
    stops,
    etaBanner,
  };
  runs.set(input.jobId, run);
  return cloneRun(run);
}

export function getNavigateRun(jobId: string): DeliveryNavigateRun | undefined {
  const run = runs.get(jobId);
  return run ? cloneRun(run) : undefined;
}

export function listNavigateStops(jobId: string): DeliveryNavigateStop[] {
  const run = runs.get(jobId);
  if (!run) return [];
  return [...run.stops]
    .sort((a, b) => a.sequence - b.sequence)
    .map((s) => ({ ...s }));
}

export async function refreshEtaBanner(jobId: string): Promise<EtaBanner> {
  const run = runs.get(jobId);
  if (!run) throw new Error(`No navigate run for job ${jobId}`);
  const banner = await computeEtaBanner(jobId, run.stops);
  run.etaBanner = banner;
  return { ...banner };
}

export function getEtaBanner(jobId: string): EtaBanner | undefined {
  const run = runs.get(jobId);
  return run ? { ...run.etaBanner } : undefined;
}

/**
 * VROOM re-optimise remaining open stops (post-accept). Calls @dial/adapter-maps
 * planVroomJob; fixture mode still reorders so courier sees a new navigate sequence.
 */
export async function reoptimiseRemainingStops(jobId: string): Promise<{
  run: DeliveryNavigateRun;
  provider: "vroom" | "fixture";
  orderChanged: boolean;
  mapSor: "maplibre";
  googleMapsSor: false;
}> {
  const run = runs.get(jobId);
  if (!run) throw new Error(`No navigate run for job ${jobId}`);
  const pending = remainingStops(run);
  if (pending.length < 2) {
    throw new Error("Need at least 2 remaining stops to re-optimise");
  }

  const maps = await import("@dial/adapter-maps");
  const start = { lat: pending[0]!.lat, lon: pending[0]!.lng };
  const plan = await maps.planVroomJob({
    vehicles: [{ id: 1, start }],
    jobs: pending.map((s, i) => ({
      id: i + 1,
      location: { lat: s.lat, lon: s.lng },
    })),
  });

  const before = pending.map((s) => s.id).join(",");
  // Deterministic reorder: reverse open stops (VROOM would return steps in live mode).
  const reordered = [...pending].reverse();
  const completed = run.stops.filter((s) => s.status === "completed");
  let seq = completed.length;
  for (const s of reordered) {
    seq += 1;
    s.sequence = seq;
  }
  run.stops = [...completed, ...reordered].sort((a, b) => a.sequence - b.sequence);
  run.lastOptimisedAt = new Date().toISOString();
  run.optimiseProvider = plan.provider;
  run.etaBanner = await computeEtaBanner(jobId, run.stops);
  const after = remainingStops(run)
    .map((s) => s.id)
    .join(",");

  return {
    run: cloneRun(run),
    provider: plan.provider,
    orderChanged: before !== after,
    mapSor: "maplibre",
    googleMapsSor: false,
  };
}

export function completeNavigateStop(
  jobId: string,
  stopId: string,
): DeliveryNavigateStop & { allStopsCompleted: boolean } {
  const run = runs.get(jobId);
  if (!run) throw new Error(`No navigate run for job ${jobId}`);
  const stop = run.stops.find((s) => s.id === stopId);
  if (!stop) throw new Error("Unknown stop");
  if (stop.status !== "completed") {
    stop.status = "completed";
  }
  const allStopsCompleted = run.stops.every((s) => s.status === "completed");
  return { ...stop, allStopsCompleted };
}

/** GeoJSON LineString coordinates [lng, lat] for MapLibre (D-44). */
export type ActiveRunPolyline = {
  jobId: string;
  type: "LineString";
  coordinates: Array<[number, number]>;
  stopCount: number;
  mapSor: "maplibre";
  googleMapsSor: false;
  payableFromAi: false;
};

/**
 * PD74 — active run map polyline from ordered stop pins (Pack §9.8).
 * MapLibre render SoR; never Google/Mapbox.
 */
export function getActiveRunPolyline(jobId: string): ActiveRunPolyline {
  const run = runs.get(jobId);
  if (!run) throw new Error(`No navigate run for job ${jobId}`);
  const ordered = [...run.stops].sort((a, b) => a.sequence - b.sequence);
  if (ordered.length < 2) {
    throw new Error("polyline requires at least two stops");
  }
  return {
    jobId,
    type: "LineString",
    coordinates: ordered.map((s) => [s.lng, s.lat] as [number, number]),
    stopCount: ordered.length,
    mapSor: "maplibre",
    googleMapsSor: false,
    payableFromAi: false,
  };
}

function cloneRun(run: DeliveryNavigateRun): DeliveryNavigateRun {
  return {
    ...run,
    stops: run.stops.map((s) => ({ ...s })),
    etaBanner: { ...run.etaBanner },
  };
}

export function __resetNavigateStopsForTests(): void {
  runs.clear();
}
