/**
 * S133 — parse integrations health JSON for admin readiness UI (no secrets).
 */
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
