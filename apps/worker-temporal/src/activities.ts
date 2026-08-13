/**
 * Temporal activities — Node side; call @dial/delivery SoR (D-45).
 * Workflow file must not import this module directly (bundling).
 */
import {
  acceptOffer,
  capturePod,
  createDeliveryJob,
  getDeliveryJob,
  setCourierAvailable,
  startDeliveryDispatchWorkflow,
  startTransit,
} from "@dial/delivery";

export async function activityCreateAndDispatch(input: {
  orderId: string;
  from: string;
  to: string;
  courierId: string;
  codUsdMinor?: string;
}): Promise<{ jobId: string; status: string }> {
  setCourierAvailable(input.courierId, true);
  const created = createDeliveryJob({
    orderId: input.orderId,
    from: input.from,
    to: input.to,
    ...(input.codUsdMinor !== undefined
      ? { codUsdMinor: BigInt(input.codUsdMinor) }
      : {}),
  });
  startDeliveryDispatchWorkflow(created.id);
  const offered = getDeliveryJob(created.id);
  if (!offered?.offerId) throw new Error("Expected offer after workflow start");
  acceptOffer(offered.offerId, input.courierId);
  startTransit(created.id);
  const job = capturePod(created.id);
  return { jobId: job.id, status: job.status };
}
