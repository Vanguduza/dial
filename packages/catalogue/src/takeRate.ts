/**
 * PD34 — grocery take-rate ladder (ops scaffold). Integer bps only — not AI payable.
 * Founder/ops supply ladder numbers; AI never writes payable amounts.
 */
export type TakeRateTier = {
  /** Inclusive GMV floor in USD minor for this tier. */
  minGmvUsdMinor: bigint;
  /** Platform take in basis points (100 bps = 1%). */
  takeRateBps: number;
};

export type TakeRateLadder = {
  ladderId: string;
  vertical: "grocery";
  label: string;
  tiers: TakeRateTier[];
  status: "draft" | "published";
  publishedAt: string | null;
  setBy: string;
  payableFromAi: false;
  /** Liquor take-rate not in scope (counsel gate). */
  liquorAllowed: false;
};

const ladders = new Map<string, TakeRateLadder>();

function id(): string {
  return `trl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function createGroceryTakeRateDraft(input: {
  label?: string;
  tiers: Array<{ minGmvUsdMinor: bigint | string; takeRateBps: number }>;
  setBy: string;
}): TakeRateLadder {
  if (!input.tiers.length) throw new Error("take-rate draft requires tiers");
  for (const t of input.tiers) {
    if (!Number.isInteger(t.takeRateBps) || t.takeRateBps < 0 || t.takeRateBps > 10_000) {
      throw new Error("takeRateBps must be integer 0..10000");
    }
  }
  const ladder: TakeRateLadder = {
    ladderId: id(),
    vertical: "grocery",
    label: (input.label ?? "Grocery take-rate").slice(0, 80),
    tiers: input.tiers.map((t) => ({
      minGmvUsdMinor: BigInt(t.minGmvUsdMinor),
      takeRateBps: t.takeRateBps,
    })),
    status: "draft",
    publishedAt: null,
    setBy: input.setBy.slice(0, 64),
    payableFromAi: false,
    liquorAllowed: false,
  };
  ladders.set(ladder.ladderId, ladder);
  return clone(ladder);
}

export function publishTakeRateLadder(ladderId: string, setBy: string): TakeRateLadder {
  const ladder = ladders.get(ladderId);
  if (!ladder) throw new Error(`Unknown ladder ${ladderId}`);
  if (ladder.payableFromAi) throw new Error("payableFromAi must stay false");
  ladder.status = "published";
  ladder.publishedAt = new Date().toISOString();
  ladder.setBy = setBy.slice(0, 64);
  return clone(ladder);
}

export function getTakeRateLadder(ladderId: string): TakeRateLadder | undefined {
  const l = ladders.get(ladderId);
  return l ? clone(l) : undefined;
}

export function listTakeRateLadders(): TakeRateLadder[] {
  return [...ladders.values()].map(clone);
}

export function getPublishedGroceryTakeRate(): TakeRateLadder | undefined {
  return [...ladders.values()]
    .filter((l) => l.vertical === "grocery" && l.status === "published")
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .map(clone)[0];
}

/** Resolve take-rate bps for a GMV amount (draft economics echo — not a payable write). */
export function resolveTakeRateBps(
  ladder: TakeRateLadder,
  gmvUsdMinor: bigint,
): number {
  const sorted = [...ladder.tiers].sort((a, b) =>
    a.minGmvUsdMinor < b.minGmvUsdMinor ? -1 : 1,
  );
  let bps = sorted[0]?.takeRateBps ?? 0;
  for (const t of sorted) {
    if (gmvUsdMinor >= t.minGmvUsdMinor) bps = t.takeRateBps;
  }
  return bps;
}

function clone(l: TakeRateLadder): TakeRateLadder {
  return {
    ...l,
    tiers: l.tiers.map((t) => ({ ...t })),
  };
}

export function __resetTakeRateForTests(): void {
  ladders.clear();
}

/**
 * PD34 thin vertical: draft grocery take-rate → publish → resolve bps; B2B formal flag.
 */
export function runPd34B2bTakeRateThinVertical(): {
  draftCreated: true;
  published: true;
  resolvedBps: number;
  liquorAllowed: false;
  payableFromAi: false;
  b2bFormalOnly: true;
} {
  __resetTakeRateForTests();
  const draft = createGroceryTakeRateDraft({
    label: "PD34 grocery ladder",
    setBy: "ops_pd34",
    tiers: [
      { minGmvUsdMinor: 0n, takeRateBps: 800 },
      { minGmvUsdMinor: 100_00n, takeRateBps: 600 },
    ],
  });
  const published = publishTakeRateLadder(draft.ladderId, "ops_pd34");
  if (published.status !== "published" || published.payableFromAi) {
    throw new Error("PD34 publish must stay non-AI payable");
  }
  const bps = resolveTakeRateBps(published, 150_00n);
  if (bps !== 600) throw new Error("PD34 expected 600 bps above $100 GMV");
  return {
    draftCreated: true,
    published: true,
    resolvedBps: bps,
    liquorAllowed: false,
    payableFromAi: false,
    b2bFormalOnly: true,
  };
}

/**
 * Phase 4 prep — publish take-rate then durable persist (fixture skip / sandbox fail-closed).
 * Integer bps ops-set only; never AI payable; no liquor.
 */
export async function publishTakeRateLadderDurable(
  ladderId: string,
  setBy: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<{
  ladder: TakeRateLadder;
  persisted: "accepted" | "fixture_skip";
}> {
  const ladder = publishTakeRateLadder(ladderId, setBy);
  const { persistTakeRateLadderDurable } = await import("./durableFactory.js");
  const persisted = await persistTakeRateLadderDurable(ladder, env);
  return { ladder, persisted };
}

/** Phase 4 prep thin vertical for take-rate durable path. */
export async function runPhase4PrepTakeRateDurableThinVertical(): Promise<{
  resolvedBps: number;
  persisted: "fixture_skip";
  payableFromAi: false;
  liquorAllowed: false;
}> {
  __resetTakeRateForTests();
  const draft = createGroceryTakeRateDraft({
    label: "P4prep grocery ladder",
    setBy: "ops_p4prep",
    tiers: [
      { minGmvUsdMinor: 0n, takeRateBps: 750 },
      { minGmvUsdMinor: 200_00n, takeRateBps: 550 },
    ],
  });
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const { ladder, persisted } = await publishTakeRateLadderDurable(
    draft.ladderId,
    "ops_p4prep",
  );
  const bps = resolveTakeRateBps(ladder, 250_00n);
  if (bps !== 550 || persisted !== "fixture_skip") {
    throw new Error("Phase4-prep take-rate durable fixture failed");
  }

  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_ANON_KEY;
  let closed = false;
  try {
    await publishTakeRateLadderDurable(draft.ladderId, "ops_p4prep");
  } catch {
    closed = true;
  }
  if (!closed) throw new Error("expected take-rate durable fail-closed");
  process.env.DIAL_INTEGRATION_MODE = "fixture";

  return {
    resolvedBps: bps,
    persisted: "fixture_skip",
    payableFromAi: false,
    liquorAllowed: false,
  };
}
