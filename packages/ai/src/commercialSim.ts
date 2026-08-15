/**
 * PD23 Commercial Simulation runs (Pack §9.5 / D-53 / D-54).
 * Actual vs Simulated toggle — Simulated never auto-pays. Not money SoR.
 */

export type CommercialSimMode = "actual" | "simulated";

export type CommercialSimRunStatus = "draft" | "running" | "completed" | "archived";

export type CommercialSimRun = {
  runId: string;
  title: string;
  mode: CommercialSimMode;
  status: CommercialSimRunStatus;
  /** Scenario deltas — never treated as live payable. */
  projectedMarginMinor: bigint;
  currency: "USD";
  watermark: string;
  autoPayAllowed: false;
  createdAt: string;
  completedAt: string | null;
};

type CommercialSimStore = {
  runs: Map<string, CommercialSimRun>;
  simulatedPayoutBlocked: number;
};

function store(): CommercialSimStore {
  const g = globalThis as typeof globalThis & {
    __dialCommercialSimStore?: CommercialSimStore;
  };
  if (!g.__dialCommercialSimStore) {
    g.__dialCommercialSimStore = {
      runs: new Map(),
      simulatedPayoutBlocked: 0,
    };
  }
  return g.__dialCommercialSimStore;
}

export function __resetCommercialSimForTests(): void {
  const s = store();
  s.runs.clear();
  s.simulatedPayoutBlocked = 0;
}

function newId(): string {
  return `csim_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function watermarkFor(mode: CommercialSimMode): string {
  return mode === "simulated"
    ? "SIMULATED — never auto-pays"
    : "ACTUAL — live control plane (CC not money SoR)";
}

function cloneRun(r: CommercialSimRun): CommercialSimRun {
  return { ...r };
}

export function createCommercialSimRun(input: {
  title: string;
  mode: CommercialSimMode;
  projectedMarginMinor: bigint;
}): CommercialSimRun {
  if (!input.title.trim()) throw new Error("title required");
  if (input.projectedMarginMinor < 0n) {
    throw new Error("projectedMarginMinor must be non-negative");
  }
  const run: CommercialSimRun = {
    runId: newId(),
    title: input.title.trim(),
    mode: input.mode,
    status: "draft",
    projectedMarginMinor: input.projectedMarginMinor,
    currency: "USD",
    watermark: watermarkFor(input.mode),
    autoPayAllowed: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  store().runs.set(run.runId, run);
  return cloneRun(run);
}

export function setCommercialSimMode(input: {
  runId: string;
  mode: CommercialSimMode;
}): CommercialSimRun {
  const run = store().runs.get(input.runId);
  if (!run) throw new Error(`Unknown sim run ${input.runId}`);
  run.mode = input.mode;
  run.watermark = watermarkFor(input.mode);
  return cloneRun(run);
}

export function startCommercialSimRun(runId: string): CommercialSimRun {
  const run = store().runs.get(runId);
  if (!run) throw new Error(`Unknown sim run ${runId}`);
  if (run.status !== "draft") throw new Error(`cannot_start_from_${run.status}`);
  run.status = "running";
  return cloneRun(run);
}

export function completeCommercialSimRun(runId: string): CommercialSimRun {
  const run = store().runs.get(runId);
  if (!run) throw new Error(`Unknown sim run ${runId}`);
  if (run.status !== "running") {
    throw new Error(`cannot_complete_from_${run.status}`);
  }
  run.status = "completed";
  run.completedAt = new Date().toISOString();
  return cloneRun(run);
}

/**
 * Attempt payout from a Commercial Simulation context.
 * Simulated always throws (D-54). Actual still refuses — CC/sim is not money SoR.
 */
export function attemptCommercialSimPayout(input: {
  runId: string;
  amountMinor: bigint;
}): never | { refused: true; reason: string; autoPayAllowed: false } {
  const run = store().runs.get(input.runId);
  if (!run) throw new Error(`Unknown sim run ${input.runId}`);
  if (run.mode === "simulated") {
    store().simulatedPayoutBlocked += 1;
    throw new Error("Simulated Commercial Simulation must never auto-pay (D-54)");
  }
  return {
    refused: true,
    reason:
      "Commercial Simulation / Command Centre is not money SoR — use Job Reserve / ledger",
    autoPayAllowed: false,
  };
}

export function getCommercialSimRun(runId: string): CommercialSimRun | undefined {
  const r = store().runs.get(runId);
  return r ? cloneRun(r) : undefined;
}

export function listCommercialSimRuns(): CommercialSimRun[] {
  return [...store().runs.values()].map(cloneRun);
}

export function commercialSimSnapshot(): {
  runs: Array<{
    runId: string;
    title: string;
    mode: CommercialSimMode;
    status: CommercialSimRunStatus;
    projectedMarginMinor: string;
    currency: "USD";
    watermark: string;
    autoPayAllowed: false;
  }>;
  simulatedPayoutAttemptsBlocked: number;
} {
  return {
    runs: listCommercialSimRuns().map((r) => ({
      runId: r.runId,
      title: r.title,
      mode: r.mode,
      status: r.status,
      projectedMarginMinor: r.projectedMarginMinor.toString(),
      currency: "USD" as const,
      watermark: r.watermark,
      autoPayAllowed: false as const,
    })),
    simulatedPayoutAttemptsBlocked: store().simulatedPayoutBlocked,
  };
}

/**
 * PD23 Commercial Simulation thin path: create → Simulated → start/complete →
 * payout blocked; Actual also refuses (not money SoR).
 */
export function runPd23CommercialSimThinVertical(): {
  runId: string;
  simulatedNeverPays: true;
  actualRefusesMoneySor: true;
  autoPayAllowed: false;
  status: "completed";
} {
  __resetCommercialSimForTests();
  const run = createCommercialSimRun({
    title: "PD23 margin scenario",
    mode: "simulated",
    projectedMarginMinor: 50_00n,
  });
  startCommercialSimRun(run.runId);
  completeCommercialSimRun(run.runId);

  let simulatedBlocked = false;
  try {
    attemptCommercialSimPayout({ runId: run.runId, amountMinor: 10_00n });
  } catch (e) {
    if (
      e instanceof Error &&
      e.message.includes("never auto-pay")
    ) {
      simulatedBlocked = true;
    } else {
      throw e;
    }
  }
  if (!simulatedBlocked) throw new Error("PD23 expected Simulated payout block");

  setCommercialSimMode({ runId: run.runId, mode: "actual" });
  const actual = attemptCommercialSimPayout({
    runId: run.runId,
    amountMinor: 10_00n,
  });
  if (!actual.refused || actual.autoPayAllowed !== false) {
    throw new Error("PD23 Actual must refuse — not money SoR");
  }

  return {
    runId: run.runId,
    simulatedNeverPays: true,
    actualRefusesMoneySor: true,
    autoPayAllowed: false,
    status: "completed",
  };
}
