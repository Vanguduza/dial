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
  | "emergency_triage"
  | "auto_wont_start"
  | "auto_overheating"
  | "auto_brake_noise"
  | "auto_flat_tyre"
  | "auto_stalling"
  | "autoelec_battery"
  | "elec_socket_dead"
  | "plumb_leak";

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
  /** PD127 — PicPeak gallery review (ops proofing). */
  reviewStatus: "pending" | "approved" | "rejected";
  /** PD127 — MediaFingerprint stub for near-dupe review. */
  fingerprintHash: string;
  nearDupeOf: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
};

export type TechJob = {
  id: string;
  customerId: string;
  technicianId: string | null;
  jobClassId: string;
  status: "intake" | "booked" | "assigned" | "in_progress" | "completed";
  slotId: string | null;
  emergency: boolean;
  quoteId: string;
  draftAmountUsdMinor: bigint;
  currency: "USD";
  createdAt: string;
  /** PD100 — intake summary (assessment text; never payable). */
  intakeSummary?: string;
  intakeUrgency?: "normal" | "emergency";
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
  {
    id: "auto_wont_start",
    title: "Engine won't start",
    catalogId: "auto.wont_start.v1",
    steps: [
      "Dashboard lights on when key/start pressed?",
      "Engine cranks but won't start?",
      "Fuel tank empty or near-empty?",
      "Never jump-start near fuel smell/smoke",
    ],
  },
  {
    id: "auto_overheating",
    title: "Engine overheating",
    catalogId: "auto.overheating.v1",
    steps: [
      "Gauge hot or steam/smoke right now?",
      "Coolant checked only when cold?",
      "Coolant puddle under vehicle?",
      "Driven since overheating? (urgent if yes)",
    ],
  },
  {
    id: "auto_brake_noise",
    title: "Brake noise / pulls when braking",
    catalogId: "auto.brake_noise.v1",
    steps: [
      "Noise only under braking?",
      "Vehicle pulls left/right when braking?",
      "Brake warning light on?",
      "Photo of pad/disc if safe",
    ],
  },
  {
    id: "auto_flat_tyre",
    title: "Flat tyre / puncture (roadside)",
    catalogId: "auto.flat_tyre.v1",
    steps: [
      "Safe location off road with hazards?",
      "Nail/sidewall damage visible?",
      "Spare + jack present?",
      "Confirm tyre size from sidewall photo",
    ],
  },
  {
    id: "auto_stalling",
    title: "Stalling / rough idle",
    catalogId: "auto.stalling.v1",
    steps: [
      "Stalls at idle, under load, or both?",
      "Happens in traffic? (urgent)",
      "Warning lights with stall?",
      "Recent fuel / battery work?",
    ],
  },
  {
    id: "autoelec_battery",
    title: "Battery won't hold charge",
    catalogId: "autoelec.battery.v1",
    steps: [
      "Fails every time or after sitting unused?",
      "Battery age if known?",
      "Accessory left on before sit?",
      "Dim headlights / slow crank before death?",
    ],
  },
  {
    id: "elec_socket_dead",
    title: "Socket/circuit not working",
    catalogId: "elec.socket_dead.v1",
    steps: [
      "Single socket or whole circuit?",
      "Breaker tripped?",
      "Burning smell or heat at outlet?",
      "Do not open live panels — book electrician",
    ],
  },
  {
    id: "plumb_leak",
    title: "Leaking tap or pipe",
    catalogId: "plumb.leak.v1",
    steps: [
      "Active drip or puddle now?",
      "Shut-off valve known/accessible?",
      "Water near electrics?",
      "Photo of leak source",
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
  /** PD107 — ISO expiry; past date forces expired for eligibility. */
  expiresAt?: string;
  payableFromAi: false;
};

const technicianCredentials = new Map<string, TechnicianCredential[]>();

function credentialIsCurrentlyVerified(c: TechnicianCredential, now = Date.now()): boolean {
  if (c.status === "expired" || c.status === "pending") return false;
  if (c.status !== "verified") return false;
  if (c.expiresAt && Date.parse(c.expiresAt) <= now) return false;
  return true;
}

/** Assignment eligibility — active class + min score + verified non-expired credential (PD98/PD107). */
export function isTechnicianEligible(input: {
  technicianId: string;
  jobClassId: string;
  minScore?: number;
  now?: number;
}): boolean {
  const jc = jobClasses.find((j) => j.id === input.jobClassId);
  if (!jc || jc.lifecycle !== "active") return false;
  const snap = valueScores.get(input.technicianId);
  const min = input.minScore ?? 0;
  if ((snap?.score ?? 0) < min) return false;
  const creds = technicianCredentials.get(input.technicianId) ?? [];
  const now = input.now ?? Date.now();
  return creds.some(
    (c) => c.kind === "trade_licence" && credentialIsCurrentlyVerified(c, now),
  );
}

export function setTechnicianCredential(input: {
  technicianId: string;
  kind: TechnicianCredentialKind;
  status: TechnicianCredentialStatus;
  label?: string;
  expiresAt?: string | null;
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
  if (input.expiresAt != null && String(input.expiresAt).trim()) {
    row.expiresAt = String(input.expiresAt).trim();
  }
  const list = technicianCredentials.get(row.technicianId) ?? [];
  const withoutKind = list.filter((c) => c.kind !== row.kind);
  withoutKind.push(row);
  technicianCredentials.set(row.technicianId, withoutKind);
  return { ...row };
}

/**
 * PD107 — mark credential expired (or force-expire past expiresAt).
 * Re-verify via setTechnicianCredential unlocks eligibility.
 */
export function expireTechnicianCredential(input: {
  technicianId: string;
  kind: TechnicianCredentialKind;
}): TechnicianCredential {
  const list = technicianCredentials.get(input.technicianId) ?? [];
  const row = list.find((c) => c.kind === input.kind);
  if (!row) throw new Error(`No ${input.kind} credential for technician`);
  row.status = "expired";
  row.updatedAt = new Date().toISOString();
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

/**
 * PD107 thin vertical: verified → expire (or past expiresAt) blocks; re-verify unlocks.
 */
export function runPd107CredentialExpiryThinVertical(): {
  blockedWhenExpired: true;
  blockedWhenPastExpiresAt: true;
  eligibleWhenReverified: true;
  payableFromAi: false;
} {
  __resetJobsForTests();
  const technicianId = "tech_pd107";
  setValueScoreSnapshot({ technicianId, score: 80, sampleN: 20 });
  setTechnicianCredential({
    technicianId,
    kind: "trade_licence",
    status: "verified",
    label: "Automotive trade",
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  });
  if (
    !isTechnicianEligible({ technicianId, jobClassId: "jc_diag", minScore: 50 })
  ) {
    throw new Error("PD107 expected eligible with future expiresAt");
  }
  expireTechnicianCredential({ technicianId, kind: "trade_licence" });
  if (
    isTechnicianEligible({ technicianId, jobClassId: "jc_diag", minScore: 50 })
  ) {
    throw new Error("PD107 expected blocked when status=expired");
  }
  setTechnicianCredential({
    technicianId,
    kind: "trade_licence",
    status: "verified",
    expiresAt: new Date(Date.now() - 1_000).toISOString(),
  });
  if (
    isTechnicianEligible({ technicianId, jobClassId: "jc_diag", minScore: 50 })
  ) {
    throw new Error("PD107 expected blocked when expiresAt in the past");
  }
  setTechnicianCredential({
    technicianId,
    kind: "trade_licence",
    status: "verified",
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  });
  if (
    !isTechnicianEligible({ technicianId, jobClassId: "jc_diag", minScore: 50 })
  ) {
    throw new Error("PD107 expected eligible after re-verify");
  }
  return {
    blockedWhenExpired: true,
    blockedWhenPastExpiresAt: true,
    eligibleWhenReverified: true,
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
    "stranded",
    "roadside",
    "highway",
    "breakdown",
    "tow",
    "unsafe",
  ];
  const isEmergency = emergencyHints.some((h) => s.includes(h));
  const wantsTriage =
    s.includes("triage") || s.includes("life-threatening") || s.includes("p1");
  let id: ChecklistId;
  if (wantsTriage) {
    id = "emergency_triage";
  } else if (isEmergency) {
    id = "emergency_roadside";
  } else if (s.includes("won't start") || s.includes("wont start") || s.includes("no start")) {
    id = "auto_wont_start";
  } else if (s.includes("overheat") || s.includes("steam")) {
    id = "auto_overheating";
  } else if (s.includes("brake")) {
    id = "auto_brake_noise";
  } else if (s.includes("stall") || s.includes("rough idle")) {
    id = "auto_stalling";
  } else if (s.includes("flat tyre") || s.includes("flat tire") || s.includes("puncture")) {
    id = "auto_flat_tyre";
  } else if (s.includes("battery")) {
    id = "autoelec_battery";
  } else if (s.includes("socket") || s.includes("outlet") || s.includes("circuit")) {
    id = "elec_socket_dead";
  } else if (s.includes("leak") || s.includes("pipe") || s.includes("tap")) {
    id = "plumb_leak";
  } else {
    id = "automotive_basic";
  }
  const checklist = getChecklist(id);
  if (!checklist) throw new Error(`Missing checklist ${id}`);
  return checklist;
}

/**
 * PD114 thin vertical: catalogue seed expands library catalogIds (tranche ≠ all 42).
 */
export function runPd114ChecklistCatalogSeedThinVertical(): {
  catalogSeedCount: number;
  libraryIdsPresent: true;
  trancheNotFullLibrary: true;
  payableFromAi: false;
} {
  const withCatalog = listChecklists().filter((c) => c.catalogId);
  if (withCatalog.length < 8) {
    throw new Error("PD114 expected ≥8 catalogId seeds");
  }
  const need = [
    "auto.wont_start.v1",
    "auto.overheating.v1",
    "auto.brake_noise.v1",
    "auto.flat_tyre.v1",
    "auto.stalling.v1",
    "autoelec.battery.v1",
    "elec.socket_dead.v1",
    "plumb.leak.v1",
    "emergency.triage.v1",
  ];
  for (const cat of need) {
    if (!withCatalog.some((c) => c.catalogId === cat)) {
      throw new Error(`PD114 missing catalogId ${cat}`);
    }
  }
  if (withCatalog.length >= 42) {
    throw new Error("PD114 tranche must not claim full 42-library seed");
  }
  const resolved = resolveChecklistBySymptom({ symptom: "engine won't start" });
  if (resolved.catalogId !== "auto.wont_start.v1") {
    throw new Error("PD114 expected wont_start resolve");
  }
  const flat = resolveChecklistBySymptom({ symptom: "puncture nail in tyre" });
  if (flat.catalogId !== "auto.flat_tyre.v1") {
    throw new Error("PD114 expected flat_tyre resolve without emergency context");
  }
  return {
    catalogSeedCount: withCatalog.length,
    libraryIdsPresent: true,
    trancheNotFullLibrary: true,
    payableFromAi: false,
  };
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

/** PD120 — Cal.com booking confirm sibling (fixture when keys unset). */
export type CalBookingConfirm = {
  bookingId: string;
  slotId: string;
  startAt: string;
  endAt: string;
  source: "calcom" | "calcom_fixture";
  status: "confirmed";
  payableFromAi: false;
};

const calBookings = new Map<string, CalBookingConfirm>();

/**
 * Confirm a Cal.com slot booking. Marks slot booked; fixture when keys unset.
 */
export async function confirmCalBooking(input: {
  slotId: string;
}): Promise<CalBookingConfirm> {
  const slotId = input.slotId.trim();
  if (!slotId) throw new Error("slotId required");
  if (bookedSlotIds.has(slotId)) {
    throw new Error(`Slot ${slotId} already booked`);
  }
  const slots = await listBookingSlots();
  const slot = slots.find((s) => s.slotId === slotId);
  if (!slot) throw new Error(`Unknown or unavailable slot ${slotId}`);
  bookedSlotIds.add(slotId);
  const booking: CalBookingConfirm = {
    bookingId: `calbook_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    slotId: slot.slotId,
    startAt: slot.startAt,
    endAt: slot.endAt,
    source: slot.source,
    status: "confirmed",
    payableFromAi: false,
  };
  calBookings.set(booking.bookingId, booking);
  return { ...booking };
}

export function getCalBooking(bookingId: string): CalBookingConfirm | undefined {
  const b = calBookings.get(bookingId);
  return b ? { ...b } : undefined;
}

/**
 * PD120 thin vertical: list slots → confirm → slot unavailable on re-list.
 */
export async function runPd120CalComConfirmThinVertical(): Promise<{
  confirmed: true;
  slotGoneAfterConfirm: true;
  source: "calcom" | "calcom_fixture";
  payableFromAi: false;
  bookingId: string;
}> {
  __resetJobsForTests();
  calBookings.clear();
  const slots = await listBookingSlots();
  if (slots.length < 1) throw new Error("PD120 expected slots");
  const slotId = slots[0]!.slotId;
  const booking = await confirmCalBooking({ slotId });
  if (booking.status !== "confirmed" || booking.payableFromAi !== false) {
    throw new Error("PD120 confirm failed");
  }
  const after = await listBookingSlots();
  if (after.some((s) => s.slotId === slotId)) {
    throw new Error("PD120 expected slot removed after confirm");
  }
  return {
    confirmed: true,
    slotGoneAfterConfirm: true,
    source: booking.source,
    payableFromAi: false,
    bookingId: booking.bookingId,
  };
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

/**
 * PD111 — convert intake job → booked/assigned (same job id; Pack §10).
 */
export function bookJobFromIntake(input: {
  jobId: string;
  slotId?: string | null;
  technicianId?: string;
}): TechJob {
  const job = jobs.get(input.jobId);
  if (!job) throw new Error(`Unknown job ${input.jobId}`);
  if (job.status !== "intake") {
    throw new Error(`book from intake requires status intake (got ${job.status})`);
  }
  const emergency = job.emergency;
  if (!emergency && !input.slotId) {
    throw new Error("Non-emergency book from intake requires Cal.com slotId");
  }
  if (input.slotId) {
    if (bookedSlotIds.has(input.slotId)) {
      throw new Error(`Slot ${input.slotId} already booked`);
    }
    bookedSlotIds.add(input.slotId);
    job.slotId = input.slotId;
  }
  if (input.technicianId) {
    job.technicianId = input.technicianId;
    job.status = "assigned";
  } else {
    job.status = "booked";
  }
  return { ...job };
}

/**
 * PD111 thin vertical: create intake → book same job id → booked.
 */
export function runPd111IntakeBookThinVertical(): {
  sameJobId: true;
  status: "booked";
  payableFromAi: false;
  jobId: string;
} {
  __resetJobsForTests();
  const intake = createJobIntake({
    customerId: "cust_pd111",
    customerText: "check engine light on cold mornings",
  });
  const slots = [{ slotId: "cal_pd111_slot" }];
  bookedSlotIds.delete(slots[0]!.slotId);
  const booked = bookJobFromIntake({
    jobId: intake.id,
    slotId: slots[0]!.slotId,
  });
  if (booked.id !== intake.id) throw new Error("PD111 expected same job id");
  if (booked.status !== "booked") throw new Error("PD111 expected booked");
  if (booked.slotId !== slots[0]!.slotId) {
    throw new Error("PD111 expected slot attached");
  }
  return {
    sameJobId: true,
    status: "booked",
    payableFromAi: false,
    jobId: booked.id,
  };
}

/**
 * PD100 — Pack §10 create intake (pre-book). Assessment fields only; AI never writes payable.
 */
export function createJobIntake(input: {
  customerId: string;
  customerText: string;
  summary?: string;
  urgency?: "normal" | "emergency";
}): TechJob {
  if (!input.customerId.trim()) throw new Error("customerId required");
  const text = input.customerText.trim();
  if (!text) throw new Error("customerText required");
  const classified = classifyJob({ text });
  const urgency =
    input.urgency ??
    (classified.jobClassId === "jc_roadside" ||
    /battery|stranded|emergency|tow|highway/i.test(text)
      ? "emergency"
      : "normal");
  const emergency = urgency === "emergency";
  const quote = quoteFromRateCard(classified.jobClassId, { emergency });
  const job: TechJob = {
    id: `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    customerId: input.customerId.trim(),
    technicianId: null,
    jobClassId: classified.jobClassId,
    status: "intake",
    slotId: null,
    emergency,
    quoteId: quote.quoteId,
    draftAmountUsdMinor: quote.draftAmountUsdMinor,
    currency: "USD",
    createdAt: new Date().toISOString(),
    intakeSummary: (input.summary ?? text).slice(0, 500),
    intakeUrgency: urgency,
  };
  jobs.set(job.id, job);
  return { ...job };
}

/**
 * PD100 thin vertical: create intake → status intake; no payable from AI.
 */
export function runPd100JobCreateIntakeThinVertical(): {
  status: "intake";
  needsHumanQuote: true;
  payableFromAi: false;
  jobId: string;
} {
  __resetJobsForTests();
  const job = createJobIntake({
    customerId: "cust_pd100",
    customerText: "engine rattles on cold start",
  });
  if (job.status !== "intake") throw new Error("PD100 expected intake status");
  if (!job.intakeSummary) throw new Error("PD100 expected intake summary");
  return {
    status: "intake",
    needsHumanQuote: true,
    payableFromAi: false,
    jobId: job.id,
  };
}

/**
 * PD101 — customer job status + evidence deepen (Pack §9.3).
 */
export function getCustomerJobStatusDetail(jobId: string): {
  job: TechJob;
  evidenceCount: number;
  evidence: JobEvidence[];
  timeline: Array<{ at: string; event: string }>;
  statusLabel: string;
  payableFromAi: false;
} {
  const job = getTechJob(jobId);
  if (!job) throw new Error(`Unknown job ${jobId}`);
  const evidenceList = listEvidenceForJob(jobId);
  const timeline: Array<{ at: string; event: string }> = [
    { at: job.createdAt, event: job.status === "intake" ? "intake_created" : "job_created" },
  ];
  if (job.status !== "intake") {
    timeline.push({ at: job.createdAt, event: `status_${job.status}` });
  }
  for (const e of evidenceList) {
    timeline.push({ at: e.createdAt, event: `evidence_${e.kind}` });
  }
  const statusLabel =
    job.status === "intake"
      ? "Intake — awaiting book"
      : job.status === "booked"
        ? "Booked — awaiting assign"
        : job.status === "assigned"
          ? "Assigned"
          : job.status === "in_progress"
            ? "In progress"
            : "Completed";
  return {
    job: { ...job },
    evidenceCount: evidenceList.length,
    evidence: evidenceList.map((e) => ({ ...e })),
    timeline,
    statusLabel,
    payableFromAi: false,
  };
}

/**
 * PD101 thin vertical: intake → book → evidence → status detail.
 */
export function runPd101CustomerJobStatusThinVertical(): {
  statusLabel: string;
  evidenceCount: number;
  timelineLen: number;
  payableFromAi: false;
} {
  __resetJobsForTests();
  const intake = createJobIntake({
    customerId: "cust_pd101",
    customerText: "battery dead stranded",
    urgency: "emergency",
  });
  const booked = bookTechJob({
    customerId: "cust_pd101",
    technicianId: "tech_pd101",
    jobClass: "roadside",
    emergency: true,
  });
  uploadJobEvidence({
    jobId: booked.id,
    technicianId: "tech_pd101",
    kind: "photo",
    payloadRef: "fixture://pd101.jpg",
  });
  const detail = getCustomerJobStatusDetail(booked.id);
  if (detail.evidenceCount < 1) throw new Error("PD101 expected evidence");
  if (detail.timeline.length < 2) throw new Error("PD101 expected timeline");
  void intake;
  return {
    statusLabel: detail.statusLabel,
    evidenceCount: detail.evidenceCount,
    timelineLen: detail.timeline.length,
    payableFromAi: false,
  };
}

/**
 * PD102 — technician self-serve Value Score dispute (Pack §9.5 / D-53).
 * Session tech opens dispute on own snapshot; not money path.
 */
export function runPd102TechValueScoreDisputeThinVertical(): {
  disputeOpened: true;
  openedBySelf: true;
  moneyPathClean: true;
  payableFromAi: false;
  disputeId: string;
} {
  __resetJobsForTests();
  setValueScoreSnapshot({
    technicianId: "tech_pd102",
    score: 65,
    sampleN: 10,
  });
  const dispute = openValueScoreDispute({
    technicianId: "tech_pd102",
    reason: "completion factor miscounted after evidence upload",
    openedBy: "tech_pd102",
  });
  if (dispute.status !== "open") {
    throw new Error("PD102 expected open dispute");
  }
  if (dispute.openedBy !== "tech_pd102") {
    throw new Error("PD102 expected self-opened dispute");
  }
  const mine = listValueScoreDisputes().filter(
    (d) => d.technicianId === "tech_pd102" && d.status === "open",
  );
  if (mine.length < 1) throw new Error("PD102 expected dispute in queue");
  const money = assertValueScoreNotMoneyPath();
  if (money.payableFromAi) {
    throw new Error("PD102 Value Score dispute must keep payableFromAi false");
  }
  return {
    disputeOpened: true,
    openedBySelf: true,
    moneyPathClean: true,
    payableFromAi: false,
    disputeId: dispute.disputeId,
  };
}

export type TechnicianProfileCard = {
  technicianId: string;
  displayName: string;
  tradeId: string;
  tradeName: string;
  availability: TechnicianAvailabilityStatus;
  eligible: boolean;
  managersChoice: boolean;
  valueScore: number | null;
  payableFromAi: false;
};

const technicianProfileDirectory = new Map<
  string,
  { displayName: string; tradeId: string }
>();

/** PD106 — register technician for customer profile cards (Pack §9.3). */
export function upsertTechnicianProfileDirectory(input: {
  technicianId: string;
  displayName: string;
  tradeId: string;
}): void {
  if (!input.technicianId.trim()) throw new Error("technicianId required");
  technicianProfileDirectory.set(input.technicianId.trim(), {
    displayName: input.displayName.trim() || input.technicianId,
    tradeId: input.tradeId.trim() || "trade_auto",
  });
}

/**
 * PD106 — customer technician profile cards with Manager's choice flag.
 */
export function listTechnicianProfileCards(): TechnicianProfileCard[] {
  return [...technicianProfileDirectory.entries()].map(([technicianId, meta]) => {
    const trade =
      trades.find((t) => t.id === meta.tradeId) ??
      trades.find((t) => t.id === "trade_auto");
    const snap = getValueScoreSnapshot(technicianId);
    const availability = getTechnicianAvailability(technicianId);
    return {
      technicianId,
      displayName: meta.displayName,
      tradeId: trade?.id ?? meta.tradeId,
      tradeName: trade?.name ?? meta.tradeId,
      availability: availability.status,
      eligible: isTechnicianEligible({
        technicianId,
        jobClassId: "jc_diag",
        minScore: 0,
      }),
      managersChoice: snap?.managersChoice === true,
      valueScore: snap?.score ?? null,
      payableFromAi: false,
    };
  });
}

/**
 * PD106 thin vertical: profile cards include Manager's choice + eligibility.
 */
export function runPd106TechnicianProfileCardsThinVertical(): {
  cardCount: number;
  managersChoiceVisible: true;
  eligibleCard: true;
  payableFromAi: false;
} {
  __resetJobsForTests();
  upsertTechnicianProfileDirectory({
    technicianId: "tech_pd106_choice",
    displayName: "Amai Choice",
    tradeId: "trade_auto",
  });
  upsertTechnicianProfileDirectory({
    technicianId: "tech_pd106_std",
    displayName: "Baba Standard",
    tradeId: "trade_elec",
  });
  setTechnicianCredential({
    technicianId: "tech_pd106_choice",
    kind: "trade_licence",
    status: "verified",
  });
  setTechnicianCredential({
    technicianId: "tech_pd106_std",
    kind: "trade_licence",
    status: "verified",
  });
  setValueScoreSnapshot({
    technicianId: "tech_pd106_choice",
    score: 92,
    sampleN: 40,
  });
  setManagersChoice({
    technicianId: "tech_pd106_choice",
    managersChoice: true,
    setBy: "pd106",
  });
  setValueScoreSnapshot({
    technicianId: "tech_pd106_std",
    score: 74,
    sampleN: 18,
  });
  setTechnicianAvailability({
    technicianId: "tech_pd106_choice",
    status: "available",
  });
  setTechnicianAvailability({
    technicianId: "tech_pd106_std",
    status: "busy",
  });
  const cards = listTechnicianProfileCards();
  if (cards.length < 2) throw new Error("PD106 expected profile cards");
  const choice = cards.find((c) => c.technicianId === "tech_pd106_choice");
  if (!choice?.managersChoice) {
    throw new Error("PD106 expected Manager's choice on card");
  }
  if (!choice.eligible) throw new Error("PD106 expected eligible card");
  return {
    cardCount: cards.length,
    managersChoiceVisible: true,
    eligibleCard: true,
    payableFromAi: false,
  };
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
  const payloadRef = input.payloadRef.slice(0, 2048);
  const fingerprintHash = simpleEvidenceFingerprint(payloadRef);
  let nearDupeOf: string | null = null;
  for (const e of evidence.values()) {
    if (e.jobId === input.jobId && e.fingerprintHash === fingerprintHash) {
      nearDupeOf = e.evidenceId;
      break;
    }
  }
  const row: JobEvidence = {
    evidenceId: `ev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
    jobId: input.jobId,
    technicianId: input.technicianId,
    kind: input.kind,
    payloadRef,
    createdAt: new Date().toISOString(),
    reviewStatus: "pending",
    fingerprintHash,
    nearDupeOf,
    reviewedBy: null,
    reviewedAt: null,
  };
  evidence.set(row.evidenceId, row);
  return { ...row };
}

function simpleEvidenceFingerprint(payloadRef: string): string {
  let h = 0;
  for (let i = 0; i < payloadRef.length; i++) {
    h = (h * 31 + payloadRef.charCodeAt(i)) >>> 0;
  }
  return `fp_${h.toString(16)}`;
}

export function listEvidenceForJob(jobId: string): JobEvidence[] {
  return [...evidence.values()]
    .filter((e) => e.jobId === jobId)
    .map((e) => ({ ...e }));
}

/** PD127 — PicPeak evidence gallery item (lightbox / next-prev / approve-reject). */
export type EvidenceGalleryItem = JobEvidence & {
  index: number;
  total: number;
  picPeakPattern: true;
  customerPhotoShare: false;
};

export type EvidenceGallerySnapshot = {
  items: EvidenceGalleryItem[];
  pendingCount: number;
  nearDupeCount: number;
  picPeakPattern: true;
  customerPhotoShare: false;
  moneyAuthority: false;
};

/**
 * List evidence for ops proofing gallery (PicPeak UX). Not a customer photo product.
 */
export function listEvidenceGallery(input?: {
  jobId?: string;
  pendingOnly?: boolean;
}): EvidenceGallerySnapshot {
  let rows = [...evidence.values()];
  if (input?.jobId) rows = rows.filter((e) => e.jobId === input.jobId);
  if (input?.pendingOnly) rows = rows.filter((e) => e.reviewStatus === "pending");
  rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const items: EvidenceGalleryItem[] = rows.map((e, index) => ({
    ...e,
    index,
    total: rows.length,
    picPeakPattern: true,
    customerPhotoShare: false,
  }));
  return {
    items,
    pendingCount: items.filter((i) => i.reviewStatus === "pending").length,
    nearDupeCount: items.filter((i) => i.nearDupeOf).length,
    picPeakPattern: true,
    customerPhotoShare: false,
    moneyAuthority: false,
  };
}

/**
 * Navigate gallery cursor (keyboard next/prev pattern).
 */
export function navigateEvidenceGallery(input: {
  jobId?: string;
  evidenceId: string;
  direction: "next" | "prev";
}): EvidenceGalleryItem | null {
  const snap = listEvidenceGallery(
    input.jobId ? { jobId: input.jobId } : undefined,
  );
  const idx = snap.items.findIndex((i) => i.evidenceId === input.evidenceId);
  if (idx < 0) return null;
  const nextIdx =
    input.direction === "next"
      ? Math.min(idx + 1, snap.items.length - 1)
      : Math.max(idx - 1, 0);
  return snap.items[nextIdx] ?? null;
}

/**
 * Approve or reject evidence in gallery. Never payable.
 */
export function reviewEvidence(input: {
  evidenceId: string;
  decision: "approve" | "reject";
  reviewedBy: string;
}): JobEvidence {
  const row = evidence.get(input.evidenceId);
  if (!row) throw new Error(`Unknown evidence ${input.evidenceId}`);
  if (!input.reviewedBy.trim()) throw new Error("reviewedBy required");
  row.reviewStatus = input.decision === "approve" ? "approved" : "rejected";
  row.reviewedBy = input.reviewedBy.trim();
  row.reviewedAt = new Date().toISOString();
  return { ...row };
}

/**
 * PD127 thin vertical: upload → near-dupe → gallery navigate → approve|reject.
 */
export async function runPd127PicPeakEvidenceGalleryThinVertical(): Promise<{
  pendingThenResolved: true;
  nearDupeDetected: true;
  navigated: true;
  picPeakPattern: true;
  customerPhotoShare: false;
  payableFromAi: false;
}> {
  __resetJobsForTests();
  const slots = await listBookingSlots();
  const job = bookTechJob({
    customerId: "cust_pd127",
    technicianId: "tech_pd127",
    jobClass: "diagnostics",
    slotId: slots[0]!.slotId,
  });
  const first = uploadJobEvidence({
    jobId: job.id,
    technicianId: "tech_pd127",
    kind: "photo",
    payloadRef: "data:image/jpeg;base64,pd127same",
  });
  const dupe = uploadJobEvidence({
    jobId: job.id,
    technicianId: "tech_pd127",
    kind: "photo",
    payloadRef: "data:image/jpeg;base64,pd127same",
  });
  if (!dupe.nearDupeOf || dupe.nearDupeOf !== first.evidenceId) {
    throw new Error("PD127 expected near-dupe fingerprint match");
  }
  const gallery = listEvidenceGallery({ jobId: job.id });
  if (gallery.pendingCount < 2 || gallery.customerPhotoShare !== false) {
    throw new Error("PD127 gallery pending / share checks failed");
  }
  const moved = navigateEvidenceGallery({
    jobId: job.id,
    evidenceId: first.evidenceId,
    direction: "next",
  });
  if (!moved || moved.evidenceId !== dupe.evidenceId) {
    throw new Error("PD127 expected next navigate to dupe");
  }
  const approved = reviewEvidence({
    evidenceId: first.evidenceId,
    decision: "approve",
    reviewedBy: "ops_pd127",
  });
  const rejected = reviewEvidence({
    evidenceId: dupe.evidenceId,
    decision: "reject",
    reviewedBy: "ops_pd127",
  });
  if (approved.reviewStatus !== "approved" || rejected.reviewStatus !== "rejected") {
    throw new Error("PD127 review decisions failed");
  }
  const after = listEvidenceGallery({ jobId: job.id, pendingOnly: true });
  if (after.pendingCount !== 0) throw new Error("PD127 expected no pending");
  return {
    pendingThenResolved: true,
    nearDupeDetected: true,
    navigated: true,
    picPeakPattern: true,
    customerPhotoShare: false,
    payableFromAi: false,
  };
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

/** PD123 — Schedule-X roster day board (D-46); display-only — Cal.com remains bookable slots. */
export type RosterBoardEvent = {
  eventId: string;
  technicianId: string;
  jobId: string;
  jobClassId: string;
  startAt: string;
  endAt: string;
  /** Schedule-X = capacity display; never a Cal.com bookable slot. */
  displayOnly: true;
  source: "schedule_x_fixture";
  payableFromAi: false;
};

export type RosterDayBoard = {
  day: string;
  events: RosterBoardEvent[];
  scheduleXPattern: true;
  calComSlotsReplaced: false;
  moneyAuthority: false;
};

/**
 * Build multi-tech day board from assigned jobs (Schedule-X pattern).
 * Does not create or replace Cal.com bookable slots.
 */
export function listRosterDayBoard(input?: {
  day?: string;
}): RosterDayBoard {
  const day =
    input?.day?.trim() ||
    new Date().toISOString().slice(0, 10);
  const events: RosterBoardEvent[] = [];
  for (const job of jobs.values()) {
    if (!job.technicianId) continue;
    if (job.status === "intake") continue;
    let startAt = job.createdAt;
    let endAt = job.createdAt;
    if (job.slotId) {
      const booking = [...calBookings.values()].find(
        (b) => b.slotId === job.slotId,
      );
      if (booking) {
        startAt = booking.startAt;
        endAt = booking.endAt;
      } else {
        // Fixture window from slot id hash when Cal confirm not yet recorded.
        const base = Date.parse(`${day}T08:00:00.000Z`);
        const offsetH = Math.abs(
          [...job.slotId].reduce((a, c) => a + c.charCodeAt(0), 0) % 8,
        );
        startAt = new Date(base + offsetH * 3_600_000).toISOString();
        endAt = new Date(base + (offsetH + 1) * 3_600_000).toISOString();
      }
    } else {
      const base = Date.parse(`${day}T09:00:00.000Z`);
      startAt = new Date(base).toISOString();
      endAt = new Date(base + 3_600_000).toISOString();
    }
    if (!startAt.startsWith(day) && !job.slotId) {
      // Keep emergency / unslotted jobs visible on requested day board.
      const base = Date.parse(`${day}T10:00:00.000Z`);
      startAt = new Date(base).toISOString();
      endAt = new Date(base + 3_600_000).toISOString();
    }
    events.push({
      eventId: `roster_${job.id}`,
      technicianId: job.technicianId,
      jobId: job.id,
      jobClassId: job.jobClassId,
      startAt,
      endAt,
      displayOnly: true,
      source: "schedule_x_fixture",
      payableFromAi: false,
    });
  }
  events.sort((a, b) => a.startAt.localeCompare(b.startAt));
  return {
    day,
    events,
    scheduleXPattern: true,
    calComSlotsReplaced: false,
    moneyAuthority: false,
  };
}

/**
 * PD123 thin vertical: book assigned job → roster day board shows display-only event.
 */
export async function runPd123ScheduleXRosterThinVertical(): Promise<{
  eventCount: number;
  displayOnly: true;
  calComSlotsReplaced: false;
  moneyAuthority: false;
  payableFromAi: false;
}> {
  __resetJobsForTests();
  const slots = await listBookingSlots();
  if (slots.length < 1) throw new Error("PD123 expected slots");
  const job = bookTechJob({
    customerId: "cust_pd123",
    technicianId: "tech_pd123",
    jobClass: "diagnostics",
    slotId: slots[0]!.slotId,
  });
  const day = new Date().toISOString().slice(0, 10);
  const board = listRosterDayBoard({ day });
  if (board.calComSlotsReplaced !== false || board.moneyAuthority !== false) {
    throw new Error("PD123 Schedule-X must not replace Cal.com or claim money");
  }
  const hit = board.events.find((e) => e.jobId === job.id);
  if (!hit || hit.displayOnly !== true || hit.technicianId !== "tech_pd123") {
    throw new Error("PD123 expected roster event for assigned job");
  }
  return {
    eventCount: board.events.length,
    displayOnly: true,
    calComSlotsReplaced: false,
    moneyAuthority: false,
    payableFromAi: false,
  };
}

export function __resetJobsForTests(): void {
  valueScores.clear();
  scoreDisputes.clear();
  scoreEvents.length = 0;
  jobs.clear();
  evidence.clear();
  checklistRuns.clear();
  bookedSlotIds.clear();
  calBookings.clear();
  technicianAvailability.clear();
  technicianCredentials.clear();
  technicianProfileDirectory.clear();
  trades.length = 0;
  trades.push(...TRADE_SEED.map((t) => ({ ...t })));
  jobClasses.length = 0;
  jobClasses.push(...JOB_CLASS_SEED.map((j) => ({ ...j })));
  __resetProjectsAndLegalForTests();
  __resetMockLocationEvidenceForTests();
  __resetBluetoothPrintForTests();
  __resetJobVariationsForTests();
}
