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
    /** Pack §6 names the integration can use but does not require. */
    optionalMissing?: string[];
    optionalCount?: number;
  }>;
  /** S154 — optional health note (never secrets); UI truncates via helper. */
  note?: string;
};

/** S154 — admin readiness UI max visible chars for health `note`. */
export const INTEGRATIONS_HEALTH_NOTE_UI_MAX = 120;

/**
 * S154 — truncate health note for admin display (ellipsis; no secret values).
 */
export function truncateIntegrationsHealthNote(
  note: string,
  maxLen: number = INTEGRATIONS_HEALTH_NOTE_UI_MAX,
): string {
  if (maxLen < 1) return "";
  if (note.length <= maxLen) return note;
  if (maxLen === 1) return "…";
  return `${note.slice(0, maxLen - 1)}…`;
}

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
  const note = typeof b.note === "string" ? b.note : undefined;
  return {
    ready: b.ready,
    mode: b.mode,
    probes,
    groups,
    ...(note !== undefined ? { note } : {}),
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

/**
 * S139 — env groups for health `groups[]` (keys must exist in `.env.example`).
 *
 * `keys` are required for the integration to work at all and drive `configured`.
 * `optional` are real Pack §6 names the integration can use but does not need —
 * they are reported separately so a health reader can see what is still unset
 * without an optional key flipping a group to unconfigured.
 */
export const INTEGRATION_ENV_GROUPS = [
  {
    label: "whatsapp",
    keys: [
      "WHATSAPP_TOKEN",
      "WHATSAPP_PHONE_NUMBER_ID",
      "WHATSAPP_APP_SECRET",
      "WHATSAPP_VERIFY_TOKEN",
    ],
    optional: [
      "WHATSAPP_WABA_ID",
      "WHATSAPP_FLOWS_PRIVATE_KEY",
      "WHATSAPP_FLOWS_PASSPHRASE",
    ],
  },
  {
    label: "paynow",
    keys: ["PAYNOW_INTEGRATION_ID", "PAYNOW_INTEGRATION_KEY"],
    optional: ["PAYNOW_RESULT_URL", "PAYNOW_RETURN_URL"],
  },
  {
    label: "contipay",
    keys: ["CONTIPAY_API_KEY", "CONTIPAY_API_SECRET", "CONTIPAY_MERCHANT_ID"],
    optional: ["CONTIPAY_MODE", "CONTIPAY_WEBHOOK_URL"],
  },
  {
    label: "ecocash",
    keys: ["ECOCASH_API_KEY", "ECOCASH_MERCHANT_CODE", "ECOCASH_WEBHOOK_SECRET"],
    optional: ["ECOCASH_ENVIRONMENT", "ECOCASH_SANDBOX_HTTP"],
  },
  {
    label: "paypal",
    keys: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_WEBHOOK_ID"],
    optional: ["PAYPAL_MODE"],
  },
  {
    label: "escrow",
    keys: ["PSP_ESCROW_BASE_URL", "PSP_ESCROW_API_KEY", "PSP_WEBHOOK_SECRET"],
    optional: [],
  },
  {
    label: "fdms",
    keys: ["FDMS_BASE_URL", "FDMS_DEVICE_ID", "FDMS_ACTIVATION_KEY"],
    optional: ["FDMS_DEVICE_SERIAL", "FDMS_SANDBOX_HTTP"],
  },
  {
    label: "meili",
    keys: ["MEILI_HOST", "MEILI_MASTER_KEY"],
    optional: ["MEILI_SPARE_INDEX", "MEILI_GROCERY_INDEX"],
  },
  {
    label: "litellm",
    keys: ["LITELLM_BASE_URL", "LITELLM_API_KEY"],
    optional: ["GEMINI_API_KEY", "LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY"],
  },
  {
    label: "maps",
    keys: ["NOMINATIM_URL", "OSRM_URL"],
    optional: ["VROOM_URL", "MAP_TILES_STYLE_URL", "MAP_OFFLINE_PACK_BASE_URL"],
  },
  {
    label: "temporal",
    keys: ["TEMPORAL_ADDRESS", "TEMPORAL_NAMESPACE"],
    optional: [],
  },
  { label: "redis", keys: ["REDIS_URL"], optional: [] },
  { label: "internal", keys: ["INTERNAL_API_SECRET"], optional: [] },
  {
    label: "supabase",
    keys: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
    optional: ["DATABASE_URL", "SUPABASE_URL"],
  },
] as const;

export type IntegrationEnvGroupLabel =
  (typeof INTEGRATION_ENV_GROUPS)[number]["label"];

/** S146 — ordered label tuple derived from INTEGRATION_ENV_GROUPS (no parallel list). */
export const INTEGRATION_ENV_GROUP_LABELS = INTEGRATION_ENV_GROUPS.map(
  (g) => g.label,
) as readonly IntegrationEnvGroupLabel[];

/**
 * S163 — build health `note` from mode + INTEGRATION_ENV_GROUP_LABELS (never secrets).
 */
export function buildIntegrationsHealthNote(mode: string): string {
  const labels = INTEGRATION_ENV_GROUP_LABELS.join(",");
  const normalized = mode.toLowerCase();
  if (normalized === "fixture") {
    return `Fixture mode — missing keys OK for CI; ready=all probes ok; groups labels=${labels}`;
  }
  return `Sandbox/live — missing groups will fail closed on use; ready=all probes ok; groups labels=${labels}`;
}

/**
 * S176 — admin `data-testid` + docs pointer for note-builder SoR cross-link (no secrets).
 */
export const INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID =
  "note-builder-sor-hint" as const;

export const INTEGRATIONS_NOTE_BUILDER_SOR_DOCS =
  "docs/integrations/README.md" as const;

/**
 * S202/S206 — admin `data-testid` for ready≠groups configured SoR (S194).
 */
export const INTEGRATIONS_READY_VS_GROUPS_HINT_ID =
  "ready-vs-groups-sor-hint" as const;

export function listIntegrationEnvGroupSnapshots(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): Array<{
  label: string;
  configured: boolean;
  missing: string[];
  presentCount: number;
  requiredCount: number;
  optionalMissing: string[];
  optionalCount: number;
}> {
  return INTEGRATION_ENV_GROUPS.map((g) => {
    const missing = g.keys.filter((k) => !env[k]?.trim());
    const optionalMissing = g.optional.filter((k) => !env[k]?.trim());
    return {
      label: g.label,
      configured: missing.length === 0,
      missing: [...missing],
      presentCount: g.keys.length - missing.length,
      requiredCount: g.keys.length,
      optionalMissing: [...optionalMissing],
      optionalCount: g.optional.length,
    };
  });
}
