/**
 * PD14 grocery delivery slot assign — food only; liquorAllowed always false.
 */
import { NextResponse } from "next/server";
import {
  getGroceryCart,
  listGroceryDeliverySlots,
  setGroceryCartSlot,
} from "@dial/catalogue";
import { GROCERY_CART_COOKIE } from "../../../../lib/grocery/cookies";
import { apiError, newRequestId, parseJsonBody } from "@dial/shared";
import { z } from "zod";
import { requireSession } from "../../../../lib/auth/session.js";

export const runtime = "nodejs";

function cartIdFromCookie(req: Request): string | undefined {
  const raw = req.headers.get("cookie") ?? "";
  const m = raw.match(new RegExp(`${GROCERY_CART_COOKIE}=([^;]+)`));
  return m?.[1] ? decodeURIComponent(m[1]) : undefined;
}

export async function GET() {
  return NextResponse.json({
    slots: listGroceryDeliverySlots(),
    liquorFlows: false,
    note: "Cold-chain notes only — no liquorAllowed product surface",
  });
}

export async function POST(req: Request) {
  const requestId = newRequestId(req.headers.get("x-request-id"));
  const session = await requireSession(req);
  if (!session) {
    return NextResponse.json(apiError("session required", "unauthorized", requestId), {
      status: 401,
    });
  }
  const parsed = await parseJsonBody(
    req,
    z.object({ cartId: z.string().optional(), slotId: z.string() }).strict(),
  );
  if (!parsed.ok) {
    return NextResponse.json(apiError(parsed.error, parsed.code, requestId), {
      status: 400,
    });
  }
  const cartId = parsed.data.cartId ?? cartIdFromCookie(req);
  const slotId = parsed.data.slotId;
  if (!cartId || !getGroceryCart(cartId)) {
    return NextResponse.json(apiError("cart required", "invalid_body", requestId), {
      status: 400,
    });
  }
  try {
    const cart = setGroceryCartSlot(cartId, slotId);
    return NextResponse.json({
      ok: true,
      requestId,
      cartId: cart.id,
      slotId: cart.slotId,
      liquorAllowed: false,
    });
  } catch (e) {
    return NextResponse.json(
      apiError(e instanceof Error ? e.message : "slot failed", "bad_request", requestId),
      { status: 400 },
    );
  }
}
