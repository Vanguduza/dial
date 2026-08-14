/**
 * Paynow result webhook — SHA512 hash + durable idempotency (Pack §6.6 / D-43 / PD4).
 * Fixture: bridges into payments SoR + ledger/FiscalReceiptQueued when reference = intent id.
 */
import { NextResponse } from "next/server";
import { PaynowAdapter } from "@dial/adapter-psp";
import {
  __resetPaymentsForTests,
  admitPspWebhookEvent,
  completePspCaptureSettlement,
  getPaymentIntent,
  runE1aMoneySpine,
  runPd4MoneySpine,
} from "@dial/payments";
import { claimProcessedEventDurable } from "@dial/shared";

export const runtime = "nodejs";

/** Test-only: same module graph as this route (avoids dual payments instances under tsx). */
export const __testPaynowPayments = {
  reset: __resetPaymentsForTests,
  runE1aMoneySpine,
  runPd4MoneySpine,
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
      | "skipped"
      | "settled" = "skipped";
    let settlement: { journalId: string; fiscalIds: string[] } | undefined;
    if (intentId && getPaymentIntent(intentId)) {
      bridge = admitPspWebhookEvent({
        eventId: `paynow_bridge_${admission.eventId}`,
        intentId,
        signatureValid: true,
        action: admission.status === "paid" ? "capture" : "ignore",
      });
      if (bridge === "captured") {
        const settled = await completePspCaptureSettlement({
          intentId,
          pspEventId: `paynow_settle_${admission.eventId}`,
          channel: "web",
        });
        settlement = {
          journalId: settled.journalId,
          fiscalIds: settled.fiscalIds,
        };
        bridge = settled.duplicate ? "captured" : "settled";
      }
    }

    return NextResponse.json({ ok: true, admission, bridge, settlement });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "webhook error" },
      { status: 401 },
    );
  }
}
