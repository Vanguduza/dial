/**
 * Meta WhatsApp Cloud API webhook — signature + idempotency before mutate (D-40 / D-47).
 * GET: hub challenge with WHATSAPP_VERIFY_TOKEN.
 * POST: HMAC with WHATSAPP_APP_SECRET (alias META_WA_APP_SECRET).
 */
import { NextResponse } from "next/server";
import {
  admitWebhookEvent,
  resolveWhatsAppAppSecret,
  verifyMetaSignature,
  verifyWebhookChallenge,
} from "@dial/adapter-whatsapp";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const result = verifyWebhookChallenge({
    mode: url.searchParams.get("hub.mode"),
    token: url.searchParams.get("hub.verify_token"),
    challenge: url.searchParams.get("hub.challenge"),
  });
  if (!result.ok) {
    return NextResponse.json({ error: "verify failed" }, { status: 403 });
  }
  return new NextResponse(result.challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

export async function POST(req: Request) {
  const appSecret = resolveWhatsAppAppSecret();
  if (!appSecret) {
    return NextResponse.json(
      { error: "WHATSAPP_APP_SECRET unset — fail closed" },
      { status: 503 },
    );
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get("x-hub-signature-256") ?? "";
  if (
    !verifyMetaSignature({
      appSecret,
      rawBody,
      signatureHeader,
    })
  ) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const deliveryId =
    req.headers.get("x-hub-delivery-id") ??
    req.headers.get("x-request-id") ??
    `body_${createHmacish(rawBody)}`;

  const admission = admitWebhookEvent(deliveryId);
  if (admission === "duplicate") {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  return NextResponse.json({ ok: true, admitted: true });
}

function createHmacish(raw: string): string {
  let h = 0;
  for (let i = 0; i < raw.length; i++) h = (h * 31 + raw.charCodeAt(i)) | 0;
  return `h_${Math.abs(h).toString(36)}`;
}
