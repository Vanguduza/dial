/**
 * PD69 — job variation propose/approve (Pack §10). Draft delta only;
 * AI never writes payable amounts — human propose + human approve.
 */

export type JobVariationStatus = "proposed" | "approved" | "rejected";

export type JobVariation = {
  variationId: string;
  jobId: string;
  proposedBy: string;
  /** Draft delta USD minor — not a payable write until human approve + pricing engine. */
  draftDeltaUsdMinor: string;
  currency: "USD";
  reason: string;
  status: JobVariationStatus;
  approvedBy: string | null;
  rejectedBy: string | null;
  createdAt: string;
  resolvedAt: string | null;
  payableFromAi: false;
};

const variations: JobVariation[] = [];

function vid(): string {
  return `jvar_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function proposeJobVariation(input: {
  jobId: string;
  proposedBy: string;
  draftDeltaUsdMinor: bigint;
  reason: string;
  /** Must stay false — callers cannot mark AI as payable source. */
  fromAi?: boolean;
}): JobVariation {
  if (input.fromAi === true) {
    throw new Error("AI cannot propose job variation payables");
  }
  if (!input.jobId.trim() || !input.proposedBy.trim()) {
    throw new Error("jobId and proposedBy required");
  }
  if (typeof input.draftDeltaUsdMinor !== "bigint") {
    throw new TypeError("draftDeltaUsdMinor must be bigint");
  }
  if (!input.reason.trim()) throw new Error("reason required");
  const row: JobVariation = {
    variationId: vid(),
    jobId: input.jobId,
    proposedBy: input.proposedBy.trim(),
    draftDeltaUsdMinor: input.draftDeltaUsdMinor.toString(),
    currency: "USD",
    reason: input.reason.trim(),
    status: "proposed",
    approvedBy: null,
    rejectedBy: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    payableFromAi: false,
  };
  variations.unshift(row);
  return { ...row };
}

export function approveJobVariation(input: {
  variationId: string;
  approvedBy: string;
}): JobVariation {
  if (!input.approvedBy.trim()) throw new Error("approvedBy required");
  const row = variations.find((v) => v.variationId === input.variationId);
  if (!row) throw new Error(`Unknown variation ${input.variationId}`);
  if (row.status !== "proposed") throw new Error(`Variation already ${row.status}`);
  row.status = "approved";
  row.approvedBy = input.approvedBy.trim();
  row.resolvedAt = new Date().toISOString();
  return { ...row };
}

export function rejectJobVariation(input: {
  variationId: string;
  rejectedBy: string;
}): JobVariation {
  if (!input.rejectedBy.trim()) throw new Error("rejectedBy required");
  const row = variations.find((v) => v.variationId === input.variationId);
  if (!row) throw new Error(`Unknown variation ${input.variationId}`);
  if (row.status !== "proposed") throw new Error(`Variation already ${row.status}`);
  row.status = "rejected";
  row.rejectedBy = input.rejectedBy.trim();
  row.resolvedAt = new Date().toISOString();
  return { ...row };
}

export function listJobVariations(filter?: {
  jobId?: string;
  status?: JobVariationStatus;
}): JobVariation[] {
  return variations
    .filter((v) => (filter?.jobId ? v.jobId === filter.jobId : true))
    .filter((v) => (filter?.status ? v.status === filter.status : true))
    .map((v) => ({ ...v }));
}

/**
 * PD69 thin vertical: propose → AI blocked → approve draft (not payable write).
 */
export function runPd69JobVariationApproveThinVertical(): {
  approved: true;
  aiProposeBlocked: true;
  payableFromAi: false;
  currency: "USD";
} {
  __resetJobVariationsForTests();
  let aiBlocked = false;
  try {
    proposeJobVariation({
      jobId: "job_pd69",
      proposedBy: "ai_agent",
      draftDeltaUsdMinor: 50_00n,
      reason: "AI draft",
      fromAi: true,
    });
  } catch {
    aiBlocked = true;
  }
  if (!aiBlocked) throw new Error("PD69 must block AI variation propose");
  const proposed = proposeJobVariation({
    jobId: "job_pd69",
    proposedBy: "tech_pd69",
    draftDeltaUsdMinor: 25_00n,
    reason: "Extra parts after diagnosis",
  });
  const approved = approveJobVariation({
    variationId: proposed.variationId,
    approvedBy: "ops_pd69",
  });
  if (approved.status !== "approved" || approved.payableFromAi !== false) {
    throw new Error("PD69 approve failed");
  }
  return {
    approved: true,
    aiProposeBlocked: true,
    payableFromAi: false,
    currency: "USD",
  };
}

export function __resetJobVariationsForTests(): void {
  variations.length = 0;
}
