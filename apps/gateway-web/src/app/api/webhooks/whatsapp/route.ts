/**
 * Meta WhatsApp Cloud API webhook — signature + idempotency before mutate (D-40 / D-47).
 * Phase 0: verifies + admits; Flow handlers live in @dial/adapter-whatsapp.
 */
import { NextResponse } from "next/server";
import {
  admitWebhookEvent,
  verifyMetaSignature,
} from "@dial/adapter-whatsapp";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const appSecret = process.env.META_WA_APP_SECRET;
  if (!appSecret) {
    return NextResponse.json(
      { error: "META_WA_APP_SECRET unset — fail closed" },
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

  // Stub: parse + route to Flow handlers in Expand (E2a). No Baileys.
  return NextResponse.json({ ok: true, admitted: true });
}

function createHmacish(raw: string): string {
  let h = 0;
  for (let i = 0; i < raw.length; i++) h = (h * 31 + raw.charCodeAt(i)) | 0;
  return `h_${Math.abs(h).toString(36)}`;
}
