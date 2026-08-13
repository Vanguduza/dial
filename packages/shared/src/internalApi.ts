/** S131 — INTERNAL_API_SECRET presence for side-effect HTTP (D-47). Never echoes value. */

export type IntegrationMode = "fixture" | "sandbox" | "live";

function modeOf(env: NodeJS.ProcessEnv): IntegrationMode {
  const m = (env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (m === "sandbox" || m === "live") return m;
  return "fixture";
}

export async function pingInternalApiHealth(
  env: NodeJS.ProcessEnv = process.env,
): Promise<{
  ok: boolean;
  mode: IntegrationMode;
  configured: boolean;
  error?: string;
}> {
  const mode = modeOf(env);
  const configured = Boolean(env.INTERNAL_API_SECRET?.trim());
  if (mode === "fixture") {
    return { ok: true, mode, configured: true };
  }
  if (!configured) {
    return {
      ok: false,
      mode,
      configured: false,
      error: "INTERNAL_API_SECRET unset — fail closed",
    };
  }
  return { ok: true, mode, configured: true };
}
