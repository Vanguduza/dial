/**
 * PD82 — customer account profile API (Pack §10 Identity). Session SoR (D-47).
 */
import { NextResponse } from "next/server";
import {
  getProfileByUserId,
  rlsContextFromSession,
  selectProfileAs,
  updateProfileAs,
  upsertProfileAfterAuth,
} from "@dial/identity";
import {
  getSessionFromToken,
  parseSessionCookie,
} from "../../../../lib/auth/session";

export const runtime = "nodejs";

function sessionOr401(req: Request) {
  return getSessionFromToken(parseSessionCookie(req.headers.get("cookie")));
}

export async function GET(req: Request) {
  const session = sessionOr401(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  if (url.searchParams.has("userId") || url.searchParams.has("role")) {
    return NextResponse.json(
      { error: "role/userId from query rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }
  let profile = getProfileByUserId(session.userId);
  if (!profile) {
    profile = await upsertProfileAfterAuth({
      userId: session.userId,
      email: session.email,
      displayName: session.email.split("@")[0] ?? "Customer",
      role: "customer",
      buyerSegment: session.buyerSegment,
    });
  }
  const ctx = rlsContextFromSession(session);
  const row = selectProfileAs(ctx, session.userId);
  return NextResponse.json({
    profile: row,
    payableFromAi: false,
    note: "PD82 — account profile session SoR",
  });
}

export async function PATCH(req: Request) {
  const session = sessionOr401(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    displayName?: string;
    buyerSegment?: "b2c" | "b2b";
    userId?: string;
    role?: string;
  };
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "role/userId from body rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }
  if (!getProfileByUserId(session.userId)) {
    await upsertProfileAfterAuth({
      userId: session.userId,
      email: session.email,
      displayName: session.email.split("@")[0] ?? "Customer",
      role: "customer",
      buyerSegment: session.buyerSegment,
    });
  }
  const ctx = rlsContextFromSession(session);
  try {
    const updated = updateProfileAs(ctx, session.userId, {
      ...(body.displayName !== undefined
        ? { displayName: body.displayName }
        : {}),
      ...(body.buyerSegment !== undefined
        ? { buyerSegment: body.buyerSegment }
        : {}),
    });
    return NextResponse.json({
      ok: true,
      profile: updated,
      payableFromAi: false,
      note: "PD82 — profile updated",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "profile update failed" },
      { status: 400 },
    );
  }
}
