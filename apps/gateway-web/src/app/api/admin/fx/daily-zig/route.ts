/**
 * Admin Daily ZiG rate (D-57) + PD57 four-eyes propose/approve.
 * Fail closed without INTERNAL_API_SECRET.
 */
import { NextResponse } from "next/server";
import {
  approveDailyZigRate,
  getActiveFxRate,
  listFxRateAudit,
  listFxRateProposals,
  proposeDailyZigRate,
  rejectDailyZigRate,
  setDailyZigRate,
} from "@dial/payments";

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

function serializeRate(row: {
  fxRateId: string;
  zigMinorPerUsd: bigint;
  effectiveAt: string;
  setBy: string;
}) {
  return {
    fxRateId: row.fxRateId,
    zigMinorPerUsd: row.zigMinorPerUsd.toString(),
    effectiveAt: row.effectiveAt,
    setBy: row.setBy,
  };
}

function serializeProposal(p: ReturnType<typeof listFxRateProposals>[number]) {
  return {
    ...p,
    zigMinorPerUsd: p.zigMinorPerUsd.toString(),
  };
}

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const active = getActiveFxRate();
  return NextResponse.json({
    active: active ? serializeRate(active) : null,
    audit: listFxRateAudit().map(serializeRate),
    proposals: listFxRateProposals().map(serializeProposal),
    pendingFourEyes: listFxRateProposals({ status: "pending" }).map(
      serializeProposal,
    ),
    payableFromAi: false,
    note: "PD57 — four-eyes propose/approve; direct set still available for fixtures",
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;

  const body = (await req.json()) as {
    action?: string;
    zigMinorPerUsd?: string;
    setBy?: string;
    proposedBy?: string;
    approvedBy?: string;
    rejectedBy?: string;
    proposalId?: string;
    effectiveAt?: string;
  };

  try {
    if (body.action === "propose") {
      if (!body.zigMinorPerUsd || !body.proposedBy) {
        return NextResponse.json(
          { error: "zigMinorPerUsd and proposedBy required" },
          { status: 400 },
        );
      }
      const proposal = proposeDailyZigRate({
        zigMinorPerUsd: BigInt(body.zigMinorPerUsd),
        proposedBy: body.proposedBy,
      });
      return NextResponse.json({
        ok: true,
        proposal: serializeProposal(proposal),
        payableFromAi: false,
      });
    }
    if (body.action === "approve") {
      if (!body.proposalId || !body.approvedBy) {
        return NextResponse.json(
          { error: "proposalId and approvedBy required" },
          { status: 400 },
        );
      }
      const out = approveDailyZigRate({
        proposalId: body.proposalId,
        approvedBy: body.approvedBy,
      });
      return NextResponse.json({
        ok: true,
        proposal: serializeProposal(out.proposal),
        rate: serializeRate(out.rate),
        payableFromAi: false,
      });
    }
    if (body.action === "reject") {
      if (!body.proposalId || !body.rejectedBy) {
        return NextResponse.json(
          { error: "proposalId and rejectedBy required" },
          { status: 400 },
        );
      }
      const proposal = rejectDailyZigRate({
        proposalId: body.proposalId,
        rejectedBy: body.rejectedBy,
      });
      return NextResponse.json({
        ok: true,
        proposal: serializeProposal(proposal),
        payableFromAi: false,
      });
    }

    // Legacy direct set (fixtures / PD22) — still audited via setBy
    if (!body.zigMinorPerUsd || !body.setBy) {
      return NextResponse.json(
        {
          error:
            "zigMinorPerUsd + setBy (direct) or action propose|approve|reject required",
        },
        { status: 400 },
      );
    }
    const row = setDailyZigRate({
      zigMinorPerUsd: BigInt(body.zigMinorPerUsd),
      setBy: body.setBy,
      ...(body.effectiveAt ? { effectiveAt: body.effectiveAt } : {}),
    });
    return NextResponse.json({ ok: true, rate: serializeRate(row) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "rate set failed" },
      { status: 400 },
    );
  }
}
