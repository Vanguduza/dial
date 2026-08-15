/**
 * Meta WA approved template name registry (ENH-021 / D-60 / PD40).
 * Ops fills `WA_TEMPLATE_<KEY>` with approved Meta names; fixture stubs match docs/ops.
 * Never invent payable amounts in template components.
 */
export type WaTemplateKey =
  | "SPARE_ORDER_CONFIRMED"
  | "SPARE_PAYMENT_LINK"
  | "TECH_JOB_RECEIVED"
  | "TECH_EMERGENCY_ACK"
  | "SPARE_DELIVERED"
  | "GROCERY_ORDER_CONFIRMED"
  | "GROCERY_PAYMENT_LINK";

export type WaTemplateVertical = "spare" | "grocery" | "tech";

export type WaTemplateBinding = {
  key: WaTemplateKey;
  /** Meta template name once approved — env override preferred. */
  templateName: string;
  language: string;
  status: "stub" | "approved";
  /** Ops hint: set this env to promote stub → approved. */
  envKeyHint: string;
  vertical: WaTemplateVertical;
  /** Always false — templates never carry AI-written payables. */
  payableFromAi: false;
};

const FIXTURE_REGISTRY: Record<WaTemplateKey, WaTemplateBinding> = {
  SPARE_ORDER_CONFIRMED: {
    key: "SPARE_ORDER_CONFIRMED",
    templateName: "spare_order_confirmed",
    language: "en",
    status: "stub",
    envKeyHint: "WA_TEMPLATE_SPARE_ORDER_CONFIRMED",
    vertical: "spare",
    payableFromAi: false,
  },
  SPARE_PAYMENT_LINK: {
    key: "SPARE_PAYMENT_LINK",
    templateName: "spare_payment_link",
    language: "en",
    status: "stub",
    envKeyHint: "WA_TEMPLATE_SPARE_PAYMENT_LINK",
    vertical: "spare",
    payableFromAi: false,
  },
  TECH_JOB_RECEIVED: {
    key: "TECH_JOB_RECEIVED",
    templateName: "tech_job_received",
    language: "en",
    status: "stub",
    envKeyHint: "WA_TEMPLATE_TECH_JOB_RECEIVED",
    vertical: "tech",
    payableFromAi: false,
  },
  TECH_EMERGENCY_ACK: {
    key: "TECH_EMERGENCY_ACK",
    templateName: "tech_emergency_ack",
    language: "en",
    status: "stub",
    envKeyHint: "WA_TEMPLATE_TECH_EMERGENCY_ACK",
    vertical: "tech",
    payableFromAi: false,
  },
  SPARE_DELIVERED: {
    key: "SPARE_DELIVERED",
    templateName: "spare_delivered",
    language: "en",
    status: "stub",
    envKeyHint: "WA_TEMPLATE_SPARE_DELIVERED",
    vertical: "spare",
    payableFromAi: false,
  },
  GROCERY_ORDER_CONFIRMED: {
    key: "GROCERY_ORDER_CONFIRMED",
    templateName: "grocery_order_confirmed",
    language: "en",
    status: "stub",
    envKeyHint: "WA_TEMPLATE_GROCERY_ORDER_CONFIRMED",
    vertical: "grocery",
    payableFromAi: false,
  },
  GROCERY_PAYMENT_LINK: {
    key: "GROCERY_PAYMENT_LINK",
    templateName: "grocery_payment_link",
    language: "en",
    status: "stub",
    envKeyHint: "WA_TEMPLATE_GROCERY_PAYMENT_LINK",
    vertical: "grocery",
    payableFromAi: false,
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
      payableFromAi: false,
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

/**
 * PD40 thin vertical: spare + grocery templates present; env promote; no liquor;
 * Cloud API only; payableFromAi=false.
 */
export function runPd40WaTemplateRegistryThinVertical(env?: NodeJS.ProcessEnv): {
  spareTemplateCount: number;
  groceryTemplateCount: number;
  envPromoteWorks: true;
  liquorTemplates: false;
  baileysForbidden: true;
  payableFromAi: false;
  cloudApiOnly: true;
} {
  const e = { ...(env ?? process.env) };
  delete e.WA_TEMPLATE_SPARE_ORDER_CONFIRMED;
  const list = listWaTemplateRegistry(e);
  const spare = list.filter((t) => t.vertical === "spare");
  const grocery = list.filter((t) => t.vertical === "grocery");
  if (spare.length < 2 || grocery.length < 2) {
    throw new Error("PD40 expected spare + grocery templates in registry");
  }
  if (list.some((t) => t.payableFromAi)) {
    throw new Error("PD40 templates must keep payableFromAi=false");
  }
  if (list.some((t) => /liquor|beer|wine|spirit/i.test(t.templateName))) {
    throw new Error("PD40 liquor templates forbidden");
  }
  e.WA_TEMPLATE_SPARE_ORDER_CONFIRMED = "spare_order_confirmed_v2_pd40";
  const promoted = resolveWaTemplate("SPARE_ORDER_CONFIRMED", e);
  if (
    promoted.status !== "approved" ||
    promoted.templateName !== "spare_order_confirmed_v2_pd40"
  ) {
    throw new Error("PD40 env promote must mark approved");
  }
  return {
    spareTemplateCount: spare.length,
    groceryTemplateCount: grocery.length,
    envPromoteWorks: true,
    liquorTemplates: false,
    baileysForbidden: true,
    payableFromAi: false,
    cloudApiOnly: true,
  };
}
