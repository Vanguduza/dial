/**
 * G1 Grocery browse — USD only (D-57); food/pantry; session B2B formal filter (D-49).
 * PD35 — brand polish + formal KYC / food-safety cert badges (display only).
 */
import Link from "next/link";
import { cookies } from "next/headers";
import { dialTokens } from "@dial/design-tokens";
import {
  resolveGroceryCertBadge,
  searchGroceryOffers,
} from "@dial/catalogue";
import {
  getSessionFromToken,
  sessionCookieName,
} from "../../lib/auth/session";
import { GroceryAddToCartButton } from "./GroceryAddToCartButton";

export default async function GroceryBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const jar = await cookies();
  const session = getSessionFromToken(jar.get(sessionCookieName())?.value);
  const sessionRole = session?.buyerSegment === "b2b" ? "b2b" : "b2c";
  const hits = searchGroceryOffers(q, { sessionRole });

  return (
    <main
      data-testid="grocery-browse"
      style={{
        minHeight: "100vh",
        background: `
          radial-gradient(ellipse 80% 50% at 10% -10%, ${dialTokens.color.brand.accent}33 0%, transparent 55%),
          linear-gradient(165deg, ${dialTokens.color.brand.surface} 0%, #ebe6dc 48%, ${dialTokens.color.brand.primary}18 100%)
        `,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <header
        data-testid="grocery-brand-hero"
        style={{ maxWidth: 960, margin: "0 auto" }}
      >
        <p
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            fontSize: "clamp(2rem, 6vw, 3rem)",
            margin: 0,
            color: dialTokens.color.brand.primary,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Dial Groceries
        </p>
        <p
          style={{
            marginTop: dialTokens.space.sm,
            maxWidth: 36,
            height: 3,
            background: dialTokens.color.brand.accent,
            borderRadius: 2,
          }}
          aria-hidden
        />
        <p style={{ opacity: 0.72, fontSize: 15, marginTop: dialTokens.space.sm }}>
          Food & pantry · USD browse · agency marketplace ·{" "}
          {sessionRole === "b2b" ? "B2B formal only" : "B2C"} · no liquor
        </p>
        {sessionRole === "b2b" ? (
          <p
            role="status"
            data-testid="b2b-formal-only-banner"
            style={{
              marginTop: dialTokens.space.sm,
              padding: dialTokens.space.sm,
              borderRadius: 8,
              background: `${dialTokens.color.brand.primary}14`,
              border: `1px solid ${dialTokens.color.brand.primary}44`,
              fontSize: 14,
              maxWidth: 640,
            }}
          >
            B2B session: formal suppliers only (D-49). Informal stock is hidden
            from search and blocked at cart — not checkout-only.
          </p>
        ) : null}
        <nav
          style={{
            display: "flex",
            gap: dialTokens.space.md,
            flexWrap: "wrap",
            marginTop: dialTokens.space.sm,
          }}
        >
          <Link href="/home">Home</Link>
          <Link href="/spare">Spare</Link>
          <Link href="/grocery/cart">Cart</Link>
          <Link href="/grocery/track">Track</Link>
        </nav>
      </header>

      <form
        method="get"
        action="/grocery"
        style={{
          maxWidth: 960,
          margin: `${dialTokens.space.lg} auto 0`,
          display: "flex",
          gap: dialTokens.space.sm,
          flexWrap: "wrap",
        }}
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="Milk, rice, pantry…"
          aria-label="Search groceries"
          style={{
            flex: "1 1 200px",
            padding: dialTokens.space.sm,
            borderRadius: 8,
            border: `1px solid ${dialTokens.color.brand.primary}55`,
            fontSize: 16,
            background: "#fff",
          }}
        />
        <button
          type="submit"
          style={{
            padding: `${dialTokens.space.sm} ${dialTokens.space.md}`,
            borderRadius: 8,
            border: "none",
            background: dialTokens.color.brand.primary,
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </form>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          maxWidth: 960,
          margin: `${dialTokens.space.lg} auto 0`,
          display: "grid",
          gap: dialTokens.space.md,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        }}
      >
        {hits.map((h) => {
          const badge = resolveGroceryCertBadge(h);
          return (
            <li key={h.offerId} data-testid={`grocery-offer-${h.offerId}`}>
              <div
                style={{
                  padding: dialTokens.space.md,
                  borderRadius: 12,
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  borderTop: `3px solid ${dialTokens.color.brand.accent}`,
                }}
              >
                <span
                  data-testid="grocery-offer-brand"
                  style={{
                    display: "block",
                    fontFamily: `${dialTokens.font.display}, Georgia, serif`,
                    fontSize: 13,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: dialTokens.color.brand.primary,
                    opacity: 0.85,
                  }}
                >
                  {h.brand}
                </span>
                <strong style={{ display: "block", marginTop: 4, fontSize: 17 }}>
                  {h.title}
                </strong>
                <span style={{ fontSize: 13, opacity: 0.7 }}>
                  {h.unitLabel} · {h.coldChain}
                </span>
                {badge ? (
                  <span
                    role="status"
                    data-testid={badge.testId}
                    style={{
                      display: "inline-block",
                      marginTop: dialTokens.space.sm,
                      padding: `2px ${dialTokens.space.sm}`,
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      background:
                        badge.kind === "food_safety_required"
                          ? `${dialTokens.color.brand.accent}33`
                          : `${dialTokens.color.brand.primary}14`,
                      color: dialTokens.color.brand.ink,
                      border: `1px solid ${
                        badge.kind === "food_safety_required"
                          ? dialTokens.color.brand.accent
                          : `${dialTokens.color.brand.primary}44`
                      }`,
                    }}
                  >
                    {badge.label}
                  </span>
                ) : null}
                <span
                  style={{ display: "block", marginTop: 8, fontWeight: 600 }}
                >
                  USD {(Number(h.unitPriceUsdMinor) / 100).toFixed(2)}
                </span>
                <span style={{ fontSize: 12, opacity: 0.55 }}>
                  Sold by {h.supplierDisplayName} · {h.supplierFormality}
                </span>
                <GroceryAddToCartButton offerId={h.offerId} />
              </div>
            </li>
          );
        })}
      </ul>
      {hits.length === 0 ? (
        <p
          style={{
            maxWidth: 960,
            margin: `${dialTokens.space.lg} auto`,
            opacity: 0.7,
          }}
        >
          No grocery offers for “{q || "empty"}”.
        </p>
      ) : null}
      <p
        style={{
          maxWidth: 960,
          margin: `${dialTokens.space.lg} auto 0`,
          fontSize: 11,
          opacity: 0.45,
        }}
      >
        PD35 · Dial Groceries brand · KYC / food-safety badges · USD browse ·
        ZiG at checkout only · no liquor
      </p>
    </main>
  );
}
