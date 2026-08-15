/**
 * PD18 / PD50 / PD75 / PD79 / PD108 Garage / Vehicle Hub API.
 * Pack §9.2 consent + Pack §10 Vehicles CRUD + expiry_reminders.
 */
import { NextResponse } from "next/server";
import {
  addGarageVehicle,
  browsePathForGarageVehicle,
  deleteGarageVehicle,
  listDueVehicleReminders,
  listGarageConsentAudit,
  listGarageVehicles,
  listVehicleReminders,
  scheduleVehicleReminder,
  setActiveGarageVehicle,
  setGarageReminderConsent,
  updateGarageVehicle,
} from "@dial/catalogue";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const customerId = url.searchParams.get("customerId");
  if (!customerId) {
    return NextResponse.json({ error: "customerId required" }, { status: 400 });
  }
  const includeAudit = url.searchParams.get("includeAudit") === "1";
  const view = url.searchParams.get("view");
  if (view === "reminders") {
    return NextResponse.json({
      customerId,
      reminders: listVehicleReminders(customerId),
      due: listDueVehicleReminders(customerId),
      payableFromAi: false,
      note: "PD108 — Vehicle Hub reminders (consent-gated)",
    });
  }
  const vehicles = listGarageVehicles(customerId).map((v) => ({
    ...v,
    browsePath: browsePathForGarageVehicle(v.vehicleId),
  }));
  return NextResponse.json({
    vehicles,
    consentAudit: includeAudit ? listGarageConsentAudit(customerId) : undefined,
    reminders: listVehicleReminders(customerId),
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    action?: string;
    customerId?: string;
    label?: string;
    chassisHint?: string;
    reminderConsent?: boolean;
    vehicleId?: string;
    kind?: string;
    dueAt?: string;
  };
  try {
    if (body.action === "schedule_reminder") {
      const reminder = scheduleVehicleReminder({
        vehicleId: String(body.vehicleId ?? ""),
        dueAt: String(body.dueAt ?? ""),
        ...(body.kind === "service_due" ||
        body.kind === "licence_expiry" ||
        body.kind === "insurance_expiry" ||
        body.kind === "other"
          ? { kind: body.kind }
          : {}),
      });
      return NextResponse.json({
        ok: true,
        reminder,
        due: listDueVehicleReminders(reminder.customerId),
        payableFromAi: false,
        note: "PD108 — reminder scheduled (consent required)",
      });
    }
    if (!body.customerId || !body.label) {
      return NextResponse.json(
        { error: "customerId and label required (or action=schedule_reminder)" },
        { status: 400 },
      );
    }
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

/** PD50 consent + PD75 set active + PD79 update. */
export async function PATCH(req: Request) {
  const body = (await req.json()) as {
    vehicleId?: string;
    reminderConsent?: boolean;
    setActive?: boolean;
    label?: string;
    chassisHint?: string;
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
    if (body.label !== undefined || body.chassisHint !== undefined) {
      const vehicle = updateGarageVehicle({
        vehicleId: body.vehicleId,
        ...(body.label !== undefined ? { label: body.label } : {}),
        ...(body.chassisHint !== undefined
          ? { chassisHint: body.chassisHint }
          : {}),
      });
      return NextResponse.json({
        ok: true,
        vehicle,
        browsePath: browsePathForGarageVehicle(vehicle.vehicleId),
        note: "PD79 — garage vehicle updated",
      });
    }
    if (typeof body.reminderConsent !== "boolean") {
      return NextResponse.json(
        { error: "reminderConsent, setActive, or label/chassisHint required" },
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

/** PD79 — delete vehicle (promotes another active if needed). */
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const vehicleId =
    url.searchParams.get("vehicleId") ??
    ((await req.json().catch(() => ({}))) as { vehicleId?: string }).vehicleId;
  if (!vehicleId) {
    return NextResponse.json({ error: "vehicleId required" }, { status: 400 });
  }
  try {
    const result = deleteGarageVehicle(vehicleId);
    return NextResponse.json({
      ok: true,
      ...result,
      note: "PD79 — garage vehicle deleted",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "garage delete failed" },
      { status: 400 },
    );
  }
}
