/**
 * Admin Trade / JobClass + Value Score (PD19 / Pack §9.5 / D-53).
 * Fail closed without INTERNAL_API_SECRET. Never writes payable amounts.
 */
import { NextResponse } from "next/server";
import {
  createJobClassDefinition,
  createTradeDefinition,
  getValueScoreSnapshot,
  listJobClassDefinitions,
  listTradeDefinitions,
  listValueScoreDisputes,
  openValueScoreDispute,
  resolveValueScoreDispute,
  setJobClassLifecycle,
  setTradeLifecycle,
  setValueScoreSnapshot,
  type TradeLifecycle,
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
  const header = req.headers.get("x-internal-secret") ?? "";
  if (header !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

function snapshot() {
  return {
    trades: listTradeDefinitions(),
    jobClasses: listJobClassDefinitions(),
    disputes: listValueScoreDisputes(),
  };
}

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const url = new URL(req.url);
  const techId = url.searchParams.get("technicianId");
  return NextResponse.json({
    ...snapshot(),
    valueScore: techId ? getValueScoreSnapshot(techId) ?? null : null,
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;

  const body = (await req.json()) as {
    action?: string;
    name?: string;
    id?: string;
    tradeId?: string;
    jobClassId?: string;
    lifecycle?: TradeLifecycle;
    technicianId?: string;
    score?: number;
    reason?: string;
    openedBy?: string;
    disputeId?: string;
    resolution?: "upheld" | "rejected";
    resolvedBy?: string;
    compensatingDelta?: number;
  };

  try {
    if (body.action === "create_trade") {
      if (!body.name) {
        return NextResponse.json({ error: "name required" }, { status: 400 });
      }
      const createTrade: Parameters<typeof createTradeDefinition>[0] = {
        name: body.name,
      };
      if (body.id) createTrade.id = body.id;
      const trade = createTradeDefinition(createTrade);
      return NextResponse.json({ ok: true, trade, ...snapshot() });
    }
    if (body.action === "set_trade_lifecycle") {
      if (!body.tradeId || !body.lifecycle) {
        return NextResponse.json(
          { error: "tradeId and lifecycle required" },
          { status: 400 },
        );
      }
      const trade = setTradeLifecycle({
        tradeId: body.tradeId,
        lifecycle: body.lifecycle,
      });
      return NextResponse.json({ ok: true, trade, ...snapshot() });
    }
    if (body.action === "create_job_class") {
      if (!body.tradeId || !body.name) {
        return NextResponse.json(
          { error: "tradeId and name required" },
          { status: 400 },
        );
      }
      const createJc: Parameters<typeof createJobClassDefinition>[0] = {
        tradeId: body.tradeId,
        name: body.name,
      };
      if (body.id) createJc.id = body.id;
      const jobClass = createJobClassDefinition(createJc);
      return NextResponse.json({ ok: true, jobClass, ...snapshot() });
    }
    if (body.action === "set_job_class_lifecycle") {
      if (!body.jobClassId || !body.lifecycle) {
        return NextResponse.json(
          { error: "jobClassId and lifecycle required" },
          { status: 400 },
        );
      }
      const jobClass = setJobClassLifecycle({
        jobClassId: body.jobClassId,
        lifecycle: body.lifecycle,
      });
      return NextResponse.json({ ok: true, jobClass, ...snapshot() });
    }
    if (body.action === "set_value_score") {
      if (!body.technicianId || body.score === undefined) {
        return NextResponse.json(
          { error: "technicianId and score required" },
          { status: 400 },
        );
      }
      const valueScore = setValueScoreSnapshot({
        technicianId: body.technicianId,
        score: body.score,
      });
      return NextResponse.json({ ok: true, valueScore, ...snapshot() });
    }
    if (body.action === "open_dispute") {
      if (!body.technicianId || !body.reason || !body.openedBy) {
        return NextResponse.json(
          { error: "technicianId, reason, openedBy required" },
          { status: 400 },
        );
      }
      const dispute = openValueScoreDispute({
        technicianId: body.technicianId,
        reason: body.reason,
        openedBy: body.openedBy,
      });
      return NextResponse.json({ ok: true, dispute, ...snapshot() });
    }
    if (body.action === "resolve_dispute") {
      if (
        !body.disputeId ||
        (body.resolution !== "upheld" && body.resolution !== "rejected") ||
        !body.resolvedBy
      ) {
        return NextResponse.json(
          { error: "disputeId, resolution, resolvedBy required" },
          { status: 400 },
        );
      }
      const resolveInput: Parameters<typeof resolveValueScoreDispute>[0] = {
        disputeId: body.disputeId,
        resolution: body.resolution,
        resolvedBy: body.resolvedBy,
      };
      if (body.compensatingDelta !== undefined) {
        resolveInput.compensatingDelta = body.compensatingDelta;
      }
      const out = resolveValueScoreDispute(resolveInput);
      return NextResponse.json({
        ok: true,
        dispute: out.dispute,
        valueScore: out.snapshot,
        ...snapshot(),
      });
    }
    return NextResponse.json(
      {
        error:
          "action must be create_trade|set_trade_lifecycle|create_job_class|set_job_class_lifecycle|set_value_score|open_dispute|resolve_dispute",
      },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "admin trade/score failed" },
      { status: 400 },
    );
  }
}
