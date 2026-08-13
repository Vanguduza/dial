/**
 * Temporal worker host (D-45 / D-61) — DeliveryDispatchWorkflow + money/fiscal hooks.
 * Default: in-process runner (no SDK required for CI).
 * When TEMPORAL_ADDRESS is set and @temporalio packages are installed later,
 * use createTemporalWorkerOptions() to wire the real worker.
 */
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

/** Config for a future @temporalio/worker bootstrap — fail closed if address missing in live. */
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
 * In-process DeliveryDispatchWorkflow (fixture / local without Temporal server).
 * SoR remains @dial/delivery — this only hosts the orchestration loop.
 */
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

export function assertInternalSecretForSideEffects(
  env: NodeJS.ProcessEnv = process.env,
): void {
  const mode = (env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (mode === "fixture") return;
  if (!env.INTERNAL_API_SECRET?.trim()) {
    throw new Error("INTERNAL_API_SECRET unset — fail closed for worker side-effects");
  }
}
