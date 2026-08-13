/**
 * Local entry: in-process DeliveryDispatchWorkflow host.
 * Swap to @temporalio/worker when Temporal compose profile is up.
 */
import {
  createTemporalWorkerOptions,
  runDeliveryDispatchInProcess,
} from "./index.js";

const opts = createTemporalWorkerOptions();
console.log(
  JSON.stringify({
    mode: process.env.DIAL_INTEGRATION_MODE ?? "fixture",
    temporal: opts,
    note: "In-process runner — Temporal SDK worker lands when server is up",
  }),
);

const demo = await runDeliveryDispatchInProcess({
  orderId: `ord_local_${Date.now().toString(36)}`,
  from: "Harare CBD",
  to: "Avondale",
  courierId: "courier_local_1",
});
console.log(JSON.stringify({ ok: true, demo }, (_, v) =>
  typeof v === "bigint" ? v.toString() : v,
));
