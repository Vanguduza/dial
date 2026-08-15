/**
 * PD109 — customer web Chatwoot handoff (Pack Matrix B).
 * Session SoR; Chatwoot ≠ ticket status SoR (ERP is).
 */
import { NextResponse } from "next/server";
import {
  openWebChatwootHandoff,
  runPd109WebChatwootHandoffThinVertical,
} from "@dial/adapter-whatsapp";
import {
  getSessionFromToken,
  parseSessionCookie,
} from "../../../../lib/auth/session";

export const runtime = "nodejs";

function customerIdFromSession(email: string): string {
  return `cust_${email.split("@")[0]!.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
}

function sessionOr401(req: Request) {
  return getSessionFromToken(parseSessionCookie(req.headers.get("cookie")));
}

export async function GET() {
  const thin = runPd109WebChatwootHandoffThinVertical();
  return NextResponse.json({
    contract: thin,
    chatwootIsStatusSor: false,
    note: "PD109 — Chatwoot handoff ids; ERP ticket SoR",
  });
}

export async function POST(req: Request) {
  const session = sessionOr401(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as Record<string, unknown>;
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }
  try {
    const out = openWebChatwootHandoff({
      customerId: customerIdFromSession(session.email),
      topic: String(body.topic ?? "general_support"),
      ...(body.orderId != null ? { orderId: String(body.orderId) } : {}),
      ...(body.jobId != null ? { jobId: String(body.jobId) } : {}),
    });
    return NextResponse.json({
      ok: true,
      handoff: out.handoff,
      ticket: out.ticket,
      chatwootIsStatusSor: false,
      payableFromAi: false,
      note: "PD109 — web Chatwoot handoff; ERP status SoR",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "handoff failed" },
      { status: 400 },
    );
  }
}
