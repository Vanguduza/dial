/**
 * PD73 — identity step-up (Pack §10). Session SoR; never body userId/role (D-47).
 * Required before money-sensitive admin mutations (not a second AuthN SoR).
 */

export type StepUpChallenge = {
  challengeId: string;
  userId: string;
  purpose: string;
  status: "pending" | "verified" | "expired";
  createdAt: string;
  verifiedAt: string | null;
  expiresAt: string;
  /** Opaque fixture code — never log in prod. */
  fixtureCode: string;
};

const challenges = new Map<string, StepUpChallenge>();

function cid(): string {
  return `stu_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function requestStepUp(input: {
  userId: string;
  purpose: string;
  ttlMs?: number;
}): StepUpChallenge {
  if (!input.userId.trim()) throw new Error("userId required (session SoR)");
  if (!input.purpose.trim()) throw new Error("purpose required");
  const ttl = input.ttlMs ?? 5 * 60_000;
  const row: StepUpChallenge = {
    challengeId: cid(),
    userId: input.userId.trim(),
    purpose: input.purpose.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
    verifiedAt: null,
    expiresAt: new Date(Date.now() + ttl).toISOString(),
    fixtureCode: "step-up-ok",
  };
  challenges.set(row.challengeId, row);
  return { ...row };
}

export function verifyStepUp(input: {
  challengeId: string;
  userId: string;
  code: string;
}): StepUpChallenge {
  const row = challenges.get(input.challengeId);
  if (!row) throw new Error("Unknown step-up challenge");
  if (row.userId !== input.userId.trim()) {
    throw new Error("step-up user mismatch — session SoR only");
  }
  if (row.status !== "pending") throw new Error(`Challenge already ${row.status}`);
  if (Date.parse(row.expiresAt) < Date.now()) {
    row.status = "expired";
    throw new Error("step-up challenge expired");
  }
  if (input.code !== row.fixtureCode) {
    throw new Error("step-up code invalid");
  }
  row.status = "verified";
  row.verifiedAt = new Date().toISOString();
  return { ...row };
}

export function assertStepUpVerified(input: {
  challengeId: string;
  userId: string;
  purpose?: string;
}): true {
  const row = challenges.get(input.challengeId);
  if (!row) throw new Error("Unknown step-up challenge");
  if (row.userId !== input.userId.trim()) {
    throw new Error("step-up user mismatch — session SoR only");
  }
  if (row.status !== "verified") {
    throw new Error("step-up required before this action");
  }
  if (input.purpose && row.purpose !== input.purpose) {
    throw new Error("step-up purpose mismatch");
  }
  return true;
}

export function getStepUpChallenge(challengeId: string): StepUpChallenge | undefined {
  const row = challenges.get(challengeId);
  return row ? { ...row } : undefined;
}

/**
 * PD73 thin vertical: request → wrong code fail → verify → assert gate.
 */
export function runPd73IdentityStepUpThinVertical(): {
  verified: true;
  wrongCodeBlocked: true;
  gateEnforced: true;
  payableFromAi: false;
} {
  __resetStepUpForTests();
  const challenge = requestStepUp({
    userId: "usr_pd73",
    purpose: "money_sensitive_admin",
  });
  let wrongBlocked = false;
  try {
    verifyStepUp({
      challengeId: challenge.challengeId,
      userId: "usr_pd73",
      code: "bad",
    });
  } catch {
    wrongBlocked = true;
  }
  if (!wrongBlocked) throw new Error("PD73 must reject bad step-up code");
  const ok = verifyStepUp({
    challengeId: challenge.challengeId,
    userId: "usr_pd73",
    code: "step-up-ok",
  });
  if (ok.status !== "verified") throw new Error("PD73 verify failed");
  assertStepUpVerified({
    challengeId: challenge.challengeId,
    userId: "usr_pd73",
    purpose: "money_sensitive_admin",
  });
  return {
    verified: true,
    wrongCodeBlocked: true,
    gateEnforced: true,
    payableFromAi: false,
  };
}

export function __resetStepUpForTests(): void {
  challenges.clear();
}
