/**
 * PD14 grocery cart API — add lines (USD); session B2B filter (D-49).
 */
import { NextResponse } from "next/server";
import {
  addToGroceryCart,
  createGroceryCart,
  getGroceryCart,
} from "@dial/catalogue";
import {
  getSessionFromToken,
  parseSessionCookie,
} from "../../../../lib/auth/session";

import { GROCERY_CART_COOKIE } from "../../../../lib/grocery/cookies";

export const runtime = "nodejs";

export { GROCERY_CART_COOKIE };

function buyerSegment(req: Request): "b2c" | "b2b" {
  const session = getSessionFromToken(
    parseSessionCookie(req.headers.get("cookie")),
  );
  return session?.buyerSegment === "b2b" ? "b2b" : "b2c";
}

function cartIdFromCookie(req: Request): string | undefined {
  const raw = req.headers.get("cookie") ?? "";
  const m = raw.match(new RegExp(`${GROCERY_CART_COOKIE}=([^;]+)`));
  return m?.[1] ? decodeURIComponent(m[1]) : undefined;
}

export async function GET(req: Request) {
  const cartId = cartIdFromCookie(req) ?? new URL(req.url).searchParams.get("cartId");
  if (!cartId) {
    return NextResponse.json({ cart: null, currency: "USD" });
  }
  const cart = getGroceryCart(cartId);
  if (!cart) return NextResponse.json({ cart: null, currency: "USD" });
  return NextResponse.json({
    cart: {
      ...cart,
      totalUsdMinor: cart.total.amountMinor.toString(),
      lines: cart.lines.map((l) => ({
        ...l,
        unitPriceUsdMinor: l.unitPrice.amountMinor.toString(),
        lineUsdMinor: l.lineTotal.amountMinor.toString(),
      })),
    },
    currency: "USD",
    zigOnCart: false,
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    offerId?: string;
    qty?: number;
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
  const offerId = String(body.offerId ?? "");
  if (!offerId) {
    return NextResponse.json({ error: "offerId required" }, { status: 400 });
  }
  const segment = buyerSegment(req);
  let cartId = body.cartId ?? cartIdFromCookie(req);
  if (!cartId || !getGroceryCart(cartId)) {
    cartId = createGroceryCart().id;
  }
  try {
    const cart = addToGroceryCart(cartId, offerId, body.qty ?? 1, {
      buyerSegment: segment,
    });
    const res = NextResponse.json({
      ok: true,
      cartId: cart.id,
      currency: cart.currency,
      totalUsdMinor: cart.total.amountMinor.toString(),
      lineCount: cart.lines.length,
    });
    res.cookies.set(GROCERY_CART_COOKIE, cart.id, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "add failed";
    const status = /B2B|informal|Liquor|DIAL_OWNED/.test(msg) ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
