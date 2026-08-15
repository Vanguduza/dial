/**
 * PD27 dual-entry API — Select Vehicle / Browse EPC (Pack §9.2 / C-6).
 * Session buyerSegment for B2B informal hide (D-49). USD only (D-57).
 */
import { NextResponse } from "next/server";
import {
  dualEntrySnapshot,
  getVehicleByChassis,
  listCatalogAssemblies,
  listCatalogGroups,
  listCatalogParts,
  listVehicleMakes,
  listVehicleModels,
  searchOffersByChassis,
  selectVehicles,
} from "@dial/catalogue";
import {
  getSessionFromToken,
  parseSessionCookie,
} from "../../../../lib/auth/session";

export const runtime = "nodejs";

function sessionRole(req: Request): "b2c" | "b2b" {
  const session = getSessionFromToken(
    parseSessionCookie(req.headers.get("cookie")),
  );
  return session?.buyerSegment === "b2b" ? "b2b" : "b2c";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.has("userId") || url.searchParams.has("role")) {
    return NextResponse.json(
      { error: "role/userId from query rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }

  const view = url.searchParams.get("view") ?? "entry";
  const role = sessionRole(req);

  try {
    if (view === "entry") {
      return NextResponse.json({
        ok: true,
        ...dualEntrySnapshot(),
        makes: listVehicleMakes(),
        groups: listCatalogGroups(),
        sessionRole: role,
        note: "Dual entry: Select Vehicle (vehicle_master) | Browse EPC (catalog_*) — join chassis_code",
      });
    }

    if (view === "models") {
      const make = url.searchParams.get("make") ?? "";
      return NextResponse.json({
        ok: true,
        make,
        models: listVehicleModels(make),
      });
    }

    if (view === "select_vehicle") {
      const make = url.searchParams.get("make") ?? "";
      const model = url.searchParams.get("model") ?? undefined;
      const yearRaw = url.searchParams.get("year");
      const year = yearRaw ? Number(yearRaw) : undefined;
      const vehicles = selectVehicles({
        make,
        ...(model ? { model } : {}),
        ...(year !== undefined && !Number.isNaN(year) ? { year } : {}),
      });
      return NextResponse.json({
        ok: true,
        entryPath: "select_vehicle",
        vehicles,
        displayCurrency: "USD",
      });
    }

    if (view === "epc_assemblies") {
      const groupId = url.searchParams.get("groupId") ?? undefined;
      const chassis = url.searchParams.get("chassis") ?? undefined;
      return NextResponse.json({
        ok: true,
        entryPath: "browse_epc",
        assemblies: listCatalogAssemblies({
          ...(groupId ? { groupId } : {}),
          ...(chassis ? { chassisCode: chassis } : {}),
        }),
      });
    }

    if (view === "epc_parts") {
      const assemblyId = url.searchParams.get("assemblyId") ?? undefined;
      const chassis = url.searchParams.get("chassis") ?? undefined;
      return NextResponse.json({
        ok: true,
        entryPath: "browse_epc",
        parts: listCatalogParts({
          ...(assemblyId ? { assemblyId } : {}),
          ...(chassis ? { chassisCode: chassis } : {}),
        }),
      });
    }

    if (view === "offers") {
      const chassis = url.searchParams.get("chassis") ?? "";
      const entry =
        url.searchParams.get("entry") === "browse_epc"
          ? "browse_epc"
          : "select_vehicle";
      const vehicle = getVehicleByChassis(chassis);
      const hits = searchOffersByChassis({
        chassisCode: chassis,
        sessionRole: role,
        entryPath: entry,
      });
      return NextResponse.json({
        ok: true,
        chassisCode: chassis,
        vehicle: vehicle ?? null,
        entryPath: entry,
        sessionRole: role,
        displayCurrency: "USD",
        reverseEngineeredEpc: false,
        hits: hits.map((h) => ({
          offerId: h.offerId,
          title: h.title,
          unitPriceUsdMinor: h.unitPriceUsdMinor.toString(),
          qualityTier: h.qualityTier,
          supplierFormality: h.supplierFormality,
          oem: h.oem,
          brand: h.brand,
          chassis_codes: h.chassis_codes,
          displayCurrency: h.displayCurrency,
        })),
      });
    }

    return NextResponse.json(
      {
        error:
          "view must be entry|models|select_vehicle|epc_assemblies|epc_parts|offers",
      },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "dual entry failed" },
      { status: 400 },
    );
  }
}
