/**
 * BullMQ worker host — FDMS day + search indexer (when not fixture).
 * Fixture mode exits after printing readiness (CI-safe).
 */
import {
  integrationMode,
  startFdmsDayWorker,
  startSearchIndexerWorker,
} from "@dial/queues";
import { processFdmsDayJob } from "@dial/tax";

const mode = integrationMode();
console.log(
  JSON.stringify({
    service: "worker-queues",
    mode,
    queues: ["dial-fdms-day", "dial-search-indexer"],
  }),
);

if (mode === "fixture") {
  console.log(
    JSON.stringify({
      ok: true,
      note: "Fixture — no Redis workers; admin /api/admin/fdms/day runs inline",
    }),
  );
  process.exit(0);
}

const fdms = await startFdmsDayWorker({
  processor: async (data) => {
    await processFdmsDayJob({ action: data.action });
  },
});

const search = await startSearchIndexerWorker({
  processor: async (data) => {
    const { processIndexerJob } = await import("@dial/search-indexer");
    await processIndexerJob(data);
  },
});

console.log(JSON.stringify({ ok: true, workers: ["fdms-day", "search-indexer"] }));

async function shutdown() {
  await fdms.stop();
  await search.stop();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
