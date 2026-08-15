/**
 * PD113 — Formbricks + PostHog T8 stubs (fixture / fail-closed).
 * Never money SoR; flags/surveys only. Live SaaS keys optional.
 */

export type FormbricksSurveyStub = {
  surveyId: string;
  jobId?: string;
  orderId?: string;
  status: "queued" | "skipped_no_key";
  fixture: true;
  payableFromAi: false;
};

export type PostHogFlagStub = {
  flagKey: string;
  enabled: boolean;
  source: "fixture" | "env";
  fixture: true;
  moneyAuthority: false;
};

function formbricksKeySet(): boolean {
  return Boolean(process.env.FORMBRICKS_API_KEY?.trim());
}

function posthogKeySet(): boolean {
  return Boolean(process.env.POSTHOG_API_KEY?.trim());
}

/**
 * Queue post-job/order survey. Without FORMBRICKS_API_KEY → fail-closed skip (not throw).
 */
export function queueFormbricksSurvey(input: {
  surveyId: string;
  jobId?: string;
  orderId?: string;
}): FormbricksSurveyStub {
  if (!input.surveyId.trim()) throw new Error("surveyId required");
  const base: FormbricksSurveyStub = {
    surveyId: input.surveyId.trim(),
    status: formbricksKeySet() ? "queued" : "skipped_no_key",
    fixture: true,
    payableFromAi: false,
  };
  if (input.jobId) base.jobId = input.jobId;
  if (input.orderId) base.orderId = input.orderId;
  return base;
}

/**
 * Evaluate feature flag. Without POSTHOG_API_KEY → fixture off (fail-closed for rollout).
 */
export function evaluatePostHogFlag(input: {
  flagKey: string;
  defaultEnabled?: boolean;
}): PostHogFlagStub {
  if (!input.flagKey.trim()) throw new Error("flagKey required");
  if (!posthogKeySet()) {
    return {
      flagKey: input.flagKey.trim(),
      enabled: false,
      source: "fixture",
      fixture: true,
      moneyAuthority: false,
    };
  }
  return {
    flagKey: input.flagKey.trim(),
    enabled: input.defaultEnabled === true,
    source: "env",
    fixture: true,
    moneyAuthority: false,
  };
}

/**
 * PD113 thin vertical: Formbricks + PostHog stubs; fail-closed without keys; not money.
 */
export function runPd113FormbricksPosthogStubThinVertical(): {
  surveySkippedWithoutKey: true;
  flagOffWithoutKey: true;
  moneyAuthority: false;
  payableFromAi: false;
} {
  const prevFb = process.env.FORMBRICKS_API_KEY;
  const prevPh = process.env.POSTHOG_API_KEY;
  delete process.env.FORMBRICKS_API_KEY;
  delete process.env.POSTHOG_API_KEY;
  try {
    const survey = queueFormbricksSurvey({
      surveyId: "csat_post_job",
      jobId: "job_pd113",
    });
    if (survey.status !== "skipped_no_key" || survey.payableFromAi !== false) {
      throw new Error("PD113 expected Formbricks fail-closed skip");
    }
    const flag = evaluatePostHogFlag({ flagKey: "staff_dogfood_ai_field" });
    if (flag.enabled || flag.moneyAuthority !== false) {
      throw new Error("PD113 expected PostHog fixture off + no money authority");
    }
    return {
      surveySkippedWithoutKey: true,
      flagOffWithoutKey: true,
      moneyAuthority: false,
      payableFromAi: false,
    };
  } finally {
    if (prevFb !== undefined) process.env.FORMBRICKS_API_KEY = prevFb;
    else delete process.env.FORMBRICKS_API_KEY;
    if (prevPh !== undefined) process.env.POSTHOG_API_KEY = prevPh;
    else delete process.env.POSTHOG_API_KEY;
  }
}

/** PD117 — Supabase Realtime status channel stub (Pack §5.16 / D-45 track). */
export type RealtimeStatusSubscription = {
  channel: string;
  status: "subscribed_fixture" | "skipped_no_realtime";
  readOnly: true;
  mapSor: "maplibre";
  fixture: true;
  payableFromAi: false;
};

function realtimeConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
      (process.env.SUPABASE_ANON_KEY?.trim() ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
  );
}

/**
 * Subscribe to ERP status fan-out. Without Supabase Realtime keys → fail-closed skip.
 * Never money authority; MapLibre remains map SoR.
 */
export function subscribeRealtimeStatusChannel(input: {
  channel: string;
}): RealtimeStatusSubscription {
  const channel = input.channel.trim();
  if (!channel) throw new Error("channel required");
  if (!realtimeConfigured()) {
    return {
      channel,
      status: "skipped_no_realtime",
      readOnly: true,
      mapSor: "maplibre",
      fixture: true,
      payableFromAi: false,
    };
  }
  return {
    channel,
    status: "subscribed_fixture",
    readOnly: true,
    mapSor: "maplibre",
    fixture: true,
    payableFromAi: false,
  };
}

/**
 * PD117 thin vertical: Realtime fail-closed without keys; read-only; not money.
 */
export function runPd117RealtimeStatusStubThinVertical(): {
  skippedWithoutKeys: true;
  readOnly: true;
  mapSor: "maplibre";
  payableFromAi: false;
} {
  const prevUrl = process.env.SUPABASE_URL;
  const prevKey = process.env.SUPABASE_ANON_KEY;
  const prevPub = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  try {
    const sub = subscribeRealtimeStatusChannel({ channel: "run:ord_pd117" });
    if (sub.status !== "skipped_no_realtime" || !sub.readOnly) {
      throw new Error("PD117 expected fail-closed Realtime skip");
    }
    if (sub.mapSor !== "maplibre" || sub.payableFromAi !== false) {
      throw new Error("PD117 MapLibre / payable check failed");
    }
    return {
      skippedWithoutKeys: true,
      readOnly: true,
      mapSor: "maplibre",
      payableFromAi: false,
    };
  } finally {
    if (prevUrl !== undefined) process.env.SUPABASE_URL = prevUrl;
    else delete process.env.SUPABASE_URL;
    if (prevKey !== undefined) process.env.SUPABASE_ANON_KEY = prevKey;
    else delete process.env.SUPABASE_ANON_KEY;
    if (prevPub !== undefined) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = prevPub;
    else delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
}

/** PD118 — FLOW_CSAT ERP score (Formbricks side-path; ERP SoR). */
export type CsatScoreRecord = {
  csatId: string;
  score: number;
  comment: string | null;
  orderId?: string;
  jobId?: string;
  survey: FormbricksSurveyStub;
  statusFrom: "erp";
  payableFromAi: false;
};

const csatStore = (): Map<string, CsatScoreRecord> => {
  const g = globalThis as { __dialCsatScores?: Map<string, CsatScoreRecord> };
  if (!g.__dialCsatScores) g.__dialCsatScores = new Map();
  return g.__dialCsatScores;
};

export function __resetCsatForTests(): void {
  csatStore().clear();
}

/**
 * Record 1–5 CSAT after fulfilment; queues Formbricks FLOW_CSAT survey.
 * Score is ERP SoR — never a payable amount.
 */
export function recordCsatScore(input: {
  score: number;
  comment?: string;
  orderId?: string;
  jobId?: string;
}): CsatScoreRecord {
  if (!Number.isInteger(input.score) || input.score < 1 || input.score > 5) {
    throw new Error("CSAT score must be integer 1–5");
  }
  if (!input.orderId?.trim() && !input.jobId?.trim()) {
    throw new Error("orderId or jobId required");
  }
  const survey = queueFormbricksSurvey({
    surveyId: "FLOW_CSAT",
    ...(input.orderId ? { orderId: input.orderId } : {}),
    ...(input.jobId ? { jobId: input.jobId } : {}),
  });
  const rec: CsatScoreRecord = {
    csatId: `csat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    score: input.score,
    comment: input.comment?.trim() || null,
    survey,
    statusFrom: "erp",
    payableFromAi: false,
  };
  if (input.orderId) rec.orderId = input.orderId;
  if (input.jobId) rec.jobId = input.jobId;
  csatStore().set(rec.csatId, rec);
  return { ...rec };
}

export function getCsatScore(csatId: string): CsatScoreRecord | undefined {
  const r = csatStore().get(csatId);
  return r ? { ...r } : undefined;
}

/**
 * PD118 thin vertical: CSAT 1–5 → ERP record + Formbricks FLOW_CSAT; not money.
 */
export function runPd118CsatFlowThinVertical(): {
  score: number;
  statusFrom: "erp";
  surveyId: "FLOW_CSAT";
  payableFromAi: false;
  csatId: string;
} {
  __resetCsatForTests();
  const prev = process.env.FORMBRICKS_API_KEY;
  delete process.env.FORMBRICKS_API_KEY;
  try {
    const out = recordCsatScore({
      score: 5,
      comment: "quick delivery",
      orderId: "ord_pd118",
    });
    if (out.score !== 5 || out.statusFrom !== "erp") {
      throw new Error("PD118 expected ERP CSAT score");
    }
    if (out.survey.surveyId !== "FLOW_CSAT" || out.payableFromAi !== false) {
      throw new Error("PD118 FLOW_CSAT / payable check failed");
    }
    let rejected = false;
    try {
      recordCsatScore({ score: 9, orderId: "ord_bad" });
    } catch {
      rejected = true;
    }
    if (!rejected) throw new Error("PD118 expected invalid score reject");
    return {
      score: out.score,
      statusFrom: "erp",
      surveyId: "FLOW_CSAT",
      payableFromAi: false,
      csatId: out.csatId,
    };
  } finally {
    if (prev !== undefined) process.env.FORMBRICKS_API_KEY = prev;
    else delete process.env.FORMBRICKS_API_KEY;
  }
}
