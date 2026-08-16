/**
 * Integration readiness health. Report lives in lib/integrationsHealth.ts —
 * this route only adds the sandbox/live internal-secret guard (D-47).
 */
import { NextResponse } from "next/server";
import { integrationsHealthResponse } from "../../../../lib/integrationsHealth.js";

export const runtime = "nodejs";

export async function GET(req: Request): Promise<NextResponse> {
  const mode = (process.env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (mode !== "fixture") {
    const secret = process.env.INTERNAL_API_SECRET?.trim();
    const header = req.headers.get("x-internal-secret") ?? "";
    if (!secret || header !== secret) {
      return NextResponse.json(
        { error: "unauthorized", code: "unauthorized" },
        { status: 401 },
      );
    }
  }
  return integrationsHealthResponse();
}
