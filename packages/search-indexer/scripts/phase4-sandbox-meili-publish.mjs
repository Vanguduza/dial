/**
 * Phase 4 sandbox Meili publish — approved formal Factory offer → live index.
 * B2B informal leak=0 on memory + Meili search. Does not claim G4.
 *
 * Usage: pnpm --filter @dial/search-indexer exec node --import tsx scripts/phase4-sandbox-meili-publish.mjs
 * (load .env into process first — never commit secrets)
 */
import {
  __resetCatalogueForTests,
  approveCatalogueReview,
  countInformalB2bLeaks,
  ingestCatalogueCsv,
  searchOffers,
  searchSpareOfferDocuments,
} from "@dial/catalogue";
import { publishFactoryOfferViaIndexer } from "../src/index.ts";

__resetCatalogueForTests();

const csv = [
  "vertical,offerId,title,unitPriceUsdMinor,supplierFormality,brand,oem,qualityTier",
  "spare,off_p4sb_formal,P4 Sandbox Formal Filter,2100,formal,Bosch,P4-OEM,OES",
  "spare,off_p4sb_informal,P4 Sandbox Informal Wiper,900,informal,Local,P4-WIP,OES",
].join("\n");

const ingested = ingestCatalogueCsv(csv);
const formalReview = ingested.reviews.find(
  (r) => r.draft?.supplierFormality === "formal",
);
if (!formalReview?.draft) {
  console.log(JSON.stringify({ ok: false, error: "formal_review_missing" }));
  process.exit(1);
}

approveCatalogueReview(formalReview.reviewId);
const draft = formalReview.draft;

const out = await publishFactoryOfferViaIndexer({
  batchId: formalReview.batchId,
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

const search = await searchSpareOfferDocuments({
  q: "P4 Sandbox Formal",
  filter: 'offerSource = "MARKETPLACE"',
  limit: 5,
});

const b2bHits = searchOffers("P4 Sandbox", { sessionRole: "b2b" });
const leaks =
  countInformalB2bLeaks() +
  b2bHits.filter((h) => h.supplierFormality === "informal").length;

const ok =
  out.publishTaskUid !== "fixture" && leaks === 0 && search.hits.length >= 1;

console.log(
  JSON.stringify({
    ok,
    publishTaskUid: out.publishTaskUid,
    offerId: out.doc.id,
    searchHits: search.hits.length,
    searchSource: search.source,
    b2bLeaks: leaks,
    indexerJobs: out.indexerResults.length,
    not_G4: true,
  }),
);

process.exit(ok ? 0 : 1);
