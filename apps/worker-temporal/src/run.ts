/**
 * Local entry: fixture in-process demo OR Temporal SDK worker (compose profile).
 * Phase 1 / G1: sandbox/live fail closed without TEMPORAL_ADDRESS + INTERNAL_API_SECRET.
 */
import { requireWorkerTemporalSecrets } from "@dial/shared";
import {
  createTemporalSdkWorker,
  createTemporalWorkerOptions,
  runDeliveryDispatchInProcess,
} from "./index.js";

const mode = (process.env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();

if (mode !== "fixture") {
  try {
    requireWorkerTemporalSecrets();
  } catch (e) {
    console.error(
      JSON.stringify({
        ok: false,
        mode,
        error: e instanceof Error ? e.message : "fail closed",
      }),
    );
    process.exit(1);
  }
}

const opts = createTemporalWorkerOptions();
console.log(
  JSON.stringify({
    mode,
    temporal: opts,
    note:
      mode === "fixture"
        ? "Fixture — in-process DeliveryDispatch; SDK worker path registered without NativeConnection"
        : "Sandbox/live — @temporalio/worker polls TEMPORAL_ADDRESS",
  }),
);

if (mode === "fixture") {
  const sdk = await createTemporalSdkWorker();
  console.log(
    JSON.stringify({
      ok: true,
      sdkWorker: { mode: sdk.mode, taskQueue: sdk.taskQueue, workflows: sdk.workflows },
    }),
  );
  const demo = await runDeliveryDispatchInProcess({
    orderId: `ord_local_${Date.now().toString(36)}`,
    from: "Harare CBD",
    to: "Avondale",
    courierId: "courier_local_1",
  });
  console.log(
    JSON.stringify({ ok: true, demo }, (_, v) =>
      typeof v === "bigint" ? v.toString() : v,
    ),
  );
  process.exit(0);
}

const worker = await createTemporalSdkWorker();
console.log(
  JSON.stringify({
    ok: true,
    polling: true,
    taskQueue: worker.taskQueue,
  }),
);

async function shutdown() {
  await worker.stop();
  process.exit(0);
}
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
await worker.run();
