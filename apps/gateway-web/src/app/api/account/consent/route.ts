/**
 * PD78 — customer marketing consent (Pack Matrix B). Session SoR (D-47).
 */
import { NextResponse } from "next/server";
import {
  getMarketingConsent,
  listMarketingConsentAudit,
  setMarketingConsent,
} from "@dial/identity";
import {
  getSessionFromToken,
  parseSessionCookie,
} from "../../../../lib/auth/session";

export const runtime = "nodejs";

function sessionOr401(req: Request) {
  return getSessionFromToken(parseSessionCookie(req.headers.get("cookie")));
}

function customerIdFromSession(email: string): string {
  return `cust_${email.split("@")[0]!.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
}

export async function GET(req: Request) {
  const session = sessionOr401(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  if (url.searchParams.has("userId") || url.searchParams.has("role")) {
    return NextResponse.json(
      { error: "role/userId from query rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }
  const customerId = customerIdFromSession(session.email);
  return NextResponse.json({
    consent: getMarketingConsent(customerId),
    audit: listMarketingConsentAudit(customerId),
    payableFromAi: false,
    note: "PD78 — marketing consent grant/revoke with audit",
  });
}

export async function POST(req: Request) {
  const session = sessionOr401(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    marketing?: boolean;
    userId?: string;
    role?: string;
  };
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "role/userId from body rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }
  if (typeof body.marketing !== "boolean") {
    return NextResponse.json(
      { error: "marketing boolean required" },
      { status: 400 },
    );
  }
  const customerId = customerIdFromSession(session.email);
  try {
    const consent = setMarketingConsent({
      customerId,
      marketing: body.marketing,
    });
    return NextResponse.json({
      ok: true,
      consent,
      audit: listMarketingConsentAudit(customerId),
      payableFromAi: false,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "consent failed" },
      { status: 400 },
    );
  }
}
