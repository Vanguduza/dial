import { dialTokens } from "@dial/design-tokens";

/**
 * Pre-auth sign-up (Pack T1 / §10 screens) — no Shop|Services until AuthN.
 * Optional `next` query returns to checkout (or other same-origin path) after form sign-up.
 */
function safeNextPath(raw: string | undefined): string {
  if (!raw) return "/home";
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//") || t.includes("://")) {
    return "/home";
  }
  return t;
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next: nextRaw, error } = await searchParams;
  const next = safeNextPath(nextRaw);

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
          Create your account
        </p>
        {error ? (
          <p role="alert" style={{ color: "#a33", fontSize: 14 }}>
            {error}
          </p>
        ) : null}
        <form
          style={{
            marginTop: dialTokens.space.xl,
            display: "grid",
            gap: dialTokens.space.md,
            textAlign: "left",
          }}
          action="/api/auth/sign-up"
          method="post"
        >
          <input type="hidden" name="next" value={next} />
          <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
            Display name
            <input
              name="displayName"
              type="text"
              autoComplete="name"
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
              autoComplete="new-password"
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
            Create account
          </button>
        </form>
        <p style={{ marginTop: dialTokens.space.lg, fontSize: 14 }}>
          <a href="/" style={{ color: dialTokens.color.brand.accent }}>
            Already have an account? Sign in
          </a>
        </p>
      </section>
    </main>
  );
}
