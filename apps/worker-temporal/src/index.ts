/**
 * Temporal worker host (D-45 / D-61) — DeliveryDispatchWorkflow + money/fiscal hooks.
 * Fixture: in-process. Sandbox/live: Temporal client against TEMPORAL_ADDRESS.
 */
import { Connection, Client } from "@temporalio/client";
import {
  acceptOffer,
  capturePod,
  createDeliveryJob,
  getDeliveryJob,
  setCourierAvailable,
  startDeliveryDispatchWorkflow,
  startTransit,
  type DeliveryJob,
} from "@dial/delivery";

export const TEMPORAL_TASK_QUEUE = "dial-main";
export const WORKFLOW_DELIVERY_DISPATCH = "DeliveryDispatchWorkflow";

export type TemporalWorkerOptions = {
  address: string;
  namespace: string;
  taskQueue: string;
  workflows: string[];
};

export type DeliveryDispatchInput = {
  orderId: string;
  from: string;
  to: string;
  courierId: string;
  codUsdMinor?: bigint;
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

/**
 * Temporal worker health (S126) — fixture returns options + namespace; sandbox fail-closed without address.
 * Never opens a live Temporal connection in health (avoid hanging CI).
 */
export function pingTemporalHealth(
  env: NodeJS.ProcessEnv = process.env,
): {
  ok: boolean;
  mode: string;
  addressConfigured: boolean;
  namespace: string;
  taskQueue: string;
  workflows: string[];
  error?: string;
} {
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

export async function runDeliveryDispatchInProcess(input: {
  orderId: string;
  from: string;
  to: string;
  courierId: string;
  codUsdMinor?: bigint;
}): Promise<{ workflowId: string; job: DeliveryJob }> {
  setCourierAvailable(input.courierId, true);
  const created = createDeliveryJob({
    orderId: input.orderId,
    from: input.from,
    to: input.to,
    ...(input.codUsdMinor !== undefined
      ? { codUsdMinor: input.codUsdMinor }
      : {}),
  });
  const wf = startDeliveryDispatchWorkflow(created.id);
  const offered = getDeliveryJob(created.id);
  if (!offered?.offerId) {
    throw new Error("Expected offer after workflow start");
  }
  acceptOffer(offered.offerId, input.courierId);
  startTransit(created.id);
  const job = capturePod(created.id);
  return { workflowId: wf.workflowId, job };
}

/**
 * Start DeliveryDispatchWorkflow — remote Temporal when not fixture.
 */
export async function startDeliveryDispatch(
  input: DeliveryDispatchInput,
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ workflowId: string; path: "in_process" | "temporal" }> {
  const mode = (env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (mode === "fixture") {
    const result = await runDeliveryDispatchInProcess(input);
    return { workflowId: result.workflowId, path: "in_process" };
  }

  const opts = createTemporalWorkerOptions(env);
  const connection = await Connection.connect({ address: opts.address });
  try {
    const client = new Client({
      connection,
      namespace: opts.namespace,
    });
    const handle = await client.workflow.start("DeliveryDispatchWorkflow", {
      taskQueue: opts.taskQueue,
      workflowId: `ddw_${input.orderId}_${Date.now().toString(36)}`,
      args: [
        {
          orderId: input.orderId,
          from: input.from,
          to: input.to,
          courierId: input.courierId,
          codUsdMinor:
            input.codUsdMinor !== undefined
              ? input.codUsdMinor.toString()
              : undefined,
        },
      ],
    });
    return { workflowId: handle.workflowId, path: "temporal" };
  } finally {
    await connection.close();
  }
}

export function temporalWorkerBootstrap(
  env: NodeJS.ProcessEnv = process.env,
): TemporalWorkerOptions & { workflowsPathHint: string } {
  const opts = createTemporalWorkerOptions(env);
  return {
    ...opts,
    workflowsPathHint:
      "@dial/worker-temporal workflows.ts — register DeliveryDispatchWorkflow",
  };
}

export function assertInternalSecretForSideEffects(
  env: NodeJS.ProcessEnv = process.env,
): void {
  const mode = (env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (mode === "fixture") return;
  if (!env.INTERNAL_API_SECRET?.trim()) {
    throw new Error("INTERNAL_API_SECRET unset — fail closed for worker side-effects");
  }
}

export type SdkWorkerHandle = {
  mode: "fixture" | "sandbox" | "live";
  taskQueue: string;
  workflows: string[];
  /** Start polling (no-op in fixture). */
  run: () => Promise<void>;
  stop: () => Promise<void>;
};

/**
 * S101 — Temporal SDK worker registration path.
 * Fixture: no NativeConnection (CI-safe). Sandbox/live: Worker.create against compose.
 */
export async function createTemporalSdkWorker(
  env: NodeJS.ProcessEnv = process.env,
): Promise<SdkWorkerHandle> {
  const modeRaw = (env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  const mode: "fixture" | "sandbox" | "live" =
    modeRaw === "sandbox" || modeRaw === "live" ? modeRaw : "fixture";
  const opts = createTemporalWorkerOptions(env);
  assertInternalSecretForSideEffects(env);

  if (mode === "fixture") {
    return {
      mode,
      taskQueue: opts.taskQueue,
      workflows: opts.workflows,
      run: async () => undefined,
      stop: async () => undefined,
    };
  }

  const { NativeConnection, Worker } = await import("@temporalio/worker");
  const connection = await NativeConnection.connect({ address: opts.address });
  const worker = await Worker.create({
    connection,
    namespace: opts.namespace,
    taskQueue: opts.taskQueue,
    workflowsPath: new URL("./workflows.ts", import.meta.url).pathname,
    activities: await import("./activities.js"),
  });

  let running: Promise<void> | undefined;
  return {
    mode,
    taskQueue: opts.taskQueue,
    workflows: opts.workflows,
    run: async () => {
      running = worker.run();
      await running;
    },
    stop: async () => {
      worker.shutdown();
      await connection.close();
    },
  };
}

export { DeliveryDispatchWorkflow } from "./workflows.js";
export { activityCreateAndDispatch } from "./activities.js";
