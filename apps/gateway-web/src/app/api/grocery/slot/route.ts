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
  const body = (await req.json()) as {
    cartId?: string;
    slotId?: string;
    userId?: string;
    role?: string;
  };
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }
  const cartId = body.cartId ?? cartIdFromCookie(req);
  const slotId = String(body.slotId ?? "");
  if (!cartId || !getGroceryCart(cartId)) {
    return NextResponse.json({ error: "cart required" }, { status: 400 });
  }
  if (!slotId) {
    return NextResponse.json({ error: "slotId required" }, { status: 400 });
  }
  try {
    const cart = setGroceryCartSlot(cartId, slotId);
    return NextResponse.json({
      ok: true,
      cartId: cart.id,
      slotId: cart.slotId,
      liquorAllowed: false,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "slot failed" },
      { status: 400 },
    );
  }
}
