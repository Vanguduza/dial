/**
 * Pack §10 Spare search proxy — `GET /api/search/spare` (PD2).
 * Session buyerSegment drives B2B formal-only filter (D-49). Never trust body role.
 * Fixture: in-memory catalogue. Sandbox/live: Meili HTTP with session filter.
 */
import { NextResponse } from "next/server";
import {
  meiliFilterForSession,
  searchOffersAsync,
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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const chassis = url.searchParams.get("chassis") ?? undefined;

  // D-47: ignore any client-supplied role/userId query params for AuthZ.
  if (url.searchParams.has("role") || url.searchParams.has("userId")) {
    return NextResponse.json(
      { error: "role/userId from query rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }

  const sessionRole = sessionRoleFromRequest(req);
  try {
    const result = await searchOffersAsync(q, { sessionRole });
    const filtered =
      chassis && chassis.trim()
        ? result.hits.filter(
            (h) =>
              h.title.toLowerCase().includes(chassis.toLowerCase()) ||
              h.oem.toLowerCase().includes(chassis.toLowerCase()),
          )
        : result.hits;

    return NextResponse.json({
      q,
      sessionRole,
      meiliFilter: result.meiliFilter || meiliFilterForSession(sessionRole),
      searchSource: result.source,
      indexUid: result.indexUid,
      currency: "USD",
      hits: filtered.map((h) => ({
        offerId: h.offerId,
        title: h.title,
        unitPriceUsdMinor: h.unitPriceUsdMinor.toString(),
        qualityTier: h.qualityTier,
        offerSource: h.offerSource,
        supplierFormality: h.supplierFormality,
        oem: h.oem,
        brand: h.brand,
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "search failed" },
      { status: 503 },
    );
  }
}
