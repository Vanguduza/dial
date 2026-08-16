/**
 * Phase 1 worker secret gate — sandbox/live must fail closed before polling.
 * Fixture mode skips (CI). Never echoes secret values.
 */
export type IntegrationMode = "fixture" | "sandbox" | "live";

export function workerIntegrationMode(
  env: NodeJS.ProcessEnv = process.env,
): IntegrationMode {
  const m = (env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (m === "sandbox" || m === "live") return m;
  return "fixture";
}

export type WorkerSecretGate = {
  ok: boolean;
  mode: IntegrationMode;
  missing: string[];
  error?: string;
};

/** BullMQ host: REDIS_URL + INTERNAL_API_SECRET required outside fixture. */
export function assertWorkerQueuesSecrets(
  env: NodeJS.ProcessEnv = process.env,
): WorkerSecretGate {
  const mode = workerIntegrationMode(env);
  if (mode === "fixture") {
    return { ok: true, mode, missing: [] };
  }
  const missing: string[] = [];
  if (!env.REDIS_URL?.trim()) missing.push("REDIS_URL");
  if (!env.INTERNAL_API_SECRET?.trim()) missing.push("INTERNAL_API_SECRET");
  if (missing.length) {
    return {
      ok: false,
      mode,
      missing,
      error: `${missing.join(" / ")} unset — fail closed for worker-queues`,
    };
  }
  return { ok: true, mode, missing: [] };
}

/** Temporal host: TEMPORAL_ADDRESS + INTERNAL_API_SECRET required outside fixture. */
export function assertWorkerTemporalSecrets(
  env: NodeJS.ProcessEnv = process.env,
): WorkerSecretGate {
  const mode = workerIntegrationMode(env);
  if (mode === "fixture") {
    return { ok: true, mode, missing: [] };
  }
  const missing: string[] = [];
  if (!env.TEMPORAL_ADDRESS?.trim()) missing.push("TEMPORAL_ADDRESS");
  if (!env.INTERNAL_API_SECRET?.trim()) missing.push("INTERNAL_API_SECRET");
  if (missing.length) {
    return {
      ok: false,
      mode,
      missing,
      error: `${missing.join(" / ")} unset — fail closed for worker-temporal`,
    };
  }
  return { ok: true, mode, missing: [] };
}

export function requireWorkerQueuesSecrets(
  env: NodeJS.ProcessEnv = process.env,
): void {
  const gate = assertWorkerQueuesSecrets(env);
  if (!gate.ok) throw new Error(gate.error ?? "worker-queues fail closed");
}

export function requireWorkerTemporalSecrets(
  env: NodeJS.ProcessEnv = process.env,
): void {
  const gate = assertWorkerTemporalSecrets(env);
  if (!gate.ok) throw new Error(gate.error ?? "worker-temporal fail closed");
}
