/**
 * Spare checkout API — EcoCash|COD against @dial/payments (D-57).
 * PD96: promo draft on cart (not payable). PD97: Idempotency-Key required.
 */
import { NextResponse } from "next/server";
import { addToCart, createCart, getCart, getOffer } from "@dial/catalogue";
import { getAppliedPromoDraft } from "@dial/promotions";
import {
  assertB2bMayPurchase,
  createCheckoutPayment,
  freezeOfferSnapshot,
  getActiveFxRate,
  requireIdempotencyKey,
  setDailyZigRate,
  type CheckoutPayChoice,
} from "@dial/payments";
import {
  getSessionFromToken,
  parseSessionCookie,
} from "../../../../lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let idempotencyKey: string;
  try {
    idempotencyKey = requireIdempotencyKey(req.headers);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Idempotency-Key required" },
      { status: 400 },
    );
  }

  const contentType = req.headers.get("content-type") ?? "";
  let offerId = "";
  let qty = 1;
  let choice: CheckoutPayChoice = "ecocash";
  let cartId: string | undefined;

  if (contentType.includes("application/json")) {
    const body = (await req.json()) as {
      offerId?: string;
      qty?: number;
      choice?: string;
      cartId?: string;
      userId?: string;
      role?: string;
    };
    if (body.userId !== undefined || body.role !== undefined) {
      return NextResponse.json(
        { error: "userId/role from body rejected — session SoR only (D-47)" },
        { status: 400 },
      );
    }
    offerId = (body.offerId ?? "").trim();
    qty = typeof body.qty === "number" && body.qty >= 1 ? body.qty : 1;
    if (body.choice === "cod" || body.choice === "ecocash") choice = body.choice;
    cartId = body.cartId;
  } else {
    return NextResponse.json({ error: "application/json required" }, { status: 415 });
  }

  const session = getSessionFromToken(
    parseSessionCookie(req.headers.get("cookie")),
  );
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const buyerSegment = session.buyerSegment === "b2b" ? "b2b" : "b2c";

  try {
    let cart = cartId ? getCart(cartId) : undefined;
    if (!cart) {
      if (!offerId) {
        return NextResponse.json({ error: "offerId or cartId required" }, { status: 400 });
      }
      const offer = getOffer(offerId);
      if (!offer) {
        return NextResponse.json({ error: "Unknown offer" }, { status: 404 });
      }
      assertB2bMayPurchase({
        buyerSegment,
        formality: offer.supplierFormality,
      });
      cart = createCart();
      addToCart(cart.id, offerId, qty);
      cart = getCart(cart.id)!;
    }
    if (cart.currency !== "USD") {
      return NextResponse.json({ error: "Cart must be USD (D-57)" }, { status: 400 });
    }
    if (cart.lines.length === 0) {
      return NextResponse.json({ error: "Cart empty" }, { status: 400 });
    }

    if (!getActiveFxRate()) {
      setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "spare_api_checkout_stub" });
    }

    const orderId = `ord_${cart.id}`;
    const primary = cart.lines[0]!;
    const offer = getOffer(primary.offerId);
    const snapshot = freezeOfferSnapshot({
      orderId,
      supplierDisplayName: offer?.brand ?? "Marketplace supplier",
      formality: offer?.supplierFormality ?? "formal",
      amountUsdMinor: cart.total.amountMinor,
    });

    const promoDraft = getAppliedPromoDraft(cart.id);

    const pay = await createCheckoutPayment({
      choice,
      orderId,
      amountUsdMinor: cart.total.amountMinor,
      idempotencyKey,
    });

    return NextResponse.json({
      ok: true,
      cartId: cart.id,
      currency: "USD",
      cartTotalUsdMinor: cart.total.amountMinor.toString(),
      snapshotId: snapshot.offerSnapshotId,
      soldBy: snapshot.soldBy,
      intentId: pay.intent?.id,
      codOrderId: pay.codOrder?.id,
      fxRateId: pay.intent?.fxRateId ?? pay.codOrder?.fxRateId,
      displayPayableCurrency: pay.intent?.displayPayable?.currency,
      choice,
      imttOnCheckoutLines: false,
      promoDraft: promoDraft
        ? {
            code: promoDraft.code,
            draftDiscountPercent: promoDraft.draftDiscountPercent,
            payableFromAi: false,
            note: "PD96 — draft only; pricing engine applies payable",
          }
        : null,
      idempotencyKey,
      payableFromAi: false,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "checkout failed";
    const status = /B2B|informal|Unauthorized/.test(msg) ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
