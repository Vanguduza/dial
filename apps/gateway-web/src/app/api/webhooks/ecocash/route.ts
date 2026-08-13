/**
 * EcoCash webhook — HMAC + idempotency (D-43).
 */
import { NextResponse } from "next/server";
import { EcoCashDirectAdapter } from "@dial/adapter-psp";
import { claimProcessedEvent } from "@dial/shared";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headers = Object.fromEntries(req.headers.entries());
  try {
    const admission = await new EcoCashDirectAdapter().verifyWebhook(
      headers,
      rawBody,
    );
    if (
      claimProcessedEvent({
        eventId: admission.eventId,
        source: "ecocash",
      }) === "duplicate"
    ) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    return NextResponse.json({ ok: true, admission });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "webhook error" },
      { status: 401 },
    );
  }
}
