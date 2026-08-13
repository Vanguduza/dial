/**
 * Search indexer — BullMQ/outbox consumer shape (Pack §8 / D-26).
 * Fixture: applies Meili settings + upsert via catalogue client without Redis.
 * Sandbox/live: requires REDIS_URL + MEILI_* (fail closed).
 */
import {
  ensureSpareOffersIndex,
  listMeiliStubDocuments,
  upsertSpareOfferDocuments,
  type SpareOfferDocument,
} from "@dial/catalogue";

export type IntegrationMode = "fixture" | "sandbox" | "live";

export function integrationMode(
  env: NodeJS.ProcessEnv = process.env,
): IntegrationMode {
  const m = (env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (m === "sandbox" || m === "live") return m;
  return "fixture";
}

export type IndexerJob =
  | { type: "OfferInvalidated"; offerId: string }
  | { type: "MasterProductPublished"; masterProductId: string }
  | { type: "StockHeartbeatReceived"; supplierId: string }
  | { type: "ReindexAll" };

export type IndexerResult = {
  job: IndexerJob;
  indexUid: string;
  documentsUpserted: number;
  taskUid: string | "fixture";
};

function assertSandboxDeps(env: NodeJS.ProcessEnv = process.env): void {
  if (integrationMode(env) === "fixture") return;
  if (!env.REDIS_URL?.trim()) {
    throw new Error("REDIS_URL unset — fail closed for search-indexer");
  }
  if (!env.MEILI_HOST?.trim() || !env.MEILI_MASTER_KEY?.trim()) {
    throw new Error("MEILI_HOST / MEILI_MASTER_KEY unset — fail closed");
  }
}

/** Process one outbox-shaped job (in-process; BullMQ worker wires later). */
export async function processIndexerJob(
  job: IndexerJob,
): Promise<IndexerResult> {
  assertSandboxDeps();
  const ensured = await ensureSpareOffersIndex();
  let docs: SpareOfferDocument[] = [];
  if (job.type === "ReindexAll" || job.type === "MasterProductPublished") {
    docs = listMeiliStubDocuments();
  } else if (job.type === "OfferInvalidated") {
    docs = listMeiliStubDocuments().filter((d) => d.id === job.offerId);
  } else {
    docs = listMeiliStubDocuments();
  }
  const upsert = await upsertSpareOfferDocuments(docs);
  return {
    job,
    indexUid: ensured.indexUid,
    documentsUpserted: docs.length,
    taskUid: upsert.taskUid,
  };
}

/** Drain a batch of outbox jobs (fixture / worker activity). */
export async function drainIndexerOutbox(
  jobs: IndexerJob[],
): Promise<IndexerResult[]> {
  const out: IndexerResult[] = [];
  for (const job of jobs) {
    out.push(await processIndexerJob(job));
  }
  return out;
}
