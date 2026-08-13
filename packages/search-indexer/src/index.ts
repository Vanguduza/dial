/**
 * Search indexer — BullMQ/outbox consumer (Pack §8 / D-26 / D-29).
 * Fixture: in-memory queue + Meili client. Sandbox/live: Redis required.
 */
import {
  ensureSpareOffersIndex,
  listMeiliStubDocuments,
  upsertSpareOfferDocuments,
  type SpareOfferDocument,
} from "@dial/catalogue";
import {
  drainFixtureSearchJobs,
  enqueueSearchIndexerJob,
  integrationMode,
  type SearchIndexerJobPayload,
} from "@dial/queues";

export type IndexerJob = SearchIndexerJobPayload;

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

/** Process one outbox-shaped job (in-process; BullMQ worker wires via @dial/queues). */
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

/** Enqueue via BullMQ (fixture buffer) then process drained jobs. */
export async function enqueueAndProcessIndexerJob(
  job: IndexerJob,
): Promise<IndexerResult[]> {
  await enqueueSearchIndexerJob(job);
  if (integrationMode() === "fixture") {
    const pending = drainFixtureSearchJobs();
    const out: IndexerResult[] = [];
    for (const j of pending) {
      out.push(await processIndexerJob(j));
    }
    return out;
  }
  return [];
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

export { integrationMode } from "@dial/queues";
