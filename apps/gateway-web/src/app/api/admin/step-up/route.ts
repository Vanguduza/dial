/**
 * PD73 — identity step-up (Pack §10). Session SoR for userId.
 */
import { NextResponse } from "next/server";
import {
  assertStepUpVerified,
  requestStepUp,
  verifyStepUp,
} from "@dial/identity";
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
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }
  const action = String(body.action ?? "");
  const userId = session.userId;
  try {
    switch (action) {
      case "request": {
        const challenge = requestStepUp({
          userId,
          purpose: String(body.purpose ?? "money_sensitive_admin"),
        });
        return NextResponse.json({
          ok: true,
          challengeId: challenge.challengeId,
          purpose: challenge.purpose,
          expiresAt: challenge.expiresAt,
          status: challenge.status,
          // Fixture only — never expose live OTP codes.
          fixtureHint: "step-up-ok",
          payableFromAi: false,
          note: "PD73 — step-up challenge",
        });
      }
      case "verify": {
        const challenge = verifyStepUp({
          challengeId: String(body.challengeId ?? ""),
          userId,
          code: String(body.code ?? ""),
        });
        return NextResponse.json({
          ok: true,
          challengeId: challenge.challengeId,
          status: challenge.status,
          verifiedAt: challenge.verifiedAt,
          payableFromAi: false,
        });
      }
      case "assert": {
        assertStepUpVerified({
          challengeId: String(body.challengeId ?? ""),
          userId,
          ...(body.purpose != null ? { purpose: String(body.purpose) } : {}),
        });
        return NextResponse.json({
          ok: true,
          gate: "passed",
          payableFromAi: false,
        });
      }
      default:
        return NextResponse.json(
          { error: "action must be request | verify | assert" },
          { status: 400 },
        );
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "step-up failed" },
      { status: 400 },
    );
  }
}
