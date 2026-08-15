/**
 * PD45 Admin support + consent audit — ERP tickets SoR; Chatwoot handoff only.
 * Fail closed without INTERNAL_API_SECRET.
 */
import { NextResponse } from "next/server";
import {
  listConsentAudit,
  listSupportTickets,
} from "@dial/adapter-whatsapp";

export const runtime = "nodejs";

function assertInternalSecret(req: Request): NextResponse | null {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "INTERNAL_API_SECRET unset — fail closed" },
      { status: 503 },
    );
  }
  if ((req.headers.get("x-internal-secret") ?? "") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  return NextResponse.json({
    consents: listConsentAudit(),
    tickets: listSupportTickets(),
    chatwootIsStatusSor: false,
    payableFromAi: false,
    note: "PD45 — ERP support tickets + consent audit; Chatwoot ≠ status SoR",
  });
}
