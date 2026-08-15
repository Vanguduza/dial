"use client";

import { useState } from "react";
import { dialTokens } from "@dial/design-tokens";

/** PD14 add-to-cart — USD cart; no ZiG on browse. */
export function GroceryAddToCartButton({ offerId }: { offerId: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/grocery/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ offerId, qty: 1 }),
      });
      const json = (await res.json()) as {
        error?: string;
        totalUsdMinor?: string;
        lineCount?: number;
      };
      if (!res.ok) {
        setMsg(json.error ?? "Add failed");
        return;
      }
      setMsg(`Cart · ${json.lineCount} lines · USD ${((Number(json.totalUsdMinor) || 0) / 100).toFixed(2)}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Add failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: dialTokens.space.sm }}>
      <button
        type="button"
        disabled={busy}
        onClick={() => void add()}
        style={{
          padding: `${dialTokens.space.sm} ${dialTokens.space.md}`,
          borderRadius: 8,
          border: "none",
          background: dialTokens.color.brand.primary,
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer",
          width: "100%",
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? "Adding…" : "Add to cart (USD)"}
      </button>
      {msg ? <p style={{ fontSize: 12, marginTop: 6 }}>{msg}</p> : null}
    </div>
  );
}
