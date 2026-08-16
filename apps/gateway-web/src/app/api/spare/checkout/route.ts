/**
 * Spare checkout API — EcoCash|COD via G2 spine (D-57 / G2 durable path).
 * Paynow remains optional hosted rail (PD112) — not G2 exit path.
 * PD96: promo draft on cart (not payable). PD97: Idempotency-Key required.
 */
import { NextResponse } from "next/server";
import { getAppliedPromoDraft } from "@dial/promotions";
import {
  requireIdempotencyKey,
  type CheckoutPayChoice,
} from "@dial/payments";
import {
  getSessionFromToken,
  parseSessionCookie,
} from "../../../../lib/auth/session";
import {
  runG2SparePaynowHosted,
  runG2SpareThinVertical,
} from "../../../../lib/spare/g2Spine";
import { takeRouteRateLimit } from "../../../../lib/http/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = await takeRouteRateLimit({
    key: `checkout:${req.headers.get("x-forwarded-for") ?? "local"}`,
    limit: 40,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterMs: limited.retryAfterMs },
      { status: 429 },
    );
  }
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
    if (
      body.choice === "cod" ||
      body.choice === "ecocash" ||
      body.choice === "paynow"
    ) {
      choice = body.choice;
    }
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

  if (!offerId && !cartId) {
    return NextResponse.json({ error: "offerId or cartId required" }, { status: 400 });
  }

  try {
    // Optional Paynow hosted rail — durable pending order; settle via webhook (not G2 exit).
    if (choice === "paynow") {
      const paynow = await runG2SparePaynowHosted({
        ...(offerId ? { offerId } : {}),
        ...(cartId ? { cartId } : {}),
        qty,
        buyerSegment,
        customerId: session.userId,
        idempotencyKey,
      });
      return NextResponse.json({
        ok: true,
        cartId: paynow.cart.id,
        orderId: paynow.orderId,
        currency: "USD",
        cartTotalUsdMinor: paynow.cart.total.amountMinor.toString(),
        snapshotId: paynow.snapshotId,
        soldBy: paynow.soldBy,
        intentId: paynow.intentId,
        hostedUrl: paynow.hostedUrl,
        providerRef: paynow.providerRef ?? null,
        fxRateId: paynow.fxRateId,
        displayPayableCurrency: paynow.displayPayableCurrency,
        durable: paynow.durable,
        b2bInformalLeaks: paynow.b2bInformalLeaks,
        choice: "paynow",
        imttOnCheckoutLines: false,
        idempotencyKey,
        payableFromAi: false,
        note: paynow.note,
      });
    }

    const result = await runG2SpareThinVertical({
      ...(offerId ? { offerId } : {}),
      ...(cartId ? { cartId } : {}),
      qty,
      buyerSegment,
      customerId: session.userId,
      payChoice: choice,
      idempotencyKey,
      simulateEcoCashWebhook: true,
    });

    const promoDraft = getAppliedPromoDraft(result.cart.id);

    return NextResponse.json({
      ok: true,
      cartId: result.cart.id,
      orderId: result.orderId,
      currency: "USD",
      cartTotalUsdMinor: result.cart.total.amountMinor.toString(),
      snapshotId: result.snapshotId,
      soldBy: result.soldBy,
      intentId: result.intentId,
      codOrderId: result.codOrderId,
      providerRef: result.providerRef ?? null,
      hostedUrl: null,
      fxRateId: result.fxRateId,
      displayPayableCurrency: result.displayPayableCurrency,
      jobReserveId: result.jobReserveId,
      journalId: result.journalId ?? null,
      fiscalIds: result.fiscalIds ?? [],
      webhook: result.webhook,
      durable: result.durable,
      b2bInformalLeaks: result.b2bInformalLeaks,
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
