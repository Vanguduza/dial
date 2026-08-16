/**
 * PD23 WHT remittance centre (Pack §9.5 / D-50 / D-53).
 * Remits withheld balances — never assumes WHT disappears; AI never writes payable.
 */

export type WhtRemittanceStatus = "draft" | "submitted" | "acknowledged";

export type WhtRemittanceLine = {
  technicianId: string;
  yearOfAssessment: number;
  withheldMinor: bigint;
  currency: "USD";
};

export type WhtRemittanceBatch = {
  batchId: string;
  yearOfAssessment: number;
  status: WhtRemittanceStatus;
  lines: WhtRemittanceLine[];
  totalWithheldMinor: bigint;
  currency: "USD";
  /** Human ops only — never AI. */
  submittedBy: string | null;
  createdAt: string;
  submittedAt: string | null;
  payableFromAi: false;
};

type RemittanceStore = {
  batches: Map<string, WhtRemittanceBatch>;
};

function store(): RemittanceStore {
  const g = globalThis as typeof globalThis & {
    __dialWhtRemittanceStore?: RemittanceStore;
  };
  if (!g.__dialWhtRemittanceStore) {
    g.__dialWhtRemittanceStore = { batches: new Map() };
  }
  return g.__dialWhtRemittanceStore;
}

export function __resetWhtRemittanceForTests(): void {
  store().batches.clear();
}

function newId(): string {
  return `whtb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function cloneBatch(b: WhtRemittanceBatch): WhtRemittanceBatch {
  return {
    ...b,
    lines: b.lines.map((l) => ({ ...l })),
  };
}

/** Build remittance draft from provided withholding rows for a YOA. */
export function createWhtRemittanceDraft(input: {
  yearOfAssessment: number;
  balances: Array<{
    technicianId: string;
    yearOfAssessment: number;
    withheldMinor: bigint;
  }>;
}): WhtRemittanceBatch {
  const balances = input.balances.filter(
    (b) =>
      b.yearOfAssessment === input.yearOfAssessment && b.withheldMinor > 0n,
  );
  if (balances.length === 0) {
    throw new Error("no_withheld_balances_for_year");
  }
  const lines: WhtRemittanceLine[] = balances.map((b) => ({
    technicianId: b.technicianId,
    yearOfAssessment: b.yearOfAssessment,
    withheldMinor: b.withheldMinor,
    currency: "USD" as const,
  }));
  const totalWithheldMinor = lines.reduce((s, l) => s + l.withheldMinor, 0n);
  const batch: WhtRemittanceBatch = {
    batchId: newId(),
    yearOfAssessment: input.yearOfAssessment,
    status: "draft",
    lines,
    totalWithheldMinor,
    currency: "USD",
    submittedBy: null,
    createdAt: new Date().toISOString(),
    submittedAt: null,
    payableFromAi: false,
  };
  store().batches.set(batch.batchId, batch);
  return cloneBatch(batch);
}

export function submitWhtRemittance(input: {
  batchId: string;
  submittedBy: string;
}): WhtRemittanceBatch {
  const batch = store().batches.get(input.batchId);
  if (!batch) throw new Error(`Unknown remittance ${input.batchId}`);
  if (batch.status !== "draft") {
    throw new Error(`cannot_submit_from_${batch.status}`);
  }
  if (!input.submittedBy.trim()) throw new Error("submittedBy required");
  batch.status = "submitted";
  batch.submittedBy = input.submittedBy.trim();
  batch.submittedAt = new Date().toISOString();
  return cloneBatch(batch);
}

export function acknowledgeWhtRemittance(batchId: string): WhtRemittanceBatch {
  const batch = store().batches.get(batchId);
  if (!batch) throw new Error(`Unknown remittance ${batchId}`);
  if (batch.status !== "submitted") {
    throw new Error(`cannot_acknowledge_from_${batch.status}`);
  }
  batch.status = "acknowledged";
  return cloneBatch(batch);
}

export function getWhtRemittance(batchId: string): WhtRemittanceBatch | undefined {
  const b = store().batches.get(batchId);
  return b ? cloneBatch(b) : undefined;
}

export function listWhtRemittances(): WhtRemittanceBatch[] {
  return [...store().batches.values()].map(cloneBatch);
}

export function serializeWhtRemittance(b: WhtRemittanceBatch) {
  return {
    ...b,
    totalWithheldMinor: b.totalWithheldMinor.toString(),
    lines: b.lines.map((l) => ({
      ...l,
      withheldMinor: l.withheldMinor.toString(),
    })),
  };
}

/**
 * Phase 8 prep (not G8) — Postgres row shape for durable remittance (migration `0006`).
 * In-memory store remains fixture SoR until sandbox tables applied.
 */
export function whtRemittanceDurableRow(
  b: WhtRemittanceBatch,
): Record<string, unknown> {
  return {
    batch_id: b.batchId,
    year_of_assessment: b.yearOfAssessment,
    status: b.status,
    total_withheld_minor: Number(b.totalWithheldMinor),
    currency: b.currency,
    submitted_by: b.submittedBy,
    created_at: b.createdAt,
    submitted_at: b.submittedAt,
    payable_from_ai: false,
    lines_json: b.lines.map((l) => ({
      technician_id: l.technicianId,
      year_of_assessment: l.yearOfAssessment,
      withheld_minor: l.withheldMinor.toString(),
      currency: l.currency,
    })),
  };
}

/** Key-drop-in: sandbox/live persist when Supabase configured; fixture = no-op. */
export async function persistWhtRemittanceDurable(
  batch: WhtRemittanceBatch,
  env: NodeJS.ProcessEnv = process.env,
): Promise<"fixture_skip" | "accepted" | "duplicate"> {
  const mode = (env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (mode === "fixture") return "fixture_skip";
  const { persistWhtRemittanceBatchDurable } = await import(
    "@dial/shared"
  );
  return persistWhtRemittanceBatchDurable(
    whtRemittanceDurableRow(batch),
    env,
  );
}
