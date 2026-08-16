/**
 * ContiPay webhook — HMAC + durable idempotency + payments SoR bridge (D-43 / key-drop-in).
 */
import { NextResponse } from "next/server";
import { ContiPayAdapter } from "@dial/adapter-psp";
import {
  admitPspWebhookEvent,
  completePspCaptureSettlement,
  findPaymentIntentForWebhook,
} from "@dial/payments";
import { claimProcessedEventDurable } from "@dial/shared";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headers = Object.fromEntries(req.headers.entries());
  try {
    const admission = await new ContiPayAdapter().verifyWebhook(headers, rawBody);
    if (
      (await claimProcessedEventDurable({
        eventId: admission.eventId,
        source: "contipay",
      })) === "duplicate"
    ) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const payload = admission.payload as {
      reference?: string;
      paymentId?: string;
      id?: string;
    };
    const intent =
      findPaymentIntentForWebhook(String(payload.reference ?? "")) ??
      findPaymentIntentForWebhook(admission.providerRef) ??
      findPaymentIntentForWebhook(String(payload.paymentId ?? payload.id ?? ""));

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
        eventId: `contipay_bridge_${admission.eventId}`,
        intentId: intent.id,
        signatureValid: true,
        action: admission.status === "paid" ? "capture" : "ignore",
      });
      if (bridge === "captured") {
        const settled = await completePspCaptureSettlement({
          intentId: intent.id,
          pspEventId: `contipay_settle_${admission.eventId}`,
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
