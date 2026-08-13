/**
 * Pack §10 Spare search proxy — `GET /api/search/spare`.
 * Session buyerSegment drives B2B formal-only filter (D-49). Never trust body role.
 * Live Meili optional later; stub search via @dial/catalogue (S21).
 */
import { NextResponse } from "next/server";
import {
  meiliFilterForSession,
  searchOffers,
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
  const sessionRole = sessionRoleFromRequest(req);
  const hits = searchOffers(q, { sessionRole });
  const filtered =
    chassis && chassis.trim()
      ? hits.filter(
          (h) =>
            h.title.toLowerCase().includes(chassis.toLowerCase()) ||
            h.oem.toLowerCase().includes(chassis.toLowerCase()),
        )
      : hits;

  return NextResponse.json({
    q,
    sessionRole,
    meiliFilter: meiliFilterForSession(sessionRole),
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
}
