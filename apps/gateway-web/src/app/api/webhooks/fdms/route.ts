/**
 * FDMS / ZIMRA Virtual Gateway webhook — fiscal events (D-40a / D-59).
 * Fail closed without FDMS_ACTIVATION_KEY outside fixture mode.
 */
import { NextResponse } from "next/server";
import { ZimraVirtualGatewayAdapter } from "@dial/adapter-fdms";
import { claimProcessedEvent } from "@dial/shared";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const mode = (process.env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (mode !== "fixture" && !process.env.FDMS_ACTIVATION_KEY?.trim()) {
    return NextResponse.json(
      { error: "FDMS_ACTIVATION_KEY unset — fail closed" },
      { status: 503 },
    );
  }
  const body = (await req.json()) as {
    eventId?: string;
    type?: string;
    receipt?: unknown;
  };
  if (!body.eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }
  if (
    claimProcessedEvent({ eventId: body.eventId, source: "fdms" }) ===
    "duplicate"
  ) {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  if (body.type === "submit_receipt" && body.receipt) {
    const gw = new ZimraVirtualGatewayAdapter();
    const result = await gw.submitReceipt(body.receipt);
    return NextResponse.json({ ok: true, result });
  }
  return NextResponse.json({ ok: true, acknowledged: true });
}
