import { NextResponse } from "next/server";
import { createSession, sessionCookieName } from "../../../../lib/auth/session";

/** T1 sign-in stub — sets dial_session cookie from email (Supabase later). */
export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  let email = "";
  if (contentType.includes("application/json")) {
    const body = (await req.json()) as { email?: string; identifier?: string; userId?: string };
    if (body.userId) {
      return NextResponse.json(
        { error: "userId from body rejected — session SoR only (D-47)" },
        { status: 400 },
      );
    }
    email = (body.email ?? body.identifier ?? "").trim();
  } else {
    const form = await req.formData();
    if (form.has("userId")) {
      return NextResponse.json(
        { error: "userId from body rejected — session SoR only (D-47)" },
        { status: 400 },
      );
    }
    email = String(form.get("identifier") ?? form.get("email") ?? "").trim();
  }

  if (!email) {
    return NextResponse.json({ error: "identifier required" }, { status: 400 });
  }

  try {
    const { token, session } = createSession({ email });
    const res = NextResponse.json({
      ok: true,
      userId: session.userId,
      email: session.email,
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
