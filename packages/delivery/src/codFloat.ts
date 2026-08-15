/**
 * PD32 — COD float-limit warning on collect (Pack §9.8 / D-7 ops).
 * PD61 — COD collect failure reasons on attempts.
 * USD amountMinor only — never float FX. Warning when projected held > limit.
 */

export type CourierCodFloatState = {
  courierId: string;
  /** Max cash the courier may carry (USD minor). */
  floatLimitUsdMinor: bigint;
  /** Cash currently held after successful COD collects. */
  heldUsdMinor: bigint;
};

export type CodCollectEvaluation = {
  courierId: string;
  collectUsdMinor: string;
  floatLimitUsdMinor: string;
  heldUsdMinor: string;
  projectedHeldUsdMinor: string;
  /** Soft warn — courier sees banner before confirm. */
  floatLimitWarning: boolean;
  overByUsdMinor: string;
  message: string;
  currency: "USD";
  payableFromAi: false;
};

/** Pack §9.8 — failure reasons on COD collect attempts. */
export type CodCollectFailureReason =
  | "customer_refused"
  | "wrong_amount"
  | "no_cash"
  | "counterfeit_suspected"
  | "other";

export type CodCollectAttempt = {
  attemptId: string;
  jobId: string;
  courierId: string;
  collectUsdMinor: string;
  floatLimitWarning: boolean;
  acknowledgedWarning: boolean;
  status: "recorded" | "blocked_unacked_warning" | "failed";
  failureReason?: CodCollectFailureReason;
  note?: string;
  /** PD80 — set when courier confirms successful collect (Pack §10). */
  confirmedAt?: string;
  currency: "USD";
  recordedAt: string;
  payableFromAi: false;
};

const floats = new Map<string, CourierCodFloatState>();
const attempts: CodCollectAttempt[] = [];

const FAILURE_REASONS = new Set<CodCollectFailureReason>([
  "customer_refused",
  "wrong_amount",
  "no_cash",
  "counterfeit_suspected",
  "other",
]);

function attemptId(): string {
  return `coda_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Default float $50.00 USD unless ops sets otherwise. */
export const DEFAULT_COD_FLOAT_LIMIT_USD_MINOR = 50_00n;

export function setCourierCodFloatLimit(
  courierId: string,
  floatLimitUsdMinor: bigint,
): CourierCodFloatState {
  if (floatLimitUsdMinor < 0n) throw new TypeError("float limit must be >= 0");
  const existing = floats.get(courierId);
  const row: CourierCodFloatState = {
    courierId,
    floatLimitUsdMinor,
    heldUsdMinor: existing?.heldUsdMinor ?? 0n,
  };
  floats.set(courierId, row);
  return { ...row };
}

export function getCourierCodFloat(courierId: string): CourierCodFloatState {
  const existing = floats.get(courierId);
  if (existing) return { ...existing };
  return {
    courierId,
    floatLimitUsdMinor: DEFAULT_COD_FLOAT_LIMIT_USD_MINOR,
    heldUsdMinor: 0n,
  };
}

export function evaluateCodCollect(input: {
  courierId: string;
  collectUsdMinor: bigint;
}): CodCollectEvaluation {
  if (input.collectUsdMinor < 0n) {
    throw new TypeError("collect amount must be >= 0");
  }
  const state = getCourierCodFloat(input.courierId);
  const projected = state.heldUsdMinor + input.collectUsdMinor;
  const over =
    projected > state.floatLimitUsdMinor
      ? projected - state.floatLimitUsdMinor
      : 0n;
  const warning = over > 0n;
  return {
    courierId: input.courierId,
    collectUsdMinor: input.collectUsdMinor.toString(),
    floatLimitUsdMinor: state.floatLimitUsdMinor.toString(),
    heldUsdMinor: state.heldUsdMinor.toString(),
    projectedHeldUsdMinor: projected.toString(),
    floatLimitWarning: warning,
    overByUsdMinor: over.toString(),
    message: warning
      ? `COD float limit warning: projected ${projected} exceeds limit ${state.floatLimitUsdMinor} USD minor by ${over}`
      : "Within COD float limit",
    currency: "USD",
    payableFromAi: false,
  };
}

/**
 * Record COD collect against float. If warning and not acknowledged → blocked.
 * On success, increments heldUsdMinor.
 */
export function recordCodCollectAttempt(input: {
  jobId: string;
  courierId: string;
  collectUsdMinor: bigint;
  acknowledgedWarning?: boolean;
}): CodCollectAttempt {
  const evalResult = evaluateCodCollect({
    courierId: input.courierId,
    collectUsdMinor: input.collectUsdMinor,
  });
  if (evalResult.floatLimitWarning && !input.acknowledgedWarning) {
    const blocked: CodCollectAttempt = {
      attemptId: attemptId(),
      jobId: input.jobId,
      courierId: input.courierId,
      collectUsdMinor: input.collectUsdMinor.toString(),
      floatLimitWarning: true,
      acknowledgedWarning: false,
      status: "blocked_unacked_warning",
      currency: "USD",
      recordedAt: new Date().toISOString(),
      payableFromAi: false,
    };
    attempts.push(blocked);
    return { ...blocked };
  }

  const state = getCourierCodFloat(input.courierId);
  state.heldUsdMinor += input.collectUsdMinor;
  floats.set(input.courierId, state);

  const row: CodCollectAttempt = {
    attemptId: attemptId(),
    jobId: input.jobId,
    courierId: input.courierId,
    collectUsdMinor: input.collectUsdMinor.toString(),
    floatLimitWarning: evalResult.floatLimitWarning,
    acknowledgedWarning: Boolean(input.acknowledgedWarning),
    status: "recorded",
    currency: "USD",
    recordedAt: new Date().toISOString(),
    payableFromAi: false,
  };
  attempts.push(row);
  return { ...row };
}

/** PD61 — failed COD collect with required failure reason (does not change held float). */
export function recordCodCollectFailure(input: {
  jobId: string;
  courierId: string;
  collectUsdMinor: bigint;
  failureReason: CodCollectFailureReason;
  note?: string;
}): CodCollectAttempt {
  if (input.collectUsdMinor < 0n) {
    throw new TypeError("collect amount must be >= 0");
  }
  if (!FAILURE_REASONS.has(input.failureReason)) {
    throw new Error(`Unknown COD failure reason ${input.failureReason}`);
  }
  if (!input.jobId.trim() || !input.courierId.trim()) {
    throw new Error("jobId and courierId required");
  }
  const row: CodCollectAttempt = {
    attemptId: attemptId(),
    jobId: input.jobId,
    courierId: input.courierId,
    collectUsdMinor: input.collectUsdMinor.toString(),
    floatLimitWarning: false,
    acknowledgedWarning: false,
    status: "failed",
    failureReason: input.failureReason,
    ...(input.note ? { note: input.note } : {}),
    currency: "USD",
    recordedAt: new Date().toISOString(),
    payableFromAi: false,
  };
  attempts.push(row);
  return { ...row };
}

export function listCodCollectAttempts(courierId: string): CodCollectAttempt[] {
  return attempts.filter((a) => a.courierId === courierId).map((a) => ({ ...a }));
}

export function getCodCollectAttempt(
  attemptId: string,
): CodCollectAttempt | undefined {
  const row = attempts.find((a) => a.attemptId === attemptId);
  return row ? { ...row } : undefined;
}

/**
 * PD80 — Pack §10 COD confirm: successful attempt → confirmed settle (USD minor).
 * Does not invent amounts — uses the recorded collectUsdMinor from the attempt.
 */
export function confirmCodCollect(input: {
  jobId: string;
  courierId: string;
  attemptId: string;
}): {
  confirmed: true;
  jobId: string;
  attemptId: string;
  settleUsdMinor: string;
  currency: "USD";
  payableFromAi: false;
} {
  if (!input.jobId.trim() || !input.courierId.trim() || !input.attemptId.trim()) {
    throw new Error("jobId, courierId, and attemptId required");
  }
  const attempt = attempts.find((a) => a.attemptId === input.attemptId);
  if (!attempt) throw new Error(`Unknown COD attempt ${input.attemptId}`);
  if (attempt.jobId !== input.jobId || attempt.courierId !== input.courierId) {
    throw new Error("COD attempt does not match job/courier");
  }
  if (attempt.status !== "recorded") {
    throw new Error(`COD attempt not confirmable (status=${attempt.status})`);
  }
  if (attempt.confirmedAt) {
    return {
      confirmed: true,
      jobId: input.jobId,
      attemptId: input.attemptId,
      settleUsdMinor: attempt.collectUsdMinor,
      currency: "USD",
      payableFromAi: false,
    };
  }
  attempt.confirmedAt = new Date().toISOString();
  return {
    confirmed: true,
    jobId: input.jobId,
    attemptId: input.attemptId,
    settleUsdMinor: attempt.collectUsdMinor,
    currency: "USD",
    payableFromAi: false,
  };
}

export function __resetCodFloatForTests(): void {
  floats.clear();
  attempts.length = 0;
}
