import { NextResponse } from "next/server";
import {
  createSessionFromSupabasePassword,
  sessionCookieName,
} from "../../../../lib/auth/session";
import { takeRouteRateLimit } from "../../../../lib/http/rateLimit";

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
 * PD1 sign-in — Supabase Auth password → profile → DialSession cookie.
 * Rejects body userId (D-47). Password required (replaces email-only stub).
 * Form posts redirect to `next` (G2 checkout return); JSON keeps API shape.
 */
export async function POST(req: Request) {
  const limited = await takeRouteRateLimit({
    key: `auth:${req.headers.get("x-forwarded-for") ?? "local"}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterMs: limited.retryAfterMs },
      { status: 429 },
    );
  }
  const contentType = req.headers.get("content-type") ?? "";
  const isForm = contentType.includes("application/x-www-form-urlencoded")
    || contentType.includes("multipart/form-data");
  let email = "";
  let password = "";
  let next = "/home";
  if (contentType.includes("application/json")) {
    const body = (await req.json()) as {
      email?: string;
      identifier?: string;
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
    password = String(form.get("password") ?? "");
    next = safeNextPath(String(form.get("next") ?? ""));
  }

  if (!email) {
    if (isForm) {
      return NextResponse.redirect(
        new URL(
          `/?error=${encodeURIComponent("identifier required")}&next=${encodeURIComponent(next)}`,
          req.url,
        ),
        303,
      );
    }
    return NextResponse.json({ error: "identifier required" }, { status: 400 });
  }
  if (!password) {
    if (isForm) {
      return NextResponse.redirect(
        new URL(
          `/?error=${encodeURIComponent("password required")}&next=${encodeURIComponent(next)}`,
          req.url,
        ),
        303,
      );
    }
    return NextResponse.json({ error: "password required" }, { status: 400 });
  }

  try {
    const { token, session } = await createSessionFromSupabasePassword({
      email,
      password,
    });
    if (isForm) {
      const res = NextResponse.redirect(new URL(next, req.url), 303);
      res.cookies.set(sessionCookieName(), token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
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
    res.cookies.set(sessionCookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "sign-in failed";
    if (isForm) {
      return NextResponse.redirect(
        new URL(
          `/?error=${encodeURIComponent(msg)}&next=${encodeURIComponent(next)}`,
          req.url,
        ),
        303,
      );
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
