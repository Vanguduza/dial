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
};

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
  status: "queued" | "approved" | "rejected";
  vertical: "spare" | "grocery";
  draft?: CatalogueDraftOffer;
};

export type SearchNoResultEvent = {
  eventId: string;
  query: string;
  sessionRole: SearchSessionRole;
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
  },
];

const OFFERS: StubOffer[] = [...OFFER_SEED];

const carts = new Map<string, Cart>();
const ingestBatches = new Map<string, CatalogueIngestBatch>();
const reviewQueue: CatalogueReviewItem[] = [];
const searchNoResultEvents: SearchNoResultEvent[] = [];

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
    availability: "available",
    chassis_codes: chassisCodesForOffer(offer),
    engine_codes: [],
    categoryPath: ["spares"],
    priceMinor: Number(offer.unitPriceUsdMinor),
    currency: "USD",
    warrantyDays: 90,
    deliveryBandId: "harare_metro",
    fitmentConfidence: 0.8,
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

function stubOfferFromMeiliDoc(doc: SpareOfferDocument): StubOffer {
  const tier = doc.qualityTier;
  const qualityTier: StubOffer["qualityTier"] =
    tier === "OEM" || tier === "OES" || tier === "Aftermarket"
      ? tier
      : "Aftermarket";
  return {
    offerId: doc.id,
    title: doc.description,
    unitPriceUsdMinor: BigInt(doc.priceMinor),
    qualityTier,
    offerSource: doc.offerSource,
    supplierFormality: doc.supplierFormality,
    oem: doc.oem,
    brand: doc.brand,
  };
}

/**
 * PD2 search path — fixture uses in-memory SoR; sandbox/live hits Meili with
 * `meiliFilterForSession` (D-49). Never trusts body role (caller passes session).
 */
export async function searchOffersAsync(
  query: string,
  opts?: { sessionRole?: SearchSessionRole },
): Promise<{
  hits: StubOffer[];
  source: "memory" | "meili";
  meiliFilter: string;
  indexUid: string;
}> {
  const role = opts?.sessionRole ?? "b2c";
  const filter = meiliFilterForSession(role);
  if (integrationMode() === "fixture") {
    return {
      hits: searchOffers(query, { sessionRole: role }),
      source: "memory",
      meiliFilter: filter,
      indexUid: process.env.MEILI_SPARE_INDEX?.trim() || "spare_offers_v1",
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
  return {
    hits,
    source: "meili",
    meiliFilter: filter,
    indexUid: result.indexUid || spareOffersIndexName(),
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
): SearchNoResultEvent {
  const event: SearchNoResultEvent = {
    eventId: `snr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    query,
    sessionRole,
    createdAt: new Date().toISOString(),
  };
  searchNoResultEvents.push(event);
  return event;
}

export function listSearchNoResultEvents(): SearchNoResultEvent[] {
  return searchNoResultEvents.map((e) => ({ ...e }));
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
  ingestBatches.set(batch.batchId, batch);
  const review: CatalogueReviewItem = {
    reviewId: `crq_${batch.batchId}`,
    batchId: batch.batchId,
    offerId: "pending",
    status: "queued",
    vertical: "spare",
  };
  reviewQueue.push(review);
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
      ingestBatches.set(batch.batchId, batch);
      const review: CatalogueReviewItem = {
        reviewId: `crq_${batch.batchId}`,
        batchId: batch.batchId,
        offerId: draft.offerId,
        status: "queued",
        vertical: draft.vertical,
        draft,
      };
      reviewQueue.push(review);
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
export function getDemandGapSnapshot(): {
  noResultCount: number;
  topQueries: Array<{ query: string; count: number }>;
  informalB2bLeaks: number;
  pendingReview: number;
  approvedAwaitingPublish: number;
} {
  const counts = new Map<string, number>();
  for (const e of searchNoResultEvents) {
    counts.set(e.query, (counts.get(e.query) ?? 0) + 1);
  }
  const topQueries = [...counts.entries()]
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  return {
    noResultCount: searchNoResultEvents.length,
    topQueries,
  informalB2bLeaks: countInformalB2bLeaks() /* spare; grocery checked in PD15 runner */,
  pendingReview: reviewQueue.filter((r) => r.status === "queued").length,
    approvedAwaitingPublish: reviewQueue.filter(
      (r) =>
        r.status === "approved" &&
        ingestBatches.get(r.batchId)?.status === "approved",
    ).length,
  };
}

export function listCatalogueReviewQueue(): CatalogueReviewItem[] {
  return reviewQueue.map((r) => ({ ...r }));
}

export function getCatalogueIngestBatch(
  batchId: string,
): CatalogueIngestBatch | undefined {
  const batch = ingestBatches.get(batchId);
  return batch ? { ...batch } : undefined;
}

/**
 * Human approve only (D-53 / D-54) — never auto-publish from AI.
 * Marks review + batch approved; publish to Meili stub is a separate step.
 */
export function approveCatalogueReview(reviewId: string): CatalogueReviewItem {
  const item = reviewQueue.find((r) => r.reviewId === reviewId);
  if (!item) throw new Error(`Unknown review ${reviewId}`);
  if (item.status !== "queued") {
    throw new Error(`Review ${reviewId} is already ${item.status}`);
  }
  item.status = "approved";
  const batch = ingestBatches.get(item.batchId);
  if (batch) batch.status = "approved";
  return { ...item };
}

export function rejectCatalogueReview(reviewId: string): CatalogueReviewItem {
  const item = reviewQueue.find((r) => r.reviewId === reviewId);
  if (!item) throw new Error(`Unknown review ${reviewId}`);
  if (item.status !== "queued") {
    throw new Error(`Review ${reviewId} is already ${item.status}`);
  }
  item.status = "rejected";
  const batch = ingestBatches.get(item.batchId);
  if (batch) batch.status = "rejected";
  return { ...item };
}

/**
 * E5a / PD2: after human approve, publish one SKU into memory + Meili upsert.
 * Never publishes informal to B2B search (D-49). Fixture upsert is no-op HTTP.
 */
export function publishApprovedBatchToMeiliStub(input: {
  batchId: string;
  offer: StubOffer;
}): SpareOfferDocument {
  const batch = ingestBatches.get(input.batchId);
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
  const review = reviewQueue.find((r) => r.batchId === input.batchId);
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
  const batch = ingestBatches.get(input.batchId);
  if (!batch) throw new Error(`Unknown batch ${input.batchId}`);
  if (batch.status !== "approved") {
    throw new Error("Batch must be human-approved before Meili publish");
  }
  const review = reviewQueue.find((r) => r.batchId === input.batchId);
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
  carts.set(cart.id, cart);
  return cart;
}

export function getCart(cartId: string): Cart | undefined {
  return carts.get(cartId);
}

/** Lookup marketplace offer by id (PD5 Android + spare checkout API). */
export function getOffer(offerId: string): StubOffer | undefined {
  const o = OFFERS.find((x) => x.offerId === offerId);
  return o ? { ...o } : undefined;
}

export function addToCart(cartId: string, offerId: string, qty = 1): Cart {
  const cart = carts.get(cartId);
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
  carts.clear();
  ingestBatches.clear();
  reviewQueue.length = 0;
  searchNoResultEvents.length = 0;
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
  groceryMeiliFilterForSession,
  listGroceryDeliverySlots,
  listGroceryMeiliDocuments,
  placeGroceryOrder,
  publishGroceryOfferFromFactory,
  searchGroceryOffers,
  setGroceryCartSlot,
  trackGroceryOrder,
  type GroceryCart,
  type GroceryDeliverySlot,
  type GroceryOffer,
  type GroceryOfferDocument,
  type GroceryOrder,
  type GroceryOrderStatus,
} from "./grocery.js";

export {
  __resetSpareCustomerForTests,
  addGarageVehicle,
  advanceSpareOrderStatus,
  getSpareOrder,
  getSpareReturnClaim,
  listGarageVehicles,
  listSpareOrders,
  openSpareReturnClaim,
  placeSpareOrder,
  resolveSpareReturnClaim,
  runPd18SpareWebThinVertical,
  runPd20CustomerMobileThinVertical,
  trackSpareOrder,
  type GarageVehicle,
  type SpareCartSnapshot,
  type SpareOrder,
  type SpareOrderLine,
  type SpareOrderStatus,
  type SpareReturnClaim,
  type SpareReturnPath,
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
