/**
 * PD113 — Formbricks + PostHog T8 stubs (fixture / fail-closed).
 * Never money SoR; flags/surveys only. Live SaaS keys optional.
 */

/** Bracket access — Next/webpack must not rewrite `delete process.env.X` into invalid LHS. */
function envGet(name: string): string | undefined {
  return process.env[name];
}
function envSet(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

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
  return Boolean(envGet("FORMBRICKS_API_KEY")?.trim());
}

function posthogKeySet(): boolean {
  return Boolean(envGet("POSTHOG_API_KEY")?.trim());
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
  const prevFb = envGet("FORMBRICKS_API_KEY");
  const prevPh = envGet("POSTHOG_API_KEY");
  envSet("FORMBRICKS_API_KEY", undefined);
  envSet("POSTHOG_API_KEY", undefined);
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
    envSet("FORMBRICKS_API_KEY", prevFb);
    envSet("POSTHOG_API_KEY", prevPh);
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
    envGet("SUPABASE_URL")?.trim() &&
      (envGet("SUPABASE_ANON_KEY")?.trim() ||
        envGet("NEXT_PUBLIC_SUPABASE_ANON_KEY")?.trim()),
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
  const prevUrl = envGet("SUPABASE_URL");
  const prevKey = envGet("SUPABASE_ANON_KEY");
  const prevPub = envGet("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  envSet("SUPABASE_URL", undefined);
  envSet("SUPABASE_ANON_KEY", undefined);
  envSet("NEXT_PUBLIC_SUPABASE_ANON_KEY", undefined);
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
    envSet("SUPABASE_URL", prevUrl);
    envSet("SUPABASE_ANON_KEY", prevKey);
    envSet("NEXT_PUBLIC_SUPABASE_ANON_KEY", prevPub);
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
  const prev = envGet("FORMBRICKS_API_KEY");
  envSet("FORMBRICKS_API_KEY", undefined);
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
    envSet("FORMBRICKS_API_KEY", prev);
  }
}

/** PD122 — Rive auth-home greeting stub (Pack §9.1 / D-27); no voice. */
export type RiveGreetingStub = {
  assetRef: string;
  state: "fixture";
  voice: false;
  surface: "auth_home";
  payableFromAi: false;
};

/**
 * Resolve greeting motion asset. Always fixture path when unset — never voice.
 */
export function resolveRiveGreeting(input?: {
  assetRef?: string;
}): RiveGreetingStub {
  const fromEnv = envGet("DIAL_RIVE_GREETING_ASSET")?.trim();
  const assetRef =
    input?.assetRef?.trim() ||
    fromEnv ||
    "fixture://dial-welcome.riv";
  return {
    assetRef,
    state: "fixture",
    voice: false,
    surface: "auth_home",
    payableFromAi: false,
  };
}

/**
 * PD122 thin vertical: Rive greeting fixture; voice forbidden; not money.
 */
export function runPd122RiveGreetingStubThinVertical(): {
  assetPresent: true;
  voice: false;
  surface: "auth_home";
  payableFromAi: false;
  assetRef: string;
} {
  const prev = envGet("DIAL_RIVE_GREETING_ASSET");
  envSet("DIAL_RIVE_GREETING_ASSET", undefined);
  try {
    const g = resolveRiveGreeting();
    if (!g.assetRef || g.voice !== false || g.payableFromAi !== false) {
      throw new Error("PD122 Rive greeting checks failed");
    }
    if (g.surface !== "auth_home") {
      throw new Error("PD122 expected auth_home surface");
    }
    return {
      assetPresent: true,
      voice: false,
      surface: "auth_home",
      payableFromAi: false,
      assetRef: g.assetRef,
    };
  } finally {
    envSet("DIAL_RIVE_GREETING_ASSET", prev);
  }
}

/** PD130 — Langfuse trace stub (T8); fail-closed without keys; not money / not packages/ai schema. */
export type LangfuseTraceStub = {
  traceId: string;
  name: string;
  status: "queued" | "skipped_no_key";
  fixture: true;
  moneyAuthority: false;
  payableFromAi: false;
};

function langfuseKeysSet(): boolean {
  return Boolean(
    envGet("LANGFUSE_PUBLIC_KEY")?.trim() &&
      envGet("LANGFUSE_SECRET_KEY")?.trim(),
  );
}

/**
 * Queue AiInvocation-shaped trace metadata. Without Langfuse keys → fail-closed skip.
 */
export function queueLangfuseTrace(input: {
  name: string;
  metadata?: Record<string, string>;
}): LangfuseTraceStub {
  if (!input.name.trim()) throw new Error("trace name required");
  return {
    traceId: `lf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: input.name.trim(),
    status: langfuseKeysSet() ? "queued" : "skipped_no_key",
    fixture: true,
    moneyAuthority: false,
    payableFromAi: false,
  };
}

/**
 * PD130 thin vertical: Langfuse stub fail-closed without keys; not money.
 */
export function runPd130LangfuseTraceStubThinVertical(): {
  skippedWithoutKey: true;
  moneyAuthority: false;
  payableFromAi: false;
} {
  const prevPub = envGet("LANGFUSE_PUBLIC_KEY");
  const prevSec = envGet("LANGFUSE_SECRET_KEY");
  envSet("LANGFUSE_PUBLIC_KEY", undefined);
  envSet("LANGFUSE_SECRET_KEY", undefined);
  try {
    const t = queueLangfuseTrace({
      name: "guidedIntake.shadow",
      metadata: { capability: "guidedIntake" },
    });
    if (t.status !== "skipped_no_key" || t.moneyAuthority !== false) {
      throw new Error("PD130 expected Langfuse fail-closed skip");
    }
    if (t.payableFromAi !== false) {
      throw new Error("PD130 payableFromAi must be false");
    }
    return {
      skippedWithoutKey: true,
      moneyAuthority: false,
      payableFromAi: false,
    };
  } finally {
    envSet("LANGFUSE_PUBLIC_KEY", prevPub);
    envSet("LANGFUSE_SECRET_KEY", prevSec);
  }
}
