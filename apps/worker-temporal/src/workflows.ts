/**
 * Temporal workflow — free of Node-only APIs for bundling.
 * Activities execute @dial/delivery SoR on the worker process.
 */
import { proxyActivities } from "@temporalio/workflow";

const { activityCreateAndDispatch } = proxyActivities<{
  activityCreateAndDispatch: (input: {
    orderId: string;
    from: string;
    to: string;
    courierId: string;
    codUsdMinor?: string;
  }) => Promise<{ jobId: string; status: string }>;
}>({
  startToCloseTimeout: "2 minutes",
});

export async function DeliveryDispatchWorkflow(input: {
  orderId: string;
  from: string;
  to: string;
  courierId: string;
  codUsdMinor?: string;
}): Promise<{
  orderId: string;
  status: "accepted_for_dispatch" | "pod_captured";
  jobId?: string;
}> {
  const result = await activityCreateAndDispatch(input);
  return {
    orderId: input.orderId,
    status:
      result.status === "pod_captured"
        ? "pod_captured"
        : "accepted_for_dispatch",
    jobId: result.jobId,
  };
}
