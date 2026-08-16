/**
 * Temporal task-queue config + health, derived from env only.
 * Lives here so the gateway can report Temporal readiness without importing
 * `@temporalio/worker` (native bindings; not bundlable by Next).
 */

export const TEMPORAL_TASK_QUEUE = "dial-main";
export const WORKFLOW_DELIVERY_DISPATCH = "DeliveryDispatchWorkflow";

export type TemporalWorkerOptions = {
  address: string;
  namespace: string;
  taskQueue: string;
  workflows: string[];
};

export type TemporalHealth = {
  ok: boolean;
  mode: string;
  addressConfigured: boolean;
  namespace: string;
  taskQueue: string;
  workflows: string[];
  error?: string;
};

export function createTemporalWorkerOptions(
  env: NodeJS.ProcessEnv = process.env,
): TemporalWorkerOptions {
  const mode = (env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  const address = env.TEMPORAL_ADDRESS?.trim();
  if ((mode === "sandbox" || mode === "live") && !address) {
    throw new Error("TEMPORAL_ADDRESS unset — fail closed for Temporal worker");
  }
  return {
    address: address || "127.0.0.1:7233",
    namespace: env.TEMPORAL_NAMESPACE?.trim() || "dial",
    taskQueue: TEMPORAL_TASK_QUEUE,
    workflows: [WORKFLOW_DELIVERY_DISPATCH],
  };
}

/** Never opens a live Temporal connection — config-only, so health cannot hang. */
export function pingTemporalHealth(
  env: NodeJS.ProcessEnv = process.env,
): TemporalHealth {
  const mode = (env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  const addressConfigured = Boolean(env.TEMPORAL_ADDRESS?.trim());
  try {
    const opts = createTemporalWorkerOptions(env);
    return {
      ok: true,
      mode,
      addressConfigured,
      namespace: opts.namespace,
      taskQueue: opts.taskQueue,
      workflows: opts.workflows,
    };
  } catch (e) {
    return {
      ok: false,
      mode,
      addressConfigured,
      namespace: env.TEMPORAL_NAMESPACE?.trim() || "dial",
      taskQueue: TEMPORAL_TASK_QUEUE,
      workflows: [WORKFLOW_DELIVERY_DISPATCH],
      error: e instanceof Error ? e.message : "temporal config error",
    };
  }
}
