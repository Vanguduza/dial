/**
 * Public liveness probe for container orchestration.
 * Deliberately discloses nothing about integration state or configuration —
 * `/api/health/integrations` carries that and is access-controlled.
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { ok: true, status: "live" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
