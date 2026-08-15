/**
 * PD69 — Job variation propose/approve (Pack §10). Fail closed without secret.
 */
import { NextResponse } from "next/server";
import {
  approveJobVariation,
  listJobVariations,
  proposeJobVariation,
  rejectJobVariation,
} from "@dial/jobs";

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
  const status = url.searchParams.get("status") as
    | "proposed"
    | "approved"
    | "rejected"
    | undefined;
  return NextResponse.json({
    ok: true,
    variations: listJobVariations({
      ...(jobId ? { jobId } : {}),
      ...(status ? { status } : {}),
    }),
    payableFromAi: false,
    note: "PD69 — variation drafts; AI never writes payables",
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected — session/secret SoR only (D-47)" },
      { status: 400 },
    );
  }
  const action = String(body.action ?? "");
  try {
    switch (action) {
      case "propose": {
        const variation = proposeJobVariation({
          jobId: String(body.jobId ?? ""),
          proposedBy: String(body.proposedBy ?? ""),
          draftDeltaUsdMinor: BigInt(String(body.draftDeltaUsdMinor ?? "0")),
          reason: String(body.reason ?? ""),
          ...(body.fromAi === true ? { fromAi: true } : {}),
        });
        return NextResponse.json({ ok: true, variation, payableFromAi: false });
      }
      case "approve": {
        const variation = approveJobVariation({
          variationId: String(body.variationId ?? ""),
          approvedBy: String(body.approvedBy ?? ""),
        });
        return NextResponse.json({ ok: true, variation, payableFromAi: false });
      }
      case "reject": {
        const variation = rejectJobVariation({
          variationId: String(body.variationId ?? ""),
          rejectedBy: String(body.rejectedBy ?? ""),
        });
        return NextResponse.json({ ok: true, variation, payableFromAi: false });
      }
      default:
        return NextResponse.json(
          { error: "action must be propose | approve | reject" },
          { status: 400 },
        );
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "variation action failed" },
      { status: 400 },
    );
  }
}
