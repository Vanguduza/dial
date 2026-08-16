"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

/**
 * PD134 — Grocery home collections (food/pantry).
 */
export default function GroceryCollectionsPage() {
  const [collections, setCollections] = useState<
    Array<{ id: string; title: string; count: number }>
  >([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/grocery/collections");
      const data = (await res.json()) as {
        error?: string;
        collections?: typeof collections;
        liquorAllowed?: boolean;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setCollections(data.collections ?? []);
      setMessage(null);
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <main
      data-testid="pd134-grocery-collections"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: "1.5rem",
      }}
    >
      <p>
        <Link href="/grocery/track">Track order</Link>
      </p>
      <h1>Grocery collections</h1>
      <button type="button" disabled={busy} onClick={() => void load()}>
        Load collections
      </button>
      {message ? <p role="status">{message}</p> : null}
      <ul>
        {collections.map((c) => (
          <li key={c.id}>
            {c.title} ({c.count})
          </li>
        ))}
      </ul>
    </main>
  );
}
