/**
 * Jobs classification / rate-card quote / JobClass+Trade stubs (Pack §15 T6 / D-53).
 * Quotes are drafts only — AI never writes payable amounts.
 */
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
};

export type JobQuoteDraft = {
  quoteId: string;
  jobClassId: string;
  draftAmountUsdMinor: bigint;
  currency: "USD";
  source: "rate_card";
};

const trades: TradeDefinition[] = [
  { id: "trade_auto", name: "Automotive", lifecycle: "active" },
  { id: "trade_elec", name: "Electrical", lifecycle: "active" },
];

const jobClasses: JobClassDefinition[] = [
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

const valueScores = new Map<string, ValueScoreSnapshot>();

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

/** Assignment eligibility — active class + minimum value score. */
export function isTechnicianEligible(input: {
  technicianId: string;
  jobClassId: string;
  minScore?: number;
}): boolean {
  const jc = jobClasses.find((j) => j.id === input.jobClassId);
  if (!jc || jc.lifecycle !== "active") return false;
  const snap = valueScores.get(input.technicianId);
  const min = input.minScore ?? 0;
  return (snap?.score ?? 0) >= min;
}

export function setValueScoreSnapshot(input: {
  technicianId: string;
  score: number;
}): ValueScoreSnapshot {
  const row: ValueScoreSnapshot = {
    technicianId: input.technicianId,
    score: input.score,
    asOf: new Date().toISOString(),
  };
  valueScores.set(input.technicianId, row);
  return { ...row };
}

export function getValueScoreSnapshot(
  technicianId: string,
): ValueScoreSnapshot | undefined {
  const row = valueScores.get(technicianId);
  return row ? { ...row } : undefined;
}

/** Rate-card quote only — not AI-authored payable. */
export function quoteFromRateCard(jobClassId: string): JobQuoteDraft {
  const jc = jobClasses.find((j) => j.id === jobClassId);
  if (!jc || jc.lifecycle !== "active") {
    throw new Error(`Unknown or inactive job class ${jobClassId}`);
  }
  const draftAmountUsdMinor = jobClassId === "jc_roadside" ? 80_00n : 45_00n;
  return {
    quoteId: `jq_${Date.now().toString(36)}`,
    jobClassId,
    draftAmountUsdMinor,
    currency: "USD",
    source: "rate_card",
  };
}

export function __resetJobsForTests(): void {
  valueScores.clear();
}
