/**
 * PD55 — Admin orders queue thin vertical (Pack §9.5).
 * Spare + grocery list/advance; payableFromAi=false; no liquor.
 */
import {
  __resetSpareCustomerForTests,
  advanceSpareOrderStatus,
  listSpareOrders,
  placeSpareOrder,
} from "./spareCustomer.js";
import {
  __resetGroceryForTests,
  addToGroceryCart,
  advanceGroceryOrderStatus,
  createGroceryCart,
  listGroceryDeliverySlots,
  listGroceryOrders,
  placeGroceryOrder,
  setGroceryCartSlot,
} from "./grocery.js";

export function runPd55AdminOrdersThinVertical(): {
  spareOrderId: string;
  groceryOrderId: string;
  spareAdvanced: true;
  groceryAdvanced: true;
  queueCount: number;
  payableFromAi: false;
  liquorAllowed: false;
} {
  __resetSpareCustomerForTests();
  __resetGroceryForTests();

  const spareOrder = placeSpareOrder({
    cart: {
      id: "cart_pd55",
      currency: "USD",
      totalUsdMinor: 12_00n,
      lines: [
        {
          offerId: "off_pd55",
          title: "PD55 oil",
          qty: 1,
          unitPriceUsdMinor: 12_00n,
          lineTotalUsdMinor: 12_00n,
          soldBy: "Agency PD55",
          supplierFormality: "formal",
        },
      ],
    },
    customerId: "cust_pd55",
    payChoice: "cod",
  });

  const gcart = createGroceryCart();
  addToGroceryCart(gcart.id, "groc_milk_1l", 1);
  const slots = listGroceryDeliverySlots();
  const slot = slots.find((s) => s.liquorAllowed === false) ?? slots[0];
  if (!slot) throw new Error("PD55 needs grocery slot");
  setGroceryCartSlot(gcart.id, slot.slotId);
  const gord = placeGroceryOrder({
    cartId: gcart.id,
    customerId: "cust_pd55",
    payChoice: "cod",
    soldBy: "Agency Grocer",
  });

  const spareList = listSpareOrders();
  const groceryList = listGroceryOrders();
  if (!spareList.some((o) => o.orderId === spareOrder.orderId)) {
    throw new Error("PD55 spare order missing from admin list");
  }
  if (!groceryList.some((o) => o.orderId === gord.orderId)) {
    throw new Error("PD55 grocery order missing from admin list");
  }

  const spareAdv = advanceSpareOrderStatus(spareOrder.orderId);
  const groceryAdv = advanceGroceryOrderStatus(gord.orderId);
  if (spareAdv.status === "confirmed" || groceryAdv.status === "confirmed") {
    throw new Error("PD55 expected status advance");
  }

  return {
    spareOrderId: spareOrder.orderId,
    groceryOrderId: gord.orderId,
    spareAdvanced: true,
    groceryAdvanced: true,
    queueCount: spareList.length + groceryList.length,
    payableFromAi: false,
    liquorAllowed: false,
  };
}
