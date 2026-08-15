/**
 * PD14 grocery web deepen — slot → USD cart checkout EcoCash|COD → track.
 * Reuses G1 money/delivery spine; requires delivery slot (no liquor).
 */
import {
  __resetGroceryForTests,
  addToGroceryCart,
  createGroceryCart,
  getGroceryCart,
  listGroceryDeliverySlots,
  placeGroceryOrder,
  setGroceryCartSlot,
  trackGroceryOrder,
  type GroceryOrder,
} from "@dial/catalogue";
import { __resetPaymentsForTests } from "@dial/payments";
import { runG1GroceryThinVertical } from "./g1Spine.js";

export type Pd14ThinResult = {
  cartId: string;
  slotId: string;
  liquorAllowed: false;
  currency: "USD";
  zigOnlyAtCheckout: true;
  payChoice: "ecocash" | "cod";
  order: GroceryOrder;
  trackStatus: string;
  statusFrom: "erp";
  intentId?: string;
  deliveryJobId: string;
  imttOnCheckoutLines: false;
};

/**
 * Thin vertical beyond G1 browse: ATC → slot → checkout (ZiG at pay) → ERP track.
 */
export async function runPd14GroceryWebThinVertical(input?: {
  offerId?: string;
  payChoice?: "ecocash" | "cod";
  buyerSegment?: "b2c" | "b2b";
}): Promise<Pd14ThinResult> {
  __resetGroceryForTests();
  __resetPaymentsForTests();

  const buyerSegment = input?.buyerSegment ?? "b2c";
  const payChoice = input?.payChoice ?? "ecocash";
  const offerId = input?.offerId ?? "groc_milk_1l";

  const cart = createGroceryCart();
  addToGroceryCart(cart.id, offerId, 1, { buyerSegment });
  const slots = listGroceryDeliverySlots();
  const slot = slots[0];
  if (!slot) throw new Error("PD14 requires grocery delivery slots");
  if (slot.liquorAllowed !== false) {
    throw new Error("PD14 slots must forbid liquor");
  }
  setGroceryCartSlot(cart.id, slot.slotId);

  const g1 = await runG1GroceryThinVertical({
    cartId: cart.id,
    payChoice,
    buyerSegment,
  });

  const ordered = placeGroceryOrder({
    cartId: cart.id,
    payChoice,
    soldBy: g1.soldBy,
    deliveryJobId: g1.deliveryJobId,
  });

  const track = trackGroceryOrder(ordered.orderId);
  const refreshed = getGroceryCart(cart.id);
  if (!refreshed?.slotId) throw new Error("PD14 cart must retain slotId");

  return {
    cartId: cart.id,
    slotId: slot.slotId,
    liquorAllowed: false,
    currency: "USD",
    zigOnlyAtCheckout: true,
    payChoice,
    order: ordered,
    trackStatus: track.order.status,
    statusFrom: "erp",
    ...(g1.intentId ? { intentId: g1.intentId } : {}),
    deliveryJobId: g1.deliveryJobId,
    imttOnCheckoutLines: false,
  };
}
