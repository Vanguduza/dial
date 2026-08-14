import { NextResponse } from "next/server";
import { selectProfileAs, rlsContextFromSession } from "@dial/identity";
import {
  assertResourceAccess,
  getSessionFromToken,
  parseSessionCookie,
} from "../../../../lib/auth/session";

/**
 * PD1 — current profile via session SoR + RLS helper (D-47).
 * Cookie AuthN; object AuthZ on own profile row; never query/body userId.
 */
export async function GET(req: Request) {
  const session = getSessionFromToken(
    parseSessionCookie(req.headers.get("cookie")),
  );
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  if (url.searchParams.has("userId") || url.searchParams.has("role")) {
    return NextResponse.json(
      { error: "userId/role from query rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }

  try {
    assertResourceAccess({
      session,
      resourceOwnerId: session.userId,
      resourceKind: "profile",
    });
    const profile = selectProfileAs(
      rlsContextFromSession(session),
      session.userId,
    );
    if (!profile) {
      return NextResponse.json({ error: "profile not found" }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      userId: profile.userId,
      email: profile.email,
      displayName: profile.displayName,
      role: profile.role,
      buyerSegment: profile.buyerSegment,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "forbidden" },
      { status: 403 },
    );
  }
}
