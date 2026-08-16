/**
 * PayPal webhook — Orders v2 verify + durable idempotency + payments SoR bridge (D-43 / key-drop-in).
 */
import { NextResponse } from "next/server";
import { PayPalAdapter } from "@dial/adapter-psp";
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
    const admission = await new PayPalAdapter().verifyWebhook(headers, rawBody);
    if (
      (await claimProcessedEventDurable({
        eventId: admission.eventId,
        source: "paypal",
      })) === "duplicate"
    ) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const payload = admission.payload as {
      resource?: { custom_id?: string; id?: string; supplementary_data?: { related_ids?: { order_id?: string } } };
      id?: string;
    };
    const resource = payload.resource ?? {};
    const relatedOrder =
      resource.supplementary_data?.related_ids?.order_id ??
      resource.custom_id ??
      "";
    const intent =
      findPaymentIntentForWebhook(relatedOrder) ??
      findPaymentIntentForWebhook(admission.providerRef) ??
      findPaymentIntentForWebhook(String(resource.id ?? payload.id ?? ""));

    const paid =
      admission.status === "paid" ||
      String(admission.type).includes("CAPTURE.COMPLETED") ||
      String(admission.type).includes("ORDER.COMPLETED");

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
        eventId: `paypal_bridge_${admission.eventId}`,
        intentId: intent.id,
        signatureValid: true,
        action: paid ? "capture" : "ignore",
      });
      if (bridge === "captured") {
        const settled = await completePspCaptureSettlement({
          intentId: intent.id,
          pspEventId: `paypal_settle_${admission.eventId}`,
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
