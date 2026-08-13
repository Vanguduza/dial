/**
 * BullMQ worker host — FDMS day + search indexer + money outbox (when not fixture).
 * Fixture mode drains money outbox once then exits (CI-safe).
 */
import {
  integrationMode,
  startFdmsDayWorker,
  startOutboxSideEffectsWorker,
  startSearchIndexerWorker,
} from "@dial/queues";
import { processFdmsDayJob } from "@dial/tax";
import { runMoneyOutboxDrain } from "./moneyOutbox.js";

const mode = integrationMode();
console.log(
  JSON.stringify({
    service: "worker-queues",
    mode,
    queues: [
      "dial-fdms-day",
      "dial-search-indexer",
      "dial-outbox-side-effects",
    ],
  }),
);

if (mode === "fixture") {
  const money = await runMoneyOutboxDrain({ enqueueSideEffects: true });
  console.log(
    JSON.stringify({
      ok: true,
      note: "Fixture — no Redis workers; admin /api/admin/money/outbox + fdms/day run inline",
      moneyOutbox: {
        drained: money.drained.length,
        remaining: money.remaining,
      },
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

const outbox = await startOutboxSideEffectsWorker({
  processor: async (data) => {
    if (data.topic === "money.ledger_posted" || data.topic === "money.drain") {
      await runMoneyOutboxDrain({ enqueueSideEffects: false });
    }
  },
});

console.log(
  JSON.stringify({
    ok: true,
    workers: ["fdms-day", "search-indexer", "outbox-side-effects"],
  }),
);

async function shutdown() {
  await fdms.stop();
  await search.stop();
  await outbox.stop();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
