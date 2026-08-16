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
  findPaymentIntentForWebhook,
  findPaymentIntentForWebhookDurable,
  getPaymentIntent,
  runE1aMoneySpine,
  runPd4MoneySpine,
} from "@dial/payments";
import { claimProcessedEventDurable } from "@dial/shared";
import { takeRouteRateLimit } from "../../../../lib/http/rateLimit";

export const runtime = "nodejs";

/** Test-only: same module graph as this route (avoids dual payments instances under tsx). */
export const __testPaynowPayments = {
  reset: __resetPaymentsForTests,
  runE1aMoneySpine,
  runPd4MoneySpine,
  getPaymentIntent,
};

export async function POST(req: Request) {
  const limited = await takeRouteRateLimit({
    key: "webhook:paynow",
    limit: 120,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterMs: limited.retryAfterMs },
      { status: 429 },
    );
  }
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

    const intent =
      (await findPaymentIntentForWebhookDurable(
        String((admission.payload as { reference?: string })?.reference ?? ""),
      )) ?? (await findPaymentIntentForWebhookDurable(admission.providerRef));
    let bridge:
      | "captured"
      | "rejected_signature"
      | "duplicate"
      | "ignored"
      | "skipped"
      | "settled" = "skipped";
    let settlement: { journalId: string; fiscalIds: string[] } | undefined;
    if (intent) {
      bridge = admitPspWebhookEvent({
        eventId: `paynow_bridge_${admission.eventId}`,
        intentId: intent.id,
        signatureValid: true,
        action: admission.status === "paid" ? "capture" : "ignore",
      });
      if (bridge === "captured") {
        const settled = await completePspCaptureSettlement({
          intentId: intent.id,
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
