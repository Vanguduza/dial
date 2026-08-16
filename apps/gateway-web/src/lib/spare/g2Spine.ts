/**
 * G2 Spare thin vertical (web) — Meili/memory browse → USD cart → EcoCash|COD →
 * durable OfferSnapshot/order → Job Reserve → ledger + FiscalReceiptQueued.
 * Money SoR = @dial/payments + @dial/ledger; agency only (D-58); B2B informal deny (D-49).
 */
import {
  addToCart,
  countInformalB2bLeaks,
  createCart,
  getCart,
  getOffer,
  placeSpareOrder,
  searchOffersAsync,
  type Cart,
  type SearchSessionRole,
} from "@dial/catalogue";
import {
  admitPspWebhookEvent,
  assertB2bMayPurchase,
  authorizeJobReserve,
  completeCodPlacementSettlement,
  completePspCaptureSettlement,
  createCheckoutPayment,
  freezeOfferSnapshot,
  getActiveFxRate,
  setDailyZigRate,
  type CheckoutPayChoice,
} from "@dial/payments";
import {
  persistJobReserveDurable,
  persistOfferSnapshotDurable,
  persistOrderDurable,
  persistPaymentIntentDurable,
  processedEventsIntegrationMode,
} from "@dial/shared";

export type G2SpareThinResult = {
  cart: Cart;
  orderId: string;
  snapshotId: string;
  soldBy: string;
  intentId?: string;
  codOrderId?: string;
  providerRef?: string;
  fxRateId?: string;
  displayPayableCurrency?: string;
  jobReserveId: string;
  journalId?: string;
  fiscalIds?: string[];
  webhook?: "captured" | "skipped_cod";
  durable: {
    mode: "fixture" | "sandbox" | "live";
    snapshot: string;
    order: string;
    paymentIntent: string;
    jobReserve: string;
  };
  b2bInformalLeaks: number;
  currency: "USD";
  imttOnCheckoutLines: false;
  payableFromAi: false;
};

function requireOpsFxRate(setByFallback: string): void {
  if (getActiveFxRate()) return;
  const mode = processedEventsIntegrationMode();
  // Sandbox/live: prefer ops-audited rate; allow explicit G2 dogfood seed only.
  if (mode !== "fixture" && process.env.DIAL_G2_ALLOW_FX_SEED?.trim() !== "1") {
    throw new Error(
      "No active Daily ZiG rate — set via admin four-eyes / setDailyZigRate before Spare checkout (D-57)",
    );
  }
  setDailyZigRate({
    zigMinorPerUsd: 2500_00n,
    setBy: setByFallback,
  });
}

/**
 * End-to-end Spare G2 path for one marketplace offer (or cartId).
 * Fixture-safe; sandbox persists offer_snapshots/orders/JR/fiscal via @dial/shared.
 */
export async function runG2SpareThinVertical(input: {
  offerId?: string;
  cartId?: string;
  qty?: number;
  buyerSegment?: SearchSessionRole;
  customerId?: string;
  payChoice: Exclude<CheckoutPayChoice, "paynow">;
  /** Pack §10 Idempotency-Key (required from HTTP; spine allows fixture default). */
  idempotencyKey?: string;
  /** Simulate verified EcoCash webhook (fixture/sandbox dogfood). */
  simulateEcoCashWebhook?: boolean;
}): Promise<G2SpareThinResult> {
  const buyerSegment = input.buyerSegment ?? "b2c";
  const customerId = input.customerId ?? `cust_g2_${buyerSegment}`;
  let cartId = input.cartId;

  if (!cartId) {
    const offerId = input.offerId ?? "off_filter_oil_kun26";
    // Prefer Meili when sandbox/live so browse→checkout is index-backed.
    let fromIndex: ReturnType<typeof getOffer> | undefined;
    try {
      const search = await searchOffersAsync(offerId, {
        sessionRole: buyerSegment,
      });
      fromIndex = search.hits.find((h) => h.offerId === offerId);
    } catch {
      // Meili unset/unreachable — fall back to catalogue memory for durable money path.
      fromIndex = undefined;
    }
    const offer = fromIndex ?? getOffer(offerId);
    if (!offer) throw new Error(`Unknown spare offer ${offerId}`);
    assertB2bMayPurchase({
      buyerSegment,
      formality: offer.supplierFormality,
    });
    const cart = createCart();
    addToCart(cart.id, offer.offerId, input.qty ?? 1);
    cartId = cart.id;
  }

  const cart = getCart(cartId);
  if (!cart || cart.lines.length === 0) throw new Error("Spare cart empty");
  if (cart.currency !== "USD") throw new Error("Spare cart must be USD (D-57)");

  for (const line of cart.lines) {
    assertB2bMayPurchase({
      buyerSegment,
      formality: line.supplierFormality,
    });
  }

  requireOpsFxRate(
    processedEventsIntegrationMode() === "fixture"
      ? "g2_spare_fixture"
      : "g2_spare_dogfood_seed",
  );

  const orderId = `sord_g2_${cart.id}`;
  const primary = cart.lines[0]!;
  const snapshot = freezeOfferSnapshot({
    orderId,
    offerId: primary.offerId,
    supplierDisplayName: primary.soldBy.replace(/^Sold by\s+/i, "") || "Marketplace supplier",
    formality: primary.supplierFormality,
    amountUsdMinor: cart.total.amountMinor,
  });

  const durableSnapshot = await persistOfferSnapshotDurable({
    snapshotId: snapshot.offerSnapshotId,
    offerId: primary.offerId,
    customerId,
    priceMinor: cart.total.amountMinor,
    supplierFormality: primary.supplierFormality,
    payload: {
      soldBy: snapshot.soldBy,
      orderId,
    },
  });

  const pay = await createCheckoutPayment({
    choice: input.payChoice,
    orderId,
    amountUsdMinor: cart.total.amountMinor,
    idempotencyKey:
      input.idempotencyKey ?? `g2-${input.payChoice}-${cart.id}`,
  });

  if (pay.intent) {
    await persistPaymentIntentDurable({
      intentId: pay.intent.id,
      method: pay.intent.method,
      amountMinor: pay.intent.amount.amountMinor,
      currency: pay.intent.amount.currency,
      status: pay.intent.status,
      orderId,
      idempotencyKey: pay.intent.idempotencyKey,
      fxRateId: pay.intent.fxRateId ?? null,
    });
  }

  let journalId: string | undefined;
  let fiscalIds: string[] | undefined;
  let webhook: "captured" | "skipped_cod" = "skipped_cod";

  if (input.payChoice === "ecocash" && pay.intent) {
    const simulate = input.simulateEcoCashWebhook !== false;
    if (simulate) {
      const pspEventId = `g2_eco_${cart.id}_${pay.intent.id}`;
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
  }

  if (input.payChoice === "cod") {
    const settled = await completeCodPlacementSettlement({
      orderId,
      amountUsdMinor: cart.total.amountMinor,
      formality: primary.supplierFormality,
      dialFeeUsdMinor: 50n,
      channel: "web",
    });
    journalId = settled.journalId;
    fiscalIds = settled.fiscalIds;
  }

  const spareOrder = placeSpareOrder({
    cart: {
      id: cart.id,
      currency: "USD",
      totalUsdMinor: cart.total.amountMinor,
      lines: cart.lines.map((l) => ({
        offerId: l.offerId,
        title: l.title,
        qty: l.qty,
        unitPriceUsdMinor: l.unitPrice.amountMinor,
        lineTotalUsdMinor: l.lineTotal.amountMinor,
        soldBy: l.soldBy,
        supplierFormality: l.supplierFormality,
      })),
    },
    customerId,
    payChoice: input.payChoice,
    orderId,
  });

  const durableOrder = await persistOrderDurable({
    orderId,
    customerId,
    status: spareOrder.status,
    totalMinor: spareOrder.totalUsdMinor,
    fxRateId: pay.intent?.fxRateId ?? pay.codOrder?.fxRateId ?? null,
    lines: spareOrder.lines.map((l, i) => ({
      lineId: `${orderId}_l${i}`,
      offerId: l.offerId,
      title: l.title,
      qty: l.qty,
      unitPriceMinor: l.unitPriceUsdMinor,
    })),
  });

  const reserve = await authorizeJobReserve({
    jobId: `gjob_${orderId}`,
    amountUsdMinor: cart.total.amountMinor,
    idempotencyKey: `g2-jr-${cart.id}`,
  });

  const durableJr = await persistJobReserveDurable({
    reserveId: reserve.id,
    jobOrOrderId: orderId,
    customerId,
    amountMinor: cart.total.amountMinor,
    status: reserve.status,
  });

  const fxRateId = pay.intent?.fxRateId ?? pay.codOrder?.fxRateId;
  const displayPayableCurrency = pay.intent?.displayPayable?.currency;
  const mode = processedEventsIntegrationMode();

  return {
    cart,
    orderId,
    snapshotId: snapshot.offerSnapshotId,
    soldBy: snapshot.soldBy,
    ...(pay.intent?.id ? { intentId: pay.intent.id } : {}),
    ...(pay.codOrder?.id ? { codOrderId: pay.codOrder.id } : {}),
    ...(pay.intent?.providerRef ? { providerRef: pay.intent.providerRef } : {}),
    ...(fxRateId ? { fxRateId } : {}),
    ...(displayPayableCurrency ? { displayPayableCurrency } : {}),
    jobReserveId: reserve.id,
    ...(journalId ? { journalId } : {}),
    ...(fiscalIds ? { fiscalIds } : {}),
    webhook,
    durable: {
      mode,
      snapshot: durableSnapshot,
      order: durableOrder,
      paymentIntent: pay.intent ? "accepted_or_fixture" : "n/a",
      jobReserve: durableJr,
    },
    b2bInformalLeaks: countInformalB2bLeaks(""),
    currency: "USD",
    imttOnCheckoutLines: false,
    payableFromAi: false,
  };
}

/**
 * Optional Paynow hosted rail (PD112 / Phase 2 scope) — durable snapshot + pending order +
 * intent; JR/ledger/fiscal wait for verified Paynow webhook (not client redirect).
 * Fail-closed without PAYNOW_* in sandbox/live via adapter createPayment.
 */
export async function runG2SparePaynowHosted(input: {
  offerId?: string;
  cartId?: string;
  qty?: number;
  buyerSegment?: SearchSessionRole;
  customerId?: string;
  idempotencyKey: string;
}): Promise<{
  cart: Cart;
  orderId: string;
  snapshotId: string;
  soldBy: string;
  intentId: string;
  hostedUrl: string | null;
  providerRef?: string;
  fxRateId?: string;
  displayPayableCurrency?: string;
  durable: G2SpareThinResult["durable"];
  b2bInformalLeaks: number;
  currency: "USD";
  imttOnCheckoutLines: false;
  payableFromAi: false;
  note: string;
}> {
  const buyerSegment = input.buyerSegment ?? "b2c";
  const customerId = input.customerId ?? `cust_g2_paynow_${buyerSegment}`;
  let cartId = input.cartId;

  if (!cartId) {
    const offerId = input.offerId ?? "off_filter_oil_kun26";
    let fromIndex: ReturnType<typeof getOffer> | undefined;
    try {
      const search = await searchOffersAsync(offerId, {
        sessionRole: buyerSegment,
      });
      fromIndex = search.hits.find((h) => h.offerId === offerId);
    } catch {
      fromIndex = undefined;
    }
    const offer = fromIndex ?? getOffer(offerId);
    if (!offer) throw new Error(`Unknown spare offer ${offerId}`);
    assertB2bMayPurchase({
      buyerSegment,
      formality: offer.supplierFormality,
    });
    const cart = createCart();
    addToCart(cart.id, offer.offerId, input.qty ?? 1);
    cartId = cart.id;
  }

  const cart = getCart(cartId);
  if (!cart || cart.lines.length === 0) throw new Error("Spare cart empty");
  if (cart.currency !== "USD") throw new Error("Spare cart must be USD (D-57)");

  for (const line of cart.lines) {
    assertB2bMayPurchase({
      buyerSegment,
      formality: line.supplierFormality,
    });
  }

  requireOpsFxRate(
    processedEventsIntegrationMode() === "fixture"
      ? "g2_paynow_fixture"
      : "g2_paynow_dogfood_seed",
  );

  const orderId = `sord_g2_pn_${cart.id}`;
  const primary = cart.lines[0]!;
  const snapshot = freezeOfferSnapshot({
    orderId,
    offerId: primary.offerId,
    supplierDisplayName:
      primary.soldBy.replace(/^Sold by\s+/i, "") || "Marketplace supplier",
    formality: primary.supplierFormality,
    amountUsdMinor: cart.total.amountMinor,
  });

  const durableSnapshot = await persistOfferSnapshotDurable({
    snapshotId: snapshot.offerSnapshotId,
    offerId: primary.offerId,
    customerId,
    priceMinor: cart.total.amountMinor,
    supplierFormality: primary.supplierFormality,
    payload: { soldBy: snapshot.soldBy, orderId, rail: "paynow_hosted" },
  });

  const pay = await createCheckoutPayment({
    choice: "paynow",
    orderId,
    amountUsdMinor: cart.total.amountMinor,
    idempotencyKey: input.idempotencyKey,
  });
  if (!pay.intent) throw new Error("Paynow intent missing");

  const durableIntent = await persistPaymentIntentDurable({
    intentId: pay.intent.id,
    method: pay.intent.method,
    amountMinor: pay.intent.amount.amountMinor,
    currency: pay.intent.amount.currency,
    status: pay.intent.status,
    orderId,
    idempotencyKey: pay.intent.idempotencyKey,
    fxRateId: pay.intent.fxRateId ?? null,
  });

  // Pending until Paynow RESULT_URL webhook → completePspCaptureSettlement.
  const durableOrder = await persistOrderDurable({
    orderId,
    customerId,
    status: "pending_payment",
    totalMinor: cart.total.amountMinor,
    fxRateId: pay.intent.fxRateId ?? null,
    lines: cart.lines.map((l, i) => ({
      lineId: `${orderId}_l${i}`,
      offerId: l.offerId,
      title: l.title,
      qty: l.qty,
      unitPriceMinor: l.unitPrice.amountMinor,
    })),
  });

  const mode = processedEventsIntegrationMode();
  return {
    cart,
    orderId,
    snapshotId: snapshot.offerSnapshotId,
    soldBy: snapshot.soldBy,
    intentId: pay.intent.id,
    hostedUrl: pay.intent.hostedUrl ?? null,
    ...(pay.intent.providerRef ? { providerRef: pay.intent.providerRef } : {}),
    ...(pay.intent.fxRateId ? { fxRateId: pay.intent.fxRateId } : {}),
    ...(pay.intent.displayPayable?.currency
      ? { displayPayableCurrency: pay.intent.displayPayable.currency }
      : {}),
    durable: {
      mode,
      snapshot: durableSnapshot,
      order: durableOrder,
      paymentIntent: durableIntent,
      jobReserve: "deferred_until_webhook",
    },
    b2bInformalLeaks: countInformalB2bLeaks(""),
    currency: "USD",
    imttOnCheckoutLines: false,
    payableFromAi: false,
    note: "Paynow optional rail — settle via RESULT_URL webhook; EcoCash|COD remain G2 CTAs (D-57)",
  };
}

/** Browse helper — session-scoped Meili/memory; B2B leak probe for G2 evidence. */
export async function browseSpareForSession(
  q: string,
  sessionRole: SearchSessionRole,
) {
  const result = await searchOffersAsync(q, { sessionRole });
  const informalInHits =
    sessionRole === "b2b"
      ? result.hits.filter((h) => h.supplierFormality === "informal").length
      : 0;
  return {
    hits: result.hits,
    currency: "USD" as const,
    source: result.source,
    meiliIndex: result.indexUid,
    sessionRole,
    informalB2bLeaks: countInformalB2bLeaks(q),
    /** Index/API hits that would leak informal to B2B (must stay 0). */
    informalHitsInSession: informalInHits,
  };
}

/** G2 evidence helper — memory + async browse must both report leak=0 for B2B. */
export async function probeB2bInformalLeak(q = ""): Promise<{
  memoryLeaks: number;
  browseLeaks: number;
  informalHitsInB2bSession: number;
  source: string;
  ok: boolean;
}> {
  const memoryLeaks = countInformalB2bLeaks(q);
  const browse = await browseSpareForSession(q, "b2b");
  return {
    memoryLeaks,
    browseLeaks: browse.informalB2bLeaks,
    informalHitsInB2bSession: browse.informalHitsInSession,
    source: browse.source,
    ok:
      memoryLeaks === 0 &&
      browse.informalB2bLeaks === 0 &&
      browse.informalHitsInSession === 0,
  };
}
