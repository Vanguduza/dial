/**
 * Meta WA approved template name registry (ENH-021 / D-60).
 * Ops fills `WA_TEMPLATE_<KEY>` with approved Meta names; fixture stubs match docs/ops.
 * Never invent payable amounts in template components.
 */
export type WaTemplateKey =
  | "SPARE_ORDER_CONFIRMED"
  | "SPARE_PAYMENT_LINK"
  | "TECH_JOB_RECEIVED"
  | "TECH_EMERGENCY_ACK"
  | "SPARE_DELIVERED";

export type WaTemplateBinding = {
  key: WaTemplateKey;
  /** Meta template name once approved — env override preferred. */
  templateName: string;
  language: string;
  status: "stub" | "approved";
};

const FIXTURE_REGISTRY: Record<WaTemplateKey, WaTemplateBinding> = {
  SPARE_ORDER_CONFIRMED: {
    key: "SPARE_ORDER_CONFIRMED",
    templateName: "spare_order_confirmed",
    language: "en",
    status: "stub",
  },
  SPARE_PAYMENT_LINK: {
    key: "SPARE_PAYMENT_LINK",
    templateName: "spare_payment_link",
    language: "en",
    status: "stub",
  },
  TECH_JOB_RECEIVED: {
    key: "TECH_JOB_RECEIVED",
    templateName: "tech_job_received",
    language: "en",
    status: "stub",
  },
  TECH_EMERGENCY_ACK: {
    key: "TECH_EMERGENCY_ACK",
    templateName: "tech_emergency_ack",
    language: "en",
    status: "stub",
  },
  SPARE_DELIVERED: {
    key: "SPARE_DELIVERED",
    templateName: "spare_delivered",
    language: "en",
    status: "stub",
  },
};

/** Resolve template binding — env `WA_TEMPLATE_<KEY>` wins; else fixture stub. */
export function resolveWaTemplate(
  key: WaTemplateKey,
  env: NodeJS.ProcessEnv = process.env,
): WaTemplateBinding {
  const base = FIXTURE_REGISTRY[key];
  const fromEnv = env[`WA_TEMPLATE_${key}`]?.trim();
  if (fromEnv) {
    return {
      ...base,
      templateName: fromEnv,
      status: "approved",
    };
  }
  return { ...base };
}

export function listWaTemplateRegistry(
  env: NodeJS.ProcessEnv = process.env,
): WaTemplateBinding[] {
  return (Object.keys(FIXTURE_REGISTRY) as WaTemplateKey[]).map((k) =>
    resolveWaTemplate(k, env),
  );
}
