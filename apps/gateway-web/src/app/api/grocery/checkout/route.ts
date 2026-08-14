/**
 * G1 grocery checkout API — EcoCash|COD → Job Reserve → delivery job (food/pantry).
 */
import { NextResponse } from "next/server";
import { runG1GroceryThinVertical } from "../../../../lib/grocery/g1Spine";
import {
  getSessionFromToken,
  parseSessionCookie,
} from "../../../../lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  let offerId = "groc_milk_1l";
  let choice: "ecocash" | "cod" = "ecocash";

  if (contentType.includes("application/json")) {
    const body = (await req.json()) as {
      offerId?: string;
      choice?: string;
      userId?: string;
      role?: string;
    };
    if (body.userId !== undefined || body.role !== undefined) {
      return NextResponse.json(
        { error: "userId/role from body rejected — session SoR only (D-47)" },
        { status: 400 },
      );
    }
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
    offerId = String(form.get("offerId") ?? offerId);
    const c = String(form.get("choice") ?? "ecocash");
    choice = c === "cod" ? "cod" : "ecocash";
  }

  const session = getSessionFromToken(
    parseSessionCookie(req.headers.get("cookie")),
  );
  const buyerSegment = session?.buyerSegment === "b2b" ? "b2b" : "b2c";

  try {
    const result = await runG1GroceryThinVertical({
      offerId,
      payChoice: choice,
      buyerSegment,
    });
    return NextResponse.json({
      ok: true,
      ...result,
      cartTotalUsdMinor: result.cart.total.amountMinor.toString(),
      note: "IMTT not on checkout lines (D-60); liquor blocked",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "grocery checkout failed";
    const status = /B2B|informal|Liquor|DIAL_OWNED/.test(msg) ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
