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
};

export type CatalogueReviewItem = {
  reviewId: string;
  batchId: string;
  offerId: string;
  status: "queued" | "approved" | "rejected";
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
    chassis_codes: [],
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
  };
  ingestBatches.set(batch.batchId, batch);
  const review: CatalogueReviewItem = {
    reviewId: `crq_${batch.batchId}`,
    batchId: batch.batchId,
    offerId: "pending",
    status: "queued",
  };
  reviewQueue.push(review);
  return { ...batch };
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
  pingMeiliHealth,
  searchSpareOfferDocuments,
  spareOffersIndexName,
  upsertSpareOfferDocuments,
  integrationMode as meiliIntegrationMode,
} from "./meiliClient.js";

export {
  MEILI_GROCERY_INDEX_DEFAULT,
  MEILI_GROCERY_OFFERS_V1_SETTINGS,
  __resetGroceryForTests,
  addToGroceryCart,
  assertGroceryPublishAllowed,
  countGroceryInformalB2bLeaks,
  createGroceryCart,
  getGroceryCart,
  getGroceryOffer,
  groceryMeiliFilterForSession,
  listGroceryMeiliDocuments,
  searchGroceryOffers,
  type GroceryCart,
  type GroceryOffer,
  type GroceryOfferDocument,
} from "./grocery.js";
