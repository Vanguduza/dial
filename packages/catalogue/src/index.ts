/**
 * Catalogue + Meili search stubs (E2a cart + Pack §15 T2).
 * USD browse/cart only (D-57). Agency marketplace only (D-58). B2B hides informal (D-49).
 */
import { type Money, money } from "@dial/shared";

export type OfferSource = "MARKETPLACE";
export type SupplierFormality = "formal" | "informal";
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

/** Pack §8.1 Meili document shape (customer-facing; no supplierId). */
export type SpareOfferDocument = {
  id: string;
  masterProductId: string;
  oem: string;
  normalisedOem: string;
  description: string;
  brand: string;
  qualityTier: string;
  availability: "available" | "confirm_required" | "sourcing";
  chassis_codes: string[];
  engine_codes: string[];
  categoryPath: string[];
  priceMinor: number;
  currency: "USD";
  warrantyDays: number;
  deliveryBandId: string;
  fitmentConfidence: number;
  stockValidUntil: number;
  hasRestrictedSku: boolean;
  offerSource: OfferSource;
  supplierFormality: SupplierFormality;
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
  status: "pending_review" | "approved" | "rejected";
  rowCount: number;
  createdAt: string;
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

/** Pack §8.2 settings — filterable includes offerSource + supplierFormality. */
export const MEILI_SPARE_OFFERS_V1_SETTINGS = {
  searchableAttributes: [
    "oem",
    "normalisedOem",
    "description",
    "brand",
    "pnc",
    "chassis_codes",
    "engine_codes",
  ],
  filterableAttributes: [
    "brand",
    "qualityTier",
    "availability",
    "chassis_codes",
    "engine_codes",
    "currency",
    "deliveryBandId",
    "hasRestrictedSku",
    "priceMinor",
    "fitmentConfidence",
    "stockValidUntil",
    "offerSource",
    "supplierFormality",
  ],
  sortableAttributes: ["priceMinor", "fitmentConfidence", "stockValidUntil"],
  displayedAttributes: [
    "id",
    "masterProductId",
    "oem",
    "description",
    "brand",
    "qualityTier",
    "availability",
    "priceMinor",
    "currency",
    "warrantyDays",
    "deliveryBandId",
    "fitmentConfidence",
    "hasRestrictedSku",
    "categoryPath",
    "offerSource",
    "supplierFormality",
  ],
} as const;

const OFFERS: StubOffer[] = [
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
    batchId: `cib_${Date.now().toString(36)}`,
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
}
