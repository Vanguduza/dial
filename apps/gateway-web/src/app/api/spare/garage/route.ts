/**
 * PD18 Garage / Vehicle Hub API — reminders need consent (Pack §9.2).
 */
import { NextResponse } from "next/server";
import { addGarageVehicle, listGarageVehicles } from "@dial/catalogue";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const customerId = new URL(req.url).searchParams.get("customerId");
  if (!customerId) {
    return NextResponse.json({ error: "customerId required" }, { status: 400 });
  }
  return NextResponse.json({
    vehicles: listGarageVehicles(customerId),
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
    return NextResponse.json({ ok: true, vehicle });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "garage failed" },
      { status: 400 },
    );
  }
}
