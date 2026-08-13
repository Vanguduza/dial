/**
 * S133/S137 — parse integrations health JSON for admin readiness UI (no secrets).
 */
export const INTEGRATION_PROBE_KEYS = [
  "temporal",
  "litellm",
  "maps",
  "fdms",
  "meili",
  "queues",
  "whatsapp",
  "psp",
  "internal",
] as const;

export type IntegrationProbeKey = (typeof INTEGRATION_PROBE_KEYS)[number];

export type IntegrationsHealthSnapshot = {
  ready: boolean;
  mode: string;
  probes: Record<string, boolean>;
  groups: Array<{
    label: string;
    configured: boolean;
    missing: string[];
    presentCount: number;
    requiredCount: number;
  }>;
};

export function parseIntegrationsHealth(
  body: unknown,
): IntegrationsHealthSnapshot | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "invalid body" };
  }
  const b = body as Record<string, unknown>;
  if (typeof b.ready !== "boolean" || typeof b.mode !== "string") {
    return { error: "missing ready/mode" };
  }
  const probes =
    b.probes && typeof b.probes === "object"
      ? (b.probes as Record<string, boolean>)
      : {};
  const groups = Array.isArray(b.groups)
    ? (b.groups as IntegrationsHealthSnapshot["groups"])
    : [];
  return {
    ready: b.ready,
    mode: b.mode,
    probes,
    groups,
  };
}

export function probeEntries(
  probes: Record<string, boolean>,
): Array<{ name: string; ok: boolean }> {
  return Object.entries(probes)
    .map(([name, ok]) => ({ name, ok: Boolean(ok) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * S138 — build probes object from INTEGRATION_PROBE_KEYS SoR (missing → false).
 */
export function buildIntegrationsProbes(
  values: Partial<Record<IntegrationProbeKey, boolean>>,
): Record<IntegrationProbeKey, boolean> {
  const out = {} as Record<IntegrationProbeKey, boolean>;
  for (const key of INTEGRATION_PROBE_KEYS) {
    out[key] = Boolean(values[key]);
  }
  return out;
}

export function integrationsReady(
  probes: Record<string, boolean>,
): boolean {
  return INTEGRATION_PROBE_KEYS.every((k) => probes[k] === true);
}

/** S139 — env groups for health `groups[]` (keys must exist in `.env.example`). */
export const INTEGRATION_ENV_GROUPS = [
  {
    label: "whatsapp",
    keys: [
      "WHATSAPP_TOKEN",
      "WHATSAPP_PHONE_NUMBER_ID",
      "WHATSAPP_APP_SECRET",
      "WHATSAPP_VERIFY_TOKEN",
    ],
  },
  { label: "paynow", keys: ["PAYNOW_INTEGRATION_ID", "PAYNOW_INTEGRATION_KEY"] },
  {
    label: "contipay",
    keys: ["CONTIPAY_API_KEY", "CONTIPAY_API_SECRET", "CONTIPAY_MERCHANT_ID"],
  },
  {
    label: "ecocash",
    keys: ["ECOCASH_API_KEY", "ECOCASH_MERCHANT_CODE", "ECOCASH_WEBHOOK_SECRET"],
  },
  {
    label: "paypal",
    keys: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_WEBHOOK_ID"],
  },
  {
    label: "escrow",
    keys: ["PSP_ESCROW_BASE_URL", "PSP_ESCROW_API_KEY", "PSP_WEBHOOK_SECRET"],
  },
  {
    label: "fdms",
    keys: ["FDMS_BASE_URL", "FDMS_DEVICE_ID", "FDMS_ACTIVATION_KEY"],
  },
  { label: "meili", keys: ["MEILI_HOST", "MEILI_MASTER_KEY"] },
  { label: "litellm", keys: ["LITELLM_BASE_URL", "LITELLM_API_KEY"] },
  { label: "maps", keys: ["NOMINATIM_URL", "OSRM_URL"] },
  { label: "temporal", keys: ["TEMPORAL_ADDRESS", "TEMPORAL_NAMESPACE"] },
  { label: "redis", keys: ["REDIS_URL"] },
  { label: "internal", keys: ["INTERNAL_API_SECRET"] },
] as const;

export type IntegrationEnvGroupLabel =
  (typeof INTEGRATION_ENV_GROUPS)[number]["label"];

/** S146 — ordered label tuple derived from INTEGRATION_ENV_GROUPS (no parallel list). */
export const INTEGRATION_ENV_GROUP_LABELS = INTEGRATION_ENV_GROUPS.map(
  (g) => g.label,
) as readonly IntegrationEnvGroupLabel[];

export function listIntegrationEnvGroupSnapshots(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): Array<{
  label: string;
  configured: boolean;
  missing: string[];
  presentCount: number;
  requiredCount: number;
}> {
  return INTEGRATION_ENV_GROUPS.map((g) => {
    const missing = g.keys.filter((k) => !env[k]?.trim());
    return {
      label: g.label,
      configured: missing.length === 0,
      missing: [...missing],
      presentCount: g.keys.length - missing.length,
      requiredCount: g.keys.length,
    };
  });
}
