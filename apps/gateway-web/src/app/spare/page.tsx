/**
 * PD3 Spare browse — USD-only results via searchOffersAsync (D-57); no supplierId (D-58).
 * Session buyerSegment drives B2B formal-only filter (D-49).
 */
import Link from "next/link";
import { cookies } from "next/headers";
import { AppShell } from "../../components/shell/AppShell";
import { ProductThumb } from "../../components/ui/ProductThumb";
import {
  searchSpareForSession,
  sessionFromCookieStore,
} from "../../lib/spare/sessionSearch";

function SearchBar({ q, chassis }: { q: string; chassis: string }) {
  return (
    <form method="get" action="/spare" className="dial-searchbar">
      <input
        name="q"
        defaultValue={q}
        placeholder="OEM, brand, or part"
        aria-label="Search spares"
        className="dial-input"
      />
      {chassis ? <input type="hidden" name="chassis" value={chassis} /> : null}
      <button type="submit" className="dial-btn">
        Search
      </button>
    </form>
  );
}

export default async function SpareBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; chassis?: string }>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const chassis = params.chassis?.trim() ?? "";
  const jar = await cookies();
  const { sessionRole } = sessionFromCookieStore((name) => jar.get(name));
  const { hits, source, chassisFilter } = await searchSpareForSession(
    q,
    sessionRole,
    chassis ? { chassis } : undefined,
  );

  return (
    <AppShell
      section="spare"
      activeHref="/spare"
      cartHref="/spare/cart"
      search={<SearchBar q={q} chassis={chassis} />}
    >
      <div data-testid="spare-browse" className="dial-container">
        <div className="dial-page-head">
          <h1>Dial a Spare</h1>
          <p>
            {sessionRole === "b2b" ? "B2B formal stock" : "USD browse"} · search{" "}
            {source}
            {chassisFilter ? ` · chassis ${chassisFilter}` : ""}
          </p>
        </div>

        <div style={{ display: "grid", gap: "var(--dial-space-md)" }}>
          <div className="dial-only-compact">
            <SearchBar q={q} chassis={chassis} />
          </div>
          <Link href="/spare/entry" className="dial-btn dial-btn--secondary">
            Select Vehicle / EPC
          </Link>
        </div>

        <section className="dial-section">
          <div className="dial-section__head">
            <h2>
              {hits.length} {hits.length === 1 ? "offer" : "offers"}
            </h2>
            <span style={{ color: "var(--dial-muted)", fontSize: "0.8125rem" }}>
              Prices in USD
            </span>
          </div>

          <ul className="dial-grid">
            {hits.map((h) => (
              <li key={h.offerId}>
                <Link href={`/spare/${h.offerId}`} className="dial-product">
                  <div className="dial-product__media">
                    <ProductThumb seed={h.offerId} kind="part" label={h.title} />
                  </div>
                  <div className="dial-product__body">
                    <span className="dial-badge-row">
                      <span className="dial-badge">{h.qualityTier}</span>
                      {h.supplierFormality === "formal" ? (
                        <span className="dial-badge dial-badge--accent">
                          Formal
                        </span>
                      ) : null}
                    </span>
                    <strong className="dial-product__title">{h.title}</strong>
                    <span className="dial-product__meta">
                      {h.brand} · {h.oem} · {h.qualityTier}
                    </span>
                    <span className="dial-product__price">
                      USD {(Number(h.unitPriceUsdMinor) / 100).toFixed(2)}
                    </span>
                    <span className="dial-product__sold-by">
                      Sold by {h.brand} Agency · {h.supplierFormality}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {hits.length === 0 ? (
            <p className="dial-empty">No offers for “{q || "empty query"}”.</p>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
