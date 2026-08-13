/**
 * Admin FDMS fiscal-day open/close (D-40a / D-59).
 * Fail closed without INTERNAL_API_SECRET. Enqueues @dial/queues FDMS day job
 * and runs fixture processor inline when DIAL_INTEGRATION_MODE=fixture.
 */
import { NextResponse } from "next/server";
import {
  enqueueFdmsDayJob,
  integrationMode,
} from "@dial/queues";
import {
  getFiscalDayState,
  processFdmsDayJob,
} from "@dial/tax";

export const runtime = "nodejs";

function assertInternalSecret(req: Request): NextResponse | null {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "INTERNAL_API_SECRET unset — fail closed" },
      { status: 503 },
    );
  }
  const header = req.headers.get("x-internal-secret") ?? "";
  if (header !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  return NextResponse.json({ day: getFiscalDayState() });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;

  const body = (await req.json()) as {
    action?: "open" | "close";
    requestedBy?: string;
  };

  if (body.action !== "open" && body.action !== "close") {
    return NextResponse.json(
      { error: "action must be open|close" },
      { status: 400 },
    );
  }

  const queued = await enqueueFdmsDayJob({
    action: body.action,
    ...(body.requestedBy ? { requestedBy: body.requestedBy } : {}),
  });

  let day = getFiscalDayState();
  if (integrationMode() === "fixture") {
    day = await processFdmsDayJob({ action: body.action });
  }

  return NextResponse.json({
    jobId: queued.jobId,
    mode: queued.mode,
    day,
  });
}
