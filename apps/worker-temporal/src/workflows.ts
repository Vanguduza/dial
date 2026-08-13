/**
 * Temporal workflow module placeholder — register with @temporalio/worker when server is up.
 * Activities call @dial/delivery SoR; this file stays free of Node-only APIs for bundling.
 */
export async function DeliveryDispatchWorkflow(input: {
  orderId: string;
  from: string;
  to: string;
  courierId: string;
  codUsdMinor?: string;
}): Promise<{ orderId: string; status: "accepted_for_dispatch" }> {
  // Real activity stubs land when worker binary is run against Temporal.
  // Eng SoR for job state remains packages/delivery (in-process path).
  return {
    orderId: input.orderId,
    status: "accepted_for_dispatch",
  };
}
