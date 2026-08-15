/**
 * PD88 — POST /api/ai/guided-intake (Pack §10). Session SoR; no money (D-47 / D-61).
 */
import { NextResponse } from "next/server";
import { guidedIntake } from "@dial/ai";
import {
  getSessionFromToken,
  parseSessionCookie,
} from "../../../../lib/auth/session";

export const runtime = "nodejs";

function sessionOr401(req: Request) {
  return getSessionFromToken(parseSessionCookie(req.headers.get("cookie")));
}

export async function POST(req: Request) {
  const session = sessionOr401(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    customerText?: string;
    userId?: string;
    role?: string;
    customerUserId?: string;
  };
  if (
    body.userId !== undefined ||
    body.role !== undefined ||
    body.customerUserId !== undefined
  ) {
    return NextResponse.json(
      { error: "identity fields from body rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }
  const customerText = String(body.customerText ?? "").trim();
  if (!customerText) {
    return NextResponse.json({ error: "customerText required" }, { status: 400 });
  }
  try {
    const assessment = guidedIntake({ customerText });
    return NextResponse.json({
      ok: true,
      assessment,
      payableFromAi: false,
      note: "PD88 — JobAssessment only; AI never writes payable amounts",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "guided intake failed" },
      { status: 400 },
    );
  }
}
