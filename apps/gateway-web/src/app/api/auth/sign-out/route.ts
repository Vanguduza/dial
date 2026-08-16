import { NextResponse } from "next/server";
import { sessionCookieName, sessionCookieOptions } from "../../../../lib/auth/session";

/**
 * Clear DialSession cookie. Session SoR only — no body userId (D-47).
 */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookieName(), "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  return res;
}
