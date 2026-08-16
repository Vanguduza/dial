/**
 * EcoCash webhook — HMAC + durable idempotency + payments SoR bridge (D-43 / PD4 / key-drop-in).
 */
import { NextResponse } from "next/server";
import { EcoCashDirectAdapter } from "@dial/adapter-psp";
import {
  admitPspWebhookEvent,
  completePspCaptureSettlement,
  findPaymentIntentForWebhook,
  findPaymentIntentForWebhookDurable,
} from "@dial/payments";
import { claimProcessedEventDurable } from "@dial/shared";
import { takeRouteRateLimit } from "../../../../lib/http/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = await takeRouteRateLimit({
    key: "webhook:ecocash",
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
    const admission = await new EcoCashDirectAdapter().verifyWebhook(
      headers,
      rawBody,
    );
    if (
      (await claimProcessedEventDurable({
        eventId: admission.eventId,
        source: "ecocash",
      })) === "duplicate"
    ) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const payload = admission.payload as { reference?: string };
    const intent =
      (await findPaymentIntentForWebhookDurable(String(payload.reference ?? ""))) ??
      (await findPaymentIntentForWebhookDurable(admission.providerRef));

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
        eventId: `ecocash_bridge_${admission.eventId}`,
        intentId: intent.id,
        signatureValid: true,
        action: admission.status === "paid" ? "capture" : "ignore",
      });
      if (bridge === "captured") {
        const settled = await completePspCaptureSettlement({
          intentId: intent.id,
          pspEventId: `ecocash_settle_${admission.eventId}`,
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
