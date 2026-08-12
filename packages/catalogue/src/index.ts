/**
 * E2a catalogue/cart stub — USD browse/cart only (D-57). ZiG never on cart lines.
 */
import { type Money, money } from "@dial/shared";

export type StubOffer = {
  offerId: string;
  title: string;
  /** Display + payable line in USD minor (browse/cart). */
  unitPriceUsdMinor: bigint;
  qualityTier: "OEM" | "OES" | "Aftermarket";
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

const OFFERS: StubOffer[] = [
  {
    offerId: "off_filter_oil_kun26",
    title: "Oil filter (KUN26)",
    unitPriceUsdMinor: 12_00n,
    qualityTier: "OES",
  },
  {
    offerId: "off_pad_front_zre152",
    title: "Front brake pads (ZRE152)",
    unitPriceUsdMinor: 45_00n,
    qualityTier: "Aftermarket",
  },
];

const carts = new Map<string, Cart>();

export function searchOffers(query: string): StubOffer[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...OFFERS];
  return OFFERS.filter(
    (o) =>
      o.title.toLowerCase().includes(q) ||
      o.offerId.toLowerCase().includes(q),
  );
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
}
