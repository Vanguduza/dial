import { dialTokens } from "@dial/design-tokens";

/**
 * T0/T1 auth-first gateway shell (v4 §1.4) — sign-in surface only.
 * Shop | Services appear only after authentication.
 */
export default function SignInPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: `linear-gradient(160deg, ${dialTokens.color.brand.surface} 0%, #e8ebe4 55%, ${dialTokens.color.brand.primary}22 100%)`,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.lg,
      }}
    >
      <section style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <p
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            fontSize: "3rem",
            letterSpacing: "-0.03em",
            margin: 0,
            color: dialTokens.color.brand.primary,
          }}
        >
          DIAL
        </p>
        <p style={{ marginTop: dialTokens.space.sm, opacity: 0.85 }}>
          Find it. Buy it. Get it done.
        </p>
        <form
          style={{
            marginTop: dialTokens.space.xl,
            display: "grid",
            gap: dialTokens.space.md,
            textAlign: "left",
          }}
          action="/api/auth/sign-in"
          method="post"
        >
          <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
            Email or phone
            <input
              name="identifier"
              type="text"
              autoComplete="username"
              required
              style={{
                padding: "12px 14px",
                borderRadius: 8,
                border: `1px solid ${dialTokens.color.brand.primary}33`,
                fontSize: 16,
              }}
            />
          </label>
          <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              style={{
                padding: "12px 14px",
                borderRadius: 8,
                border: `1px solid ${dialTokens.color.brand.primary}33`,
                fontSize: 16,
              }}
            />
          </label>
          <button
            type="submit"
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              border: "none",
              background: dialTokens.color.brand.primary,
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            Sign in
          </button>
        </form>
        <p style={{ marginTop: dialTokens.space.lg, fontSize: 14 }}>
          <a href="/sign-up" style={{ color: dialTokens.color.brand.accent }}>
            Create account
          </a>
        </p>
        <p style={{ marginTop: dialTokens.space.md, fontSize: 12, opacity: 0.6 }}>
          Auth-first — Supabase Auth + Shop | Services after sign-in (PD1)
        </p>
      </section>
    </main>
  );
}
