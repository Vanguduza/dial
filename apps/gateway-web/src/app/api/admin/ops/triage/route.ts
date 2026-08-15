/**
 * PD128 — Plane-pattern ops triage inbox. Fail closed without INTERNAL_API_SECRET.
 * Chatwoot ≠ status SoR.
 */
import { NextResponse } from "next/server";
import {
  claimOpsTriageItem,
  enqueueOpsTriageItem,
  listOpsTriageInbox,
  resolveOpsTriageItem,
  runPd128PlaneOpsTriageThinVertical,
  type OpsTriageKind,
} from "@dial/shared";

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
  const url = new URL(req.url);
  if (url.searchParams.get("view") === "thin") {
    const thin = runPd128PlaneOpsTriageThinVertical();
    return NextResponse.json({
      ok: true,
      thin,
      note: "PD128 — Plane ops triage thin vertical",
    });
  }
  const status = url.searchParams.get("status") as
    | "open"
    | "claimed"
    | "resolved"
    | null;
  const inbox = listOpsTriageInbox(
    status ? { status } : undefined,
  );
  return NextResponse.json({
    ok: true,
    inbox,
    note: "PD128 — Plane claim/resolve pattern; Chatwoot ≠ status SoR",
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    kind?: string;
    title?: string;
    correlationRef?: string;
    slaDueAt?: string;
    ticketId?: string;
    claimedBy?: string;
    resolvedBy?: string;
    userId?: string;
    role?: string;
  };
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }
  try {
    if (body.action === "enqueue") {
      const item = enqueueOpsTriageItem({
        kind: (body.kind ?? "support") as OpsTriageKind,
        title: String(body.title ?? ""),
        correlationRef: String(body.correlationRef ?? ""),
        slaDueAt:
          body.slaDueAt ??
          new Date(Date.now() + 3_600_000).toISOString(),
      });
      return NextResponse.json({ ok: true, item });
    }
    if (body.action === "claim") {
      const item = claimOpsTriageItem({
        ticketId: String(body.ticketId ?? ""),
        claimedBy: String(body.claimedBy ?? "ops"),
      });
      return NextResponse.json({ ok: true, item });
    }
    if (body.action === "resolve") {
      const item = resolveOpsTriageItem({
        ticketId: String(body.ticketId ?? ""),
        resolvedBy: String(body.resolvedBy ?? "ops"),
      });
      return NextResponse.json({ ok: true, item });
    }
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "triage action failed" },
      { status: 400 },
    );
  }
}
