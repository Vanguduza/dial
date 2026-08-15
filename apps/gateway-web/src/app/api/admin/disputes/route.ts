/**
 * PD53 Admin Value Score disputes queue (D-53).
 * Fail closed without INTERNAL_API_SECRET. Never writes payable amounts.
 */
import { NextResponse } from "next/server";
import {
  listValueScoreDisputes,
  openValueScoreDispute,
  resolveValueScoreDispute,
  setValueScoreSnapshot,
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
  const status = new URL(req.url).searchParams.get("status") ?? "open";
  const all = listValueScoreDisputes();
  const disputes =
    status === "all"
      ? all
      : all.filter((d) => d.status === (status as typeof d.status));
  return NextResponse.json({
    disputes,
    openCount: all.filter((d) => d.status === "open").length,
    payableFromAi: false,
    note: "PD53 — Value Score disputes queue; append-only compensate; ≠ money",
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const body = (await req.json()) as {
    action?: string;
    technicianId?: string;
    reason?: string;
    openedBy?: string;
    disputeId?: string;
    resolution?: "upheld" | "rejected";
    resolvedBy?: string;
    compensatingDelta?: number;
    seedScore?: number;
  };
  try {
    if (body.action === "seed_and_open") {
      if (!body.technicianId || !body.reason || !body.openedBy) {
        return NextResponse.json(
          { error: "technicianId, reason, openedBy required" },
          { status: 400 },
        );
      }
      setValueScoreSnapshot({
        technicianId: body.technicianId,
        score: body.seedScore ?? 50,
        sampleN: 5,
        factorContributions: [
          { factor: "completion", weight: 1, contribution: body.seedScore ?? 50 },
        ],
      });
      const dispute = openValueScoreDispute({
        technicianId: body.technicianId,
        reason: body.reason,
        openedBy: body.openedBy,
      });
      return NextResponse.json({
        ok: true,
        dispute,
        disputes: listValueScoreDisputes().filter((d) => d.status === "open"),
        payableFromAi: false,
      });
    }
    if (body.action === "resolve") {
      if (
        !body.disputeId ||
        !body.resolvedBy ||
        (body.resolution !== "upheld" && body.resolution !== "rejected")
      ) {
        return NextResponse.json(
          { error: "disputeId, resolution, resolvedBy required" },
          { status: 400 },
        );
      }
      const out = resolveValueScoreDispute({
        disputeId: body.disputeId,
        resolution: body.resolution,
        resolvedBy: body.resolvedBy,
        ...(body.compensatingDelta != null
          ? { compensatingDelta: body.compensatingDelta }
          : {}),
      });
      return NextResponse.json({
        ok: true,
        dispute: out.dispute,
        snapshot: out.snapshot,
        disputes: listValueScoreDisputes().filter((d) => d.status === "open"),
        payableFromAi: false,
      });
    }
    return NextResponse.json(
      { error: "action must be seed_and_open|resolve" },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "disputes failed" },
      { status: 400 },
    );
  }
}
