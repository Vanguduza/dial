/**
 * PD3 Spare browse — USD-only results via searchOffersAsync (D-57); no supplierId (D-58).
 * Session buyerSegment drives B2B formal-only filter (D-49).
 */
import Link from "next/link";
import { cookies } from "next/headers";
import { dialTokens } from "@dial/design-tokens";
import {
  searchSpareForSession,
  sessionFromCookieStore,
} from "../../lib/spare/sessionSearch";

export default async function SpareBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const jar = await cookies();
  const { sessionRole } = sessionFromCookieStore((name) => jar.get(name));
  const { hits, source, meiliFilter } = await searchSpareForSession(q, sessionRole);

  return (
    <main
      data-testid="spare-browse"
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
          Dial a Spare
        </p>
        <p style={{ opacity: 0.7, fontSize: 14 }}>
          Browse USD only · agency marketplace ·{" "}
          {sessionRole === "b2b" ? "B2B formal stock" : "B2C"} · search {source}
        </p>
        <nav
          style={{
            display: "flex",
            gap: dialTokens.space.md,
            flexWrap: "wrap",
            marginTop: dialTokens.space.sm,
          }}
        >
          <Link href="/home">Home</Link>
          <Link href="/spare/entry">Select Vehicle / EPC</Link>
          <Link href="/spare/cart">Cart</Link>
          <Link href="/spare/orders">Orders</Link>
          <Link href="/spare/garage">Garage</Link>
          <Link href="/spare/returns">Returns</Link>
        </nav>
      </header>

      <form
        method="get"
        action="/spare"
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
          placeholder="OEM, brand, or part"
          aria-label="Search spares"
          style={{
            flex: "1 1 200px",
            minWidth: 0,
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
            <Link
              href={`/spare/${h.offerId}`}
              style={{
                display: "block",
                padding: dialTokens.space.md,
                borderRadius: 12,
                background: "#fff",
                textDecoration: "none",
                color: dialTokens.color.brand.ink,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                minHeight: 120,
              }}
            >
              <strong style={{ display: "block", marginBottom: 4 }}>{h.title}</strong>
              <span style={{ fontSize: 13, opacity: 0.7 }}>
                {h.brand} · {h.oem} · {h.qualityTier}
              </span>
              <span style={{ display: "block", marginTop: 8, fontWeight: 600 }}>
                USD {(Number(h.unitPriceUsdMinor) / 100).toFixed(2)}
              </span>
              <span style={{ fontSize: 12, opacity: 0.55 }}>
                Sold by {h.brand} Agency · {h.supplierFormality}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {hits.length === 0 ? (
        <p style={{ maxWidth: 960, margin: `${dialTokens.space.lg} auto`, opacity: 0.7 }}>
          No offers for “{q || "empty query"}”.
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
        PD3 · filter {meiliFilter} · currency USD (no ZiG on browse)
      </p>
    </main>
  );
}
