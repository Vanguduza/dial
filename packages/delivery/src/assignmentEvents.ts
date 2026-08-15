/**
 * PD59 — delivery assignment-event timeline (Pack §9.5 / D-45).
 * Append-only; never writes payable amounts.
 */

export type AssignmentEventType =
  | "offered"
  | "accepted"
  | "rejected"
  | "timed_out"
  | "fifo_queued"
  | "manual_override"
  | "reassigned";

export type DeliveryAssignmentEvent = {
  eventId: string;
  jobId: string;
  type: AssignmentEventType;
  courierId: string | null;
  actor: string;
  at: string;
  note?: string;
  payableFromAi: false;
};

const events: DeliveryAssignmentEvent[] = [];

function eid(): string {
  return `dae_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function recordAssignmentEvent(input: {
  jobId: string;
  type: AssignmentEventType;
  courierId?: string | null;
  actor: string;
  note?: string;
}): DeliveryAssignmentEvent {
  if (!input.jobId.trim() || !input.actor.trim()) {
    throw new Error("jobId and actor required");
  }
  const row: DeliveryAssignmentEvent = {
    eventId: eid(),
    jobId: input.jobId,
    type: input.type,
    courierId: input.courierId ?? null,
    actor: input.actor.trim(),
    at: new Date().toISOString(),
    ...(input.note ? { note: input.note } : {}),
    payableFromAi: false,
  };
  events.push(row);
  return { ...row };
}

export function listAssignmentEvents(jobId?: string): DeliveryAssignmentEvent[] {
  return events
    .filter((e) => (jobId ? e.jobId === jobId : true))
    .map((e) => ({ ...e }))
    .sort((a, b) => (a.at < b.at ? -1 : 1));
}

export function __resetAssignmentEventsForTests(): void {
  events.length = 0;
}
