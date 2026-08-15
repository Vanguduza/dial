/**
 * PD67 — delivery_runs inbox (Pack §9.8). Created on accept/override assign.
 */

export type DeliveryRunStatus = "assigned" | "active" | "completed" | "cancelled";

export type DeliveryRun = {
  runId: string;
  jobId: string;
  courierId: string;
  status: DeliveryRunStatus;
  openedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  mapSor: "maplibre";
  payableFromAi: false;
};

const runs = new Map<string, DeliveryRun>();

function rid(): string {
  return `drun_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function openDeliveryRun(input: {
  jobId: string;
  courierId: string;
}): DeliveryRun {
  if (!input.jobId.trim() || !input.courierId.trim()) {
    throw new Error("jobId and courierId required");
  }
  const existing = [...runs.values()].find(
    (r) =>
      r.jobId === input.jobId &&
      (r.status === "assigned" || r.status === "active"),
  );
  if (existing) return { ...existing };

  const row: DeliveryRun = {
    runId: rid(),
    jobId: input.jobId,
    courierId: input.courierId,
    status: "assigned",
    openedAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    mapSor: "maplibre",
    payableFromAi: false,
  };
  runs.set(row.runId, row);
  return { ...row };
}

export function startDeliveryRun(runId: string, courierId: string): DeliveryRun {
  const run = runs.get(runId);
  if (!run) throw new Error("Unknown run");
  if (run.courierId !== courierId) throw new Error("Run not for this courier");
  if (run.status !== "assigned") throw new Error(`Run already ${run.status}`);
  run.status = "active";
  run.startedAt = new Date().toISOString();
  return { ...run };
}

export function completeDeliveryRun(runId: string, courierId: string): DeliveryRun {
  const run = runs.get(runId);
  if (!run) throw new Error("Unknown run");
  if (run.courierId !== courierId) throw new Error("Run not for this courier");
  if (run.status !== "assigned" && run.status !== "active") {
    throw new Error(`Run already ${run.status}`);
  }
  run.status = "completed";
  run.completedAt = new Date().toISOString();
  return { ...run };
}

export function listRunsForCourier(courierId: string): DeliveryRun[] {
  return [...runs.values()]
    .filter((r) => r.courierId === courierId)
    .map((r) => ({ ...r }))
    .sort((a, b) => (a.openedAt < b.openedAt ? 1 : -1));
}

export function getDeliveryRun(runId: string): DeliveryRun | undefined {
  const r = runs.get(runId);
  return r ? { ...r } : undefined;
}

export function getActiveRunForJob(jobId: string): DeliveryRun | undefined {
  const r = [...runs.values()].find(
    (x) =>
      x.jobId === jobId && (x.status === "assigned" || x.status === "active"),
  );
  return r ? { ...r } : undefined;
}

export function __resetDeliveryRunsForTests(): void {
  runs.clear();
}
