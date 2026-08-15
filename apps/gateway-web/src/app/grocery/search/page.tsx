"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type Hit = {
  offerId: string;
  title: string;
  brand: string;
  unitPriceUsdMinor: string;
  coldChain: string;
  availability: string;
};

/**
 * PD135 — Grocery search + facets (food/pantry; liquor hidden).
 */
export default function GrocerySearchPage() {
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("");
  const [coldChain, setColdChain] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const search = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (brand.trim()) params.set("brand", brand.trim());
      if (coldChain) params.set("coldChain", coldChain);
      const res = await fetch(`/api/search/grocery?${params.toString()}`);
      const data = (await res.json()) as {
        error?: string;
        hits?: Hit[];
        liquorAllowed?: boolean;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setHits(data.hits ?? []);
      setMessage(
        data.liquorAllowed === false
          ? "Food/pantry search — liquor hidden · USD browse"
          : null,
      );
    } finally {
      setBusy(false);
    }
  }, [q, brand, coldChain]);

  return (
    <main
      data-testid="pd135-grocery-search"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: "1.5rem",
      }}
    >
      <p>
        <Link href="/grocery/collections">Collections</Link>
        {" · "}
        <Link href="/grocery/track">Track</Link>
      </p>
      <h1>Grocery search</h1>
      <p>Filter by brand / cold chain — USD; no liquor.</p>
      <div style={{ display: "grid", gap: 8, maxWidth: 420 }}>
        <label>
          Query
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ display: "block", width: "100%", padding: 10 }}
          />
        </label>
        <label>
          Brand
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            style={{ display: "block", width: "100%", padding: 10 }}
          />
        </label>
        <label>
          Cold chain
          <select
            value={coldChain}
            onChange={(e) => setColdChain(e.target.value)}
            style={{ display: "block", width: "100%", padding: 10 }}
          >
            <option value="">Any</option>
            <option value="ambient">Ambient</option>
            <option value="chilled">Chilled</option>
            <option value="frozen">Frozen</option>
          </select>
        </label>
        <button type="button" disabled={busy} onClick={() => void search()}>
          Search
        </button>
      </div>
      {message ? <p role="status">{message}</p> : null}
      <ul>
        {hits.map((h) => (
          <li key={h.offerId}>
            {h.title} · {h.brand} · {h.coldChain} · {h.unitPriceUsdMinor}¢
          </li>
        ))}
      </ul>
    </main>
  );
}
