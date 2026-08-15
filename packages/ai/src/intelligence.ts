/**
 * Intelligence Factory + Command Centre (D-54 Pack T8/E6a / PD10).
 * Simulated never auto-pays. No auto-publish without human + Promptfoo.
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
};

export type ShadowPromoteGate = {
  shadowId: string;
  promptfooPassed: boolean;
  humanApproved: boolean;
  canPromote: boolean;
};

export type CommandCentreMode = "actual" | "simulated";

const metricRegistry = new Map<string, MetricContract>();
const metricValues = new Map<string, number>();
const datasets: FactoryDatasetVersion[] = [];

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

export function recordOutcomeWeightedDataset(): FactoryDatasetVersion {
  const row: FactoryDatasetVersion = {
    versionId: `ds_${Date.now().toString(36)}`,
    outcomeWeighted: true,
    createdAt: new Date().toISOString(),
  };
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
    throw new Error("Simulated Command Centre must never auto-pay (D-54)");
  }
  return {
    refused: true,
    reason: "Command Centre is not money SoR — use Job Reserve / ledger packages",
  };
}

export function __resetIntelligenceForTests(): void {
  metricRegistry.clear();
  metricValues.clear();
  datasets.length = 0;
}
