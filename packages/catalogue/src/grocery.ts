/**
 * G1 Groceries — food/pantry only (no liquor Build).
 * Meili index grocery_offers_v1; USD browse (D-57); B2B hide informal (D-49);
 * agency MARKETPLACE only (D-58). Absorb into @dial/catalogue — not a parallel SoR.
 */
import { type Money, money } from "@dial/shared";

export type GroceryVertical = "grocery"; // liquor deferred — counsel gate
export type GroceryColdChain = "ambient" | "chilled" | "frozen" | "fragile";
export type GroceryAvailability = "available" | "confirm_required" | "sourcing";

export type GroceryOffer = {
  offerId: string;
  title: string;
  description: string;
  brand: string;
  categoryPath: string[];
  vertical: GroceryVertical;
  pricingMode: "unit";
  unitPriceUsdMinor: bigint;
  unitLabel: string;
  availability: GroceryAvailability;
  coldChain: GroceryColdChain;
  ageGateRequired: boolean;
  hasRestrictedSku: boolean;
  deliveryBandId: string;
  stockValidUntil: number;
  offerSource: "MARKETPLACE";
  supplierFormality: "formal" | "informal";
  supplierDisplayName: string;
};

export type GroceryOfferDocument = {
  id: string;
  masterProductId: string;
  title: string;
  description: string;
  brand: string;
  categoryPath: string[];
  vertical: GroceryVertical;
  pricingMode: "unit";
  priceMinor: number;
  currency: "USD";
  unitLabel: string;
  availability: GroceryAvailability;
  coldChain: GroceryColdChain;
  ageGateRequired: boolean;
  hasRestrictedSku: boolean;
  deliveryBandId: string;
  stockValidUntil: number;
  offerSource: "MARKETPLACE";
  supplierFormality: "formal" | "informal";
  supplierDisplayName: string;
};

export const MEILI_GROCERY_INDEX_DEFAULT = "grocery_offers_v1";

export const MEILI_GROCERY_OFFERS_V1_SETTINGS = {
  searchableAttributes: [
    "title",
    "description",
    "brand",
    "barcode",
    "categoryPath",
    "supplierDisplayName",
  ],
  filterableAttributes: [
    "vertical",
    "categoryPath",
    "pricingMode",
    "availability",
    "coldChain",
    "ageGateRequired",
    "hasRestrictedSku",
    "currency",
    "deliveryBandId",
    "priceMinor",
    "stockValidUntil",
    "offerSource",
    "supplierFormality",
  ],
  sortableAttributes: ["priceMinor", "stockValidUntil"],
  displayedAttributes: [
    "id",
    "masterProductId",
    "title",
    "description",
    "brand",
    "categoryPath",
    "vertical",
    "pricingMode",
    "priceMinor",
    "currency",
    "unitLabel",
    "availability",
    "coldChain",
    "ageGateRequired",
    "hasRestrictedSku",
    "deliveryBandId",
    "stockValidUntil",
    "offerSource",
    "supplierFormality",
    "supplierDisplayName",
  ],
} as const;

const GROCERY_SEED: GroceryOffer[] = [
  {
    offerId: "groc_milk_1l",
    title: "Full cream milk 1L",
    description: "Pasteurised full cream milk",
    brand: "Dairibord",
    categoryPath: ["pantry", "dairy"],
    vertical: "grocery",
    pricingMode: "unit",
    unitPriceUsdMinor: 1_80n,
    unitLabel: "1L",
    availability: "available",
    coldChain: "chilled",
    ageGateRequired: false,
    hasRestrictedSku: false,
    deliveryBandId: "harare_metro",
    stockValidUntil: Date.now() + 86_400_000,
    offerSource: "MARKETPLACE",
    supplierFormality: "formal",
    supplierDisplayName: "OK Express Agency",
  },
  {
    offerId: "groc_rice_2kg",
    title: "White rice 2kg",
    description: "Long grain white rice",
    brand: "Mahatma",
    categoryPath: ["pantry", "staples"],
    vertical: "grocery",
    pricingMode: "unit",
    unitPriceUsdMinor: 3_50n,
    unitLabel: "2kg",
    availability: "available",
    coldChain: "ambient",
    ageGateRequired: false,
    hasRestrictedSku: false,
    deliveryBandId: "harare_metro",
    stockValidUntil: Date.now() + 7 * 86_400_000,
    offerSource: "MARKETPLACE",
    supplierFormality: "formal",
    supplierDisplayName: "OK Express Agency",
  },
  {
    offerId: "groc_bread_informal",
    title: "Fresh loaf (informal baker)",
    description: "Same-day baked loaf",
    brand: "Local",
    categoryPath: ["bakery"],
    vertical: "grocery",
    pricingMode: "unit",
    unitPriceUsdMinor: 1_20n,
    unitLabel: "each",
    availability: "available",
    coldChain: "ambient",
    ageGateRequired: false,
    hasRestrictedSku: false,
    deliveryBandId: "harare_metro",
    stockValidUntil: Date.now() + 43_200_000,
    offerSource: "MARKETPLACE",
    supplierFormality: "informal",
    supplierDisplayName: "Corner Bakery",
  },
];

type GroceryStore = {
  offers: GroceryOffer[];
  carts: Map<string, GroceryCart>;
};

function store(): GroceryStore {
  const g = globalThis as typeof globalThis & {
    __dialGroceryStore?: GroceryStore;
  };
  if (!g.__dialGroceryStore) {
    g.__dialGroceryStore = {
      offers: [...GROCERY_SEED],
      carts: new Map(),
    };
  }
  return g.__dialGroceryStore;
}

export function __resetGroceryForTests(): void {
  const s = store();
  s.offers = [...GROCERY_SEED];
  s.carts.clear();
}

export type GroceryCartLine = {
  offerId: string;
  title: string;
  qty: number;
  unitPrice: Money;
  lineTotal: Money;
  supplierDisplayName: string;
  supplierFormality: "formal" | "informal";
};

export type GroceryCart = {
  id: string;
  currency: "USD";
  lines: GroceryCartLine[];
  total: Money;
};

function toDoc(o: GroceryOffer): GroceryOfferDocument {
  return {
    id: o.offerId,
    masterProductId: `mp_${o.offerId}`,
    title: o.title,
    description: o.description,
    brand: o.brand,
    categoryPath: o.categoryPath,
    vertical: o.vertical,
    pricingMode: o.pricingMode,
    priceMinor: Number(o.unitPriceUsdMinor),
    currency: "USD",
    unitLabel: o.unitLabel,
    availability: o.availability,
    coldChain: o.coldChain,
    ageGateRequired: o.ageGateRequired,
    hasRestrictedSku: o.hasRestrictedSku,
    deliveryBandId: o.deliveryBandId,
    stockValidUntil: o.stockValidUntil,
    offerSource: o.offerSource,
    supplierFormality: o.supplierFormality,
    supplierDisplayName: o.supplierDisplayName,
  };
}

export function listGroceryMeiliDocuments(): GroceryOfferDocument[] {
  return store()
    .offers.filter((o) => o.offerSource === "MARKETPLACE" && o.vertical === "grocery")
    .map(toDoc);
}

export function groceryMeiliFilterForSession(role: "b2c" | "b2b"): string {
  const base = 'offerSource = "MARKETPLACE" AND vertical = "grocery"';
  if (role === "b2b") {
    return `${base} AND supplierFormality = "formal"`;
  }
  return base;
}

export function searchGroceryOffers(
  query: string,
  opts?: { sessionRole?: "b2c" | "b2b" },
): GroceryOffer[] {
  const role = opts?.sessionRole ?? "b2c";
  const q = query.trim().toLowerCase();
  let hits = store().offers.filter(
    (o) => o.offerSource === "MARKETPLACE" && o.vertical === "grocery",
  );
  // Food/pantry Build — never surface liquor (ageGate / counsel gate).
  hits = hits.filter((o) => !o.ageGateRequired && o.hasRestrictedSku === false);
  if (role === "b2b") {
    hits = hits.filter((o) => o.supplierFormality === "formal");
  }
  if (q) {
    hits = hits.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.brand.toLowerCase().includes(q) ||
        o.offerId.toLowerCase().includes(q) ||
        o.categoryPath.some((c) => c.toLowerCase().includes(q)),
    );
  }
  return hits.map((o) => ({ ...o }));
}

export function countGroceryInformalB2bLeaks(query = ""): number {
  return searchGroceryOffers(query, { sessionRole: "b2b" }).filter(
    (o) => o.supplierFormality === "informal",
  ).length;
}

export function getGroceryOffer(offerId: string): GroceryOffer | null {
  const o = store().offers.find((x) => x.offerId === offerId);
  return o ? { ...o } : null;
}

export function assertGroceryPublishAllowed(input: {
  offerSource: string;
  vertical: string;
  ageGateRequired?: boolean;
}): void {
  if (input.offerSource !== "MARKETPLACE") {
    throw new Error("DIAL_OWNED / non-marketplace grocery publish forbidden (D-58)");
  }
  if (input.vertical === "liquor" || input.ageGateRequired) {
    throw new Error("Liquor SKUs blocked until counsel gate (G1 food/pantry only)");
  }
}

export function createGroceryCart(): GroceryCart {
  const cart: GroceryCart = {
    id: `gcart_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    currency: "USD",
    lines: [],
    total: money(0n, "USD"),
  };
  store().carts.set(cart.id, cart);
  return { ...cart, lines: [] };
}

export function getGroceryCart(cartId: string): GroceryCart | undefined {
  const c = store().carts.get(cartId);
  return c
    ? { ...c, lines: c.lines.map((l) => ({ ...l })), total: { ...c.total } }
    : undefined;
}

export function addToGroceryCart(
  cartId: string,
  offerId: string,
  qty = 1,
  opts?: { buyerSegment?: "b2c" | "b2b" },
): GroceryCart {
  const cart = store().carts.get(cartId);
  if (!cart) throw new Error(`Unknown grocery cart ${cartId}`);
  if (qty < 1) throw new Error("qty must be >= 1");
  const offer = store().offers.find((o) => o.offerId === offerId);
  if (!offer) throw new Error(`Unknown grocery offer ${offerId}`);
  assertGroceryPublishAllowed({
    offerSource: offer.offerSource,
    vertical: offer.vertical,
    ageGateRequired: offer.ageGateRequired,
  });
  if (opts?.buyerSegment === "b2b" && offer.supplierFormality === "informal") {
    throw new Error("B2B cannot purchase informal grocery stock (D-49)");
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
      supplierDisplayName: offer.supplierDisplayName,
      supplierFormality: offer.supplierFormality,
    });
  }
  cart.total = money(
    cart.lines.reduce((s, l) => s + l.lineTotal.amountMinor, 0n),
    "USD",
  );
  cart.currency = "USD";
  return getGroceryCart(cartId)!;
}
