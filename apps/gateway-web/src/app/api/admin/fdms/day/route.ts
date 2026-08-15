/**
 * Admin FDMS fiscal-day open/close (D-40a / D-59 / PD11).
 * Fail closed without INTERNAL_API_SECRET.
 * Fixture + sandbox (with FDMS_* keys) process Virtual Gateway inline — no physical printer.
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

function hasFdmsSandboxKeys(): boolean {
  return (
    Boolean(process.env.FDMS_BASE_URL?.trim()) &&
    Boolean(process.env.FDMS_DEVICE_ID?.trim()) &&
    Boolean(process.env.FDMS_ACTIVATION_KEY?.trim())
  );
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

  const mode = integrationMode();
  const sandboxReady = mode === "sandbox" && hasFdmsSandboxKeys();

  // Fixture always queues in-memory. Sandbox without Redis processes Gateway inline (PD11 CI).
  let jobId: string;
  let queuedMode: string = mode;
  if (mode === "fixture" || (sandboxReady && process.env.REDIS_URL?.trim())) {
    const queued = await enqueueFdmsDayJob({
      action: body.action,
      ...(body.requestedBy ? { requestedBy: body.requestedBy } : {}),
    });
    jobId = queued.jobId;
    queuedMode = queued.mode;
  } else if (sandboxReady) {
    jobId = `sb_inline_${body.action}_${Date.now().toString(36)}`;
  } else {
    const queued = await enqueueFdmsDayJob({
      action: body.action,
      ...(body.requestedBy ? { requestedBy: body.requestedBy } : {}),
    });
    jobId = queued.jobId;
    queuedMode = queued.mode;
  }

  let day = getFiscalDayState();
  if (mode === "fixture" || sandboxReady) {
    day = await processFdmsDayJob({ action: body.action });
  }

  return NextResponse.json({
    jobId,
    mode: queuedMode,
    day,
  });
}
