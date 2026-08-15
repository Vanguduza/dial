/**
 * Temporal activities — Node side; call @dial/delivery SoR (D-45).
 * Workflow file must not import this module directly (bundling).
 */
import {
  acceptOffer,
  capturePod,
  createDeliveryJob,
  createJobsFromMultiStopPlan,
  getDeliveryJob,
  setCourierAvailable,
  startDeliveryDispatchWorkflow,
  startTransit,
  type MultiStopVendorLeg,
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

/**
 * PD36 — Temporal activity: multi-vendor same band/slot → one job (grill Q15).
 */
export async function activityCreateMultiStopDispatch(input: {
  orderId: string;
  dropoffAddress: string;
  courierId: string;
  vendors: MultiStopVendorLeg[];
  codUsdMinor?: string;
}): Promise<{
  jobIds: string[];
  jobCount: number;
  consolidated: boolean;
  liquorAllowed: false;
  podSpoilageRulesUnchanged: true;
}> {
  setCourierAvailable(input.courierId, true);
  const result = createJobsFromMultiStopPlan({
    orderId: input.orderId,
    dropoffAddress: input.dropoffAddress,
    vendors: input.vendors,
    ...(input.codUsdMinor !== undefined
      ? { codUsdMinor: BigInt(input.codUsdMinor) }
      : {}),
    createJob: createDeliveryJob,
  });
  for (const job of result.jobs) {
    startDeliveryDispatchWorkflow(job.id);
    const offered = getDeliveryJob(job.id);
    if (!offered?.offerId) throw new Error("Expected offer after multi-stop dispatch");
    acceptOffer(offered.offerId, input.courierId);
  }
  return {
    jobIds: result.jobs.map((j) => j.id),
    jobCount: result.jobCount,
    consolidated: result.consolidated,
    liquorAllowed: false,
    podSpoilageRulesUnchanged: true,
  };
}
