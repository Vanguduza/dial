import { NextResponse } from "next/server";
import { signUp } from "@dial/identity";
import { createSession, sessionCookieName } from "../../../../lib/auth/session";

/** T1 sign-up stub — creates profile (RLS SoR) + session cookie. */
export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  let email = "";
  let displayName = "";

  if (contentType.includes("application/json")) {
    const body = (await req.json()) as {
      email?: string;
      identifier?: string;
      displayName?: string;
      name?: string;
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
    displayName = (body.displayName ?? body.name ?? "").trim();
  } else {
    const form = await req.formData();
    if (form.has("userId") || form.has("role")) {
      return NextResponse.json(
        { error: "userId/role from body rejected — session SoR only (D-47)" },
        { status: 400 },
      );
    }
    email = String(form.get("identifier") ?? form.get("email") ?? "").trim();
    displayName = String(form.get("displayName") ?? form.get("name") ?? "").trim();
  }

  if (!email) {
    return NextResponse.json({ error: "identifier required" }, { status: 400 });
  }
  if (!displayName) {
    return NextResponse.json({ error: "displayName required" }, { status: 400 });
  }

  try {
    const profile = signUp({ email, displayName });
    const { token, session } = createSession({
      email: profile.email,
      userId: profile.userId,
      role: profile.role === "admin" ? "ops_admin" : "customer",
    });
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
      { error: e instanceof Error ? e.message : "sign-up failed" },
      { status: 400 },
    );
  }
}
