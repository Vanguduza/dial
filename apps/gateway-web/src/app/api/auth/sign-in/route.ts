import { NextResponse } from "next/server";
import {
  createSessionFromSupabasePassword,
  sessionCookieName,
} from "../../../../lib/auth/session";

/**
 * PD1 sign-in — Supabase Auth password → profile → DialSession cookie.
 * Rejects body userId (D-47). Password required (replaces email-only stub).
 */
export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  let email = "";
  let password = "";
  if (contentType.includes("application/json")) {
    const body = (await req.json()) as {
      email?: string;
      identifier?: string;
      password?: string;
      userId?: string;
      role?: string;
    };
    if (body.userId !== undefined || body.role !== undefined) {
      return NextResponse.json(
        { error: "userId/role from body rejected — session SoR only (D-47)" },
        { status: 400 },
      );
    }
    email = (body.email ?? body.identifier ?? "").trim();
    password = body.password ?? "";
  } else {
    const form = await req.formData();
    if (form.has("userId") || form.has("role")) {
      return NextResponse.json(
        { error: "userId/role from body rejected — session SoR only (D-47)" },
        { status: 400 },
      );
    }
    email = String(form.get("identifier") ?? form.get("email") ?? "").trim();
    password = String(form.get("password") ?? "");
  }

  if (!email) {
    return NextResponse.json({ error: "identifier required" }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ error: "password required" }, { status: 400 });
  }

  try {
    const { token, session } = await createSessionFromSupabasePassword({
      email,
      password,
    });
    const res = NextResponse.json({
      ok: true,
      userId: session.userId,
      email: session.email,
      buyerSegment: session.buyerSegment,
      auth: "supabase",
      next: "/home",
    });
    res.cookies.set(sessionCookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return res;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "sign-in failed" },
      { status: 400 },
    );
  }
}
