/**
 * G1 thin vertical orchestration (food/pantry).
 * Browse cart USD → EcoCash|COD → Job Reserve → delivery job create.
 * Money SoR = @dial/payments + ledger; delivery SoR = @dial/delivery. No liquor.
 */
import {
  addToGroceryCart,
  assertGroceryPublishAllowed,
  createGroceryCart,
  getGroceryCart,
  getGroceryOffer,
  searchGroceryOffers,
  type GroceryCart,
  type SearchSessionRole,
} from "@dial/catalogue";
import {
  admitPspWebhookEvent,
  assertB2bMayPurchase,
  authorizeJobReserve,
  completePspCaptureSettlement,
  createCheckoutPayment,
  freezeOfferSnapshot,
  setDailyZigRate,
  getActiveFxRate,
  type CheckoutPayChoice,
} from "@dial/payments";
import {
  acceptOffer,
  capturePod,
  createDeliveryJob,
  getDeliveryJob,
  postCourierLocation,
  reconcileCodAfterPod,
  setCourierAvailable,
  startDeliveryDispatchWorkflow,
  startTransit,
} from "@dial/delivery";

export type G1ThinResult = {
  cart: GroceryCart;
  snapshotId: string;
  soldBy: string;
  intentId?: string;
  codOrderId?: string;
  fxRateId?: string;
  displayPayableCurrency?: string;
  jobReserveId: string;
  deliveryJobId: string;
  journalId?: string;
  fiscalIds?: string[];
  webhook?: "captured" | "skipped_cod";
  currency: "USD";
  imttOnCheckoutLines: false;
  /** Phase 10 exit still open — thin vertical ≠ G10 (D-52). */
  g10Claimed: false;
};

/**
 * End-to-end G1 path for one formal pantry SKU (or cartId).
 * Fixture-safe; reuses PD4 checkout + Job Reserve + delivery create.
 */
export async function runG1GroceryThinVertical(input: {
  offerId?: string;
  cartId?: string;
  qty?: number;
  buyerSegment?: SearchSessionRole;
  payChoice: CheckoutPayChoice;
  deliveryTo?: string;
  /** PD99 — Pack §10 Idempotency-Key (required from HTTP; spine allows fixture default). */
  idempotencyKey?: string;
}): Promise<G1ThinResult> {
  const buyerSegment = input.buyerSegment ?? "b2c";
  let cartId = input.cartId;
  if (!cartId) {
    const offerId = input.offerId ?? "groc_milk_1l";
    const offer = getGroceryOffer(offerId);
    if (!offer) throw new Error(`Unknown grocery offer ${offerId}`);
    assertGroceryPublishAllowed({
      offerSource: offer.offerSource,
      vertical: offer.vertical,
      ageGateRequired: offer.ageGateRequired,
    });
    assertB2bMayPurchase({
      buyerSegment,
      formality: offer.supplierFormality,
    });
    const cart = createGroceryCart();
    addToGroceryCart(cart.id, offerId, input.qty ?? 1, { buyerSegment });
    cartId = cart.id;
  }

  const cart = getGroceryCart(cartId);
  if (!cart || cart.lines.length === 0) throw new Error("Grocery cart empty");
  if (cart.currency !== "USD") throw new Error("Grocery cart must be USD (D-57)");

  for (const line of cart.lines) {
    assertB2bMayPurchase({
      buyerSegment,
      formality: line.supplierFormality,
    });
    if (line.supplierFormality === "informal" && buyerSegment === "b2b") {
      throw new Error("B2B cannot purchase informal grocery stock (D-49)");
    }
  }

  const primary = cart.lines[0]!;
  if (!getActiveFxRate()) {
    setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "g1_grocery_stub" });
  }

  const orderId = `gord_${cart.id}`;
  const snapshot = freezeOfferSnapshot({
    orderId,
    supplierDisplayName: primary.supplierDisplayName,
    formality: primary.supplierFormality,
    amountUsdMinor: cart.total.amountMinor,
  });

  const pay = await createCheckoutPayment({
    choice: input.payChoice,
    orderId,
    amountUsdMinor: cart.total.amountMinor,
    idempotencyKey:
      input.idempotencyKey ?? `g1-${input.payChoice}-${cart.id}`,
  });

  let journalId: string | undefined;
  let fiscalIds: string[] | undefined;
  let webhook: "captured" | "skipped_cod" = "skipped_cod";

  // EcoCash: reuse PD4 admit → ledger → FiscalReceiptQueued (no parallel money SoR).
  if (input.payChoice === "ecocash" && pay.intent) {
    const pspEventId = `g1_eco_${cart.id}_${pay.intent.id}`;
    const admitted = admitPspWebhookEvent({
      eventId: pspEventId,
      intentId: pay.intent.id,
      signatureValid: true,
      action: "capture",
    });
    if (admitted === "captured") {
      const settled = await completePspCaptureSettlement({
        intentId: pay.intent.id,
        pspEventId,
        dialFeeUsdMinor: 50n,
        channel: "web",
      });
      journalId = settled.journalId;
      fiscalIds = settled.fiscalIds;
      webhook = "captured";
    }
  }

  const reserve = await authorizeJobReserve({
    jobId: `gjob_${orderId}`,
    amountUsdMinor: cart.total.amountMinor,
    idempotencyKey: `g1-jr-${cart.id}`,
  });

  const delivery = createDeliveryJob({
    orderId,
    from: "supplier_hub_harare",
    to: input.deliveryTo ?? "customer_harare_metro",
    ...(input.payChoice === "cod"
      ? { codUsdMinor: cart.total.amountMinor }
      : {}),
  });

  const fxRateId = pay.intent?.fxRateId ?? pay.codOrder?.fxRateId;
  const displayPayableCurrency = pay.intent?.displayPayable?.currency;

  return {
    cart,
    snapshotId: snapshot.offerSnapshotId,
    soldBy: snapshot.soldBy,
    ...(pay.intent?.id ? { intentId: pay.intent.id } : {}),
    ...(pay.codOrder?.id ? { codOrderId: pay.codOrder.id } : {}),
    ...(fxRateId ? { fxRateId } : {}),
    ...(displayPayableCurrency ? { displayPayableCurrency } : {}),
    jobReserveId: reserve.id,
    deliveryJobId: delivery.id,
    ...(journalId ? { journalId } : {}),
    ...(fiscalIds ? { fiscalIds } : {}),
    webhook,
    currency: "USD",
    imttOnCheckoutLines: false,
    g10Claimed: false,
  };
}

/** G10 sandbox dogfood — food order → JR → delivery → POD (same module; g10Claimed=false). */
export async function runG1GroceryFoodSandboxDogfood(input?: {
  payChoice?: CheckoutPayChoice;
  offerId?: string;
}): Promise<
  G1ThinResult & {
    podStatus: string;
    codReconciled: boolean;
  }
> {
  const courierId = "cour_g10_dogfood";
  setCourierAvailable(courierId, true);
  const result = await runG1GroceryThinVertical({
    offerId: input?.offerId ?? "groc_milk_1l",
    payChoice: input?.payChoice ?? "ecocash",
    buyerSegment: "b2c",
    idempotencyKey: `g10-spine-${Date.now()}`,
  });
  startDeliveryDispatchWorkflow(result.deliveryJobId);
  const job = getDeliveryJob(result.deliveryJobId)!;
  const offerId = job.offerId!;
  acceptOffer(offerId, courierId);
  startTransit(result.deliveryJobId);
  postCourierLocation({
    courierId,
    lat: -17.8252,
    lng: 31.0335,
    jobId: result.deliveryJobId,
  });
  capturePod(result.deliveryJobId, {
    photoRef: "g10_pod_photo",
    gpsLat: -17.8252,
    gpsLng: 31.0335,
  });
  const cod = reconcileCodAfterPod(result.deliveryJobId);
  const final = getDeliveryJob(result.deliveryJobId)!;
  return {
    ...result,
    podStatus: final.status,
    codReconciled: cod.reconciled,
  };
}

/** Browse helper — session-scoped; excludes liquor/age-gate SKUs. */
export function browseGroceryForSession(
  q: string,
  sessionRole: SearchSessionRole,
) {
  const hits = searchGroceryOffers(q, { sessionRole });
  return {
    hits,
    currency: "USD" as const,
    meiliIndex: "grocery_offers_v1",
    sessionRole,
  };
}
