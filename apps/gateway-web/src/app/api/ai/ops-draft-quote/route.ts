/**
 * PD89 — POST /api/ai/ops-draft-quote (Pack §10). Internal secret; draft only (D-61).
 */
import { NextResponse } from "next/server";
import {
  clientAssessment,
  opsDraftQuoteFromAssessment,
  type JobAssessment,
} from "@dial/ai";

export const runtime = "nodejs";

function requireInternal(req: Request): NextResponse | null {
  const expected = process.env.INTERNAL_API_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "INTERNAL_API_SECRET unset — fail closed" },
      { status: 503 },
    );
  }
  if (req.headers.get("x-internal-secret") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST(req: Request) {
  const denied = requireInternal(req);
  if (denied) return denied;

  const body = (await req.json()) as {
    customerText?: string;
    assessment?: JobAssessment;
    userId?: string;
    role?: string;
    amountMinor?: unknown;
  };
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected (D-47)" },
      { status: 400 },
    );
  }
  if (body.amountMinor !== undefined) {
    return NextResponse.json(
      { error: "amountMinor rejected — AI never writes payable amounts" },
      { status: 400 },
    );
  }

  try {
    const assessment =
      body.assessment ??
      clientAssessment({
        customerText: String(body.customerText ?? "").trim() || "ops draft",
      });
    const draft = opsDraftQuoteFromAssessment(assessment);
    return NextResponse.json({
      ok: true,
      draft,
      payableFromAi: false,
      note: "PD89 — humanApprovalRequired; ledgerWrite=false",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "ops draft quote failed" },
      { status: 400 },
    );
  }
}
