/**
 * Escrow PSP webhook — HMAC + durable idempotency (D-43 / S121).
 */
import { NextResponse } from "next/server";
import { EscrowPspAdapter } from "@dial/adapter-psp";
import { claimProcessedEventDurable } from "@dial/shared";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headers = Object.fromEntries(req.headers.entries());
  try {
    const admission = await new EscrowPspAdapter().verifyWebhook(
      headers,
      rawBody,
    );
    if (
      (await claimProcessedEventDurable({
        eventId: admission.eventId,
        source: "psp_escrow",
      })) === "duplicate"
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
