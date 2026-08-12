import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { dialTokens } from "@dial/design-tokens";
import {
  getSessionFromToken,
  parseSessionCookie,
  sessionCookieName,
} from "../../lib/auth/session";

/**
 * Auth-first home (Pack T1) — Shop | Services only after AuthN.
 */
export default async function AuthHomePage() {
  const jar = await cookies();
  const token = jar.get(sessionCookieName())?.value;
  const session = getSessionFromToken(token);
  if (!session) {
    redirect("/");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: `linear-gradient(160deg, ${dialTokens.color.brand.surface} 0%, #e8ebe4 55%, ${dialTokens.color.brand.primary}22 100%)`,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.lg,
      }}
    >
      <header style={{ maxWidth: 720, margin: "0 auto" }}>
        <p
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            fontSize: "2.5rem",
            margin: 0,
            color: dialTokens.color.brand.primary,
          }}
        >
          DIAL
        </p>
        <p style={{ opacity: 0.75, fontSize: 14 }}>Signed in as {session.email}</p>
      </header>
      <nav
        style={{
          maxWidth: 720,
          margin: `${dialTokens.space.xl} auto 0`,
          display: "grid",
          gap: dialTokens.space.md,
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        }}
      >
        <a
          href="#shop"
          style={{
            display: "block",
            padding: dialTokens.space.lg,
            borderRadius: 12,
            background: dialTokens.color.brand.primary,
            color: "#fff",
            textDecoration: "none",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          Shop
        </a>
        <a
          href="#services"
          style={{
            display: "block",
            padding: dialTokens.space.lg,
            borderRadius: 12,
            background: dialTokens.color.brand.accent,
            color: "#fff",
            textDecoration: "none",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          Services
        </a>
      </nav>
      <p style={{ maxWidth: 720, margin: `${dialTokens.space.xl} auto 0`, fontSize: 12, opacity: 0.55 }}>
        Auth-first home (Pack T1) — profiles RLS via @dial/identity; live Supabase in Phase 0
      </p>
    </main>
  );
}

/** Exported for tests — cookie header → session. */
export function sessionFromCookieHeader(cookieHeader: string | null) {
  return getSessionFromToken(parseSessionCookie(cookieHeader));
}
