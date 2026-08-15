/**
 * PD18 / PD50 / PD75 Garage / Vehicle Hub API — reminders need consent (Pack §9.2).
 * Pack §10 set active vehicle.
 */
import { NextResponse } from "next/server";
import {
  addGarageVehicle,
  browsePathForGarageVehicle,
  listGarageConsentAudit,
  listGarageVehicles,
  setActiveGarageVehicle,
  setGarageReminderConsent,
} from "@dial/catalogue";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const customerId = url.searchParams.get("customerId");
  if (!customerId) {
    return NextResponse.json({ error: "customerId required" }, { status: 400 });
  }
  const includeAudit = url.searchParams.get("includeAudit") === "1";
  const vehicles = listGarageVehicles(customerId).map((v) => ({
    ...v,
    browsePath: browsePathForGarageVehicle(v.vehicleId),
  }));
  return NextResponse.json({
    vehicles,
    consentAudit: includeAudit ? listGarageConsentAudit(customerId) : undefined,
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    customerId?: string;
    label?: string;
    chassisHint?: string;
    reminderConsent?: boolean;
  };
  if (!body.customerId || !body.label) {
    return NextResponse.json(
      { error: "customerId and label required" },
      { status: 400 },
    );
  }
  try {
    const vehicle = addGarageVehicle({
      customerId: body.customerId,
      label: body.label,
      chassisHint: body.chassisHint ?? "",
      reminderConsent: body.reminderConsent === true,
    });
    return NextResponse.json({
      ok: true,
      vehicle,
      browsePath: browsePathForGarageVehicle(vehicle.vehicleId),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "garage failed" },
      { status: 400 },
    );
  }
}

/** PD50 consent + PD75 set active. */
export async function PATCH(req: Request) {
  const body = (await req.json()) as {
    vehicleId?: string;
    reminderConsent?: boolean;
    setActive?: boolean;
  };
  if (!body.vehicleId) {
    return NextResponse.json({ error: "vehicleId required" }, { status: 400 });
  }
  try {
    if (body.setActive === true) {
      const vehicle = setActiveGarageVehicle(body.vehicleId);
      return NextResponse.json({
        ok: true,
        vehicle,
        browsePath: browsePathForGarageVehicle(vehicle.vehicleId),
        note: "PD75 — active vehicle set (Pack §10)",
      });
    }
    if (typeof body.reminderConsent !== "boolean") {
      return NextResponse.json(
        { error: "reminderConsent or setActive required" },
        { status: 400 },
      );
    }
    const vehicle = setGarageReminderConsent({
      vehicleId: body.vehicleId,
      reminderConsent: body.reminderConsent,
    });
    return NextResponse.json({
      ok: true,
      vehicle,
      browsePath: browsePathForGarageVehicle(vehicle.vehicleId),
      consentAudit: listGarageConsentAudit(vehicle.customerId),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "garage update failed" },
      { status: 400 },
    );
  }
}
