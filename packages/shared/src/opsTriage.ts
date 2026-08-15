/**
 * PD128 — Plane-pattern ops triage inbox (D-46 backlog / stitch §7.2).
 * AGPL Plane = UX pattern only — reimplement claim/resolve + SLA badges in-repo.
 * Chatwoot remains human chat SoR; never a second helpdesk SoR.
 */
export type OpsTriageKind = "dispute" | "sla" | "evidence" | "support";

export type OpsTriageStatus = "open" | "claimed" | "resolved";

export type OpsTriageItem = {
  ticketId: string;
  kind: OpsTriageKind;
  title: string;
  /** Deep-link correlation (order/job/dispute id). */
  correlationRef: string;
  slaDueAt: string;
  status: OpsTriageStatus;
  claimedBy: string | null;
  claimedAt: string | null;
  resolvedAt: string | null;
  slaBadge: "ok" | "due_soon" | "overdue";
  planePattern: true;
  chatwootStatusSor: false;
  payableFromAi: false;
};

const triageStore = (): Map<string, OpsTriageItem> => {
  const g = globalThis as { __dialOpsTriage?: Map<string, OpsTriageItem> };
  if (!g.__dialOpsTriage) g.__dialOpsTriage = new Map();
  return g.__dialOpsTriage;
};

export function __resetOpsTriageForTests(): void {
  triageStore().clear();
}

function slaBadgeFor(dueAt: string, now = Date.now()): OpsTriageItem["slaBadge"] {
  const due = Date.parse(dueAt);
  if (due <= now) return "overdue";
  if (due - now <= 3_600_000) return "due_soon";
  return "ok";
}

export function enqueueOpsTriageItem(input: {
  kind: OpsTriageKind;
  title: string;
  correlationRef: string;
  slaDueAt: string;
}): OpsTriageItem {
  if (!input.title.trim() || !input.correlationRef.trim()) {
    throw new Error("title and correlationRef required");
  }
  if (!Date.parse(input.slaDueAt)) throw new Error("slaDueAt must be ISO");
  const row: OpsTriageItem = {
    ticketId: `triage_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    kind: input.kind,
    title: input.title.trim(),
    correlationRef: input.correlationRef.trim(),
    slaDueAt: input.slaDueAt,
    status: "open",
    claimedBy: null,
    claimedAt: null,
    resolvedAt: null,
    slaBadge: slaBadgeFor(input.slaDueAt),
    planePattern: true,
    chatwootStatusSor: false,
    payableFromAi: false,
  };
  triageStore().set(row.ticketId, row);
  return { ...row };
}

export function listOpsTriageInbox(input?: {
  status?: OpsTriageStatus;
  now?: number;
}): OpsTriageItem[] {
  const now = input?.now ?? Date.now();
  return [...triageStore().values()]
    .filter((t) => (input?.status ? t.status === input.status : true))
    .map((t) => ({
      ...t,
      slaBadge: slaBadgeFor(t.slaDueAt, now),
    }))
    .sort((a, b) => {
      const rank = { overdue: 0, due_soon: 1, ok: 2 } as const;
      const d = rank[a.slaBadge] - rank[b.slaBadge];
      if (d !== 0) return d;
      return a.slaDueAt.localeCompare(b.slaDueAt);
    });
}

/** Keyboard claim pattern — Plane triage UX reimplemented. */
export function claimOpsTriageItem(input: {
  ticketId: string;
  claimedBy: string;
}): OpsTriageItem {
  const row = triageStore().get(input.ticketId);
  if (!row) throw new Error(`Unknown triage ticket ${input.ticketId}`);
  if (row.status === "resolved") throw new Error("Cannot claim resolved ticket");
  if (!input.claimedBy.trim()) throw new Error("claimedBy required");
  row.status = "claimed";
  row.claimedBy = input.claimedBy.trim();
  row.claimedAt = new Date().toISOString();
  row.slaBadge = slaBadgeFor(row.slaDueAt);
  return { ...row };
}

export function resolveOpsTriageItem(input: {
  ticketId: string;
  resolvedBy: string;
}): OpsTriageItem {
  const row = triageStore().get(input.ticketId);
  if (!row) throw new Error(`Unknown triage ticket ${input.ticketId}`);
  if (row.status === "open") {
    throw new Error("Claim required before resolve (Plane claim/resolve pattern)");
  }
  if (!input.resolvedBy.trim()) throw new Error("resolvedBy required");
  row.status = "resolved";
  row.resolvedAt = new Date().toISOString();
  if (!row.claimedBy) row.claimedBy = input.resolvedBy.trim();
  row.slaBadge = slaBadgeFor(row.slaDueAt);
  return { ...row };
}

/**
 * PD128 thin vertical: enqueue → claim → resolve; Chatwoot ≠ status SoR.
 */
export function runPd128PlaneOpsTriageThinVertical(): {
  claimedThenResolved: true;
  slaOverdueVisible: true;
  planePattern: true;
  chatwootStatusSor: false;
  payableFromAi: false;
} {
  __resetOpsTriageForTests();
  const now = Date.parse("2026-08-16T12:00:00.000Z");
  enqueueOpsTriageItem({
    kind: "evidence",
    title: "Near-dupe POD review",
    correlationRef: "job_pd128",
    slaDueAt: new Date(now - 60_000).toISOString(),
  });
  const open = enqueueOpsTriageItem({
    kind: "dispute",
    title: "Value Score dispute triage",
    correlationRef: "vsd_pd128",
    slaDueAt: new Date(now + 7_200_000).toISOString(),
  });
  const inbox = listOpsTriageInbox({ now });
  if (inbox[0]?.slaBadge !== "overdue") {
    throw new Error("PD128 expected overdue-first sort");
  }
  const claimed = claimOpsTriageItem({
    ticketId: open.ticketId,
    claimedBy: "ops_pd128",
  });
  if (claimed.status !== "claimed" || claimed.chatwootStatusSor !== false) {
    throw new Error("PD128 claim failed");
  }
  let blocked = false;
  try {
    resolveOpsTriageItem({ ticketId: inbox[0]!.ticketId, resolvedBy: "ops_pd128" });
  } catch (e) {
    blocked =
      e instanceof Error && e.message.includes("Claim required");
  }
  if (!blocked) throw new Error("PD128 expected claim-before-resolve");
  claimOpsTriageItem({ ticketId: inbox[0]!.ticketId, claimedBy: "ops_pd128" });
  const resolved = resolveOpsTriageItem({
    ticketId: inbox[0]!.ticketId,
    resolvedBy: "ops_pd128",
  });
  if (resolved.status !== "resolved" || resolved.payableFromAi !== false) {
    throw new Error("PD128 resolve failed");
  }
  return {
    claimedThenResolved: true,
    slaOverdueVisible: true,
    planePattern: true,
    chatwootStatusSor: false,
    payableFromAi: false,
  };
}
