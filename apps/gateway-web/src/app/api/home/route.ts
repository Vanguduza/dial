/**
 * Auth home snapshot API (PD26 / Pack §9.1).
 * Session cookie SoR; reject query/body identity (D-47).
 */
import { NextResponse } from "next/server";
import { buildAuthHomeSnapshot } from "../../../lib/home/authHome";
import {
  getSessionFromToken,
  parseSessionCookie,
} from "../../../lib/auth/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.has("userId") || url.searchParams.has("role")) {
    return NextResponse.json(
      { error: "role/userId from query rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }
  const session = getSessionFromToken(
    parseSessionCookie(req.headers.get("cookie")),
  );
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    home: buildAuthHomeSnapshot(session),
  });
}
