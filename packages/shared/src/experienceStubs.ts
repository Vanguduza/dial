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
