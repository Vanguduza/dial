/**
 * Official WhatsApp Cloud API adapter surface (D-40) — no Baileys / whatsapp-web.js.
 * E2a: Flow search → USD cart → checkout with required EcoCash | COD buttons → payments.
 */
import { addToCart, createCart, getCart, searchOffers } from "@dial/catalogue";
import {
  type CheckoutPayChoice,
  createCheckoutPayment,
  type PaymentIntent,
  type CodOrder,
} from "@dial/payments";
import { createHmac, timingSafeEqual } from "node:crypto";

export type FlowId =
  | "FLOW_SPARE_SEARCH"
  | "FLOW_SPARE_CART"
  | "FLOW_SPARE_CHECKOUT";

export type CheckoutButton = {
  id: CheckoutPayChoice;
  title: string;
};

/** Required pay CTAs — not free-text (D-57). */
export const CHECKOUT_PAY_BUTTONS: readonly CheckoutButton[] = [
  { id: "ecocash", title: "EcoCash" },
  { id: "cod", title: "Cash on delivery" },
] as const;

export type FlowSession = {
  sessionId: string;
  flowId: FlowId;
  cartId?: string;
  orderId?: string;
  lastScreen?: string;
};

const sessions = new Map<string, FlowSession>();
const processedWebhookIds = new Set<string>();

export function verifyMetaSignature(input: {
  appSecret: string;
  rawBody: string;
  signatureHeader: string;
}): boolean {
  const expected =
    "sha256=" +
    createHmac("sha256", input.appSecret).update(input.rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(input.signatureHeader);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Idempotent webhook admission — duplicate delivery-id is a no-op. */
export function admitWebhookEvent(deliveryId: string): "accepted" | "duplicate" {
  if (processedWebhookIds.has(deliveryId)) return "duplicate";
  processedWebhookIds.add(deliveryId);
  return "accepted";
}

export function startFlow(flowId: FlowId): FlowSession {
  const session: FlowSession = {
    sessionId: `wa_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    flowId,
  };
  sessions.set(session.sessionId, session);
  return session;
}

export function flowSpareSearch(sessionId: string, query: string) {
  const session = sessions.get(sessionId);
  if (!session) throw new Error("Unknown session");
  session.flowId = "FLOW_SPARE_SEARCH";
  session.lastScreen = "search_results";
  const offers = searchOffers(query).map((o) => ({
    offerId: o.offerId,
    title: o.title,
    /** USD only on browse (D-57). */
    displayPriceUsdMinor: o.unitPriceUsdMinor.toString(),
    displayCurrency: "USD" as const,
  }));
  return { session, offers };
}

export function flowSpareCartAdd(sessionId: string, offerId: string, qty = 1) {
  const session = sessions.get(sessionId);
  if (!session) throw new Error("Unknown session");
  if (!session.cartId) {
    session.cartId = createCart().id;
  }
  session.flowId = "FLOW_SPARE_CART";
  session.lastScreen = "cart";
  const cart = addToCart(session.cartId, offerId, qty);
  return {
    session,
    cart: {
      cartId: cart.id,
      currency: cart.currency,
      totalUsdMinor: cart.total.amountMinor.toString(),
      lines: cart.lines.map((l) => ({
        offerId: l.offerId,
        title: l.title,
        qty: l.qty,
        lineUsdMinor: l.lineTotal.amountMinor.toString(),
      })),
    },
  };
}

export function flowSpareCheckoutReview(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session?.cartId) throw new Error("Cart required before checkout");
  const cart = getCart(session.cartId);
  if (!cart || cart.lines.length === 0) throw new Error("Cart empty");
  session.flowId = "FLOW_SPARE_CHECKOUT";
  session.lastScreen = "review";
  session.orderId = session.orderId ?? `ord_${session.sessionId}`;
  return {
    session,
    review: {
      orderId: session.orderId,
      currency: "USD" as const,
      totalUsdMinor: cart.total.amountMinor.toString(),
      lines: cart.lines,
      /** 18-item disclosure stub — expand to full §7.5 list in-ticket. */
      disclosures: [
        "Prices in USD on cart; ZiG shown only if you pay with EcoCash.",
        "COD settles in USD; ZiG equivalent is indicative at confirm.",
      ],
    },
    /** Required interactive buttons — EcoCash | COD (D-57). */
    payButtons: CHECKOUT_PAY_BUTTONS,
  };
}

export async function flowSpareCheckoutPay(
  sessionId: string,
  choice: CheckoutPayChoice,
  idempotencyKey: string,
): Promise<{
  session: FlowSession;
  intent?: PaymentIntent;
  codOrder?: CodOrder;
}> {
  const session = sessions.get(sessionId);
  if (!session?.cartId || !session.orderId) {
    throw new Error("Checkout review required before pay");
  }
  if (choice !== "ecocash" && choice !== "cod") {
    throw new Error("Pay choice must be EcoCash or COD button");
  }
  const cart = getCart(session.cartId);
  if (!cart) throw new Error("Missing cart");

  session.lastScreen = "pay_result";
  const result = await createCheckoutPayment({
    choice,
    orderId: session.orderId,
    amountUsdMinor: cart.total.amountMinor,
    idempotencyKey,
  });
  return { session, ...result };
}

export function __resetWhatsappForTests(): void {
  sessions.clear();
  processedWebhookIds.clear();
}
