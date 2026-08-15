/**
 * Intelligence Factory + Command Centre (D-54 Pack T8/E6a / PD10 / PD17).
 * Simulated never auto-pays. No auto-publish without human + Promptfoo.
 * AI drafts only — never payable amounts.
 */

export type MetricContract = {
  id: string;
  source: string;
  calculation: string;
  thresholds: { warn: number; critical: number };
  ownerRole: string;
};

export type MetricTile = MetricContract & {
  mode: CommandCentreMode;
  value: number | null;
  status: "ok" | "warn" | "critical" | "unknown";
  /** Simulated tiles never drive payouts. */
  canDrivePayout: false;
};

export type FactoryDatasetVersion = {
  versionId: string;
  outcomeWeighted: true;
  createdAt: string;
  /** Shadow run that produced this promote, if any. */
  fromShadowId?: string;
};

export type ShadowPromoteGate = {
  shadowId: string;
  promptfooPassed: boolean;
  humanApproved: boolean;
  canPromote: boolean;
};

export type CommandCentreMode = "actual" | "simulated";

/** Checklist / capability draft — no money fields (D-54). */
export type FactoryDraftArtifact = {
  kind: "checklist" | "capability_prompt" | "guided_intake_eval";
  title: string;
  body: string;
  /** Locked false — AI never writes payable amounts into Factory drafts. */
  payableFromAi: false;
  flashLiteSafetyOrgan: "p1";
};

export type IntelligenceShadowRun = {
  shadowId: string;
  status:
    | "shadowing"
    | "promptfoo_pending"
    | "awaiting_human"
    | "promoted"
    | "rejected"
    | "blocked";
  draft: FactoryDraftArtifact;
  promptfooPassed: boolean | null;
  promptfooReportId: string | null;
  humanApproved: boolean;
  humanApprover: string | null;
  promotedDatasetVersionId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type IntelligenceFactorySnapshot = {
  shadows: IntelligenceShadowRun[];
  datasets: FactoryDatasetVersion[];
  autoPublishAttemptsBlocked: number;
  simulatedPayoutAttemptsBlocked: number;
};

const metricRegistry = new Map<string, MetricContract>();
const metricValues = new Map<string, number>();
const datasets: FactoryDatasetVersion[] = [];
const shadows = new Map<string, IntelligenceShadowRun>();
let autoPublishAttemptsBlocked = 0;
let simulatedPayoutAttemptsBlocked = 0;

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function assertNoPayableInDraft(draft: FactoryDraftArtifact): void {
  if (draft.payableFromAi !== false) {
    throw new Error("Factory draft must set payableFromAi=false");
  }
  const banned = /amountMinor|unitPrice|payable|ledgerWrite|setPrice/i;
  if (banned.test(draft.title) || banned.test(draft.body)) {
    throw new Error("Factory draft must not contain payable amount language");
  }
}

function cloneShadow(s: IntelligenceShadowRun): IntelligenceShadowRun {
  return {
    ...s,
    draft: { ...s.draft },
  };
}

export function registerMetricContract(contract: MetricContract): void {
  metricRegistry.set(contract.id, { ...contract });
}

export function listMetricContracts(): MetricContract[] {
  return [...metricRegistry.values()].map((c) => ({ ...c }));
}

/** Seed Pack/D-54 default KPI contracts (idempotent). */
export function ensureDefaultMetricContracts(): MetricContract[] {
  const defaults: MetricContract[] = [
    {
      id: "metric.on_time_pod",
      source: "delivery.pod",
      calculation: "count(pod_on_time)/count(pod)",
      thresholds: { warn: 0.9, critical: 0.8 },
      ownerRole: "ops_admin",
    },
    {
      id: "metric.money_outbox_depth",
      source: "ledger.money_outbox",
      calculation: "count(pending_outbox_rows)",
      thresholds: { warn: 10, critical: 50 },
      ownerRole: "ops_admin",
    },
    {
      id: "metric.dispatch_fifo_depth",
      source: "delivery.fifo",
      calculation: "count(fifo_queue)",
      thresholds: { warn: 5, critical: 20 },
      ownerRole: "ops_admin",
    },
  ];
  for (const c of defaults) {
    if (!metricRegistry.has(c.id)) registerMetricContract(c);
  }
  return listMetricContracts();
}

export function setMetricObservedValue(metricId: string, value: number): void {
  if (!metricRegistry.has(metricId)) {
    throw new Error(`Unknown MetricContract ${metricId}`);
  }
  metricValues.set(metricId, value);
}

function statusFor(
  contract: MetricContract,
  value: number | null,
): MetricTile["status"] {
  if (value === null || Number.isNaN(value)) return "unknown";
  // Depth-style metrics: higher is worse (outbox/fifo). Ratio metrics: lower is worse.
  const invert =
    contract.id.includes("depth") ||
    contract.id.includes("outbox") ||
    contract.id.includes("fifo");
  if (invert) {
    if (value >= contract.thresholds.critical) return "critical";
    if (value >= contract.thresholds.warn) return "warn";
    return "ok";
  }
  if (value <= contract.thresholds.critical) return "critical";
  if (value <= contract.thresholds.warn) return "warn";
  return "ok";
}

/** Build tiles for Command Centre — every KPI has a MetricContract (D-54). */
export function listMetricTiles(mode: CommandCentreMode): MetricTile[] {
  ensureDefaultMetricContracts();
  return listMetricContracts().map((c) => {
    const value = metricValues.has(c.id) ? metricValues.get(c.id)! : null;
    return {
      ...c,
      mode,
      value,
      status: statusFor(c, value),
      canDrivePayout: false,
    };
  });
}

export function recordOutcomeWeightedDataset(input?: {
  fromShadowId?: string;
}): FactoryDatasetVersion {
  const row: FactoryDatasetVersion = {
    versionId: `ds_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    outcomeWeighted: true,
    createdAt: new Date().toISOString(),
  };
  if (input?.fromShadowId) row.fromShadowId = input.fromShadowId;
  datasets.push(row);
  return { ...row };
}

export function evaluateShadowPromote(input: {
  shadowId: string;
  promptfooPassed: boolean;
  humanApproved: boolean;
}): ShadowPromoteGate {
  return {
    shadowId: input.shadowId,
    promptfooPassed: input.promptfooPassed,
    humanApproved: input.humanApproved,
    canPromote: input.promptfooPassed && input.humanApproved,
  };
}

/**
 * PD17 — start a shadow run with an AI checklist/capability draft (never payable).
 */
export function createIntelligenceShadowRun(input: {
  kind?: FactoryDraftArtifact["kind"];
  title: string;
  body: string;
}): IntelligenceShadowRun {
  const draft: FactoryDraftArtifact = {
    kind: input.kind ?? "checklist",
    title: input.title,
    body: input.body,
    payableFromAi: false,
    flashLiteSafetyOrgan: "p1",
  };
  assertNoPayableInDraft(draft);
  const now = new Date().toISOString();
  const run: IntelligenceShadowRun = {
    shadowId: newId("sh"),
    status: "shadowing",
    draft,
    promptfooPassed: null,
    promptfooReportId: null,
    humanApproved: false,
    humanApprover: null,
    promotedDatasetVersionId: null,
    createdAt: now,
    updatedAt: now,
  };
  shadows.set(run.shadowId, run);
  return cloneShadow(run);
}

/** Record fixture/sandbox Promptfoo eval result (gate before human). */
export function recordShadowPromptfooResult(input: {
  shadowId: string;
  passed: boolean;
  reportId?: string;
}): IntelligenceShadowRun {
  const run = shadows.get(input.shadowId);
  if (!run) throw new Error(`Unknown shadow ${input.shadowId}`);
  if (run.status === "promoted" || run.status === "rejected") {
    throw new Error(`shadow already ${run.status}`);
  }
  run.promptfooPassed = input.passed;
  run.promptfooReportId = input.reportId ?? `pf_${run.shadowId}`;
  run.status = input.passed ? "awaiting_human" : "blocked";
  run.updatedAt = new Date().toISOString();
  return cloneShadow(run);
}

/** Human approve only after Promptfoo pass (D-54). */
export function humanApproveShadowRun(input: {
  shadowId: string;
  approver: string;
}): IntelligenceShadowRun {
  const run = shadows.get(input.shadowId);
  if (!run) throw new Error(`Unknown shadow ${input.shadowId}`);
  if (run.promptfooPassed !== true) {
    throw new Error("Promptfoo must pass before human promote approve");
  }
  if (!input.approver.trim()) throw new Error("approver required");
  run.humanApproved = true;
  run.humanApprover = input.approver.trim();
  run.status = "awaiting_human";
  run.updatedAt = new Date().toISOString();
  return cloneShadow(run);
}

export function rejectShadowRun(input: {
  shadowId: string;
  reason?: string;
}): IntelligenceShadowRun {
  const run = shadows.get(input.shadowId);
  if (!run) throw new Error(`Unknown shadow ${input.shadowId}`);
  run.status = "rejected";
  run.humanApproved = false;
  run.updatedAt = new Date().toISOString();
  if (input.reason) {
    run.draft = {
      ...run.draft,
      body: `${run.draft.body}\n\n[rejected: ${input.reason}]`,
    };
  }
  return cloneShadow(run);
}

/**
 * Promote shadow → outcome-weighted dataset. Requires Promptfoo + human.
 * Never auto-publishes.
 */
export function promoteShadowRun(shadowId: string): {
  run: IntelligenceShadowRun;
  dataset: FactoryDatasetVersion;
  gate: ShadowPromoteGate;
} {
  const run = shadows.get(shadowId);
  if (!run) throw new Error(`Unknown shadow ${shadowId}`);
  const gate = evaluateShadowPromote({
    shadowId,
    promptfooPassed: run.promptfooPassed === true,
    humanApproved: run.humanApproved,
  });
  if (!gate.canPromote) {
    throw new Error(
      "Cannot promote — need Promptfoo pass AND human approve (D-54)",
    );
  }
  assertNoPayableInDraft(run.draft);
  const dataset = recordOutcomeWeightedDataset({ fromShadowId: shadowId });
  run.status = "promoted";
  run.promotedDatasetVersionId = dataset.versionId;
  run.updatedAt = new Date().toISOString();
  return { run: cloneShadow(run), dataset: { ...dataset }, gate };
}

/** Auto-publish without gates — always blocked. */
export function attemptAutoPublishShadow(shadowId: string): never {
  autoPublishAttemptsBlocked += 1;
  void shadowId;
  throw new Error("auto_publish_forbidden_need_promptfoo_and_human");
}

export function listIntelligenceShadowRuns(): IntelligenceShadowRun[] {
  return [...shadows.values()].map(cloneShadow);
}

export function listFactoryDatasets(): FactoryDatasetVersion[] {
  return datasets.map((d) => ({ ...d }));
}

export function getIntelligenceFactorySnapshot(): IntelligenceFactorySnapshot {
  return {
    shadows: listIntelligenceShadowRuns(),
    datasets: listFactoryDatasets(),
    autoPublishAttemptsBlocked,
    simulatedPayoutAttemptsBlocked,
  };
}

/** Simulated watermark — never triggers payout. */
export function commandCentreBanner(mode: CommandCentreMode): {
  mode: CommandCentreMode;
  autoPayAllowed: false;
  watermark: string;
} {
  return {
    mode,
    autoPayAllowed: false,
    watermark:
      mode === "simulated"
        ? "SIMULATED — never auto-pays"
        : "ACTUAL — live control plane",
  };
}

/**
 * T9 / D-54 — Simulated must never trigger a payout path.
 * Actual mode still requires a separate money SoR call (never from CC alone).
 */
export function attemptCommandCentrePayout(input: {
  mode: CommandCentreMode;
  amountMinor: bigint;
}): never | { refused: true; reason: string } {
  if (input.mode === "simulated") {
    simulatedPayoutAttemptsBlocked += 1;
    throw new Error("Simulated Command Centre must never auto-pay (D-54)");
  }
  return {
    refused: true,
    reason: "Command Centre is not money SoR — use Job Reserve / ledger packages",
  };
}

/**
 * PD17 thin vertical: shadow draft → Promptfoo → human → promote;
 * auto-publish blocked; Simulated never pays; draft never payable.
 */
export function runPd17IntelligenceFactoryThinVertical(): {
  shadowId: string;
  promotedDatasetVersionId: string;
  canPromoteOnlyWithBothGates: true;
  autoPublishForbidden: true;
  simulatedNeverPays: true;
  payableFromAi: false;
  flashLiteSafetyOrgan: "p1";
  autoPublishAttemptsBlocked: number;
} {
  __resetIntelligenceForTests();

  const shadow = createIntelligenceShadowRun({
    kind: "checklist",
    title: "PD17 roadside battery checklist draft",
    body: "1) Confirm safety\n2) Test voltage\n3) Route to human quote — needsHumanQuote",
  });

  const blockedPromote = evaluateShadowPromote({
    shadowId: shadow.shadowId,
    promptfooPassed: false,
    humanApproved: false,
  });
  if (blockedPromote.canPromote) {
    throw new Error("PD17 expected canPromote=false without gates");
  }

  recordShadowPromptfooResult({
    shadowId: shadow.shadowId,
    passed: true,
    reportId: "pf_fixture_pd17",
  });
  humanApproveShadowRun({
    shadowId: shadow.shadowId,
    approver: "ops_pd17",
  });

  let autoBlocked = false;
  try {
    attemptAutoPublishShadow(shadow.shadowId);
  } catch (e) {
    if (
      e instanceof Error &&
      e.message === "auto_publish_forbidden_need_promptfoo_and_human"
    ) {
      autoBlocked = true;
    } else {
      throw e;
    }
  }
  if (!autoBlocked) throw new Error("PD17 expected auto-publish block");

  const promoted = promoteShadowRun(shadow.shadowId);
  if (!promoted.dataset.outcomeWeighted) {
    throw new Error("PD17 dataset must be outcome-weighted");
  }

  assertThrowsSimulatedPayout();

  return {
    shadowId: shadow.shadowId,
    promotedDatasetVersionId: promoted.dataset.versionId,
    canPromoteOnlyWithBothGates: true,
    autoPublishForbidden: true,
    simulatedNeverPays: true,
    payableFromAi: false,
    flashLiteSafetyOrgan: "p1",
    autoPublishAttemptsBlocked,
  };
}

function assertThrowsSimulatedPayout(): void {
  try {
    attemptCommandCentrePayout({ mode: "simulated", amountMinor: 1_00n });
    throw new Error("expected simulated payout throw");
  } catch (e) {
    if (!(e instanceof Error) || !e.message.includes("never auto-pay")) {
      throw e;
    }
  }
}

export function __resetIntelligenceForTests(): void {
  metricRegistry.clear();
  metricValues.clear();
  datasets.length = 0;
  shadows.clear();
  autoPublishAttemptsBlocked = 0;
  simulatedPayoutAttemptsBlocked = 0;
}
