/**
 * Search indexer — BullMQ/outbox consumer (Pack §8 / D-26 / D-29).
 * Fixture: in-memory queue + Meili client. Sandbox/live: Redis required for jobs.
 */
import {
  ensureGroceryOffersIndex,
  ensureSpareOffersIndex,
  listMeiliStubDocuments,
  publishApprovedBatchToMeili,
  searchSpareOfferDocuments,
  upsertSpareOfferDocuments,
  type SpareOfferDocument,
  type StubOffer,
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

function assertMeiliDeps(env: NodeJS.ProcessEnv = process.env): void {
  if (integrationMode(env) === "fixture") return;
  if (!env.MEILI_HOST?.trim() || !env.MEILI_MASTER_KEY?.trim()) {
    throw new Error("MEILI_HOST / MEILI_MASTER_KEY unset — fail closed");
  }
}

function assertSandboxDeps(env: NodeJS.ProcessEnv = process.env): void {
  if (integrationMode(env) === "fixture") return;
  if (!env.REDIS_URL?.trim()) {
    throw new Error("REDIS_URL unset — fail closed for search-indexer");
  }
  assertMeiliDeps(env);
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
  } else if (job.type === "StockHeartbeatReceived") {
    // Phase 4 prep — heartbeat receipt reindexes MARKETPLACE docs only (D-58).
    docs = listMeiliStubDocuments().filter((d) => d.offerSource === "MARKETPLACE");
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

export type BootstrapSearchResult = {
  indexUid: string;
  groceryIndexUid: string;
  mode: ReturnType<typeof integrationMode>;
  taskUid: string | "fixture";
  documentsUpserted: number;
  searchHits: number;
  searchSource: "meili" | "fixture_skip";
};

/**
 * Phase 1 / G1 — ensure Meili spare + grocery index settings, seed stub docs,
 * return non-fixture taskUid when sandbox/live against a real host.
 * Meili-only (Redis not required for bootstrap).
 */
export async function bootstrapLocalSearchIndex(
  env: NodeJS.ProcessEnv = process.env,
): Promise<BootstrapSearchResult> {
  assertMeiliDeps(env);
  const mode = integrationMode(env);
  const spare = await ensureSpareOffersIndex();
  const grocery = await ensureGroceryOffersIndex();
  const docs = listMeiliStubDocuments();
  const upsert = await upsertSpareOfferDocuments(docs);
  const search = await searchSpareOfferDocuments({
    q: "",
    filter: 'offerSource = "MARKETPLACE"',
    limit: 5,
  });
  return {
    indexUid: spare.indexUid,
    groceryIndexUid: grocery.indexUid,
    mode,
    taskUid: upsert.taskUid,
    documentsUpserted: docs.length,
    searchHits: search.hits.length,
    searchSource: search.source,
  };
}

/**
 * Phase 4 prep — human-approved Factory batch → Meili publish + indexer job.
 * Fixture: in-process. Sandbox/live: fail-closed without REDIS_URL + MEILI_*.
 * Does **not** claim G4 green.
 */
export async function publishFactoryOfferViaIndexer(input: {
  batchId: string;
  offer: StubOffer;
}): Promise<{
  doc: SpareOfferDocument;
  publishTaskUid: string | "fixture";
  indexerResults: IndexerResult[];
  indexUid: string;
}> {
  assertSandboxDeps();
  const published = await publishApprovedBatchToMeili(input);
  const indexerResults = await enqueueAndProcessIndexerJob({
    type: "MasterProductPublished",
    masterProductId: published.doc.id,
  });
  return {
    doc: published.doc,
    publishTaskUid: published.taskUid,
    indexerResults,
    indexUid: published.indexUid,
  };
}

/**
 * Phase 4 prep end-to-end: CSV → pending_review → approve → Meili via indexer.
 * B2B informal leak=0; liquor rejected; no DIAL_OWNED; no AI payable.
 * Does **not** claim G4 (sandbox two-supplier Meili dogfood still open).
 */
export async function runPhase4PrepFactoryCsvPublishThinVertical(): Promise<{
  offerId: string;
  publishTaskUid: string | "fixture";
  informalB2bLeaks: number;
  liquorRejected: true;
  autoPublishForbidden: true;
  payableFromAi: false;
  offerSource: "MARKETPLACE";
}> {
  const {
    __resetCatalogueForTests,
    approveCatalogueReview,
    countInformalB2bLeaks,
    ingestCatalogueCsv,
    searchOffers,
  } = await import("@dial/catalogue");

  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetCatalogueForTests();
  const csv = [
    "vertical,offerId,title,unitPriceUsdMinor,supplierFormality,brand,oem,qualityTier",
    "spare,off_p4prep_idx,P4 Prep Filter,2100,formal,Bosch,P4-OEM,OES",
    "liquor,groc_beer_p4b,Blocked beer,999,formal,Brand,750ml,ambient",
  ].join("\n");
  const ingested = ingestCatalogueCsv(csv);
  if (ingested.rejectedRows.length < 1) {
    throw new Error("Phase4-prep indexer path expected liquor rejection");
  }
  const review = ingested.reviews[0]!;
  approveCatalogueReview(review.reviewId);
  const draft = review.draft!;
  const out = await publishFactoryOfferViaIndexer({
    batchId: review.batchId,
    offer: {
      offerId: draft.offerId,
      title: draft.title,
      unitPriceUsdMinor: draft.unitPriceUsdMinor,
      qualityTier: draft.qualityTier ?? "OES",
      offerSource: "MARKETPLACE",
      supplierFormality: draft.supplierFormality,
      oem: draft.oem ?? draft.offerId,
      brand: draft.brand,
    },
  });

  const b2bHits = searchOffers("P4 Prep", { sessionRole: "b2b" });
  const leaks =
    countInformalB2bLeaks() +
    b2bHits.filter((h) => h.supplierFormality === "informal").length;
  if (leaks !== 0) {
    throw new Error(`Phase4-prep B2B informal leak must be 0, got ${leaks}`);
  }
  if (out.doc.offerSource !== "MARKETPLACE") {
    throw new Error("DIAL_OWNED forbidden");
  }

  const hb = await processIndexerJob({
    type: "StockHeartbeatReceived",
    supplierId: "sup_p4prep",
  });
  if (hb.documentsUpserted < 1) {
    throw new Error("Phase4-prep StockHeartbeatReceived expected upsert");
  }

  return {
    offerId: out.doc.id,
    publishTaskUid: out.publishTaskUid,
    informalB2bLeaks: leaks,
    liquorRejected: true,
    autoPublishForbidden: true,
    payableFromAi: false,
    offerSource: "MARKETPLACE",
  };
}

export type RestFactoryMeiliPublishResult = {
  reviewId: string;
  offerId: string;
  batchId: string;
  publishTaskUid: string | "fixture";
  indexUid: string;
  searchHits: number;
  searchSource: "meili" | "fixture_skip";
  b2bInformalHits: number;
};

/**
 * Phase 4 G4 path — read human-approved formal reviews from durable REST,
 * publish to Meili via indexer, verify search + B2B informal leak=0.
 * Does not claim G4 until ops evidence (admin T+S+A recon) is filed.
 */
export async function publishRestApprovedFactoryOffersViaIndexer(
  env: NodeJS.ProcessEnv = process.env,
): Promise<{
  published: RestFactoryMeiliPublishResult[];
  skippedQueued: number;
  ok: boolean;
}> {
  const {
    listCatalogueReviewsDurable,
    meiliFilterForSession,
    publishStubOfferDirectToMeili,
    searchSpareOfferDocuments,
    stubOfferFromRestDraft,
  } = await import("@dial/catalogue");

  assertMeiliDeps(env);
  const reviews = await listCatalogueReviewsDurable(env);
  const approvedFormal = reviews.filter(
    (r) =>
      r.status === "approved" &&
      r.vertical === "spare" &&
      r.draft?.supplierFormality === "formal" &&
      r.draft.payableFromAi !== true,
  );
  const skippedQueued = reviews.filter((r) => r.status === "queued").length;

  const published: RestFactoryMeiliPublishResult[] = [];
  for (const review of approvedFormal) {
    const draft = review.draft!;
    const offer = stubOfferFromRestDraft({
      offerId: draft.offerId,
      title: draft.title,
      unitPriceUsdMinor: draft.unitPriceUsdMinor,
      supplierFormality: draft.supplierFormality as "formal" | "informal",
      brand: draft.brand,
      ...(draft.oem ? { oem: draft.oem } : {}),
      ...(draft.qualityTier ? { qualityTier: draft.qualityTier } : {}),
    });
    const pub = await publishStubOfferDirectToMeili(offer);
    if (env.REDIS_URL?.trim()) {
      await enqueueAndProcessIndexerJob({
        type: "MasterProductPublished",
        masterProductId: pub.doc.id,
      });
    }
    const search = await searchSpareOfferDocuments({
      q: pub.doc.id,
      filter: meiliFilterForSession("b2c"),
      limit: 10,
    });
    const b2bSearch = await searchSpareOfferDocuments({
      q: draft.title.split(" ").slice(0, 2).join(" "),
      filter: meiliFilterForSession("b2b"),
      limit: 10,
    });
    const b2bInformalHits = b2bSearch.hits.filter(
      (h) => h.supplierFormality === "informal",
    ).length;
    published.push({
      reviewId: review.reviewId,
      offerId: pub.doc.id,
      batchId: review.batchId,
      publishTaskUid: pub.taskUid,
      indexUid: pub.indexUid,
      searchHits: search.hits.filter((h) => h.id === pub.doc.id).length,
      searchSource: search.source,
      b2bInformalHits,
    });
  }

  const ok =
    published.length >= 1 &&
    published.every(
      (p) =>
        p.publishTaskUid !== "fixture" &&
        p.searchHits >= 1 &&
        p.b2bInformalHits === 0,
    );

  return { published, skippedQueued, ok };
}

export { integrationMode } from "@dial/queues";
