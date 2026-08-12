/**
 * PSP webhook — signature + idempotency before capture (D-43 / D-47).
 * Client return URL is never SoR.
 */
import { NextResponse } from "next/server";
import { admitPspWebhookEvent } from "@dial/payments";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.PSP_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "PSP_WEBHOOK_SECRET unset — fail closed" },
      { status: 503 },
    );
  }

  const signatureHeader = req.headers.get("x-psp-signature") ?? "";
  const signatureValid = signatureHeader === `sha256=${secret}`;
  const body = (await req.json()) as {
    eventId?: string;
    intentId?: string;
    action?: "capture" | "ignore";
  };

  if (!body.eventId || !body.intentId) {
    return NextResponse.json({ error: "eventId and intentId required" }, { status: 400 });
  }

  try {
    const result = admitPspWebhookEvent({
      eventId: body.eventId,
      intentId: body.intentId,
      signatureValid,
      action: body.action ?? "capture",
    });
    if (result === "rejected_signature") {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "webhook error" },
      { status: 400 },
    );
  }
}
