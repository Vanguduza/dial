/**
 * G1 Groceries — food/pantry only (no liquor Build).
 * Meili index grocery_offers_v1; USD browse (D-57); B2B hide informal (D-49);
 * agency MARKETPLACE only (D-58). Absorb into @dial/catalogue — not a parallel SoR.
 */
import { type Money, money } from "@dial/shared";

export type GroceryVertical = "grocery"; // liquor deferred — counsel gate
export type GroceryColdChain = "ambient" | "chilled" | "frozen" | "fragile";
export type GroceryAvailability = "available" | "confirm_required" | "sourcing";
/** PD35 — supplier KYC before payout; display only on browse. */
export type SupplierKycStatus = "verified" | "pending" | "none";
/** PD35 — chilled/frozen require food-safety cert (Wave 3 Q10). */
export type FoodSafetyCertStatus = "certified" | "missing" | "n_a";

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
  /** Formal suppliers: KYC before first payout (display). Informal = none. */
  supplierKycStatus: SupplierKycStatus;
  /** Chilled/frozen formal: food-safety cert required (display). */
  foodSafetyCertStatus: FoodSafetyCertStatus;
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
  supplierKycStatus: SupplierKycStatus;
  foodSafetyCertStatus: FoodSafetyCertStatus;
};

/** Browse badge — display only; never a payable / payout gate in this slice. */
export type GroceryCertBadge = {
  kind: "kyc_verified" | "food_safety_certified" | "food_safety_required";
  label: string;
  testId: string;
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
    "supplierKycStatus",
    "foodSafetyCertStatus",
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
    "supplierKycStatus",
    "foodSafetyCertStatus",
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
    supplierKycStatus: "verified",
    foodSafetyCertStatus: "certified",
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
    supplierKycStatus: "verified",
    foodSafetyCertStatus: "n_a",
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
    supplierKycStatus: "none",
    foodSafetyCertStatus: "n_a",
  },
];

type GroceryStore = {
  offers: GroceryOffer[];
  carts: Map<string, GroceryCart>;
  orders: Map<string, GroceryOrder>;
};

function store(): GroceryStore {
  const g = globalThis as typeof globalThis & {
    __dialGroceryStore?: GroceryStore;
  };
  if (!g.__dialGroceryStore) {
    g.__dialGroceryStore = {
      offers: [...GROCERY_SEED],
      carts: new Map(),
      orders: new Map(),
    };
  }
  if (!g.__dialGroceryStore.orders) {
    g.__dialGroceryStore.orders = new Map();
  }
  return g.__dialGroceryStore;
}

export function __resetGroceryForTests(): void {
  const s = store();
  s.offers = [...GROCERY_SEED];
  s.carts.clear();
  s.orders.clear();
}

/**
 * PD15 Catalogue Factory — human-approved draft → grocery SoR (then Meili upsert).
 * Never accepts liquor/ageGate or non-MARKETPLACE.
 */
export function publishGroceryOfferFromFactory(input: {
  offerId: string;
  title: string;
  brand: string;
  unitPriceUsdMinor: bigint;
  unitLabel: string;
  coldChain: GroceryColdChain;
  supplierFormality: "formal" | "informal";
  supplierDisplayName: string;
  description?: string;
  categoryPath?: string[];
  supplierKycStatus?: SupplierKycStatus;
  foodSafetyCertStatus?: FoodSafetyCertStatus;
}): GroceryOffer {
  assertGroceryPublishAllowed({
    offerSource: "MARKETPLACE",
    vertical: "grocery",
    ageGateRequired: false,
  });
  if (input.unitPriceUsdMinor <= 0n) {
    throw new Error("unitPriceUsdMinor must be positive integer minor units");
  }
  const coldNeedsCert =
    input.coldChain === "chilled" || input.coldChain === "frozen";
  const supplierKycStatus =
    input.supplierFormality === "informal"
      ? "none"
      : (input.supplierKycStatus ?? "pending");
  const foodSafetyCertStatus =
    input.supplierFormality === "informal"
      ? "n_a"
      : (input.foodSafetyCertStatus ??
        (coldNeedsCert ? "missing" : "n_a"));
  const existing = store().offers.findIndex((o) => o.offerId === input.offerId);
  const offer: GroceryOffer = {
    offerId: input.offerId,
    title: input.title,
    description: input.description ?? input.title,
    brand: input.brand,
    categoryPath: input.categoryPath ?? ["pantry", "factory"],
    vertical: "grocery",
    pricingMode: "unit",
    unitPriceUsdMinor: input.unitPriceUsdMinor,
    unitLabel: input.unitLabel,
    availability: "available",
    coldChain: input.coldChain,
    ageGateRequired: false,
    hasRestrictedSku: false,
    deliveryBandId: "band_harare_central",
    stockValidUntil: Date.now() + 7 * 24 * 60 * 60 * 1000,
    offerSource: "MARKETPLACE",
    supplierFormality: input.supplierFormality,
    supplierDisplayName: input.supplierDisplayName,
    supplierKycStatus,
    foodSafetyCertStatus,
  };
  if (existing >= 0) {
    store().offers[existing] = offer;
  } else {
    store().offers.push(offer);
  }
  return { ...offer };
}

/**
 * PD35 — resolve browse cert badge (display only).
 * Informal never badges. Chilled/frozen formal prefer food-safety; else KYC.
 */
export function resolveGroceryCertBadge(
  offer: Pick<
    GroceryOffer,
    | "supplierFormality"
    | "coldChain"
    | "supplierKycStatus"
    | "foodSafetyCertStatus"
  >,
): GroceryCertBadge | null {
  if (offer.supplierFormality === "informal") return null;
  const coldNeedsCert =
    offer.coldChain === "chilled" || offer.coldChain === "frozen";
  if (coldNeedsCert) {
    if (offer.foodSafetyCertStatus === "certified") {
      return {
        kind: "food_safety_certified",
        label: "Food-safety certified",
        testId: "cert-food-safety",
      };
    }
    return {
      kind: "food_safety_required",
      label: "Food-safety cert required",
      testId: "cert-food-safety-required",
    };
  }
  if (offer.supplierKycStatus === "verified") {
    return {
      kind: "kyc_verified",
      label: "KYC verified",
      testId: "cert-kyc",
    };
  }
  return null;
}

/**
 * PD35 thin vertical: formal chilled shows food-safety badge; ambient KYC;
 * informal never badges; brand polish fields present; USD/agency locks.
 */
export function runPd35GroceryBrandKycThinVertical(): {
  chilledBadge: "food_safety_certified";
  ambientBadge: "kyc_verified";
  informalBadge: null;
  brandPolish: true;
  currencyUsd: true;
  payableFromAi: false;
  liquorAllowed: false;
  b2bFormalOnly: true;
} {
  __resetGroceryForTests();
  const chilled = getGroceryOffer("groc_milk_1l");
  const ambient = getGroceryOffer("groc_rice_2kg");
  const informal = getGroceryOffer("groc_bread_informal");
  if (!chilled || !ambient || !informal) {
    throw new Error("PD35 seed offers missing");
  }
  const chilledBadge = resolveGroceryCertBadge(chilled);
  const ambientBadge = resolveGroceryCertBadge(ambient);
  const informalBadge = resolveGroceryCertBadge(informal);
  if (chilledBadge?.kind !== "food_safety_certified") {
    throw new Error("PD35 chilled formal must show food-safety certified");
  }
  if (ambientBadge?.kind !== "kyc_verified") {
    throw new Error("PD35 ambient formal must show KYC verified");
  }
  if (informalBadge !== null) {
    throw new Error("PD35 informal must never show cert badge");
  }
  if (!chilled.brand || !ambient.brand) {
    throw new Error("PD35 brand polish requires brand on offers");
  }
  const b2b = searchGroceryOffers("", { sessionRole: "b2b" });
  if (b2b.some((o) => o.supplierFormality === "informal")) {
    throw new Error("PD35 B2B must hide informal (D-49)");
  }
  return {
    chilledBadge: "food_safety_certified",
    ambientBadge: "kyc_verified",
    informalBadge: null,
    brandPolish: true,
    currencyUsd: true,
    payableFromAi: false,
    liquorAllowed: false,
    b2bFormalOnly: true,
  };
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
  /** PD14 delivery slot — required before checkout. */
  slotId?: string;
};

export type GroceryDeliverySlot = {
  slotId: string;
  windowLabel: string;
  coldChainNotes: string;
  /** Counsel gate — never product-surface liquorAllowed as true. */
  liquorAllowed: false;
};

export type GroceryOrderStatus =
  | "confirmed"
  | "picking"
  | "out_for_delivery"
  | "delivered";

export type GroceryOrder = {
  orderId: string;
  cartId: string;
  customerId: string | null;
  slotId: string;
  status: GroceryOrderStatus;
  totalUsdMinor: bigint;
  currency: "USD";
  payChoice: "ecocash" | "cod";
  deliveryJobId: string | null;
  soldBy: string;
  createdAt: string;
};

const GROCERY_SLOTS: GroceryDeliverySlot[] = [
  {
    slotId: "slot_harare_am",
    windowLabel: "Today 10:00–13:00",
    coldChainNotes: "Chilled lines keep cold-chain band until POD",
    liquorAllowed: false,
  },
  {
    slotId: "slot_harare_pm",
    windowLabel: "Today 15:00–18:00",
    coldChainNotes: "Ambient + chilled; frozen only if van equipped",
    liquorAllowed: false,
  },
  {
    slotId: "slot_harare_eve",
    windowLabel: "Tomorrow 09:00–12:00",
    coldChainNotes: "Standard pantry window",
    liquorAllowed: false,
  },
];

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
    supplierKycStatus: o.supplierKycStatus,
    foodSafetyCertStatus: o.foodSafetyCertStatus,
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
  if (!c) return undefined;
  const out: GroceryCart = {
    ...c,
    lines: c.lines.map((l) => ({ ...l })),
    total: { ...c.total },
  };
  if (c.slotId !== undefined) out.slotId = c.slotId;
  return out;
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

/** PD14 — list delivery windows (food only; liquorAllowed always false). */
export function listGroceryDeliverySlots(): GroceryDeliverySlot[] {
  return GROCERY_SLOTS.map((s) => ({ ...s }));
}

export function getGroceryDeliverySlot(
  slotId: string,
): GroceryDeliverySlot | undefined {
  const s = GROCERY_SLOTS.find((x) => x.slotId === slotId);
  return s ? { ...s } : undefined;
}

/** Assign slot to cart before checkout (PD14). */
export function setGroceryCartSlot(cartId: string, slotId: string): GroceryCart {
  const cart = store().carts.get(cartId);
  if (!cart) throw new Error(`Unknown grocery cart ${cartId}`);
  if (cart.lines.length === 0) throw new Error("Grocery cart empty");
  const slot = getGroceryDeliverySlot(slotId);
  if (!slot) throw new Error(`Unknown grocery slot ${slotId}`);
  if (slot.liquorAllowed !== false) {
    throw new Error("liquorAllowed must be false on grocery slots (counsel gate)");
  }
  cart.slotId = slotId;
  return getGroceryCart(cartId)!;
}

export function placeGroceryOrder(input: {
  cartId: string;
  customerId?: string | null;
  payChoice: "ecocash" | "cod";
  deliveryJobId?: string | null;
  soldBy: string;
}): GroceryOrder {
  const cart = store().carts.get(input.cartId);
  if (!cart) throw new Error(`Unknown grocery cart ${input.cartId}`);
  if (cart.lines.length === 0) throw new Error("Grocery cart empty");
  if (!cart.slotId) throw new Error("Slot required before grocery checkout (PD14)");
  const slot = getGroceryDeliverySlot(cart.slotId);
  if (!slot || slot.liquorAllowed !== false) {
    throw new Error("Invalid grocery slot");
  }
  const order: GroceryOrder = {
    orderId: `gord_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    cartId: cart.id,
    customerId: input.customerId ?? null,
    slotId: cart.slotId,
    status: "confirmed",
    totalUsdMinor: cart.total.amountMinor,
    currency: "USD",
    payChoice: input.payChoice,
    deliveryJobId: input.deliveryJobId ?? null,
    soldBy: input.soldBy,
    createdAt: new Date().toISOString(),
  };
  store().orders.set(order.orderId, order);
  return { ...order };
}

export function getGroceryOrder(orderId: string): GroceryOrder | undefined {
  const o = store().orders.get(orderId);
  return o ? { ...o } : undefined;
}

export function advanceGroceryOrderStatus(orderId: string): GroceryOrder {
  const o = store().orders.get(orderId);
  if (!o) throw new Error(`Unknown grocery order ${orderId}`);
  const seq: GroceryOrderStatus[] = [
    "confirmed",
    "picking",
    "out_for_delivery",
    "delivered",
  ];
  const i = seq.indexOf(o.status);
  if (i >= 0 && i < seq.length - 1) {
    o.status = seq[i + 1]!;
  }
  return { ...o };
}

export function trackGroceryOrder(orderId: string): {
  order: GroceryOrder;
  slot: GroceryDeliverySlot;
  statusFrom: "erp";
} {
  const order = getGroceryOrder(orderId);
  if (!order) throw new Error(`Unknown grocery order ${orderId}`);
  const slot = getGroceryDeliverySlot(order.slotId);
  if (!slot) throw new Error(`Missing slot ${order.slotId}`);
  return { order, slot, statusFrom: "erp" };
}
