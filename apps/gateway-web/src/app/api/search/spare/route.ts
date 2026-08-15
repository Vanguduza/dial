/**
 * Pack §10 Spare search proxy — `GET /api/search/spare` (PD2 + PD95 facets).
 * Session buyerSegment drives B2B formal-only filter (D-49). Never trust body role.
 * Fixture: in-memory catalogue. Sandbox/live: Meili HTTP with session filter.
 */
import { NextResponse } from "next/server";
import {
  meiliFilterForSession,
  searchOffersAsync,
  type OfferAvailability,
  type SearchSessionRole,
  type StubOffer,
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
  const brand = url.searchParams.get("brand") ?? undefined;
  const qualityTierRaw = url.searchParams.get("qualityTier");
  const availabilityRaw = url.searchParams.get("availability");
  const collection = url.searchParams.get("collection") ?? undefined;

  // D-47: ignore any client-supplied role/userId query params for AuthZ.
  if (url.searchParams.has("role") || url.searchParams.has("userId")) {
    return NextResponse.json(
      { error: "role/userId from query rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }

  const qualityTier =
    qualityTierRaw === "OEM" ||
    qualityTierRaw === "OES" ||
    qualityTierRaw === "Aftermarket"
      ? (qualityTierRaw as StubOffer["qualityTier"])
      : undefined;
  const availability =
    availabilityRaw === "available" ||
    availabilityRaw === "confirm_required" ||
    availabilityRaw === "sourcing"
      ? (availabilityRaw as OfferAvailability)
      : undefined;

  const sessionRole = sessionRoleFromRequest(req);
  try {
    const result = await searchOffersAsync(q, {
      sessionRole,
      facets: {
        ...(brand ? { brand } : {}),
        ...(qualityTier ? { qualityTier } : {}),
        ...(availability ? { availability } : {}),
        ...(chassis ? { chassis } : {}),
        ...(collection ? { collection } : {}),
      },
    });
    const filtered =
      chassis && chassis.trim() && !result.facetsApplied?.chassis
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
      collections: result.collections ?? [],
      facetsApplied: result.facetsApplied ?? {},
      hits: filtered.map((h) => ({
        offerId: h.offerId,
        title: h.title,
        unitPriceUsdMinor: h.unitPriceUsdMinor.toString(),
        qualityTier: h.qualityTier,
        availability: h.availability ?? "available",
        fitmentConfidence: h.fitmentConfidence ?? 0.8,
        offerSource: h.offerSource,
        supplierFormality: h.supplierFormality,
        oem: h.oem,
        brand: h.brand,
        soldBy: `${h.brand} Agency`,
        rawQtyExposed: false,
      })),
      payableFromAi: false,
      note: "PD95 — collections + facets (Pack §9.2)",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "search failed" },
      { status: 503 },
    );
  }
}
