/**
 * Paynow result webhook — SHA512 hash + durable idempotency (Pack §6.6 / D-43 / S119).
 * Fixture: bridges into payments SoR when `reference` matches a known intent id.
 */
import { NextResponse } from "next/server";
import { PaynowAdapter } from "@dial/adapter-psp";
import {
  __resetPaymentsForTests,
  admitPspWebhookEvent,
  getPaymentIntent,
  runE1aMoneySpine,
} from "@dial/payments";
import { claimProcessedEventDurable } from "@dial/shared";

export const runtime = "nodejs";

/** Test-only: same module graph as this route (avoids dual payments instances under tsx). */
export const __testPaynowPayments = {
  reset: __resetPaymentsForTests,
  runE1aMoneySpine,
  getPaymentIntent,
};

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headers = Object.fromEntries(req.headers.entries());
  try {
    const adapter = new PaynowAdapter();
    const admission = await adapter.verifyWebhook(headers, rawBody);
    if (
      (await claimProcessedEventDurable({
        eventId: admission.eventId,
        source: "paynow",
      })) === "duplicate"
    ) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const intentId = String(
      (admission.payload as { reference?: string })?.reference ?? "",
    );
    let bridge:
      | "captured"
      | "rejected_signature"
      | "duplicate"
      | "ignored"
      | "skipped" = "skipped";
    if (intentId && getPaymentIntent(intentId)) {
      bridge = admitPspWebhookEvent({
        eventId: `paynow_bridge_${admission.eventId}`,
        intentId,
        signatureValid: true,
        action: admission.status === "paid" ? "capture" : "ignore",
      });
    }

    return NextResponse.json({ ok: true, admission, bridge });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "webhook error" },
      { status: 401 },
    );
  }
}
