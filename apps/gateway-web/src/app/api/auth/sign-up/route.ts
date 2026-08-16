import { NextResponse } from "next/server";
import {
  createSessionFromSupabaseSignUp,
  sessionCookieName,
  sessionCookieOptions,
} from "../../../../lib/auth/session";

/** Same-origin relative path only — never open redirects. */
function safeNextPath(raw: string | null | undefined): string {
  if (!raw) return "/home";
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//") || t.includes("://")) {
    return "/home";
  }
  return t;
}

/**
 * PD1 sign-up — Supabase Auth + profiles row + DialSession cookie.
 * Rejects body userId/role (D-47). Password required.
 * Form posts redirect to `next` (default /home); JSON keeps API shape.
 */
export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  const isForm =
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data");
  let email = "";
  let displayName = "";
  let password = "";
  let next = "/home";

  if (contentType.includes("application/json")) {
    const body = (await req.json()) as {
      email?: string;
      identifier?: string;
      displayName?: string;
      name?: string;
      password?: string;
      next?: string;
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
    password = body.password ?? "";
    next = safeNextPath(body.next);
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
    password = String(form.get("password") ?? "");
    next = safeNextPath(String(form.get("next") ?? ""));
  }

  if (!email) {
    if (isForm) {
      return NextResponse.redirect(
        new URL(
          `/sign-up?error=${encodeURIComponent("identifier required")}&next=${encodeURIComponent(next)}`,
          req.url,
        ),
        303,
      );
    }
    return NextResponse.json({ error: "identifier required" }, { status: 400 });
  }
  if (!displayName) {
    if (isForm) {
      return NextResponse.redirect(
        new URL(
          `/sign-up?error=${encodeURIComponent("displayName required")}&next=${encodeURIComponent(next)}`,
          req.url,
        ),
        303,
      );
    }
    return NextResponse.json({ error: "displayName required" }, { status: 400 });
  }
  if (!password) {
    if (isForm) {
      return NextResponse.redirect(
        new URL(
          `/sign-up?error=${encodeURIComponent("password required")}&next=${encodeURIComponent(next)}`,
          req.url,
        ),
        303,
      );
    }
    return NextResponse.json({ error: "password required" }, { status: 400 });
  }

  try {
    const { token, session } = await createSessionFromSupabaseSignUp({
      email,
      password,
      displayName,
    });
    if (isForm) {
      const res = NextResponse.redirect(new URL(next, req.url), 303);
      res.cookies.set(sessionCookieName(), token, sessionCookieOptions());
      return res;
    }
    const res = NextResponse.json({
      ok: true,
      userId: session.userId,
      email: session.email,
      buyerSegment: session.buyerSegment,
      auth: "supabase",
      next,
    });
    res.cookies.set(sessionCookieName(), token, sessionCookieOptions());
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "sign-up failed";
    if (isForm) {
      return NextResponse.redirect(
        new URL(
          `/sign-up?error=${encodeURIComponent(msg)}&next=${encodeURIComponent(next)}`,
          req.url,
        ),
        303,
      );
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
