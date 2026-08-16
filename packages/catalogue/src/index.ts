/**
 * Catalogue + Meili search (E2a cart + Pack §15 T2 / PD2).
 * USD browse/cart only (D-57). Agency marketplace only (D-58). B2B hides informal (D-49).
 * Fixture: in-memory SoR. Sandbox/live: Meili HTTP (fail closed without MEILI_*).
 */
import { type Money, money } from "@dial/shared";
import {
  type OfferSource,
  type SpareOfferDocument,
  type SupplierFormality,
} from "./meiliSettings.js";
import { integrationMode } from "./meiliClient.js";

export type { OfferSource, SpareOfferDocument, SupplierFormality };
export {
  MEILI_SPARE_OFFERS_V1_SETTINGS,
  MEILI_SPARE_INDEX_DEFAULT,
} from "./meiliSettings.js";

export type SearchSessionRole = "b2c" | "b2b";

/** Pack §9.2 PDP — availability *state*, never raw qty. */
export type OfferAvailability = "available" | "confirm_required" | "sourcing";

export type StubOffer = {
  offerId: string;
  title: string;
  /** Display + payable line in USD minor (browse/cart). */
  unitPriceUsdMinor: bigint;
  qualityTier: "OEM" | "OES" | "Aftermarket";
  offerSource: OfferSource;
  supplierFormality: SupplierFormality;
  oem: string;
  brand: string;
  /** Pack §9.2 — display state (defaults available). */
  availability?: OfferAvailability;
  /** Pack §9.2 — 0..1 fitment confidence for PDP / search hit. */
  fitmentConfidence?: number;
};

export type SparePdpAttrs = {
  offerId: string;
  title: string;
  qualityTier: StubOffer["qualityTier"];
  availability: OfferAvailability;
  fitmentConfidence: number;
  /** Never expose raw stock qty on PDP (Pack §9.2). */
  rawQtyExposed: false;
  soldBy: string;
  currency: "USD";
  unitPriceUsdMinor: string;
  payableFromAi: false;
};

export function resolveOfferAvailability(o: StubOffer): OfferAvailability {
  return o.availability ?? "available";
}

export function resolveFitmentConfidence(o: StubOffer): number {
  const n = o.fitmentConfidence ?? 0.8;
  if (n < 0 || n > 1) return 0.8;
  return n;
}

/** PD91 — Pack §9.2 PDP attrs (fitment / quality / availability state). */
export function getOfferPdpAttrs(offerId: string): SparePdpAttrs | undefined {
  const o = getOffer(offerId);
  if (!o) return undefined;
  return {
    offerId: o.offerId,
    title: o.title,
    qualityTier: o.qualityTier,
    availability: resolveOfferAvailability(o),
    fitmentConfidence: resolveFitmentConfidence(o),
    rawQtyExposed: false,
    soldBy: `${o.brand} Agency`,
    currency: "USD",
    unitPriceUsdMinor: o.unitPriceUsdMinor.toString(),
    payableFromAi: false,
  };
}

/**
 * PD91 thin vertical: search/PDP expose fitment + qualityTier + availability (not qty).
 */
export function runPd91SparePdpAttrsThinVertical(): {
  offerId: string;
  qualityTier: StubOffer["qualityTier"];
  availability: OfferAvailability;
  fitmentConfidence: number;
  rawQtyExposed: false;
  payableFromAi: false;
} {
  __resetCatalogueForTests();
  const hit = searchOffers("oil")[0];
  if (!hit) throw new Error("PD91 expected oil filter hit");
  const pdp = getOfferPdpAttrs(hit.offerId);
  if (!pdp) throw new Error("PD91 PDP attrs missing");
  if (pdp.rawQtyExposed !== false) {
    throw new Error("PD91 must not expose raw qty");
  }
  if (!pdp.qualityTier || !pdp.availability) {
    throw new Error("PD91 qualityTier + availability required");
  }
  return {
    offerId: pdp.offerId,
    qualityTier: pdp.qualityTier,
    availability: pdp.availability,
    fitmentConfidence: pdp.fitmentConfidence,
    rawQtyExposed: false,
    payableFromAi: false,
  };
}

export type CartLine = {
  offerId: string;
  title: string;
  qty: number;
  unitPrice: Money;
  lineTotal: Money;
  /** Agency disclosure — Sold by {Supplier} (D-58). */
  soldBy: string;
  supplierFormality: SupplierFormality;
};

export type Cart = {
  id: string;
  currency: "USD";
  lines: CartLine[];
  total: Money;
};

export type CatalogueIngestBatch = {
  batchId: string;
  status: "pending_review" | "approved" | "rejected" | "published";
  rowCount: number;
  createdAt: string;
  /** Set after human approve + explicit publish to Meili stub index. */
  publishedOfferId?: string;
  vertical?: "spare" | "grocery";
};

export type CatalogueDraftOffer = {
  vertical: "spare" | "grocery";
  offerId: string;
  title: string;
  unitPriceUsdMinor: bigint;
  offerSource: OfferSource;
  supplierFormality: SupplierFormality;
  brand: string;
  /** Spare fields */
  qualityTier?: "OEM" | "OES" | "Aftermarket";
  oem?: string;
  /** Grocery fields */
  unitLabel?: string;
  coldChain?: "ambient" | "chilled" | "frozen" | "fragile";
  ageGateRequired: false;
  /** Locked — AI never writes payable amounts into Factory drafts. */
  payableFromAi: false;
};

export type CatalogueReviewItem = {
  reviewId: string;
  batchId: string;
  offerId: string;
  status: "queued" | "claimed" | "approved" | "rejected";
  vertical: "spare" | "grocery";
  draft?: CatalogueDraftOffer;
  /** PD64 — ops claim before resolve (Pack §10 admin queues). */
  claimedBy?: string;
  claimedAt?: string;
};

export type SearchNoResultEvent = {
  eventId: string;
  query: string;
  sessionRole: SearchSessionRole;
  /** PD54 — spare vs grocery demand-gap rollup. */
  vertical: "spare" | "grocery";
  createdAt: string;
};

const OFFER_SEED: StubOffer[] = [
  {
    offerId: "off_filter_oil_kun26",
    title: "Oil filter (KUN26)",
    unitPriceUsdMinor: 12_00n,
    qualityTier: "OES",
    offerSource: "MARKETPLACE",
    supplierFormality: "formal",
    oem: "KUN26-FILTER",
    brand: "Toyota",
    availability: "available",
    fitmentConfidence: 0.92,
  },
  {
    offerId: "off_pad_front_zre152",
    title: "Front brake pads (ZRE152)",
    unitPriceUsdMinor: 45_00n,
    qualityTier: "Aftermarket",
    offerSource: "MARKETPLACE",
    supplierFormality: "formal",
    oem: "ZRE152-PAD-F",
    brand: "Akebono",
    availability: "confirm_required",
    fitmentConfidence: 0.75,
  },
  {
    offerId: "off_wiper_informal_01",
    title: "Wiper blade (informal stock)",
    unitPriceUsdMinor: 8_00n,
    qualityTier: "Aftermarket",
    offerSource: "MARKETPLACE",
    supplierFormality: "informal",
    oem: "WIPER-UNI",
    brand: "Local",
    availability: "sourcing",
    fitmentConfidence: 0.55,
  },
];

const OFFERS: StubOffer[] = [...OFFER_SEED];

/** globalThis — Next RSC vs server-action bundles must share the same cart Map. */
function cartsStore(): Map<string, Cart> {
  const g = globalThis as typeof globalThis & {
    __dialCatalogueCarts?: Map<string, Cart>;
  };
  if (!g.__dialCatalogueCarts) g.__dialCatalogueCarts = new Map();
  return g.__dialCatalogueCarts;
}
function ingestBatchesStore(): Map<string, CatalogueIngestBatch> {
  const g = globalThis as typeof globalThis & {
    __dialCatalogueIngest?: Map<string, CatalogueIngestBatch>;
  };
  if (!g.__dialCatalogueIngest) g.__dialCatalogueIngest = new Map();
  return g.__dialCatalogueIngest;
}
function reviewQueueStore(): CatalogueReviewItem[] {
  const g = globalThis as typeof globalThis & {
    __dialCatalogueReview?: CatalogueReviewItem[];
  };
  if (!g.__dialCatalogueReview) g.__dialCatalogueReview = [];
  return g.__dialCatalogueReview;
}
function searchNoResultEventsStore(): SearchNoResultEvent[] {
  const g = globalThis as typeof globalThis & {
    __dialSearchNoResult?: SearchNoResultEvent[];
  };
  if (!g.__dialSearchNoResult) g.__dialSearchNoResult = [];
  return g.__dialSearchNoResult;
}

import { chassisCodesForOffer } from "./dualEntry.js";

function toMeiliDoc(offer: StubOffer): SpareOfferDocument {
  return {
    id: offer.offerId,
    masterProductId: `mp_${offer.offerId}`,
    oem: offer.oem,
    normalisedOem: offer.oem.replace(/[^a-zA-Z0-9]/g, "").toUpperCase(),
    description: offer.title,
    brand: offer.brand,
    qualityTier: offer.qualityTier,
    availability: resolveOfferAvailability(offer),
    chassis_codes: chassisCodesForOffer(offer),
    engine_codes: [],
    categoryPath: categoryPathForOffer(offer),
    priceMinor: Number(offer.unitPriceUsdMinor),
    currency: "USD",
    warrantyDays: 90,
    deliveryBandId: "harare_metro",
    fitmentConfidence: resolveFitmentConfidence(offer),
    stockValidUntil: Date.now() + 86_400_000,
    hasRestrictedSku: false,
    offerSource: offer.offerSource,
    supplierFormality: offer.supplierFormality,
  };
}

export function listMeiliStubDocuments(): SpareOfferDocument[] {
  return OFFERS.filter((o) => o.offerSource === "MARKETPLACE").map(toMeiliDoc);
}

export function meiliFilterForSession(role: SearchSessionRole): string {
  // D-58: agency marketplace only — never DIAL_OWNED
  const base = 'offerSource = "MARKETPLACE"';
  if (role === "b2b") {
    // D-49: B2B must not see informal
    return `${base} AND supplierFormality = "formal"`;
  }
  return base;
}

export function searchOffers(
  query: string,
  opts?: { sessionRole?: SearchSessionRole },
): StubOffer[] {
  const role = opts?.sessionRole ?? "b2c";
  const q = query.trim().toLowerCase();
  let hits = OFFERS.filter((o) => o.offerSource === "MARKETPLACE");
  if (role === "b2b") {
    hits = hits.filter((o) => o.supplierFormality === "formal");
  }
  if (q) {
    hits = hits.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.offerId.toLowerCase().includes(q) ||
        o.oem.toLowerCase().includes(q),
    );
  }
  if (q && hits.length === 0) {
    recordSearchNoResult(q, role);
  }
  return hits;
}

export type SpareFacetFilters = {
  brand?: string;
  qualityTier?: StubOffer["qualityTier"];
  availability?: OfferAvailability;
  chassis?: string;
  /** Pack §9.2 collection / categoryPath leaf */
  collection?: string;
};

export type SpareCollection = {
  id: string;
  title: string;
  count: number;
};

function categoryPathForOffer(offer: StubOffer): string[] {
  const t = offer.title.toLowerCase();
  if (t.includes("filter") || offer.offerId.includes("filter")) {
    return ["spares", "filters"];
  }
  if (t.includes("pad") || t.includes("brake")) {
    return ["spares", "brakes"];
  }
  if (t.includes("wiper")) {
    return ["spares", "wipers"];
  }
  return ["spares"];
}

/** PD95 — Pack §9.2 home collections from categoryPath (fixture). */
export function listSpareCollections(
  sessionRole: SearchSessionRole = "b2c",
): SpareCollection[] {
  const counts = new Map<string, number>();
  for (const o of searchOffers("", { sessionRole })) {
    const path = categoryPathForOffer(o);
    const leaf = path[path.length - 1] ?? "spares";
    counts.set(leaf, (counts.get(leaf) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([id, count]) => ({
      id,
      title: id.charAt(0).toUpperCase() + id.slice(1),
      count,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * PD95 — Pack §9.2 search + Meili-style facets (fixture filter on seed attrs).
 */
export function searchOffersWithFacets(
  query: string,
  opts?: {
    sessionRole?: SearchSessionRole;
    facets?: SpareFacetFilters;
  },
): {
  hits: StubOffer[];
  facetsApplied: SpareFacetFilters;
  collections: SpareCollection[];
  payableFromAi: false;
} {
  const role = opts?.sessionRole ?? "b2c";
  const facets = opts?.facets ?? {};
  let hits = searchOffers(query, { sessionRole: role });
  if (facets.brand) {
    const b = facets.brand.toLowerCase();
    hits = hits.filter((h) => h.brand.toLowerCase() === b);
  }
  if (facets.qualityTier) {
    hits = hits.filter((h) => h.qualityTier === facets.qualityTier);
  }
  if (facets.availability) {
    hits = hits.filter(
      (h) => resolveOfferAvailability(h) === facets.availability,
    );
  }
  if (facets.chassis?.trim()) {
    const c = facets.chassis.trim().toUpperCase();
    hits = hits.filter((h) =>
      chassisCodesForOffer(h).some((code) => code.toUpperCase().includes(c)),
    );
  }
  if (facets.collection?.trim()) {
    const col = facets.collection.trim().toLowerCase();
    hits = hits.filter((h) =>
      categoryPathForOffer(h).some((p) => p.toLowerCase() === col),
    );
  }
  return {
    hits,
    facetsApplied: { ...facets },
    collections: listSpareCollections(role),
    payableFromAi: false,
  };
}

/**
 * PD95 thin vertical: collections + facet filter (quality/availability/chassis).
 */
export function runPd95SpareFacetsCollectionsThinVertical(): {
  collectionCount: number;
  oesHits: number;
  availableHits: number;
  payableFromAi: false;
} {
  __resetCatalogueForTests();
  const collections = listSpareCollections("b2c");
  if (collections.length < 2) {
    throw new Error("PD95 expected multiple collections");
  }
  const oes = searchOffersWithFacets("", {
    sessionRole: "b2c",
    facets: { qualityTier: "OES" },
  });
  if (oes.hits.length < 1 || oes.hits.some((h) => h.qualityTier !== "OES")) {
    throw new Error("PD95 OES facet failed");
  }
  const avail = searchOffersWithFacets("", {
    sessionRole: "b2c",
    facets: { availability: "available" },
  });
  if (
    avail.hits.some((h) => resolveOfferAvailability(h) !== "available")
  ) {
    throw new Error("PD95 availability facet failed");
  }
  return {
    collectionCount: collections.length,
    oesHits: oes.hits.length,
    availableHits: avail.hits.length,
    payableFromAi: false,
  };
}

function stubOfferFromMeiliDoc(doc: SpareOfferDocument): StubOffer {
  const tier = doc.qualityTier;
  const qualityTier: StubOffer["qualityTier"] =
    tier === "OEM" || tier === "OES" || tier === "Aftermarket"
      ? tier
      : "Aftermarket";
  const availability: OfferAvailability =
    doc.availability === "confirm_required" || doc.availability === "sourcing"
      ? doc.availability
      : "available";
  return {
    offerId: doc.id,
    title: doc.description,
    unitPriceUsdMinor: BigInt(doc.priceMinor),
    qualityTier,
    offerSource: doc.offerSource,
    supplierFormality: doc.supplierFormality,
    oem: doc.oem,
    brand: doc.brand,
    availability,
    fitmentConfidence: doc.fitmentConfidence,
  };
}

/**
 * PD2 search path — fixture uses in-memory SoR; sandbox/live hits Meili with
 * `meiliFilterForSession` (D-49). Never trusts body role (caller passes session).
 */
export async function searchOffersAsync(
  query: string,
  opts?: { sessionRole?: SearchSessionRole; facets?: SpareFacetFilters },
): Promise<{
  hits: StubOffer[];
  source: "memory" | "meili";
  meiliFilter: string;
  indexUid: string;
  collections?: SpareCollection[];
  facetsApplied?: SpareFacetFilters;
}> {
  const role = opts?.sessionRole ?? "b2c";
  const filter = meiliFilterForSession(role);
  if (integrationMode() === "fixture") {
    const faceted = searchOffersWithFacets(query, {
      sessionRole: role,
      ...(opts?.facets ? { facets: opts.facets } : {}),
    });
    return {
      hits: faceted.hits,
      source: "memory",
      meiliFilter: filter,
      indexUid: process.env.MEILI_SPARE_INDEX?.trim() || "spare_offers_v1",
      collections: faceted.collections,
      facetsApplied: faceted.facetsApplied,
    };
  }
  const { searchSpareOfferDocuments, spareOffersIndexName } = await import(
    "./meiliClient.js"
  );
  const result = await searchSpareOfferDocuments({ q: query, filter });
  let hits = result.hits.map(stubOfferFromMeiliDoc);
  // Defense in depth: never return informal to B2B even if Meili misconfigured.
  if (role === "b2b") {
    hits = hits.filter((o) => o.supplierFormality === "formal");
  }
  if (query.trim() && hits.length === 0) {
    recordSearchNoResult(query.trim().toLowerCase(), role);
  }
  const f = opts?.facets;
  if (f?.brand) {
    const b = f.brand.toLowerCase();
    hits = hits.filter((h) => h.brand.toLowerCase() === b);
  }
  if (f?.qualityTier) {
    hits = hits.filter((h) => h.qualityTier === f.qualityTier);
  }
  if (f?.availability) {
    hits = hits.filter(
      (h) => resolveOfferAvailability(h) === f.availability,
    );
  }
  return {
    hits,
    source: "meili",
    meiliFilter: filter,
    indexUid: result.indexUid || spareOffersIndexName(),
    collections: listSpareCollections(role),
    facetsApplied: f ?? {},
  };
}

/** D-49 regression — B2B search must never return informal (leak count = 0). */
export function countInformalB2bLeaks(query = ""): number {
  return searchOffers(query, { sessionRole: "b2b" }).filter(
    (o) => o.supplierFormality === "informal",
  ).length;
}

/** Search readiness for /api/health — never echoes secrets. */
export function searchHealthSnapshot(): {
  meiliFilterB2b: string;
  informalB2bLeaks: number;
  marketplaceDocCount: number;
} {
  return {
    meiliFilterB2b: meiliFilterForSession("b2b"),
    informalB2bLeaks: countInformalB2bLeaks(),
    marketplaceDocCount: listMeiliStubDocuments().length,
  };
}

export function recordSearchNoResult(
  query: string,
  sessionRole: SearchSessionRole,
  vertical: "spare" | "grocery" = "spare",
): SearchNoResultEvent {
  const event: SearchNoResultEvent = {
    eventId: `snr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    query,
    sessionRole,
    vertical,
    createdAt: new Date().toISOString(),
  };
  searchNoResultEventsStore().push(event);
  return event;
}

export function listSearchNoResultEvents(filter?: {
  vertical?: "spare" | "grocery";
}): SearchNoResultEvent[] {
  return searchNoResultEventsStore()
    .filter((e) => (filter?.vertical ? e.vertical === filter.vertical : true))
    .map((e) => ({ ...e }));
}

/** Catalogue Factory ingest stub (D-53) — human review before publish. */
export function enqueueCatalogueIngest(rowCount: number): CatalogueIngestBatch {
  if (rowCount < 1) throw new Error("rowCount must be >= 1");
  const batch: CatalogueIngestBatch = {
    batchId: `cib_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    status: "pending_review",
    rowCount,
    createdAt: new Date().toISOString(),
    vertical: "spare",
  };
  ingestBatchesStore().set(batch.batchId, batch);
  const review: CatalogueReviewItem = {
    reviewId: `crq_${batch.batchId}`,
    batchId: batch.batchId,
    offerId: "pending",
    status: "queued",
    vertical: "spare",
  };
  reviewQueueStore().push(review);
  return { ...batch };
}

/**
 * PD15 CSV ingest — one review row per data line.
 * Columns: vertical,offerId,title,unitPriceUsdMinor,supplierFormality,brand[,oem,qualityTier|unitLabel,coldChain]
 * Rejects liquor / ageGate / DIAL_OWNED / float prices. AI never supplies payable amounts.
 */
export function ingestCatalogueCsv(csvText: string): {
  batches: CatalogueIngestBatch[];
  reviews: CatalogueReviewItem[];
  rejectedRows: Array<{ line: number; reason: string }>;
} {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));
  if (lines.length === 0) throw new Error("CSV empty");
  const header = lines[0]!.toLowerCase();
  const dataLines = header.includes("offerid") || header.includes("vertical")
    ? lines.slice(1)
    : lines;
  if (dataLines.length === 0) throw new Error("CSV has no data rows");

  const batches: CatalogueIngestBatch[] = [];
  const reviews: CatalogueReviewItem[] = [];
  const rejectedRows: Array<{ line: number; reason: string }> = [];

  dataLines.forEach((line, idx) => {
    const lineNo = idx + (header.includes("offerid") ? 2 : 1);
    try {
      const draft = parseCatalogueCsvRow(line);
      const batch: CatalogueIngestBatch = {
        batchId: `cib_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}_${idx}`,
        status: "pending_review",
        rowCount: 1,
        createdAt: new Date().toISOString(),
        vertical: draft.vertical,
      };
      ingestBatchesStore().set(batch.batchId, batch);
      const review: CatalogueReviewItem = {
        reviewId: `crq_${batch.batchId}`,
        batchId: batch.batchId,
        offerId: draft.offerId,
        status: "queued",
        vertical: draft.vertical,
        draft,
      };
      reviewQueueStore().push(review);
      batches.push({ ...batch });
      reviews.push({ ...review, draft: { ...draft } });
    } catch (e) {
      rejectedRows.push({
        line: lineNo,
        reason: e instanceof Error ? e.message : "invalid row",
      });
    }
  });

  if (batches.length === 0) {
    throw new Error(
      `No valid CSV rows (${rejectedRows.length} rejected) — liquor/DIAL_OWNED/floats blocked`,
    );
  }
  return { batches, reviews, rejectedRows };
}

function parseCatalogueCsvRow(line: string): CatalogueDraftOffer {
  const cols = line.split(",").map((c) => c.trim());
  if (cols.length < 6) {
    throw new Error("CSV row needs vertical,offerId,title,unitPriceUsdMinor,supplierFormality,brand");
  }
  const [verticalRaw, offerId, title, priceRaw, formalityRaw, brand, col6, col7] =
    cols;
  const vertical = (verticalRaw ?? "").toLowerCase();
  if (vertical === "liquor") {
    throw new Error("Liquor vertical forbidden until counsel gate");
  }
  if (vertical !== "spare" && vertical !== "grocery") {
    throw new Error("vertical must be spare|grocery");
  }
  if (!offerId || !title || !brand) throw new Error("offerId/title/brand required");
  if (/\.|e/i.test(priceRaw ?? "") && !/^\d+$/.test(priceRaw ?? "")) {
    throw new Error("unitPriceUsdMinor must be integer string (no float)");
  }
  const unitPriceUsdMinor = BigInt(priceRaw ?? "0");
  if (unitPriceUsdMinor <= 0n) throw new Error("unitPriceUsdMinor must be positive");
  const supplierFormality = (formalityRaw ?? "").toLowerCase();
  if (supplierFormality !== "formal" && supplierFormality !== "informal") {
    throw new Error("supplierFormality must be formal|informal");
  }

  if (vertical === "spare") {
    const qualityTier = (col7 ?? "OES") as "OEM" | "OES" | "Aftermarket";
    if (!["OEM", "OES", "Aftermarket"].includes(qualityTier)) {
      throw new Error("qualityTier must be OEM|OES|Aftermarket");
    }
    return {
      vertical: "spare",
      offerId,
      title,
      unitPriceUsdMinor,
      offerSource: "MARKETPLACE",
      supplierFormality,
      brand,
      oem: col6 || offerId,
      qualityTier,
      ageGateRequired: false,
      payableFromAi: false,
    };
  }

  const coldChain = (col7 ?? "ambient") as
    | "ambient"
    | "chilled"
    | "frozen"
    | "fragile";
  if (!["ambient", "chilled", "frozen", "fragile"].includes(coldChain)) {
    throw new Error("coldChain invalid");
  }
  return {
    vertical: "grocery",
    offerId,
    title,
    unitPriceUsdMinor,
    offerSource: "MARKETPLACE",
    supplierFormality,
    brand,
    unitLabel: col6 || "each",
    coldChain,
    ageGateRequired: false,
    payableFromAi: false,
  };
}

/** Demand-gap KPIs for Catalogue Factory admin (D-53). */
export function getDemandGapSnapshot(filter?: {
  vertical?: "spare" | "grocery";
}): {
  noResultCount: number;
  topQueries: Array<{ query: string; count: number }>;
  informalB2bLeaks: number;
  pendingReview: number;
  approvedAwaitingPublish: number;
  vertical: "spare" | "grocery" | "all";
} {
  const events = filter?.vertical
    ? searchNoResultEventsStore().filter((e) => e.vertical === filter.vertical)
    : searchNoResultEventsStore();
  const counts = new Map<string, number>();
  for (const e of events) {
    counts.set(e.query, (counts.get(e.query) ?? 0) + 1);
  }
  const topQueries = [...counts.entries()]
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  return {
    noResultCount: events.length,
    topQueries,
    informalB2bLeaks: countInformalB2bLeaks() /* spare; grocery checked in PD15 runner */,
    pendingReview: reviewQueueStore().filter(
      (r) =>
        (r.status === "queued" || r.status === "claimed") &&
        (filter?.vertical ? r.vertical === filter.vertical : true),
    ).length,
    approvedAwaitingPublish: reviewQueueStore().filter(
      (r) =>
        r.status === "approved" &&
        (filter?.vertical ? r.vertical === filter.vertical : true) &&
        ingestBatchesStore().get(r.batchId)?.status === "approved",
    ).length,
    vertical: filter?.vertical ?? "all",
  };
}

/** PD54 — grocery-only Meili demand-gap admin snapshot. */
export function getGroceryDemandGapSnapshot(): ReturnType<
  typeof getDemandGapSnapshot
> & { liquorAllowed: false; payableFromAi: false } {
  return {
    ...getDemandGapSnapshot({ vertical: "grocery" }),
    liquorAllowed: false,
    payableFromAi: false,
  };
}

/**
 * PD54 thin vertical: grocery no-result events → demand-gap admin snapshot.
 * Food only; liquorAllowed=false; no AI money.
 */
export function runPd54GroceryDemandGapThinVertical(): {
  noResultCount: number;
  topQuery: string;
  liquorAllowed: false;
  payableFromAi: false;
  vertical: "grocery";
} {
  __resetCatalogueForTests();
  recordSearchNoResult("exotic quinoa missing", "b2c", "grocery");
  recordSearchNoResult("exotic quinoa missing", "b2c", "grocery");
  recordSearchNoResult("frozen dragonfruit", "b2b", "grocery");
  // spare noise must not pollute grocery gap
  recordSearchNoResult("spare-only-noise", "b2c", "spare");
  const gap = getGroceryDemandGapSnapshot();
  if (gap.noResultCount !== 3) {
    throw new Error(`PD54 expected 3 grocery no-results, got ${gap.noResultCount}`);
  }
  if (gap.topQueries[0]?.query !== "exotic quinoa missing") {
    throw new Error("PD54 expected top grocery demand query");
  }
  if (gap.liquorAllowed !== false || gap.payableFromAi !== false) {
    throw new Error("PD54 locks failed");
  }
  return {
    noResultCount: gap.noResultCount,
    topQuery: gap.topQueries[0]!.query,
    liquorAllowed: false,
    payableFromAi: false,
    vertical: "grocery",
  };
}

function cloneReviewItem(r: CatalogueReviewItem): CatalogueReviewItem {
  return {
    reviewId: r.reviewId,
    batchId: r.batchId,
    offerId: r.offerId,
    status: r.status,
    vertical: r.vertical,
    ...(r.draft ? { draft: { ...r.draft } } : {}),
    ...(r.claimedBy ? { claimedBy: r.claimedBy } : {}),
    ...(r.claimedAt ? { claimedAt: r.claimedAt } : {}),
  };
}

export function listCatalogueReviewQueue(): CatalogueReviewItem[] {
  return reviewQueueStore().map(cloneReviewItem);
}

/** PD66 — pending_review items only (queued|claimed) for admin claim queue. */
export function listPendingReviewItems(): CatalogueReviewItem[] {
  return listCatalogueReviewQueue().filter(
    (r) => r.status === "queued" || r.status === "claimed",
  );
}

/**
 * PD66 thin vertical: multi-item pending queue → claim one → pending still lists claimed.
 */
export function runPd66PendingReviewQueueThinVertical(): {
  pendingCount: number;
  claimedVisible: true;
  resolvedClearsPending: true;
  payableFromAi: false;
} {
  __resetCatalogueForTests();
  enqueueCatalogueIngest(1);
  enqueueCatalogueIngest(1);
  const pending = listPendingReviewItems();
  if (pending.length < 2) throw new Error("PD66 expected 2+ pending");
  const first = pending[0]!;
  claimCatalogueReview({ reviewId: first.reviewId, claimedBy: "ops_pd66" });
  const afterClaim = listPendingReviewItems();
  if (!afterClaim.some((r) => r.reviewId === first.reviewId && r.status === "claimed")) {
    throw new Error("PD66 claimed item must remain on pending queue");
  }
  for (const item of afterClaim) {
    approveCatalogueReview(item.reviewId);
  }
  if (listPendingReviewItems().length !== 0) {
    throw new Error("PD66 pending must clear after resolve");
  }
  return {
    pendingCount: pending.length,
    claimedVisible: true,
    resolvedClearsPending: true,
    payableFromAi: false,
  };
}

export function getCatalogueIngestBatch(
  batchId: string,
): CatalogueIngestBatch | undefined {
  const batch = ingestBatchesStore().get(batchId);
  return batch ? { ...batch } : undefined;
}

/**
 * PD64 — claim a pending_review item (Pack §10 list/claim/resolve).
 */
export function claimCatalogueReview(input: {
  reviewId: string;
  claimedBy: string;
}): CatalogueReviewItem {
  if (!input.claimedBy.trim()) throw new Error("claimedBy required");
  const item = reviewQueueStore().find((r) => r.reviewId === input.reviewId);
  if (!item) throw new Error(`Unknown review ${input.reviewId}`);
  if (item.status !== "queued") {
    throw new Error(`Review ${input.reviewId} is already ${item.status}`);
  }
  item.status = "claimed";
  item.claimedBy = input.claimedBy.trim();
  item.claimedAt = new Date().toISOString();
  return cloneReviewItem(item);
}

/**
 * Human approve only (D-53 / D-54) — never auto-publish from AI.
 * Marks review + batch approved; publish to Meili stub is a separate step.
 * Accepts queued (legacy PD15) or claimed (PD64).
 */
export function approveCatalogueReview(reviewId: string): CatalogueReviewItem {
  const item = reviewQueueStore().find((r) => r.reviewId === reviewId);
  if (!item) throw new Error(`Unknown review ${reviewId}`);
  if (item.status !== "queued" && item.status !== "claimed") {
    throw new Error(`Review ${reviewId} is already ${item.status}`);
  }
  item.status = "approved";
  const batch = ingestBatchesStore().get(item.batchId);
  if (batch) batch.status = "approved";
  return cloneReviewItem(item);
}

export function rejectCatalogueReview(reviewId: string): CatalogueReviewItem {
  const item = reviewQueueStore().find((r) => r.reviewId === reviewId);
  if (!item) throw new Error(`Unknown review ${reviewId}`);
  if (item.status !== "queued" && item.status !== "claimed") {
    throw new Error(`Review ${reviewId} is already ${item.status}`);
  }
  item.status = "rejected";
  const batch = ingestBatchesStore().get(item.batchId);
  if (batch) batch.status = "rejected";
  return cloneReviewItem(item);
}

/**
 * PD64 thin vertical: enqueue → claim → approve (resolve).
 */
export function runPd64CatalogueClaimResolveThinVertical(): {
  claimedThenApproved: true;
  claimedBy: string;
  payableFromAi: false;
  liquorAllowed: false;
} {
  __resetCatalogueForTests();
  const batch = enqueueCatalogueIngest(1);
  const queued = listCatalogueReviewQueue().find((r) => r.batchId === batch.batchId);
  if (!queued || queued.status !== "queued") {
    throw new Error("PD64 expected queued review");
  }
  const claimed = claimCatalogueReview({
    reviewId: queued.reviewId,
    claimedBy: "ops_pd64",
  });
  if (claimed.status !== "claimed" || claimed.claimedBy !== "ops_pd64") {
    throw new Error("PD64 claim failed");
  }
  const approved = approveCatalogueReview(claimed.reviewId);
  if (approved.status !== "approved") {
    throw new Error("PD64 resolve approve failed");
  }
  return {
    claimedThenApproved: true,
    claimedBy: "ops_pd64",
    payableFromAi: false,
    liquorAllowed: false,
  };
}

/**
 * E5a / PD2: after human approve, publish one SKU into memory + Meili upsert.
 * Never publishes informal to B2B search (D-49). Fixture upsert is no-op HTTP.
 */
export function publishApprovedBatchToMeiliStub(input: {
  batchId: string;
  offer: StubOffer;
}): SpareOfferDocument {
  const batch = ingestBatchesStore().get(input.batchId);
  if (!batch) throw new Error(`Unknown batch ${input.batchId}`);
  if (batch.status !== "approved") {
    throw new Error("Batch must be human-approved before Meili publish");
  }
  if (input.offer.offerSource !== "MARKETPLACE") {
    throw new Error("DIAL_OWNED forbidden (D-58)");
  }
  OFFERS.push(input.offer);
  batch.status = "published";
  batch.publishedOfferId = input.offer.offerId;
  const review = reviewQueueStore().find((r) => r.batchId === input.batchId);
  if (review) review.offerId = input.offer.offerId;
  return toMeiliDoc(input.offer);
}

/**
 * PD2 publish path — memory publish then ensure index + upsert documents.
 * Sandbox/live fail closed without MEILI_* (via upsertSpareOfferDocuments).
 */
export async function publishApprovedBatchToMeili(input: {
  batchId: string;
  offer: StubOffer;
}): Promise<{
  doc: SpareOfferDocument;
  taskUid: string | "fixture";
  indexUid: string;
}> {
  const doc = publishApprovedBatchToMeiliStub(input);
  const { ensureSpareOffersIndex, upsertSpareOfferDocuments } = await import(
    "./meiliClient.js"
  );
  const ensured = await ensureSpareOffersIndex();
  const upsert = await upsertSpareOfferDocuments([doc]);
  return {
    doc,
    taskUid: upsert.taskUid,
    indexUid: upsert.indexUid || ensured.indexUid,
  };
}

/** Build StubOffer from durable REST draft JSON (Phase 4 sandbox publish). */
export function stubOfferFromRestDraft(draft: {
  offerId: string;
  title: string;
  unitPriceUsdMinor: bigint | string | number;
  supplierFormality: SupplierFormality;
  brand: string;
  oem?: string;
  qualityTier?: StubOffer["qualityTier"];
  offerSource?: OfferSource;
}): StubOffer {
  if (draft.offerSource && draft.offerSource !== "MARKETPLACE") {
    throw new Error("DIAL_OWNED forbidden on REST publish (D-58)");
  }
  return {
    offerId: draft.offerId,
    title: draft.title,
    unitPriceUsdMinor: BigInt(String(draft.unitPriceUsdMinor)),
    qualityTier: draft.qualityTier ?? "OES",
    offerSource: "MARKETPLACE",
    supplierFormality: draft.supplierFormality,
    oem: draft.oem ?? draft.offerId,
    brand: draft.brand,
  };
}

/**
 * Phase 4 durable REST path — upsert approved offer to Meili without in-memory batch SoR.
 * Caller must verify review.status === approved in Postgres before invoke.
 */
export async function publishStubOfferDirectToMeili(offer: StubOffer): Promise<{
  doc: SpareOfferDocument;
  taskUid: string | "fixture";
  indexUid: string;
}> {
  if (offer.offerSource !== "MARKETPLACE") {
    throw new Error("DIAL_OWNED forbidden (D-58)");
  }
  const doc = toMeiliDoc(offer);
  const { ensureSpareOffersIndex, upsertSpareOfferDocuments } = await import(
    "./meiliClient.js"
  );
  const ensured = await ensureSpareOffersIndex();
  const upsert = await upsertSpareOfferDocuments([doc]);
  return {
    doc,
    taskUid: upsert.taskUid,
    indexUid: upsert.indexUid || ensured.indexUid,
  };
}

/**
 * PD15 grocery publish — human-approved draft → grocery store + Meili grocery index.
 * Rejects liquor/ageGate/DIAL_OWNED. Never auto-publish.
 */
export async function publishApprovedGroceryToMeili(input: {
  batchId: string;
  draft?: CatalogueDraftOffer;
}): Promise<{
  offerId: string;
  taskUid: string | "fixture";
  indexUid: string;
}> {
  const batch = ingestBatchesStore().get(input.batchId);
  if (!batch) throw new Error(`Unknown batch ${input.batchId}`);
  if (batch.status !== "approved") {
    throw new Error("Batch must be human-approved before Meili publish");
  }
  const review = reviewQueueStore().find((r) => r.batchId === input.batchId);
  const draft = input.draft ?? review?.draft;
  if (!draft || draft.vertical !== "grocery") {
    throw new Error("Grocery draft required for grocery publish");
  }
  if (draft.payableFromAi !== false) {
    throw new Error("AI payable drafts forbidden in Catalogue Factory");
  }
  if (draft.ageGateRequired !== false) {
    throw new Error("Liquor/age-gate SKUs blocked (counsel gate)");
  }
  if (draft.offerSource !== "MARKETPLACE") {
    throw new Error("DIAL_OWNED forbidden (D-58)");
  }

  const grocery = await import("./grocery.js");
  grocery.assertGroceryPublishAllowed({
    offerSource: draft.offerSource,
    vertical: "grocery",
    ageGateRequired: draft.ageGateRequired,
  });

  const offer = grocery.publishGroceryOfferFromFactory({
    offerId: draft.offerId,
    title: draft.title,
    brand: draft.brand,
    unitPriceUsdMinor: draft.unitPriceUsdMinor,
    unitLabel: draft.unitLabel ?? "each",
    coldChain: draft.coldChain ?? "ambient",
    supplierFormality: draft.supplierFormality,
    supplierDisplayName: `${draft.brand} Agency`,
  });

  batch.status = "published";
  batch.publishedOfferId = offer.offerId;
  batch.vertical = "grocery";
  if (review) review.offerId = offer.offerId;

  const { ensureGroceryOffersIndex, upsertGroceryOfferDocuments } = await import(
    "./meiliClient.js"
  );
  const ensured = await ensureGroceryOffersIndex();
  const docs = grocery
    .listGroceryMeiliDocuments()
    .filter((d) => d.id === offer.offerId);
  const upsert = await upsertGroceryOfferDocuments(docs);
  return {
    offerId: offer.offerId,
    taskUid: upsert.taskUid,
    indexUid: upsert.indexUid || ensured.indexUid,
  };
}

/**
 * PD15 thin vertical: CSV ingest → human approve → Meili spare+grocery → demand-gap.
 * No AI payable; no liquor; no auto-publish; B2B informal leak=0.
 */
export async function runPd15CatalogueFactoryThinVertical(): Promise<{
  spareOfferId: string;
  groceryOfferId: string;
  spareIndex: string;
  groceryIndex: string;
  demandGap: ReturnType<typeof getDemandGapSnapshot>;
  informalB2bLeaks: number;
  autoPublishForbidden: true;
  payableFromAi: false;
}> {
  __resetCatalogueForTests();
  const { __resetGroceryForTests } = await import("./grocery.js");
  __resetGroceryForTests();

  searchOffers("pd15-missing-gap-query", { sessionRole: "b2c" });

  const csv = [
    "vertical,offerId,title,unitPriceUsdMinor,supplierFormality,brand,oem,qualityTier",
    "spare,off_pd15_formal,PD15 Factory Spare,3300,formal,Bosch,PD15-OEM,OES",
    "grocery,groc_pd15_oats,PD15 Rolled oats 1kg,450,formal,Dairibord,1kg,ambient",
    "liquor,groc_beer,Blocked beer,999,formal,Brand,750ml,ambient",
  ].join("\n");

  const ingested = ingestCatalogueCsv(csv);
  assertTrue(ingested.rejectedRows.length >= 1, "liquor row must be rejected");
  assertTrue(ingested.batches.length === 2, "spare+grocery batches");

  for (const review of ingested.reviews) {
    if (review.draft?.payableFromAi !== false) {
      throw new Error("Factory drafts must set payableFromAi=false");
    }
    approveCatalogueReview(review.reviewId);
  }

  const spareReview = ingested.reviews.find((r) => r.vertical === "spare")!;
  const spareDraft = spareReview.draft!;
  const sparePub = await publishApprovedBatchToMeili({
    batchId: spareReview.batchId,
    offer: {
      offerId: spareDraft.offerId,
      title: spareDraft.title,
      unitPriceUsdMinor: spareDraft.unitPriceUsdMinor,
      qualityTier: spareDraft.qualityTier ?? "OES",
      offerSource: "MARKETPLACE",
      supplierFormality: spareDraft.supplierFormality,
      oem: spareDraft.oem ?? spareDraft.offerId,
      brand: spareDraft.brand,
      availability: "available",
      fitmentConfidence: 0.8,
    },
  });

  const groceryReview = ingested.reviews.find((r) => r.vertical === "grocery")!;
  const groceryPub = await publishApprovedGroceryToMeili({
    batchId: groceryReview.batchId,
  });

  const leaks =
    countInformalB2bLeaks() +
    (await import("./grocery.js")).countGroceryInformalB2bLeaks();
  const demandGap = getDemandGapSnapshot();
  if (demandGap.noResultCount < 1) {
    throw new Error("PD15 expected demand-gap from no-result search");
  }
  if (leaks !== 0) {
    throw new Error(`B2B informal leak must be 0, got ${leaks}`);
  }

  return {
    spareOfferId: sparePub.doc.id,
    groceryOfferId: groceryPub.offerId,
    spareIndex: sparePub.indexUid,
    groceryIndex: groceryPub.indexUid,
    demandGap,
    informalB2bLeaks: leaks,
    autoPublishForbidden: true,
    payableFromAi: false,
  };
}

function assertTrue(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

export function createCart(): Cart {
  const cart: Cart = {
    id: `cart_${Date.now().toString(36)}`,
    currency: "USD",
    lines: [],
    total: money(0n, "USD"),
  };
  cartsStore().set(cart.id, cart);
  return cart;
}

export function getCart(cartId: string): Cart | undefined {
  return cartsStore().get(cartId);
}

/** Lookup marketplace offer by id (PD5 Android + spare checkout API). */
export function getOffer(offerId: string): StubOffer | undefined {
  const o = OFFERS.find((x) => x.offerId === offerId);
  return o ? { ...o } : undefined;
}

export function addToCart(cartId: string, offerId: string, qty = 1): Cart {
  const cart = cartsStore().get(cartId);
  if (!cart) throw new Error(`Unknown cart ${cartId}`);
  if (qty < 1) throw new Error("qty must be >= 1");
  const offer = OFFERS.find((o) => o.offerId === offerId);
  if (!offer) throw new Error(`Unknown offer ${offerId}`);
  if (offer.offerSource !== "MARKETPLACE") {
    throw new Error("DIAL_OWNED / non-marketplace offers forbidden (D-58)");
  }

  const existing = cart.lines.find((l) => l.offerId === offerId);
  const soldBy = `${offer.brand} Agency`;
  if (existing) {
    existing.qty += qty;
    existing.lineTotal = money(
      existing.unitPrice.amountMinor * BigInt(existing.qty),
      "USD",
    );
  } else {
    const unit = money(offer.unitPriceUsdMinor, "USD");
    cart.lines.push({
      offerId: offer.offerId,
      title: offer.title,
      qty,
      unitPrice: unit,
      lineTotal: money(offer.unitPriceUsdMinor * BigInt(qty), "USD"),
      soldBy,
      supplierFormality: offer.supplierFormality,
    });
  }

  cart.total = money(
    cart.lines.reduce((s, l) => s + l.lineTotal.amountMinor, 0n),
    "USD",
  );
  /** D-57: cart currency is always USD — never attach ZiG here. */
  cart.currency = "USD";
  return cart;
}

export function __resetCatalogueForTests(): void {
  cartsStore().clear();
  ingestBatchesStore().clear();
  const review = reviewQueueStore();
  review.splice(0, review.length);
  const noHits = searchNoResultEventsStore();
  noHits.splice(0, noHits.length);
  OFFERS.length = 0;
  OFFERS.push(...OFFER_SEED);
}

export {
  ensureSpareOffersIndex,
  ensureGroceryOffersIndex,
  groceryOffersIndexName,
  pingMeiliHealth,
  searchSpareOfferDocuments,
  spareOffersIndexName,
  upsertSpareOfferDocuments,
  upsertGroceryOfferDocuments,
  integrationMode as meiliIntegrationMode,
} from "./meiliClient.js";

export { runPd55AdminOrdersThinVertical } from "./adminOrders.js";

export {
  MEILI_GROCERY_INDEX_DEFAULT,
  MEILI_GROCERY_OFFERS_V1_SETTINGS,
  __resetGroceryForTests,
  addToGroceryCart,
  advanceGroceryOrderStatus,
  assertGroceryPublishAllowed,
  countGroceryInformalB2bLeaks,
  createGroceryCart,
  getGroceryCart,
  getGroceryDeliverySlot,
  getGroceryOffer,
  getGroceryOrder,
  getGroceryOrderDurable,
  groceryMeiliFilterForSession,
  listGroceryDeliverySlots,
  listGroceryMeiliDocuments,
  listGroceryOrders,
  listGroceryCollections,
  placeGroceryOrder,
  publishGroceryOfferFromFactory,
  resolveGroceryCertBadge,
  runPd35GroceryBrandKycThinVertical,
  searchGroceryOffers,
  searchGroceryOffersWithFacets,
  setGroceryCartSlot,
  trackGroceryOrder,
  runPd119GroceryOrderTrackTimelineThinVertical,
  runPd134GroceryCollectionsThinVertical,
  runPd135GroceryFacetsThinVertical,
  type FoodSafetyCertStatus,
  type GroceryAvailability,
  type GroceryCart,
  type GroceryCertBadge,
  type GroceryColdChain,
  type GroceryCollection,
  type GroceryFacetFilters,
  type GroceryDeliverySlot,
  type GroceryOffer,
  type GroceryOfferDocument,
  type GroceryOrder,
  type GroceryOrderTimelineEvent,
  type GroceryOrderStatus,
  type SupplierKycStatus,
} from "./grocery.js";

export {
  __resetSpareCustomerForTests,
  addGarageVehicle,
  advanceSpareOrderStatus,
  attachSpareReturnEvidence,
  browsePathForGarageVehicle,
  cancelSpareOrder,
  getActiveGarageVehicle,
  getSpareOrder,
  getSpareOrderDurable,
  getSpareReturnClaim,
  getFleetExpiryBoard,
  listDueVehicleReminders,
  listGarageConsentAudit,
  listGarageVehicles,
  listSpareOrders,
  listSpareReturnClaims,
  listVehicleReminders,
  openSpareReturnClaim,
  placeSpareOrder,
  resolveSpareReturnClaim,
  runPd18SpareWebThinVertical,
  runPd20CustomerMobileThinVertical,
  runPd48AdminReturnsThinVertical,
  runPd50VehicleHubThinVertical,
  runPd75SetActiveGarageVehicleThinVertical,
  runPd79GarageCrudThinVertical,
  runPd92SevenDayCancelThinVertical,
  runPd108VehicleRemindersThinVertical,
  runPd110ReturnClaimEvidenceThinVertical,
  runPd115SpareOrderTrackTimelineThinVertical,
  runPd124TracktorFleetExpiryThinVertical,
  scheduleVehicleReminder,
  setActiveGarageVehicle,
  setGarageReminderConsent,
  updateGarageVehicle,
  deleteGarageVehicle,
  trackSpareOrder,
  type GarageConsentEvent,
  type GarageVehicle,
  type SpareCartSnapshot,
  type SpareOrder,
  type SpareOrderLine,
  type SpareOrderStatus,
  type SpareOrderTimelineEvent,
  type FleetExpiryBoard,
  type FleetExpiryBoardRow,
  type FleetExpirySeverity,
  type SpareReturnClaim,
  type SpareReturnPath,
  type VehicleReminder,
} from "./spareCustomer.js";

export {
  chassisCodesForOffer,
  dualEntrySnapshot,
  getVehicleByChassis,
  listCatalogAssemblies,
  listCatalogGroups,
  listCatalogParts,
  listVehicleMakes,
  listVehicleModels,
  offersForChassis,
  runPd27SpareDualEntryThinVertical,
  selectVehicles,
  type CatalogAssembly,
  type CatalogGroup,
  type CatalogPart,
  type DualEntryOfferHit,
  type VehicleMasterRow,
} from "./dualEntry.js";

export {
  __resetTakeRateForTests,
  createGroceryTakeRateDraft,
  getPublishedGroceryTakeRate,
  getTakeRateLadder,
  listTakeRateLadders,
  publishTakeRateLadder,
  publishTakeRateLadderDurable,
  resolveTakeRateBps,
  runPd34B2bTakeRateThinVertical,
  runPhase4PrepTakeRateDurableThinVertical,
  type TakeRateLadder,
  type TakeRateTier,
} from "./takeRate.js";

export {
  listCatalogueReviewsDurable,
  persistCatalogueBatchDurable,
  persistCatalogueReviewDurable,
  persistFactoryIngestDurable,
  persistTakeRateLadderDurable,
} from "./durableFactory.js";

/**
 * Phase 4 prep — CSV ingest + durable persist (fixture) + human approve.
 * Meili publish via publishApprovedBatchToMeili / publishFactoryOfferViaIndexer separately.
 */
export async function runPhase4PrepFactoryIngestApproveThinVertical(): Promise<{
  batchId: string;
  reviewId: string;
  offerId: string;
  informalB2bLeaks: number;
  liquorRejected: true;
  durableMode: "fixture";
  payableFromAi: false;
  offerSource: "MARKETPLACE";
}> {
  __resetCatalogueForTests();
  const csv = [
    "vertical,offerId,title,unitPriceUsdMinor,supplierFormality,brand,oem,qualityTier",
    "spare,off_p4prep_formal,P4 Prep Filter,2100,formal,Bosch,P4-OEM,OES",
    "spare,off_p4prep_informal,P4 Prep Informal Wiper,900,informal,Local,P4-INF,Aftermarket",
    "liquor,groc_beer_p4,Blocked beer,999,formal,Brand,750ml,ambient",
  ].join("\n");
  const ingested = ingestCatalogueCsv(csv);
  if (ingested.rejectedRows.length < 1) {
    throw new Error("Phase4-prep expected liquor rejection");
  }
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const { persistFactoryIngestDurable } = await import("./durableFactory.js");
  const durable = await persistFactoryIngestDurable({
    batches: ingested.batches,
    reviews: ingested.reviews,
  });
  if (durable.mode !== "fixture") {
    throw new Error("Phase4-prep expected fixture durable skip");
  }

  const formal = ingested.reviews.find(
    (r) => r.draft?.offerId === "off_p4prep_formal",
  );
  if (!formal?.draft || formal.draft.payableFromAi !== false) {
    throw new Error("Phase4-prep formal draft missing");
  }
  approveCatalogueReview(formal.reviewId);

  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_ANON_KEY;
  let closed = false;
  try {
    await persistFactoryIngestDurable({
      batches: ingested.batches,
      reviews: ingested.reviews,
    });
  } catch {
    closed = true;
  }
  if (!closed) throw new Error("expected factory durable fail-closed");
  process.env.DIAL_INTEGRATION_MODE = "fixture";

  return {
    batchId: formal.batchId,
    reviewId: formal.reviewId,
    offerId: formal.draft.offerId,
    informalB2bLeaks: countInformalB2bLeaks(),
    liquorRejected: true,
    durableMode: "fixture",
    payableFromAi: false,
    offerSource: "MARKETPLACE",
  };
}

import { offersForChassis as offersForChassisJoin } from "./dualEntry.js";
import type { SearchSessionRole as DualRole } from "./dualEntry.js";

/** PD27 — join live stub offers on chassis after dual entry. */
export function searchOffersByChassis(input: {
  chassisCode: string;
  sessionRole: DualRole;
  entryPath: "select_vehicle" | "browse_epc";
}) {
  return offersForChassisJoin({
    ...input,
    offers: OFFERS.filter((o) => o.offerSource === "MARKETPLACE"),
  });
}
