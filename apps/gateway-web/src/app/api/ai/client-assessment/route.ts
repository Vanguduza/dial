/**
 * PD88 companion — POST /api/ai/client-assessment (Pack §10). Same no-money surface.
 */
import { NextResponse } from "next/server";
import { clientAssessment } from "@dial/ai";
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
    const assessment = clientAssessment({ customerText });
    return NextResponse.json({
      ok: true,
      assessment,
      payableFromAi: false,
      note: "PD88 — clientAssessment alias; no payable keys",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "client assessment failed" },
      { status: 400 },
    );
  }
}
