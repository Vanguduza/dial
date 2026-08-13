import { NextResponse } from "next/server";
import { signInByEmail, signUp } from "@dial/identity";
import {
  createSession,
  createSessionFromSupabasePassword,
  sessionCookieName,
} from "../../../../lib/auth/session";

/**
 * T1 / S95 sign-in — session SoR only; rejects body userId (D-47).
 * When `password` is present, uses Supabase Auth client bridge (fixture/live).
 */
export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  let email = "";
  let password: string | undefined;
  if (contentType.includes("application/json")) {
    const body = (await req.json()) as {
      email?: string;
      identifier?: string;
      password?: string;
      userId?: string;
    };
    if (body.userId) {
      return NextResponse.json(
        { error: "userId from body rejected — session SoR only (D-47)" },
        { status: 400 },
      );
    }
    email = (body.email ?? body.identifier ?? "").trim();
    password = body.password;
  } else {
    const form = await req.formData();
    if (form.has("userId")) {
      return NextResponse.json(
        { error: "userId from body rejected — session SoR only (D-47)" },
        { status: 400 },
      );
    }
    email = String(form.get("identifier") ?? form.get("email") ?? "").trim();
    const pw = form.get("password");
    password = pw == null ? undefined : String(pw);
  }

  if (!email) {
    return NextResponse.json({ error: "identifier required" }, { status: 400 });
  }

  try {
    if (password) {
      const { token, session } = await createSessionFromSupabasePassword({
        email,
        password,
      });
      const res = NextResponse.json({
        ok: true,
        userId: session.userId,
        email: session.email,
        auth: "supabase",
        next: "/home",
      });
      res.cookies.set(sessionCookieName(), token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
      return res;
    }

    let profile = signInByEmail(email);
    if (!profile) {
      profile = signUp({
        email,
        displayName: email.split("@")[0] || "DIAL user",
      });
    }
    const { token, session } = createSession({
      email: profile.email,
      userId: profile.userId,
      role: profile.role === "admin" ? "ops_admin" : "customer",
    });
    const res = NextResponse.json({
      ok: true,
      userId: session.userId,
      email: session.email,
      auth: "profile_stub",
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
