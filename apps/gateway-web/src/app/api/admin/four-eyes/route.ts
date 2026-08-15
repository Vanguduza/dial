/**
 * PD62 — unified four-eyes queue (Pack §9.5). Wraps FX proposals + approve/reject.
 */
import { NextResponse } from "next/server";
import {
  approveDailyZigRate,
  listFourEyesQueue,
  rejectDailyZigRate,
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
  if ((req.headers.get("x-internal-secret") ?? "") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  return NextResponse.json({
    ok: true,
    queue: listFourEyesQueue(),
    payableFromAi: false,
    note: "PD62 — four-eyes queue (daily ZiG proposals)",
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
      case "approve": {
        const proposalId = String(body.proposalId ?? "");
        const approvedBy = String(body.approvedBy ?? "");
        const { proposal, rate } = approveDailyZigRate({ proposalId, approvedBy });
        return NextResponse.json({
          ok: true,
          proposal: {
            ...proposal,
            zigMinorPerUsd: proposal.zigMinorPerUsd.toString(),
          },
          rate: {
            ...rate,
            zigMinorPerUsd: rate.zigMinorPerUsd.toString(),
          },
          queue: listFourEyesQueue(),
          payableFromAi: false,
        });
      }
      case "reject": {
        const proposalId = String(body.proposalId ?? "");
        const rejectedBy = String(body.rejectedBy ?? "");
        const proposal = rejectDailyZigRate({ proposalId, rejectedBy });
        return NextResponse.json({
          ok: true,
          proposal: {
            ...proposal,
            zigMinorPerUsd: proposal.zigMinorPerUsd.toString(),
          },
          queue: listFourEyesQueue(),
          payableFromAi: false,
        });
      }
      default:
        return NextResponse.json({ error: `unknown action ${action}` }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "four-eyes action failed" },
      { status: 400 },
    );
  }
}
