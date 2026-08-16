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
import { apiError, newRequestId, parseJsonBody } from "@dial/shared";
import { z } from "zod";
import {
  assertResourceAccess,
  requireSession,
} from "../../../../lib/auth/session.js";

export const runtime = "nodejs";

async function ownerId(req: Request) {
  const session = await requireSession(req);
  return session;
}

export async function GET(req: Request) {
  const requestId = newRequestId(req.headers.get("x-request-id"));
  const session = await ownerId(req);
  if (!session) {
    return NextResponse.json(apiError("session required", "unauthorized", requestId), {
      status: 401,
    });
  }
  const url = new URL(req.url);
  if (url.searchParams.has("customerId") && url.searchParams.get("customerId") !== session.userId) {
    return NextResponse.json(
      apiError("customerId from query rejected (D-47)", "identity_from_query", requestId),
      { status: 400 },
    );
  }
  const customerId = session.userId;
  const includeAudit = url.searchParams.get("includeAudit") === "1";
  const view = url.searchParams.get("view");
  if (view === "reminders") {
    return NextResponse.json({
      requestId,
      customerId,
      reminders: listVehicleReminders(customerId),
      due: listDueVehicleReminders(customerId),
      payableFromAi: false,
    });
  }
  const vehicles = listGarageVehicles(customerId).map((v) => ({
    ...v,
    browsePath: browsePathForGarageVehicle(v.vehicleId),
  }));
  return NextResponse.json({
    requestId,
    vehicles,
    consentAudit: includeAudit ? listGarageConsentAudit(customerId) : undefined,
    reminders: listVehicleReminders(customerId),
  });
}

export async function POST(req: Request) {
  const requestId = newRequestId(req.headers.get("x-request-id"));
  const session = await requireSession(req);
  if (!session) {
    return NextResponse.json(apiError("session required", "unauthorized", requestId), {
      status: 401,
    });
  }
  const schema = z
    .object({
      action: z.string().optional(),
      label: z.string().optional(),
      chassisHint: z.string().optional(),
      reminderConsent: z.boolean().optional(),
      vehicleId: z.string().optional(),
      kind: z.string().optional(),
      dueAt: z.string().optional(),
    })
    .strict();
  const parsed = await parseJsonBody(req, schema);
  if (!parsed.ok) {
    return NextResponse.json(apiError(parsed.error, parsed.code, requestId), {
      status: 400,
    });
  }
  const body = parsed.data;
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
      if (reminder.customerId !== session.userId && session.role !== "ops_admin") {
        assertResourceAccess({
          session,
          resourceOwnerId: reminder.customerId,
          resourceKind: "vehicle",
        });
      }
      return NextResponse.json({
        ok: true,
        requestId,
        reminder,
        due: listDueVehicleReminders(reminder.customerId),
        payableFromAi: false,
      });
    }
    if (!body.label) {
      return NextResponse.json(
        apiError("label required (or action=schedule_reminder)", "invalid_body", requestId),
        { status: 400 },
      );
    }
    const vehicle = addGarageVehicle({
      customerId: session.userId,
      label: body.label,
      chassisHint: body.chassisHint ?? "",
      reminderConsent: body.reminderConsent === true,
    });
    return NextResponse.json({
      ok: true,
      requestId,
      vehicle,
      browsePath: browsePathForGarageVehicle(vehicle.vehicleId),
    });
  } catch (e) {
    return NextResponse.json(
      apiError(e instanceof Error ? e.message : "garage failed", "bad_request", requestId),
      { status: 400 },
    );
  }
}

/** PD50 consent + PD75 set active + PD79 update. */
export async function PATCH(req: Request) {
  const requestId = newRequestId(req.headers.get("x-request-id"));
  const session = await requireSession(req);
  if (!session) {
    return NextResponse.json(apiError("session required", "unauthorized", requestId), {
      status: 401,
    });
  }
  const schema = z
    .object({
      vehicleId: z.string(),
      reminderConsent: z.boolean().optional(),
      setActive: z.boolean().optional(),
      label: z.string().optional(),
      chassisHint: z.string().optional(),
    })
    .strict();
  const parsed = await parseJsonBody(req, schema);
  if (!parsed.ok) {
    return NextResponse.json(apiError(parsed.error, parsed.code, requestId), {
      status: 400,
    });
  }
  const body = parsed.data;
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
  const requestId = newRequestId(req.headers.get("x-request-id"));
  const session = await requireSession(req);
  if (!session) {
    return NextResponse.json(apiError("session required", "unauthorized", requestId), {
      status: 401,
    });
  }
  const url = new URL(req.url);
  const vehicleId = url.searchParams.get("vehicleId");
  if (!vehicleId) {
    return NextResponse.json(apiError("vehicleId required", "invalid_body", requestId), {
      status: 400,
    });
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
