/**
 * G1 Grocery browse — USD only (D-57); food/pantry; session B2B formal filter (D-49).
 */
import Link from "next/link";
import { cookies } from "next/headers";
import { dialTokens } from "@dial/design-tokens";
import { searchGroceryOffers } from "@dial/catalogue";
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
      style={{
        minHeight: "100vh",
        background: `linear-gradient(160deg, ${dialTokens.color.brand.surface} 0%, #e8ebe4 55%, ${dialTokens.color.brand.primary}22 100%)`,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <header style={{ maxWidth: 960, margin: "0 auto" }}>
        <p
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
            margin: 0,
            color: dialTokens.color.brand.primary,
          }}
        >
          Dial Groceries
        </p>
        <p style={{ opacity: 0.7, fontSize: 14 }}>
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
        {hits.map((h) => (
          <li key={h.offerId}>
            <div
              style={{
                padding: dialTokens.space.md,
                borderRadius: 12,
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              <strong style={{ display: "block" }}>{h.title}</strong>
              <span style={{ fontSize: 13, opacity: 0.7 }}>
                {h.brand} · {h.unitLabel} · {h.coldChain}
              </span>
              <span style={{ display: "block", marginTop: 8, fontWeight: 600 }}>
                USD {(Number(h.unitPriceUsdMinor) / 100).toFixed(2)}
              </span>
              <span style={{ fontSize: 12, opacity: 0.55 }}>
                Sold by {h.supplierDisplayName} · {h.supplierFormality}
              </span>
              <GroceryAddToCartButton offerId={h.offerId} />
            </div>
          </li>
        ))}
      </ul>
      {hits.length === 0 ? (
        <p style={{ maxWidth: 960, margin: `${dialTokens.space.lg} auto`, opacity: 0.7 }}>
          No grocery offers for “{q || "empty"}”.
        </p>
      ) : null}
      <p style={{ maxWidth: 960, margin: `${dialTokens.space.lg} auto 0`, fontSize: 11, opacity: 0.45 }}>
        PD14 · grocery_offers_v1 · USD browse/cart · ZiG at checkout only · no liquor
      </p>
    </main>
  );
}
