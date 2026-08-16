/**
 * T9 security headers + CORS. Production origins come from DIAL_GATEWAY_BASE_URL
 * and DIAL_CORS_ORIGINS (comma-separated). Fixture/dev keep localhost.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function allowedOrigins(): Set<string> {
  const extra = (process.env.DIAL_CORS_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const gateway = process.env.DIAL_GATEWAY_BASE_URL?.trim();
  const set = new Set<string>([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    ...extra,
  ]);
  if (gateway) set.add(gateway.replace(/\/$/, ""));
  return set;
}

function localConnectSrc(): string[] {
  if (process.env.NODE_ENV === "production") return [];
  return ["http://127.0.0.1:*", "http://localhost:*"];
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");
  const res = NextResponse.next();
  const requestId =
    req.headers.get("x-request-id") ??
    `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  res.headers.set("x-request-id", requestId);
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), payment=()",
  );
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains",
    );
  }
  const allowEval = process.env.NODE_ENV !== "production";
  const scriptSrc = allowEval
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "img-src 'self' data: blob: https:",
      "style-src 'self' 'unsafe-inline'",
      scriptSrc,
      // MapLibre fetches vector styles, glyphs and tiles over https (D-44 self-host or OpenFreeMap).
      ["connect-src 'self' ws: wss: https:", ...localConnectSrc()].join(" "),
      "worker-src 'self' blob:",
      "child-src 'self' blob:",
    ].join("; "),
  );
  if (origin && allowedOrigins().has(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Vary", "Origin");
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
