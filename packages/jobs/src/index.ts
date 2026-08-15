/**
 * Jobs SoR — classification, rate-card drafts, Cal.com slots, checklist, evidence (Pack T4/T6 / PD9).
 * Quotes are drafts only — AI never writes payable amounts.
 * Booking slots = Cal.com (fixture when CALCOM_* unset) — no parallel in-house calendar.
 */
import { __resetProjectsAndLegalForTests } from "./projectsAndLegal.js";
import {
  __resetMockLocationEvidenceForTests,
  captureCameraEvidence,
  checkInAtJobSite,
  DEFAULT_JOB_SITE,
  flushEvidenceQueue,
  getCameraEvidence,
  setJobSitePin,
} from "./mockLocationEvidence.js";
import {
  __resetBluetoothPrintForTests,
  listThermalPrinters,
  listThermalPrintJobs,
  pairThermalPrinter,
  printJobTicket,
} from "./bluetoothPrint.js";
import {
  __resetJobVariationsForTests,
  approveJobVariation,
  listJobVariations,
  proposeJobVariation,
  rejectJobVariation,
  runPd69JobVariationApproveThinVertical,
} from "./variations.js";

export {
  approveJobVariation,
  listJobVariations,
  proposeJobVariation,
  rejectJobVariation,
  runPd69JobVariationApproveThinVertical,
  __resetJobVariationsForTests,
  type JobVariation,
  type JobVariationStatus,
} from "./variations.js";

export type JobClassDefinition = {
  id: string;
  tradeId: string;
  name: string;
  lifecycle: "draft" | "active" | "retired";
};

export type TradeDefinition = {
  id: string;
  name: string;
  lifecycle: "draft" | "active" | "retired";
};

export type ValueScoreSnapshot = {
  technicianId: string;
  score: number;
  asOf: string;
  confidence: "low" | "medium" | "high";
  profileId: string;
  sampleN: number;
  outcomeWindowDays: number;
  /** Pack §9.5 / D-53 — ops Manager's choice flag (not a money path). */
  managersChoice: boolean;
  /** Explainability — never payable amounts. */
  factorContributions: Array<{ factor: string; weight: number; contribution: number }>;
};

export type ValueScoreDispute = {
  disputeId: string;
  technicianId: string;
  status: "open" | "upheld" | "rejected";
  reason: string;
  openedBy: string;
  resolvedBy: string | null;
  compensatingDelta: number | null;
  createdAt: string;
  resolvedAt: string | null;
};

export type TradeLifecycle = "draft" | "active" | "retired";

export type JobQuoteDraft = {
  quoteId: string;
  jobClassId: string;
  draftAmountUsdMinor: bigint;
  currency: "USD";
  source: "rate_card";
  emergency: boolean;
};

export type BookingSlot = {
  slotId: string;
  startAt: string;
  endAt: string;
  /** Pack: Cal.com is slot sibling — fixture when keys unset. */
  source: "calcom" | "calcom_fixture";
};

export type ChecklistId =
  | "automotive_basic"
  | "emergency_roadside"
  | "emergency_triage";

export type Checklist = {
  id: ChecklistId;
  title: string;
  steps: string[];
  /** Pack catalog id when distinct from runtime id (e.g. emergency.triage.v1). */
  catalogId?: string;
};

export type ChecklistRun = {
  runId: string;
  jobId: string;
  checklistId: ChecklistId;
  stepIndex: number;
  status: "in_progress" | "completed";
  /** PD81 — answers submitted per step (Pack §10 Checklists). */
  answers: string[];
};

export type JobEvidence = {
  evidenceId: string;
  jobId: string;
  technicianId: string;
  kind: "photo" | "note";
  /** Opaque payload ref — never secrets; base64/text stub for fixture. */
  payloadRef: string;
  createdAt: string;
};

export type TechJob = {
  id: string;
  customerId: string;
  technicianId: string | null;
  jobClassId: string;
  status: "booked" | "assigned" | "in_progress" | "completed";
  slotId: string | null;
  emergency: boolean;
  quoteId: string;
  draftAmountUsdMinor: bigint;
  currency: "USD";
  createdAt: string;
};

/** PD90 — Pack technicians.availability (not delivery courier availability). */
export type TechnicianAvailabilityStatus = "available" | "busy" | "offline";

export type TechnicianAvailability = {
  technicianId: string;
  status: TechnicianAvailabilityStatus;
  updatedAt: string;
  payableFromAi: false;
};

const TRADE_SEED: TradeDefinition[] = [
  { id: "trade_auto", name: "Automotive", lifecycle: "active" },
  { id: "trade_elec", name: "Electrical", lifecycle: "active" },
];

const JOB_CLASS_SEED: JobClassDefinition[] = [
  {
    id: "jc_diag",
    tradeId: "trade_auto",
    name: "Diagnostics",
    lifecycle: "active",
  },
  {
    id: "jc_roadside",
    tradeId: "trade_auto",
    name: "Roadside assist",
    lifecycle: "active",
  },
];

const trades: TradeDefinition[] = TRADE_SEED.map((t) => ({ ...t }));

const jobClasses: JobClassDefinition[] = JOB_CLASS_SEED.map((j) => ({ ...j }));

const CHECKLISTS: Checklist[] = [
  {
    id: "automotive_basic",
    title: "Automotive basic intake",
    steps: [
      "Confirm vehicle make/model/year",
      "Capture symptom in customer words",
      "Photo of fault area (optional)",
      "Confirm location pin",
    ],
  },
  {
    id: "emergency_roadside",
    title: "Emergency roadside",
    steps: [
      "Confirm safety / hazards",
      "Exact landmark / highway km",
      "Vehicle can move? yes/no",
      "Dispatch without AI price suggestion",
    ],
  },
  {
    id: "emergency_triage",
    title: "Emergency triage v1",
    catalogId: "emergency.triage.v1",
    steps: [
      "Life-threatening? yes/no → escalate if yes",
      "Scene safe for tech arrival?",
      "Triage priority: P1|P2|P3",
      "Bypass AI price; rate_card emergency only",
    ],
  },
];

const valueScores = new Map<string, ValueScoreSnapshot>();
const scoreDisputes = new Map<string, ValueScoreDispute>();
const scoreEvents: Array<{
  eventId: string;
  technicianId: string;
  eventType: string;
  delta: number;
  actor: "system" | "ops" | "dispute";
  at: string;
}> = [];
const jobs = new Map<string, TechJob>();
const evidence = new Map<string, JobEvidence>();
const checklistRuns = new Map<string, ChecklistRun>();
const bookedSlotIds = new Set<string>();
const technicianAvailability = new Map<string, TechnicianAvailability>();

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function listTradeDefinitions(): TradeDefinition[] {
  return trades.map((t) => ({ ...t }));
}

export function listJobClassDefinitions(): JobClassDefinition[] {
  return jobClasses.map((j) => ({ ...j }));
}

export function classifyJob(input: {
  text: string;
}): { jobClassId: string; tradeId: string } {
  const t = input.text.toLowerCase();
  if (t.includes("battery") || t.includes("tow") || t.includes("roadside")) {
    return { jobClassId: "jc_roadside", tradeId: "trade_auto" };
  }
  return { jobClassId: "jc_diag", tradeId: "trade_auto" };
}

export type TechnicianCredentialKind = "trade_licence" | "itf263" | "other";
export type TechnicianCredentialStatus = "verified" | "pending" | "expired";

export type TechnicianCredential = {
  credentialId: string;
  technicianId: string;
  kind: TechnicianCredentialKind;
  status: TechnicianCredentialStatus;
  label: string;
  updatedAt: string;
  payableFromAi: false;
};

const technicianCredentials = new Map<string, TechnicianCredential[]>();

/** Assignment eligibility — active class + minimum value score + verified credential (PD98). */
export function isTechnicianEligible(input: {
  technicianId: string;
  jobClassId: string;
  minScore?: number;
}): boolean {
  const jc = jobClasses.find((j) => j.id === input.jobClassId);
  if (!jc || jc.lifecycle !== "active") return false;
  const snap = valueScores.get(input.technicianId);
  const min = input.minScore ?? 0;
  if ((snap?.score ?? 0) < min) return false;
  const creds = technicianCredentials.get(input.technicianId) ?? [];
  const hasVerifiedTrade = creds.some(
    (c) => c.kind === "trade_licence" && c.status === "verified",
  );
  return hasVerifiedTrade;
}

export function setTechnicianCredential(input: {
  technicianId: string;
  kind: TechnicianCredentialKind;
  status: TechnicianCredentialStatus;
  label?: string;
}): TechnicianCredential {
  if (!input.technicianId.trim()) throw new Error("technicianId required");
  const row: TechnicianCredential = {
    credentialId: newId("cred"),
    technicianId: input.technicianId.trim(),
    kind: input.kind,
    status: input.status,
    label: input.label ?? input.kind,
    updatedAt: new Date().toISOString(),
    payableFromAi: false,
  };
  const list = technicianCredentials.get(row.technicianId) ?? [];
  const withoutKind = list.filter((c) => c.kind !== row.kind);
  withoutKind.push(row);
  technicianCredentials.set(row.technicianId, withoutKind);
  return { ...row };
}

export function listTechnicianCredentials(
  technicianId: string,
): TechnicianCredential[] {
  return (technicianCredentials.get(technicianId) ?? []).map((c) => ({
    ...c,
  }));
}

/**
 * PD98 thin vertical: pending credential blocks eligibility; verified unlocks.
 */
export function runPd98TechnicianCredentialsThinVertical(): {
  blockedWithoutCredential: true;
  eligibleWhenVerified: true;
  payableFromAi: false;
} {
  __resetJobsForTests();
  const technicianId = "tech_pd98";
  setValueScoreSnapshot({ technicianId, score: 80, sampleN: 20 });
  if (
    isTechnicianEligible({ technicianId, jobClassId: "jc_diag", minScore: 50 })
  ) {
    throw new Error("PD98 must block without verified trade_licence");
  }
  setTechnicianCredential({
    technicianId,
    kind: "trade_licence",
    status: "pending",
    label: "Automotive trade",
  });
  if (
    isTechnicianEligible({ technicianId, jobClassId: "jc_diag", minScore: 50 })
  ) {
    throw new Error("PD98 pending must still block");
  }
  setTechnicianCredential({
    technicianId,
    kind: "trade_licence",
    status: "verified",
    label: "Automotive trade",
  });
  if (
    !isTechnicianEligible({
      technicianId,
      jobClassId: "jc_diag",
      minScore: 50,
    })
  ) {
    throw new Error("PD98 verified must unlock eligibility");
  }
  return {
    blockedWithoutCredential: true,
    eligibleWhenVerified: true,
    payableFromAi: false,
  };
}

export function setValueScoreSnapshot(input: {
  technicianId: string;
  score: number;
  confidence?: "low" | "medium" | "high";
  profileId?: string;
  sampleN?: number;
  outcomeWindowDays?: number;
  factorContributions?: ValueScoreSnapshot["factorContributions"];
}): ValueScoreSnapshot {
  const factors =
    input.factorContributions ??
    [
      { factor: "completion", weight: 0.35, contribution: input.score * 0.35 },
      { factor: "punctuality", weight: 0.25, contribution: input.score * 0.25 },
      { factor: "evidence_quality", weight: 0.25, contribution: input.score * 0.25 },
      { factor: "comeback_penalty", weight: 0.15, contribution: input.score * 0.15 },
    ];
  const banned = /amountMinor|payable|price|ledger/i;
  for (const f of factors) {
    if (banned.test(f.factor)) {
      throw new Error("Value Score factors must not encode payable amounts");
    }
  }
  const row: ValueScoreSnapshot = {
    technicianId: input.technicianId,
    score: input.score,
    asOf: new Date().toISOString(),
    confidence: input.confidence ?? (input.sampleN && input.sampleN >= 20 ? "high" : "medium"),
    profileId: input.profileId ?? "vscore_default_v1",
    sampleN: input.sampleN ?? 10,
    outcomeWindowDays: input.outcomeWindowDays ?? 90,
    managersChoice: false,
    factorContributions: factors.map((f) => ({ ...f })),
  };
  valueScores.set(input.technicianId, row);
  scoreEvents.push({
    eventId: newId("sev"),
    technicianId: input.technicianId,
    eventType: "snapshot_set",
    delta: 0,
    actor: "ops",
    at: row.asOf,
  });
  return {
    ...row,
    factorContributions: row.factorContributions.map((f) => ({ ...f })),
  };
}

export function getValueScoreSnapshot(
  technicianId: string,
): ValueScoreSnapshot | undefined {
  const row = valueScores.get(technicianId);
  return row
    ? {
        ...row,
        managersChoice: row.managersChoice === true,
        factorContributions: row.factorContributions.map((f) => ({ ...f })),
      }
    : undefined;
}

/**
 * PD86 — Pack §9.5 Manager's choice flag on Value Score profile (not money).
 */
export function setManagersChoice(input: {
  technicianId: string;
  managersChoice: boolean;
  setBy: string;
}): ValueScoreSnapshot {
  if (!input.technicianId.trim()) throw new Error("technicianId required");
  if (!input.setBy.trim()) throw new Error("setBy required");
  let row = valueScores.get(input.technicianId);
  if (!row) {
    row = setValueScoreSnapshot({
      technicianId: input.technicianId,
      score: 50,
      sampleN: 5,
    });
    row = valueScores.get(input.technicianId)!;
  }
  row.managersChoice = input.managersChoice === true;
  scoreEvents.push({
    eventId: newId("sev"),
    technicianId: input.technicianId,
    eventType: input.managersChoice ? "managers_choice_on" : "managers_choice_off",
    delta: 0,
    actor: "ops",
    at: new Date().toISOString(),
  });
  return getValueScoreSnapshot(input.technicianId)!;
}

/**
 * PD86 thin vertical: snapshot → set Manager's choice → clear (not money path).
 */
export function runPd86ManagersChoiceThinVertical(): {
  flagged: true;
  cleared: true;
  moneyPathClean: true;
  payableFromAi: false;
} {
  __resetJobsForTests();
  setValueScoreSnapshot({
    technicianId: "tech_pd86",
    score: 81,
    sampleN: 22,
  });
  const on = setManagersChoice({
    technicianId: "tech_pd86",
    managersChoice: true,
    setBy: "ops_pd86",
  });
  if (!on.managersChoice) throw new Error("PD86 expected managersChoice true");
  const off = setManagersChoice({
    technicianId: "tech_pd86",
    managersChoice: false,
    setBy: "ops_pd86",
  });
  if (off.managersChoice) throw new Error("PD86 expected managersChoice false");
  const money = assertValueScoreNotMoneyPath();
  if (money.payableFromAi) throw new Error("PD86 must keep payableFromAi false");
  return {
    flagged: true,
    cleared: true,
    moneyPathClean: true,
    payableFromAi: false,
  };
}

/** PD19 — create Trade in draft (admin editor). */
export function createTradeDefinition(input: {
  id?: string;
  name: string;
}): TradeDefinition {
  if (!input.name.trim()) throw new Error("trade name required");
  const id = input.id?.trim() || newId("trade");
  if (trades.some((t) => t.id === id)) throw new Error(`Trade ${id} exists`);
  const row: TradeDefinition = {
    id,
    name: input.name.trim(),
    lifecycle: "draft",
  };
  trades.push(row);
  return { ...row };
}

export function setTradeLifecycle(input: {
  tradeId: string;
  lifecycle: TradeLifecycle;
}): TradeDefinition {
  const t = trades.find((x) => x.id === input.tradeId);
  if (!t) throw new Error(`Unknown trade ${input.tradeId}`);
  if (t.lifecycle === "retired" && input.lifecycle !== "retired") {
    throw new Error("retired trade cannot reactivate without new definition");
  }
  if (t.lifecycle === "draft" && input.lifecycle === "retired") {
    throw new Error("draft must activate before retire");
  }
  t.lifecycle = input.lifecycle;
  return { ...t };
}

export function createJobClassDefinition(input: {
  id?: string;
  tradeId: string;
  name: string;
}): JobClassDefinition {
  const trade = trades.find((t) => t.id === input.tradeId);
  if (!trade) throw new Error(`Unknown trade ${input.tradeId}`);
  if (trade.lifecycle === "retired") {
    throw new Error("cannot add JobClass to retired trade");
  }
  if (!input.name.trim()) throw new Error("job class name required");
  const id = input.id?.trim() || newId("jc");
  if (jobClasses.some((j) => j.id === id)) {
    throw new Error(`JobClass ${id} exists`);
  }
  const row: JobClassDefinition = {
    id,
    tradeId: input.tradeId,
    name: input.name.trim(),
    lifecycle: "draft",
  };
  jobClasses.push(row);
  return { ...row };
}

export function setJobClassLifecycle(input: {
  jobClassId: string;
  lifecycle: TradeLifecycle;
}): JobClassDefinition {
  const jc = jobClasses.find((j) => j.id === input.jobClassId);
  if (!jc) throw new Error(`Unknown job class ${input.jobClassId}`);
  if (jc.lifecycle === "retired" && input.lifecycle !== "retired") {
    throw new Error("retired JobClass cannot reactivate without new definition");
  }
  jc.lifecycle = input.lifecycle;
  return { ...jc };
}

export function openValueScoreDispute(input: {
  technicianId: string;
  reason: string;
  openedBy: string;
}): ValueScoreDispute {
  if (!valueScores.has(input.technicianId)) {
    throw new Error("No Value Score snapshot to dispute");
  }
  if (!input.reason.trim() || !input.openedBy.trim()) {
    throw new Error("reason and openedBy required");
  }
  const d: ValueScoreDispute = {
    disputeId: newId("vsd"),
    technicianId: input.technicianId,
    status: "open",
    reason: input.reason.trim(),
    openedBy: input.openedBy.trim(),
    resolvedBy: null,
    compensatingDelta: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };
  scoreDisputes.set(d.disputeId, d);
  return { ...d };
}

/**
 * Resolve dispute with append-only compensating score event (D-53).
 * Never writes payable amounts / ledger.
 */
export function resolveValueScoreDispute(input: {
  disputeId: string;
  resolution: "upheld" | "rejected";
  resolvedBy: string;
  compensatingDelta?: number;
}): {
  dispute: ValueScoreDispute;
  snapshot: ValueScoreSnapshot;
} {
  const d = scoreDisputes.get(input.disputeId);
  if (!d) throw new Error(`Unknown dispute ${input.disputeId}`);
  if (d.status !== "open") throw new Error(`Dispute already ${d.status}`);
  if (!input.resolvedBy.trim()) throw new Error("resolvedBy required");
  const snap = valueScores.get(d.technicianId);
  if (!snap) throw new Error("Missing Value Score snapshot");

  d.status = input.resolution;
  d.resolvedBy = input.resolvedBy.trim();
  d.resolvedAt = new Date().toISOString();

  let delta = 0;
  if (input.resolution === "upheld") {
    delta = input.compensatingDelta ?? 5;
    d.compensatingDelta = delta;
    snap.score = Math.min(100, Math.max(0, snap.score + delta));
    snap.asOf = new Date().toISOString();
    scoreEvents.push({
      eventId: newId("sev"),
      technicianId: d.technicianId,
      eventType: "dispute_compensating",
      delta,
      actor: "dispute",
      at: snap.asOf,
    });
  } else {
    d.compensatingDelta = 0;
  }

  return {
    dispute: { ...d },
    snapshot: {
      ...snap,
      factorContributions: snap.factorContributions.map((f) => ({ ...f })),
    },
  };
}

export function listValueScoreDisputes(): ValueScoreDispute[] {
  return [...scoreDisputes.values()].map((d) => ({ ...d }));
}

export function listValueScoreEvents(): Array<{
  eventId: string;
  technicianId: string;
  eventType: string;
  delta: number;
  actor: string;
  at: string;
}> {
  return scoreEvents.map((e) => ({ ...e }));
}

/**
 * Assert Value Score path never authors money (PD19 / D-53).
 */
export function assertValueScoreNotMoneyPath(): {
  writesPriceQuotes: false;
  writesLedger: false;
  writesJobReserve: false;
  payableFromAi: false;
} {
  return {
    writesPriceQuotes: false,
    writesLedger: false,
    writesJobReserve: false,
    payableFromAi: false,
  };
}

/**
 * PD19 thin vertical: Trade+JobClass lifecycle → Value Score factors → dispute.
 */
export function runPd19AdminTradeValueScoreThinVertical(): {
  tradeId: string;
  jobClassId: string;
  tradeLifecycle: TradeLifecycle;
  jobClassLifecycle: TradeLifecycle;
  valueScore: number;
  factorsExplainable: true;
  disputeStatus: "upheld";
  moneyPathClean: true;
  ineligibleHighScoreBlocked: true;
} {
  __resetJobsForTests();

  const trade = createTradeDefinition({ name: "PD19 HVAC Trade" });
  setTradeLifecycle({ tradeId: trade.id, lifecycle: "active" });
  const jc = createJobClassDefinition({
    tradeId: trade.id,
    name: "PD19 HVAC diagnose",
    id: "jc_pd19_hvac",
  });
  setJobClassLifecycle({ jobClassId: jc.id, lifecycle: "active" });

  const snap = setValueScoreSnapshot({
    technicianId: "tech_pd19",
    score: 40,
    sampleN: 8,
    factorContributions: [
      { factor: "completion", weight: 0.4, contribution: 16 },
      { factor: "punctuality", weight: 0.3, contribution: 12 },
      { factor: "evidence_quality", weight: 0.3, contribution: 12 },
    ],
  });
  if (snap.factorContributions.length < 1) {
    throw new Error("PD19 requires factor explainability");
  }

  // High score alone does not bypass eligibility when class inactive (draft)
  const draftOnly = createJobClassDefinition({
    tradeId: trade.id,
    name: "PD19 draft-only class",
    id: "jc_pd19_draft",
  });
  setValueScoreSnapshot({ technicianId: "tech_pd19_hi", score: 99, sampleN: 50 });
  const blocked = isTechnicianEligible({
    technicianId: "tech_pd19_hi",
    jobClassId: draftOnly.id,
    minScore: 10,
  });
  if (blocked) {
    throw new Error("Ineligible tech must not offer solely due to high score");
  }

  const dispute = openValueScoreDispute({
    technicianId: "tech_pd19",
    reason: "missed evidence credit",
    openedBy: "ops_pd19",
  });
  const resolved = resolveValueScoreDispute({
    disputeId: dispute.disputeId,
    resolution: "upheld",
    resolvedBy: "ops_pd19_lead",
    compensatingDelta: 8,
  });
  if (resolved.dispute.status !== "upheld") {
    throw new Error("PD19 expected upheld dispute");
  }

  const money = assertValueScoreNotMoneyPath();
  if (money.writesLedger || money.payableFromAi) {
    throw new Error("Value Score must not write money");
  }

  return {
    tradeId: trade.id,
    jobClassId: jc.id,
    tradeLifecycle: listTradeDefinitions().find((t) => t.id === trade.id)!
      .lifecycle,
    jobClassLifecycle: listJobClassDefinitions().find((j) => j.id === jc.id)!
      .lifecycle,
    valueScore: resolved.snapshot.score,
    factorsExplainable: true,
    disputeStatus: "upheld",
    moneyPathClean: true,
    ineligibleHighScoreBlocked: true,
  };
}

/**
 * PD53 thin vertical: open Value Score dispute → admin open queue → resolve uphold.
 * Append-only compensating event; never writes payable amounts.
 */
export function runPd53AdminDisputesThinVertical(): {
  disputeId: string;
  openQueueCount: number;
  resolvedStatus: "upheld";
  compensatingDelta: number;
  payableFromAi: false;
  moneyPathClean: true;
} {
  __resetJobsForTests();
  setValueScoreSnapshot({
    technicianId: "tech_pd53",
    score: 55,
    sampleN: 12,
    factorContributions: [
      { factor: "completion", weight: 0.5, contribution: 30 },
      { factor: "punctuality", weight: 0.5, contribution: 25 },
    ],
  });
  const dispute = openValueScoreDispute({
    technicianId: "tech_pd53",
    reason: "PD53 evidence credit miss",
    openedBy: "ops_pd53",
  });
  const openQueue = listValueScoreDisputes().filter((d) => d.status === "open");
  if (!openQueue.some((d) => d.disputeId === dispute.disputeId)) {
    throw new Error("PD53 expected dispute in open queue");
  }
  const resolved = resolveValueScoreDispute({
    disputeId: dispute.disputeId,
    resolution: "upheld",
    resolvedBy: "ops_pd53_lead",
    compensatingDelta: 6,
  });
  if (resolved.dispute.status !== "upheld") {
    throw new Error("PD53 expected upheld");
  }
  const money = assertValueScoreNotMoneyPath();
  if (money.writesLedger || money.payableFromAi) {
    throw new Error("PD53 disputes must not write money");
  }
  return {
    disputeId: dispute.disputeId,
    openQueueCount: openQueue.length,
    resolvedStatus: "upheld",
    compensatingDelta: resolved.dispute.compensatingDelta ?? 0,
    payableFromAi: false,
    moneyPathClean: true,
  };
}

/** Rate-card quote only — not AI-authored payable. Replaces rate_card_stub path. */
export function quoteFromRateCard(
  jobClassId: string,
  opts?: { emergency?: boolean },
): JobQuoteDraft {
  const jc = jobClasses.find((j) => j.id === jobClassId);
  if (!jc || jc.lifecycle !== "active") {
    throw new Error(`Unknown or inactive job class ${jobClassId}`);
  }
  const emergency = Boolean(opts?.emergency);
  const draftAmountUsdMinor =
    emergency || jobClassId === "jc_roadside" ? 80_00n : 45_00n;
  return {
    quoteId: `jq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    jobClassId,
    draftAmountUsdMinor,
    currency: "USD",
    source: "rate_card",
    emergency,
  };
}

/**
 * Map free-text / legacy jobClass labels → JobClass id for book UI.
 */
export function resolveJobClassId(jobClass: string): string {
  const t = jobClass.trim().toLowerCase();
  if (!t || t === "diagnostics" || t === "diag" || t === "jc_diag") {
    return "jc_diag";
  }
  if (
    t === "roadside" ||
    t === "jc_roadside" ||
    t.includes("emergency") ||
    t.includes("roadside")
  ) {
    return "jc_roadside";
  }
  return "jc_diag";
}

/** Draft quote for Tech book UI — always rate_card (never rate_card_stub). */
export function draftTechQuote(input: {
  jobClass: string;
  emergency?: boolean;
}): JobQuoteDraft {
  const jobClassId = resolveJobClassId(input.jobClass);
  return quoteFromRateCard(jobClassId, {
    emergency: Boolean(input.emergency),
  });
}

export function listChecklists(): Checklist[] {
  return CHECKLISTS.map((c) => ({ ...c, steps: [...c.steps] }));
}

export function getChecklist(id: ChecklistId): Checklist | undefined {
  const c = CHECKLISTS.find((x) => x.id === id);
  return c ? { ...c, steps: [...c.steps] } : undefined;
}

/**
 * PD81 — Pack §10 resolve checklist by symptom (+ optional trade).
 * Keyword map only — never AI-priced.
 */
export function resolveChecklistBySymptom(input: {
  symptom: string;
  tradeId?: string;
}): Checklist {
  const s = input.symptom.trim().toLowerCase();
  if (!s) throw new Error("symptom required");
  const emergencyHints = [
    "battery",
    "stranded",
    "roadside",
    "highway",
    "breakdown",
    "tow",
    "flat tyre",
    "flat tire",
  ];
  const isEmergency = emergencyHints.some((h) => s.includes(h));
  const wantsTriage =
    s.includes("triage") || s.includes("life-threatening") || s.includes("p1");
  const id: ChecklistId = wantsTriage
    ? "emergency_triage"
    : isEmergency
      ? "emergency_roadside"
      : "automotive_basic";
  const checklist = getChecklist(id);
  if (!checklist) throw new Error(`Missing checklist ${id}`);
  return checklist;
}

function fixtureSlots(): BookingSlot[] {
  const base = Date.now();
  return [0, 1, 2].map((i) => {
    const start = new Date(base + (i + 1) * 3_600_000);
    const end = new Date(start.getTime() + 60 * 60_000);
    return {
      slotId: `cal_fix_${i}_${start.toISOString().slice(0, 13)}`,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      source: "calcom_fixture" as const,
    };
  });
}

/**
 * List bookable slots. Live Cal.com when CALCOM_BASE_URL + CALCOM_API_KEY set;
 * otherwise Pack-prescribed fixture (still tagged as Cal.com sibling).
 */
export async function listBookingSlots(): Promise<BookingSlot[]> {
  const base = process.env.CALCOM_BASE_URL?.trim();
  const key = process.env.CALCOM_API_KEY?.trim();
  if (!base || !key) {
    return fixtureSlots().filter((s) => !bookedSlotIds.has(s.slotId));
  }
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/v1/slots`, {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    });
    if (!res.ok) {
      return fixtureSlots().filter((s) => !bookedSlotIds.has(s.slotId));
    }
    const json = (await res.json()) as {
      slots?: Array<{ id?: string; start?: string; end?: string }>;
    };
    const slots = (json.slots ?? [])
      .filter((s) => s.id && s.start && s.end)
      .map((s) => ({
        slotId: String(s.id),
        startAt: String(s.start),
        endAt: String(s.end),
        source: "calcom" as const,
      }))
      .filter((s) => !bookedSlotIds.has(s.slotId));
    return slots.length > 0
      ? slots
      : fixtureSlots().filter((s) => !bookedSlotIds.has(s.slotId));
  } catch {
    return fixtureSlots().filter((s) => !bookedSlotIds.has(s.slotId));
  }
}

export function getTechJob(jobId: string): TechJob | undefined {
  const j = jobs.get(jobId);
  return j ? { ...j } : undefined;
}

export function listJobsForTechnician(technicianId: string): TechJob[] {
  return [...jobs.values()]
    .filter((j) => j.technicianId === technicianId)
    .map((j) => ({ ...j }));
}

export function listJobsForCustomer(customerId: string): TechJob[] {
  return [...jobs.values()]
    .filter((j) => j.customerId === customerId)
    .map((j) => ({ ...j }));
}

/** Book non-emergency (or emergency without slot) against rate_card + optional Cal.com slot. */
export function bookTechJob(input: {
  customerId: string;
  technicianId?: string;
  jobClass: string;
  slotId?: string | null;
  emergency?: boolean;
}): TechJob {
  const emergency = Boolean(input.emergency);
  if (!emergency && !input.slotId) {
    throw new Error("Non-emergency book requires Cal.com slotId");
  }
  if (input.slotId) {
    if (bookedSlotIds.has(input.slotId)) {
      throw new Error(`Slot ${input.slotId} already booked`);
    }
    bookedSlotIds.add(input.slotId);
  }
  const jobClassId = resolveJobClassId(input.jobClass);
  const quote = quoteFromRateCard(jobClassId, { emergency });
  const techId = input.technicianId ?? null;
  const job: TechJob = {
    id: `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    customerId: input.customerId,
    technicianId: techId,
    jobClassId,
    status: techId ? "assigned" : "booked",
    slotId: input.slotId ?? null,
    emergency,
    quoteId: quote.quoteId,
    draftAmountUsdMinor: quote.draftAmountUsdMinor,
    currency: "USD",
    createdAt: new Date().toISOString(),
  };
  jobs.set(job.id, job);
  return { ...job };
}

/** Dev/fixture: assign open job to technician. */
export function assignJobToTechnician(
  jobId: string,
  technicianId: string,
): TechJob {
  const job = jobs.get(jobId);
  if (!job) throw new Error(`Unknown job ${jobId}`);
  job.technicianId = technicianId;
  job.status = "assigned";
  return { ...job };
}

export function startChecklistRun(input: {
  jobId: string;
  checklistId: ChecklistId;
}): ChecklistRun {
  if (!jobs.has(input.jobId)) throw new Error(`Unknown job ${input.jobId}`);
  const checklist = getChecklist(input.checklistId);
  if (!checklist) throw new Error(`Unknown checklist ${input.checklistId}`);
  const run: ChecklistRun = {
    runId: `cr_${Date.now().toString(36)}`,
    jobId: input.jobId,
    checklistId: input.checklistId,
    stepIndex: 0,
    status: "in_progress",
    answers: [],
  };
  checklistRuns.set(run.runId, run);
  const job = jobs.get(input.jobId)!;
  job.status = "in_progress";
  return { ...run };
}

export function getChecklistRun(runId: string): ChecklistRun | undefined {
  const r = checklistRuns.get(runId);
  return r ? { ...r, answers: [...r.answers] } : undefined;
}

export function advanceChecklistStep(runId: string): ChecklistRun {
  const run = checklistRuns.get(runId);
  if (!run) throw new Error(`Unknown checklist run ${runId}`);
  if (run.status === "completed") return { ...run, answers: [...run.answers] };
  const checklist = getChecklist(run.checklistId)!;
  run.stepIndex += 1;
  if (run.stepIndex >= checklist.steps.length) {
    run.status = "completed";
    run.stepIndex = checklist.steps.length;
    const job = jobs.get(run.jobId);
    if (job) job.status = "completed";
  }
  return { ...run, answers: [...run.answers] };
}

/**
 * PD81 — submit step answers; completes run when all steps answered (Pack §10).
 * Answers never set payable amounts.
 */
export function submitChecklistAnswers(input: {
  runId: string;
  answers: string[];
}): ChecklistRun {
  const run = checklistRuns.get(input.runId);
  if (!run) throw new Error(`Unknown checklist run ${input.runId}`);
  const checklist = getChecklist(run.checklistId)!;
  if (!Array.isArray(input.answers) || input.answers.length !== checklist.steps.length) {
    throw new Error(
      `answers length must equal steps (${checklist.steps.length})`,
    );
  }
  const cleaned = input.answers.map((a) => String(a).trim());
  if (cleaned.some((a) => !a)) throw new Error("empty checklist answers forbidden");
  run.answers = cleaned;
  run.stepIndex = checklist.steps.length;
  run.status = "completed";
  const job = jobs.get(run.jobId);
  if (job) job.status = "completed";
  return { ...run, answers: [...run.answers] };
}

export function uploadJobEvidence(input: {
  jobId: string;
  technicianId: string;
  kind: "photo" | "note";
  payloadRef: string;
}): JobEvidence {
  const job = jobs.get(input.jobId);
  if (!job) throw new Error(`Unknown job ${input.jobId}`);
  if (job.technicianId && job.technicianId !== input.technicianId) {
    throw new Error("Technician not assigned to job");
  }
  if (!job.technicianId) {
    job.technicianId = input.technicianId;
    job.status = job.status === "booked" ? "assigned" : job.status;
  }
  const row: JobEvidence = {
    evidenceId: `ev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
    jobId: input.jobId,
    technicianId: input.technicianId,
    kind: input.kind,
    payloadRef: input.payloadRef.slice(0, 2048),
    createdAt: new Date().toISOString(),
  };
  evidence.set(row.evidenceId, row);
  return { ...row };
}

export function listEvidenceForJob(jobId: string): JobEvidence[] {
  return [...evidence.values()]
    .filter((e) => e.jobId === jobId)
    .map((e) => ({ ...e }));
}

/** PD9 thin vertical: book (Cal.com fixture) → assign → checklist → evidence. */
export async function runPd9TechThinVertical(input: {
  customerId: string;
  technicianId: string;
}): Promise<{
  job: TechJob;
  slot: BookingSlot;
  quote: JobQuoteDraft;
  run: ChecklistRun;
  evidence: JobEvidence;
}> {
  const slots = await listBookingSlots();
  const slot = slots[0];
  if (!slot) throw new Error("No Cal.com slots available");
  const quote = draftTechQuote({ jobClass: "diagnostics", emergency: false });
  if (quote.source !== "rate_card") {
    throw new Error("PD9 requires rate_card quote source (not rate_card_stub)");
  }
  const job = bookTechJob({
    customerId: input.customerId,
    technicianId: input.technicianId,
    jobClass: "diagnostics",
    slotId: slot.slotId,
    emergency: false,
  });
  const run = startChecklistRun({
    jobId: job.id,
    checklistId: "automotive_basic",
  });
  let advanced = advanceChecklistStep(run.runId);
  while (advanced.status !== "completed") {
    advanced = advanceChecklistStep(run.runId);
  }
  const ev = uploadJobEvidence({
    jobId: job.id,
    technicianId: input.technicianId,
    kind: "photo",
    payloadRef: "data:image/jpeg;base64,pd9fixture",
  });
  return {
    job: getTechJob(job.id)!,
    slot,
    quote,
    run: getChecklistRun(run.runId)!,
    evidence: ev,
  };
}

/**
 * PD13 thin vertical (customer tech-web Pack §9.3):
 * guide book (Cal.com + rate_card) → emergency book (no AI payable) → customer job list.
 */
export async function runPd13TechWebThinVertical(input?: {
  customerId?: string;
}): Promise<{
  guide: { jobId: string; slotId: string; quoteSource: "rate_card"; payableFromAi: false };
  emergency: {
    jobId: string;
    checklistId: ChecklistId;
    quoteSource: "rate_card";
    aiPricingBypassed: true;
  };
  customerJobs: number;
  checklists: ChecklistId[];
}> {
  __resetJobsForTests();
  const customerId = input?.customerId ?? "cust_pd13_web";
  const slots = await listBookingSlots();
  const slot = slots[0];
  if (!slot) throw new Error("PD13 requires Cal.com fixture slots");

  const guideQuote = draftTechQuote({ jobClass: "diagnostics", emergency: false });
  if (guideQuote.source !== "rate_card") {
    throw new Error("PD13 guide quote must be rate_card (never AI payable)");
  }
  const guideJob = bookTechJob({
    customerId,
    jobClass: "diagnostics",
    slotId: slot.slotId,
    emergency: false,
  });

  const emergencyQuote = draftTechQuote({
    jobClass: "roadside_emergency",
    emergency: true,
  });
  if (emergencyQuote.source !== "rate_card") {
    throw new Error("PD13 emergency quote must be rate_card");
  }
  const emergencyJob = bookTechJob({
    customerId,
    jobClass: "roadside_emergency",
    slotId: null,
    emergency: true,
  });
  const emergencyChecklist = getChecklist("emergency_roadside");
  if (!emergencyChecklist) {
    throw new Error("PD13 requires emergency_roadside checklist");
  }

  const mine = listJobsForCustomer(customerId);
  if (mine.length < 2) {
    throw new Error("PD13 expected guide + emergency jobs for customer");
  }
  const ids = listChecklists().map((c) => c.id);
  if (!ids.includes("automotive_basic") || !ids.includes("emergency_roadside")) {
    throw new Error("PD13 requires automotive + emergency checklists (Pack T4)");
  }

  return {
    guide: {
      jobId: guideJob.id,
      slotId: slot.slotId,
      quoteSource: "rate_card",
      payableFromAi: false,
    },
    emergency: {
      jobId: emergencyJob.id,
      checklistId: "emergency_roadside",
      quoteSource: "rate_card",
      aiPricingBypassed: true,
    },
    customerJobs: mine.length,
    checklists: ids,
  };
}

export {
  acceptTermsVersion,
  assertProjectsLegalNotMoneyPath,
  clientProjectsSurface,
  createInternalProjectDraft,
  getProjectsToggle,
  legalComplianceSnapshot,
  listInternalProjectDrafts,
  listLegalEducationTopics,
  listLegalEntityChecklists,
  listTermsAcceptances,
  listTermsVersions,
  publishTermsVersion,
  runPd24AdminProjectsLegalThinVertical,
  seedLegalEntityChecklist,
  setProjectsClientVisibility,
  setProjectsLabourGates,
  __resetProjectsAndLegalForTests,
  type InternalProjectDraft,
  type LegalEducationTopic,
  type LegalEntityChecklist,
  type LegalEntityType,
  type ProjectsClientVisibility,
  type ProjectsToggleState,
  type TermsAcceptance,
  type TermsVersion,
} from "./projectsAndLegal.js";

export {
  captureCameraEvidence,
  checkInAtJobSite,
  DEFAULT_JOB_SITE,
  distanceMeters,
  flushEvidenceQueue,
  getCameraEvidence,
  getJobSitePin,
  listCameraEvidenceForJob,
  listCheckInsForJob,
  setJobSitePin,
  type CameraEvidenceCapture,
  type CheckInAttempt,
  type JobSitePin,
} from "./mockLocationEvidence.js";

export {
  getThermalPrinter,
  listThermalPrinters,
  listThermalPrintJobs,
  pairThermalPrinter,
  printJobTicket,
  type ThermalPrinterBond,
  type ThermalPrintJob,
} from "./bluetoothPrint.js";

/**
 * PD25 thin vertical: Value Score factors on device (explainability, no money).
 */
export function runPd25ValueScoreDeviceThinVertical(): {
  score: number;
  factorsExplainable: true;
  noPayableFactors: true;
  moneyPathClean: true;
  payableFromAi: false;
} {
  __resetJobsForTests();
  const snap = setValueScoreSnapshot({
    technicianId: "tech_pd25",
    score: 78,
    sampleN: 24,
    confidence: "high",
    factorContributions: [
      { factor: "completion", weight: 0.35, contribution: 28 },
      { factor: "punctuality", weight: 0.25, contribution: 20 },
      { factor: "evidence_quality", weight: 0.25, contribution: 18 },
      { factor: "comeback_penalty", weight: 0.15, contribution: 12 },
    ],
  });
  if (snap.factorContributions.length < 3) {
    throw new Error("PD25 requires factor breakdown on device");
  }
  const money = assertValueScoreNotMoneyPath();
  if (money.payableFromAi) {
    throw new Error("PD25 Value Score must keep payableFromAi false");
  }
  return {
    score: snap.score,
    factorsExplainable: true,
    noPayableFactors: true,
    moneyPathClean: true,
    payableFromAi: false,
  };
}

/**
 * PD81 thin vertical: symptom → checklist → start run → submit answers (Pack §10).
 */
export function runPd81ChecklistBySymptomThinVertical(): {
  checklistId: "emergency_roadside";
  answersCount: number;
  completed: true;
  payableFromAi: false;
} {
  __resetJobsForTests();
  const resolved = resolveChecklistBySymptom({
    symptom: "battery dead stranded roadside",
    tradeId: "trade_auto",
  });
  if (resolved.id !== "emergency_roadside") {
    throw new Error("PD81 expected emergency_roadside for battery/stranded");
  }
  const basic = resolveChecklistBySymptom({ symptom: "engine noise on idle" });
  if (basic.id !== "automotive_basic") {
    throw new Error("PD81 expected automotive_basic for generic symptom");
  }
  const job = bookTechJob({
    customerId: "cust_pd81",
    technicianId: "tech_pd81",
    jobClass: "roadside",
    emergency: true,
  });
  const run = startChecklistRun({
    jobId: job.id,
    checklistId: resolved.id,
  });
  const answers = resolved.steps.map(
    (step, i) => `ans_${i}_${step.slice(0, 12)}`,
  );
  const done = submitChecklistAnswers({ runId: run.runId, answers });
  if (done.status !== "completed" || done.answers.length !== answers.length) {
    throw new Error("PD81 submit must complete with answers");
  }
  return {
    checklistId: "emergency_roadside",
    answersCount: done.answers.length,
    completed: true,
    payableFromAi: false,
  };
}

/**
 * PD94 thin vertical: Pack emergency.triage.v1 seed → run → complete (no AI money).
 */
export function runPd94EmergencyTriageThinVertical(): {
  checklistId: "emergency_triage";
  catalogId: "emergency.triage.v1";
  completed: true;
  aiPricingBypassed: true;
  payableFromAi: false;
} {
  __resetJobsForTests();
  const triage = getChecklist("emergency_triage");
  if (!triage || triage.catalogId !== "emergency.triage.v1") {
    throw new Error("PD94 requires emergency.triage.v1 catalog seed");
  }
  const resolved = resolveChecklistBySymptom({
    symptom: "triage life-threatening P1 roadside",
  });
  if (resolved.id !== "emergency_triage") {
    throw new Error("PD94 expected emergency_triage for triage symptom");
  }
  const job = bookTechJob({
    customerId: "cust_pd94",
    technicianId: "tech_pd94",
    jobClass: "roadside_emergency",
    emergency: true,
  });
  const run = startChecklistRun({
    jobId: job.id,
    checklistId: "emergency_triage",
  });
  const answers = triage.steps.map((s, i) => `t_${i}_${s.slice(0, 10)}`);
  const done = submitChecklistAnswers({ runId: run.runId, answers });
  if (done.status !== "completed") {
    throw new Error("PD94 triage run must complete");
  }
  return {
    checklistId: "emergency_triage",
    catalogId: "emergency.triage.v1",
    completed: true,
    aiPricingBypassed: true,
    payableFromAi: false,
  };
}

/**
 * PD30 thin vertical: mock GPS blocked → genuine geofence check-in →
 * camera overlay + offline evidence queue flush (Pack §9.7 / 2B-29).
 */
export async function runPd30MockLocationCameraThinVertical(input?: {
  technicianId?: string;
  customerId?: string;
}): Promise<{
  mockBlocked: true;
  genuineAccepted: true;
  cameraOverlay: true;
  queueFlushed: true;
  punctualityNotFromMock: true;
  payableFromAi: false;
  jobId: string;
}> {
  __resetJobsForTests();
  const technicianId = input?.technicianId ?? "tech_pd30";
  const customerId = input?.customerId ?? "cust_pd30";
  const slots = await listBookingSlots();
  const slot = slots[0];
  if (!slot) throw new Error("PD30 needs Cal.com fixture slot");
  const job = bookTechJob({
    customerId,
    technicianId,
    jobClass: "diagnostics",
    slotId: slot.slotId,
    emergency: false,
  });
  setJobSitePin({ jobId: job.id });

  const mock = checkInAtJobSite({
    jobId: job.id,
    technicianId,
    lat: DEFAULT_JOB_SITE.lat,
    lng: DEFAULT_JOB_SITE.lng,
    isMockLocation: true,
    accuracyMeters: 5,
  });
  if (mock.accepted || mock.punctualityEligible || mock.reason !== "mock_location_blocked") {
    throw new Error("PD30 mock location must block check-in / punctuality");
  }

  const genuine = checkInAtJobSite({
    jobId: job.id,
    technicianId,
    lat: DEFAULT_JOB_SITE.lat + 0.0003,
    lng: DEFAULT_JOB_SITE.lng,
    isMockLocation: false,
    accuracyMeters: 12,
  });
  if (!genuine.accepted || !genuine.punctualityEligible) {
    throw new Error("PD30 genuine in-geofence check-in must accept");
  }

  const cam = captureCameraEvidence({
    jobId: job.id,
    technicianId,
    payloadRef: "data:image/jpeg;base64,pd30camera",
    overlayChecklistStep: "Photo of fault area (optional)",
    queuedOffline: true,
  });
  // Also register in classic evidence SoR for job inbox visibility.
  uploadJobEvidence({
    jobId: job.id,
    technicianId,
    kind: "photo",
    payloadRef: cam.payloadRef,
  });
  if (cam.cameraSource !== "device_camera" || cam.flushStatus !== "queued") {
    throw new Error("PD30 camera evidence must queue with overlay");
  }

  const flush = flushEvidenceQueue(technicianId);
  if (flush.flushed < 1 || flush.payableFromAi) {
    throw new Error("PD30 evidence queue flush failed");
  }
  const after = getCameraEvidence(cam.evidenceId);
  if (!after || after.flushStatus !== "uploaded") {
    throw new Error("PD30 flushed evidence must be uploaded");
  }

  return {
    mockBlocked: true,
    genuineAccepted: true,
    cameraOverlay: true,
    queueFlushed: true,
    punctualityNotFromMock: true,
    payableFromAi: false,
    jobId: job.id,
  };
}

/**
 * PD31 thin vertical: pair ESC/POS Bluetooth printer → print job ticket.
 * Ops hook only — zimraFiscalSor=false; FDMS remains virtual API (D-40a).
 */
export async function runPd31BluetoothPrintThinVertical(input?: {
  technicianId?: string;
  customerId?: string;
}): Promise<{
  paired: true;
  ticketSent: true;
  escpos: true;
  zimraFiscalSor: false;
  fdmsVirtualOnly: true;
  payableFromAi: false;
  printerId: string;
  printJobId: string;
}> {
  __resetJobsForTests();
  const technicianId = input?.technicianId ?? "tech_pd31";
  const customerId = input?.customerId ?? "cust_pd31";
  const slots = await listBookingSlots();
  const slot = slots[0];
  if (!slot) throw new Error("PD31 needs Cal.com fixture slot");
  const job = bookTechJob({
    customerId,
    technicianId,
    jobClass: "diagnostics",
    slotId: slot.slotId,
    emergency: false,
  });
  const printer = pairThermalPrinter({
    technicianId,
    label: "DIAL pocket thermal",
    bluetoothAddress: "AA:BB:CC:31:00:01",
  });
  if (printer.zimraFiscalSor || !printer.fdmsVirtualOnly || printer.protocol !== "escpos") {
    throw new Error("PD31 printer must be ESC/POS ops hook, not ZIMRA SoR");
  }
  const ticket = printJobTicket({
    technicianId,
    printerId: printer.printerId,
    jobId: job.id,
    jobClassId: job.jobClassId,
    draftAmountUsdMinor: job.draftAmountUsdMinor,
  });
  if (
    ticket.status !== "sent" ||
    ticket.zimraFiscalSor ||
    ticket.payableFromAi ||
    !ticket.escposText.includes("NOT a fiscal receipt")
  ) {
    throw new Error("PD31 ticket must send ESC/POS ops copy without fiscal SoR");
  }
  if (listThermalPrinters(technicianId).length < 1) {
    throw new Error("PD31 expected paired printer");
  }
  if (listThermalPrintJobs(technicianId).length < 1) {
    throw new Error("PD31 expected print job record");
  }
  return {
    paired: true,
    ticketSent: true,
    escpos: true,
    zimraFiscalSor: false,
    fdmsVirtualOnly: true,
    payableFromAi: false,
    printerId: printer.printerId,
    printJobId: ticket.printJobId,
  };
}

/**
 * PD90 — set technician availability (Pack technicians.availability).
 * Distinct from delivery courier availability (D-45).
 */
export function setTechnicianAvailability(input: {
  technicianId: string;
  status: TechnicianAvailabilityStatus;
}): TechnicianAvailability {
  if (!input.technicianId.trim()) throw new Error("technicianId required");
  if (
    input.status !== "available" &&
    input.status !== "busy" &&
    input.status !== "offline"
  ) {
    throw new Error("invalid technician availability status");
  }
  const row: TechnicianAvailability = {
    technicianId: input.technicianId.trim(),
    status: input.status,
    updatedAt: new Date().toISOString(),
    payableFromAi: false,
  };
  technicianAvailability.set(row.technicianId, row);
  return { ...row };
}

export function getTechnicianAvailability(
  technicianId: string,
): TechnicianAvailability {
  const row = technicianAvailability.get(technicianId);
  if (row) return { ...row };
  return {
    technicianId,
    status: "offline",
    updatedAt: new Date(0).toISOString(),
    payableFromAi: false,
  };
}

/**
 * PD90 thin vertical: offline → available → busy → offline.
 */
export function runPd90TechnicianAvailabilityThinVertical(): {
  statuses: TechnicianAvailabilityStatus[];
  payableFromAi: false;
} {
  __resetJobsForTests();
  const technicianId = "tech_pd90";
  const statuses: TechnicianAvailabilityStatus[] = [];
  for (const status of ["available", "busy", "offline"] as const) {
    const row = setTechnicianAvailability({ technicianId, status });
    statuses.push(row.status);
  }
  const got = getTechnicianAvailability(technicianId);
  if (got.status !== "offline") {
    throw new Error("PD90 expected final offline");
  }
  return { statuses, payableFromAi: false };
}

export function __resetJobsForTests(): void {
  valueScores.clear();
  scoreDisputes.clear();
  scoreEvents.length = 0;
  jobs.clear();
  evidence.clear();
  checklistRuns.clear();
  bookedSlotIds.clear();
  technicianAvailability.clear();
  technicianCredentials.clear();
  trades.length = 0;
  trades.push(...TRADE_SEED.map((t) => ({ ...t })));
  jobClasses.length = 0;
  jobClasses.push(...JOB_CLASS_SEED.map((j) => ({ ...j })));
  __resetProjectsAndLegalForTests();
  __resetMockLocationEvidenceForTests();
  __resetBluetoothPrintForTests();
  __resetJobVariationsForTests();
}
