/**
 * G1 grocery search — food/pantry only; session B2B filter (D-49); USD (D-57).
 */
import { NextResponse } from "next/server";
import {
  groceryMeiliFilterForSession,
  searchGroceryOffers,
  type SearchSessionRole,
} from "@dial/catalogue";
import {
  getSessionFromToken,
  parseSessionCookie,
} from "../../../../lib/auth/session";

export const runtime = "nodejs";

function sessionRoleFromRequest(req: Request): SearchSessionRole {
  const token = parseSessionCookie(req.headers.get("cookie"));
  const session = getSessionFromToken(token);
  if (session?.buyerSegment === "b2b") return "b2b";
  return "b2c";
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  if (url.searchParams.has("role") || url.searchParams.has("userId")) {
    return NextResponse.json(
      { error: "role/userId from query rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }
  const q = url.searchParams.get("q") ?? "";
  const sessionRole = sessionRoleFromRequest(req);
  const hits = searchGroceryOffers(q, { sessionRole });
  return NextResponse.json({
    q,
    sessionRole,
    meiliFilter: groceryMeiliFilterForSession(sessionRole),
    indexUid: "grocery_offers_v1",
    currency: "USD",
    vertical: "grocery",
    liquorSkus: false,
    hits: hits.map((h) => ({
      offerId: h.offerId,
      title: h.title,
      unitPriceUsdMinor: h.unitPriceUsdMinor.toString(),
      brand: h.brand,
      unitLabel: h.unitLabel,
      coldChain: h.coldChain,
      offerSource: h.offerSource,
      supplierFormality: h.supplierFormality,
      supplierDisplayName: h.supplierDisplayName,
      categoryPath: h.categoryPath,
    })),
  });
}
