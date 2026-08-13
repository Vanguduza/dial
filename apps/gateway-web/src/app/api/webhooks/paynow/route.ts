/**
 * Paynow result webhook — SHA512 hash + idempotency (Pack §6.6 / D-43).
 */
import { NextResponse } from "next/server";
import { PaynowAdapter } from "@dial/adapter-psp";
import { admitPspWebhookEvent } from "@dial/payments";

export const runtime = "nodejs";

const seen = new Set<string>();

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headers = Object.fromEntries(req.headers.entries());
  try {
    const adapter = new PaynowAdapter();
    const admission = await adapter.verifyWebhook(headers, rawBody);
    if (seen.has(admission.eventId)) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    seen.add(admission.eventId);
    // Bridge into payments SoR when intent known — fixture-safe.
    if (admission.providerRef && process.env.DIAL_INTEGRATION_MODE !== "fixture") {
      admitPspWebhookEvent({
        eventId: admission.eventId,
        intentId: String(
          (admission.payload as { reference?: string })?.reference ?? "",
        ),
        signatureValid: true,
        action: admission.status === "paid" ? "capture" : "ignore",
      });
    }
    return NextResponse.json({ ok: true, admission });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "webhook error" },
      { status: 401 },
    );
  }
}
