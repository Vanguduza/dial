/**
 * FDMS / ZIMRA Virtual Gateway webhook — fiscal events (D-40a / D-59 / S118 / key-drop-in).
 * Signature verify (FDMS_ACTIVATION_KEY HMAC) + durable idempotency before mutate.
 */
import { NextResponse } from "next/server";
import {
  ZimraVirtualGatewayAdapter,
  verifyFdmsWebhook,
} from "@dial/adapter-fdms";
import { claimProcessedEventDurable } from "@dial/shared";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headers = Object.fromEntries(req.headers.entries());
  try {
    const body = verifyFdmsWebhook(headers, rawBody);
    if (
      (await claimProcessedEventDurable({
        eventId: body.eventId,
        source: "fdms",
      })) === "duplicate"
    ) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    if (body.type === "submit_receipt" && body.receipt) {
      const gw = new ZimraVirtualGatewayAdapter();
      const result = await gw.submitReceipt(body.receipt);
      return NextResponse.json({ ok: true, result });
    }
    return NextResponse.json({ ok: true, acknowledged: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "webhook error";
    const status =
      msg.includes("unset") || msg.includes("fail closed")
        ? 503
        : msg.includes("eventId")
          ? 400
          : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
