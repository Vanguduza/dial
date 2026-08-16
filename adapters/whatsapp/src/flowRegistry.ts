/**
 * Meta WhatsApp Flow id registry (PD12 / D-40).
 * Ops fills `WA_FLOW_<KEY>` with approved Meta Flow IDs; fixture stubs match companion names.
 * No liquor Flows — counsel gate.
 */
export type WaFlowKey =
  | "FLOW_SPARE_SEARCH"
  | "FLOW_SPARE_CART"
  | "FLOW_SPARE_CHECKOUT"
  | "FLOW_SPARE_TRACK"
  | "FLOW_SPARE_RETURNS"
  | "FLOW_GROCERY_HOME"
  | "FLOW_GROCERY_SEARCH"
  | "FLOW_GROCERY_CART"
  | "FLOW_GROCERY_SLOT"
  | "FLOW_GROCERY_CHECKOUT"
  | "FLOW_GROCERY_TRACK";

export type WaFlowBinding = {
  key: WaFlowKey;
  /** Meta Flow ID once registered — env override preferred. */
  flowId: string;
  status: "stub" | "approved";
  vertical: "spare" | "grocery";
  /** EcoCash|COD required on checkout Flows (D-57) — not free-text only. */
  requiresEcoCashCodButtons: boolean;
};

const FIXTURE_FLOWS: Record<WaFlowKey, WaFlowBinding> = {
  FLOW_SPARE_SEARCH: {
    key: "FLOW_SPARE_SEARCH",
    flowId: "flow_spare_search",
    status: "stub",
    vertical: "spare",
    requiresEcoCashCodButtons: false,
  },
  FLOW_SPARE_CART: {
    key: "FLOW_SPARE_CART",
    flowId: "flow_spare_cart",
    status: "stub",
    vertical: "spare",
    requiresEcoCashCodButtons: false,
  },
  FLOW_SPARE_CHECKOUT: {
    key: "FLOW_SPARE_CHECKOUT",
    flowId: "flow_spare_checkout",
    status: "stub",
    vertical: "spare",
    requiresEcoCashCodButtons: true,
  },
  FLOW_SPARE_TRACK: {
    key: "FLOW_SPARE_TRACK",
    flowId: "flow_spare_track",
    status: "stub",
    vertical: "spare",
    requiresEcoCashCodButtons: false,
  },
  FLOW_SPARE_RETURNS: {
    key: "FLOW_SPARE_RETURNS",
    flowId: "flow_spare_returns",
    status: "stub",
    vertical: "spare",
    requiresEcoCashCodButtons: false,
  },
  FLOW_GROCERY_HOME: {
    key: "FLOW_GROCERY_HOME",
    flowId: "flow_grocery_home",
    status: "stub",
    vertical: "grocery",
    requiresEcoCashCodButtons: false,
  },
  FLOW_GROCERY_SEARCH: {
    key: "FLOW_GROCERY_SEARCH",
    flowId: "flow_grocery_search",
    status: "stub",
    vertical: "grocery",
    requiresEcoCashCodButtons: false,
  },
  FLOW_GROCERY_CART: {
    key: "FLOW_GROCERY_CART",
    flowId: "flow_grocery_cart",
    status: "stub",
    vertical: "grocery",
    requiresEcoCashCodButtons: false,
  },
  FLOW_GROCERY_SLOT: {
    key: "FLOW_GROCERY_SLOT",
    flowId: "flow_grocery_slot",
    status: "stub",
    vertical: "grocery",
    requiresEcoCashCodButtons: false,
  },
  FLOW_GROCERY_CHECKOUT: {
    key: "FLOW_GROCERY_CHECKOUT",
    flowId: "flow_grocery_checkout",
    status: "stub",
    vertical: "grocery",
    requiresEcoCashCodButtons: true,
  },
  FLOW_GROCERY_TRACK: {
    key: "FLOW_GROCERY_TRACK",
    flowId: "flow_grocery_track",
    status: "stub",
    vertical: "grocery",
    requiresEcoCashCodButtons: false,
  },
};

/** Resolve Flow binding — env `WA_FLOW_<KEY>` wins; else fixture stub. */
export function resolveWaFlow(
  key: WaFlowKey,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): WaFlowBinding {
  const base = FIXTURE_FLOWS[key];
  const fromEnv = env[`WA_FLOW_${key}`]?.trim();
  if (fromEnv) {
    return { ...base, flowId: fromEnv, status: "approved" };
  }
  return { ...base };
}

export function listWaFlowRegistry(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): WaFlowBinding[] {
  return (Object.keys(FIXTURE_FLOWS) as WaFlowKey[]).map((k) =>
    resolveWaFlow(k, env),
  );
}
