/**
 * PD14 grocery checkout — requires slot; EcoCash|COD; ZiG only here (D-57).
 * Places grocery order for track after G1 money/delivery spine.
 */
import { NextResponse } from "next/server";
import {
  getGroceryCart,
  placeGroceryOrder,
} from "@dial/catalogue";
import { getActiveFxRate, requireIdempotencyKey, setDailyZigRate, usdToZig } from "@dial/payments";
import { runG1GroceryThinVertical } from "../../../../lib/grocery/g1Spine";
import { requireSession } from "../../../../lib/auth/session";
import { GROCERY_CART_COOKIE } from "../../../../lib/grocery/cookies";

export const runtime = "nodejs";

function cartIdFromCookie(req: Request): string | undefined {
  const raw = req.headers.get("cookie") ?? "";
  const m = raw.match(new RegExp(`${GROCERY_CART_COOKIE}=([^;]+)`));
  return m?.[1] ? decodeURIComponent(m[1]) : undefined;
}

export async function GET(req: Request) {
  const cartId =
    new URL(req.url).searchParams.get("cartId") ?? cartIdFromCookie(req);
  if (!cartId) {
    return NextResponse.json({ error: "cartId required" }, { status: 400 });
  }
  const cart = getGroceryCart(cartId);
  if (!cart) {
    return NextResponse.json({ error: "unknown cart" }, { status: 404 });
  }
  let rate = getActiveFxRate();
  if (!rate) {
    rate = setDailyZigRate({
      zigMinorPerUsd: 2500_00n,
      setBy: "pd14_grocery_checkout_stub",
    });
  }
  const zig = usdToZig(cart.total.amountMinor, rate);
  return NextResponse.json({
    cartId: cart.id,
    slotId: cart.slotId ?? null,
    currency: "USD",
    totalUsdMinor: cart.total.amountMinor.toString(),
    zigPayableMinor: zig.amountMinor.toString(),
    fxRateId: rate.fxRateId,
    zigOnlyAtCheckout: true,
    payButtons: ["ecocash", "cod"],
    slotRequired: true,
  });
}

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
  let cartId = cartIdFromCookie(req);
  let choice: "ecocash" | "cod" = "ecocash";
  let offerId: string | undefined;

  if (contentType.includes("application/json")) {
    const body = (await req.json()) as {
      cartId?: string;
      choice?: string;
      offerId?: string;
      userId?: string;
      role?: string;
    };
    if (body.userId !== undefined || body.role !== undefined) {
      return NextResponse.json(
        { error: "userId/role from body rejected — session SoR only (D-47)" },
        { status: 400 },
      );
    }
    if (body.cartId) cartId = body.cartId;
    if (body.offerId) offerId = body.offerId;
    if (body.choice === "cod" || body.choice === "ecocash") choice = body.choice;
  } else {
    const form = await req.formData();
    if (form.has("userId") || form.has("role")) {
      return NextResponse.json(
        { error: "userId/role from body rejected — session SoR only (D-47)" },
        { status: 400 },
      );
    }
    const fromForm = form.get("cartId");
    if (fromForm) cartId = String(fromForm);
    const oid = form.get("offerId");
    if (oid) offerId = String(oid);
    const c = String(form.get("choice") ?? "ecocash");
    choice = c === "cod" ? "cod" : "ecocash";
  }

  const session = await requireSession(req);
  const buyerSegment = session?.buyerSegment === "b2b" ? "b2b" : "b2c";

  try {
    if (cartId) {
      const cart = getGroceryCart(cartId);
      if (cart && !cart.slotId) {
        return NextResponse.json(
          { error: "Select a delivery slot before checkout (PD14)" },
          { status: 400 },
        );
      }
    }

    const result = await runG1GroceryThinVertical({
      ...(cartId ? { cartId } : {}),
      ...(offerId && !cartId ? { offerId } : {}),
      payChoice: choice,
      buyerSegment,
      idempotencyKey,
    });

    // Legacy G1 form buy without cart slot — allow for G1 compat when only offerId.
    const cart = getGroceryCart(result.cart.id);
    if (cart?.slotId) {
      const order = placeGroceryOrder({
        cartId: result.cart.id,
        payChoice: choice,
        soldBy: result.soldBy,
        deliveryJobId: result.deliveryJobId,
        customerId: session?.userId ?? null,
      });
      return NextResponse.json({
        ok: true,
        snapshotId: result.snapshotId,
        soldBy: result.soldBy,
        intentId: result.intentId ?? null,
        codOrderId: result.codOrderId ?? null,
        fxRateId: result.fxRateId ?? null,
        displayPayableCurrency: result.displayPayableCurrency ?? null,
        jobReserveId: result.jobReserveId,
        deliveryJobId: result.deliveryJobId,
        journalId: result.journalId ?? null,
        fiscalIds: result.fiscalIds ?? null,
        webhook: result.webhook,
        currency: "USD",
        cartTotalUsdMinor: result.cart.total.amountMinor.toString(),
        groceryOrderId: order.orderId,
        trackHref: `/grocery/track?orderId=${encodeURIComponent(order.orderId)}`,
        slotId: cart.slotId,
        zigOnlyAtCheckout: true,
        imttOnCheckoutLines: false,
        idempotencyKey,
        payableFromAi: false,
        note: "IMTT not on checkout lines (D-60); liquor blocked; PD14 slot+track; PD99 Idempotency-Key",
      });
    }

    return NextResponse.json({
      ok: true,
      snapshotId: result.snapshotId,
      soldBy: result.soldBy,
      intentId: result.intentId ?? null,
      codOrderId: result.codOrderId ?? null,
      fxRateId: result.fxRateId ?? null,
      displayPayableCurrency: result.displayPayableCurrency ?? null,
      jobReserveId: result.jobReserveId,
      deliveryJobId: result.deliveryJobId,
      journalId: result.journalId ?? null,
      fiscalIds: result.fiscalIds ?? null,
      webhook: result.webhook,
      currency: "USD",
      cartTotalUsdMinor: result.cart.total.amountMinor.toString(),
      imttOnCheckoutLines: false,
      idempotencyKey,
      payableFromAi: false,
      note: "IMTT not on checkout lines (D-60); liquor blocked; PD99 Idempotency-Key",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "grocery checkout failed";
    const status = /B2B|informal|Liquor|DIAL_OWNED/.test(msg) ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
