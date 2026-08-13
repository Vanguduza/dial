/**
 * Intelligence Factory + Command Centre stubs (D-54 Pack T8/E6a).
 * Simulated never auto-pays. No auto-publish without human + Promptfoo.
 */
export type MetricContract = {
  id: string;
  source: string;
  calculation: string;
  thresholds: { warn: number; critical: number };
  ownerRole: string;
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
const datasets: FactoryDatasetVersion[] = [];

export function registerMetricContract(contract: MetricContract): void {
  metricRegistry.set(contract.id, { ...contract });
}

export function listMetricContracts(): MetricContract[] {
  return [...metricRegistry.values()].map((c) => ({ ...c }));
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
  datasets.length = 0;
}
