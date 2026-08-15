/**
 * PD59 — assignment-event timeline for a delivery job (Pack §9.5 / D-45).
 * Fail closed without INTERNAL_API_SECRET.
 */
import { NextResponse } from "next/server";
import { listAssignmentEvents } from "@dial/delivery";

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
  const url = new URL(req.url);
  const jobId = url.searchParams.get("jobId") ?? undefined;
  const events = listAssignmentEvents(jobId ?? undefined);
  return NextResponse.json({
    ok: true,
    events,
    payableFromAi: false,
    note: "PD59 — delivery_assignment_events timeline",
  });
}
