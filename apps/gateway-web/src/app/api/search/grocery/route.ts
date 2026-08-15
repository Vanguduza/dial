/**
 * Pack grocery search proxy — `GET /api/search/grocery` (G1 + PD135 facets).
 * Session buyerSegment drives B2B formal-only filter (D-49). Never trust body role.
 */
import { NextResponse } from "next/server";
import {
  groceryMeiliFilterForSession,
  searchGroceryOffersWithFacets,
  type GroceryAvailability,
  type GroceryColdChain,
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
  const q = url.searchParams.get("q") ?? "";
  const brand = url.searchParams.get("brand") ?? undefined;
  const availabilityRaw = url.searchParams.get("availability");
  const coldChainRaw = url.searchParams.get("coldChain");
  const collection = url.searchParams.get("collection") ?? undefined;

  if (url.searchParams.has("role") || url.searchParams.has("userId")) {
    return NextResponse.json(
      { error: "role/userId from query rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }

  const availability =
    availabilityRaw === "available" ||
    availabilityRaw === "confirm_required" ||
    availabilityRaw === "sourcing"
      ? (availabilityRaw as GroceryAvailability)
      : undefined;
  const coldChain =
    coldChainRaw === "ambient" ||
    coldChainRaw === "chilled" ||
    coldChainRaw === "frozen" ||
    coldChainRaw === "fragile"
      ? (coldChainRaw as GroceryColdChain)
      : undefined;

  const sessionRole = sessionRoleFromRequest(req);
  try {
    const result = searchGroceryOffersWithFacets(q, {
      sessionRole,
      facets: {
        ...(brand ? { brand } : {}),
        ...(availability ? { availability } : {}),
        ...(coldChain ? { coldChain } : {}),
        ...(collection ? { collection } : {}),
      },
    });

    return NextResponse.json({
      q,
      sessionRole,
      meiliFilter: groceryMeiliFilterForSession(sessionRole),
      indexUid: "grocery_offers_v1",
      currency: "USD",
      vertical: "grocery",
      liquorSkus: false,
      liquorAllowed: false,
      collections: result.collections,
      facetsApplied: result.facetsApplied,
      hits: result.hits.map((h) => ({
        offerId: h.offerId,
        title: h.title,
        brand: h.brand,
        unitPriceUsdMinor: h.unitPriceUsdMinor.toString(),
        unitLabel: h.unitLabel,
        availability: h.availability,
        coldChain: h.coldChain,
        categoryPath: h.categoryPath,
        offerSource: h.offerSource,
        supplierFormality: h.supplierFormality,
        supplierDisplayName: h.supplierDisplayName,
        soldBy: h.supplierDisplayName,
        rawQtyExposed: false,
      })),
      payableFromAi: false,
      note: "PD135 — grocery facets; food/pantry only (Pack §9.2)",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "search failed" },
      { status: 503 },
    );
  }
}
