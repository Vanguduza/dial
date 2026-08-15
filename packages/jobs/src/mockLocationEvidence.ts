/**
 * PD30 — mock-location detection + evidence camera/queue (Pack §9.7 / 2B-29).
 * Punctuality must not credit mock GPS; camera evidence carries checklist overlay.
 * AI never writes payable amounts.
 */

export type JobSitePin = {
  jobId: string;
  lat: number;
  lng: number;
  label: string;
  geofenceRadiusMeters: number;
};

export type CheckInAttempt = {
  attemptId: string;
  jobId: string;
  technicianId: string;
  lat: number;
  lng: number;
  /** Android Location.isMock / mock provider flag. */
  isMockLocation: boolean;
  accuracyMeters: number;
  accepted: boolean;
  reason: "ok" | "mock_location_blocked" | "outside_geofence";
  distanceMeters: number;
  punctualityEligible: boolean;
  recordedAt: string;
};

export type CameraEvidenceCapture = {
  evidenceId: string;
  jobId: string;
  technicianId: string;
  payloadRef: string;
  cameraSource: "device_camera";
  overlayChecklistStep: string;
  queuedOffline: boolean;
  flushStatus: "queued" | "uploaded";
  payableFromAi: false;
  createdAt: string;
};

const jobSites = new Map<string, JobSitePin>();
const checkIns = new Map<string, CheckInAttempt[]>();
const cameraCaptures = new Map<string, CameraEvidenceCapture>();
const evidenceQueue: string[] = [];

/** Harare CBD default job pin (MapLibre/OSRM world — not Google SoR). */
export const DEFAULT_JOB_SITE = {
  lat: -17.8292,
  lng: 31.0522,
  label: "Customer pin Harare",
  geofenceRadiusMeters: 150,
} as const;

function attemptId(): string {
  return `chk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function evidenceId(): string {
  return `evcam_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
}

/** Approximate distance in meters. */
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6_371_000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function setJobSitePin(input: {
  jobId: string;
  lat?: number;
  lng?: number;
  label?: string;
  geofenceRadiusMeters?: number;
}): JobSitePin {
  const pin: JobSitePin = {
    jobId: input.jobId,
    lat: input.lat ?? DEFAULT_JOB_SITE.lat,
    lng: input.lng ?? DEFAULT_JOB_SITE.lng,
    label: input.label ?? DEFAULT_JOB_SITE.label,
    geofenceRadiusMeters:
      input.geofenceRadiusMeters ?? DEFAULT_JOB_SITE.geofenceRadiusMeters,
  };
  jobSites.set(input.jobId, pin);
  return { ...pin };
}

export function getJobSitePin(jobId: string): JobSitePin | undefined {
  const p = jobSites.get(jobId);
  return p ? { ...p } : undefined;
}

/**
 * Check-in at job site. Mock locations are always rejected for punctuality (2B-29).
 */
export function checkInAtJobSite(input: {
  jobId: string;
  technicianId: string;
  lat: number;
  lng: number;
  isMockLocation: boolean;
  accuracyMeters?: number;
}): CheckInAttempt {
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) {
    throw new TypeError("lat/lng must be finite");
  }
  let pin = jobSites.get(input.jobId);
  if (!pin) {
    pin = setJobSitePin({ jobId: input.jobId });
  }
  const dist = distanceMeters(
    { lat: input.lat, lng: input.lng },
    { lat: pin.lat, lng: pin.lng },
  );
  const accuracy = input.accuracyMeters ?? 25;

  let accepted = true;
  let reason: CheckInAttempt["reason"] = "ok";
  if (input.isMockLocation) {
    accepted = false;
    reason = "mock_location_blocked";
  } else if (dist > pin.geofenceRadiusMeters) {
    accepted = false;
    reason = "outside_geofence";
  }

  const attempt: CheckInAttempt = {
    attemptId: attemptId(),
    jobId: input.jobId,
    technicianId: input.technicianId,
    lat: input.lat,
    lng: input.lng,
    isMockLocation: input.isMockLocation,
    accuracyMeters: accuracy,
    accepted,
    reason,
    distanceMeters: Math.round(dist),
    punctualityEligible: accepted,
    recordedAt: new Date().toISOString(),
  };
  const list = checkIns.get(input.jobId) ?? [];
  list.push(attempt);
  checkIns.set(input.jobId, list);
  return { ...attempt };
}

export function listCheckInsForJob(jobId: string): CheckInAttempt[] {
  return (checkIns.get(jobId) ?? []).map((c) => ({ ...c }));
}

/**
 * Controlled camera evidence — device camera only; checklist overlay label;
 * optional offline queue before flush.
 */
export function captureCameraEvidence(input: {
  jobId: string;
  technicianId: string;
  payloadRef: string;
  overlayChecklistStep: string;
  queuedOffline?: boolean;
}): CameraEvidenceCapture {
  if (!input.overlayChecklistStep.trim()) {
    throw new Error("Camera evidence requires checklist overlay step");
  }
  const queued = Boolean(input.queuedOffline);
  const capture: CameraEvidenceCapture = {
    evidenceId: evidenceId(),
    jobId: input.jobId,
    technicianId: input.technicianId,
    payloadRef: input.payloadRef.slice(0, 2048),
    cameraSource: "device_camera",
    overlayChecklistStep: input.overlayChecklistStep.slice(0, 200),
    queuedOffline: queued,
    flushStatus: queued ? "queued" : "uploaded",
    payableFromAi: false,
    createdAt: new Date().toISOString(),
  };
  cameraCaptures.set(capture.evidenceId, capture);
  if (queued) evidenceQueue.push(capture.evidenceId);
  return { ...capture };
}

export function flushEvidenceQueue(technicianId: string): {
  flushed: number;
  evidenceIds: string[];
  payableFromAi: false;
} {
  const flushedIds: string[] = [];
  const remaining: string[] = [];
  for (const id of evidenceQueue) {
    const cap = cameraCaptures.get(id);
    if (!cap) continue;
    if (cap.technicianId !== technicianId) {
      remaining.push(id);
      continue;
    }
    cap.flushStatus = "uploaded";
    cap.queuedOffline = false;
    flushedIds.push(id);
  }
  evidenceQueue.length = 0;
  evidenceQueue.push(...remaining);
  return {
    flushed: flushedIds.length,
    evidenceIds: flushedIds,
    payableFromAi: false,
  };
}

export function getCameraEvidence(
  evidenceId: string,
): CameraEvidenceCapture | undefined {
  const c = cameraCaptures.get(evidenceId);
  return c ? { ...c } : undefined;
}

export function listCameraEvidenceForJob(jobId: string): CameraEvidenceCapture[] {
  return [...cameraCaptures.values()]
    .filter((c) => c.jobId === jobId)
    .map((c) => ({ ...c }));
}

export function __resetMockLocationEvidenceForTests(): void {
  jobSites.clear();
  checkIns.clear();
  cameraCaptures.clear();
  evidenceQueue.length = 0;
}
