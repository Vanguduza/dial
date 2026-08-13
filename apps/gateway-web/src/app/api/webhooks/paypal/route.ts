/**
 * PayPal webhook — Orders v2 verify (D-43).
 */
import { NextResponse } from "next/server";
import { PayPalAdapter } from "@dial/adapter-psp";

export const runtime = "nodejs";

const seen = new Set<string>();

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headers = Object.fromEntries(req.headers.entries());
  try {
    const admission = await new PayPalAdapter().verifyWebhook(headers, rawBody);
    if (seen.has(admission.eventId)) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    seen.add(admission.eventId);
    return NextResponse.json({ ok: true, admission });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "webhook error" },
      { status: 401 },
    );
  }
}
