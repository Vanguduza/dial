"use client";

import { useCallback, useEffect, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

export function GroceryTrackClient({ initialOrderId }: { initialOrderId: string }) {
  const [orderId, setOrderId] = useState(initialOrderId);
  const [data, setData] = useState<{
    status?: string;
    statusFrom?: string;
    windowLabel?: string;
    coldChainNotes?: string;
    totalUsdMinor?: string;
    soldBy?: string;
    liquorAllowed?: boolean;
    error?: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (id: string) => {
    if (!id.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/grocery/track?orderId=${encodeURIComponent(id.trim())}`,
      );
      const json = (await res.json()) as typeof data & { error?: string };
      if (!res.ok) {
        setData({ error: json.error ?? `HTTP ${res.status}` });
        return;
      }
      setData(json);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (initialOrderId) void load(initialOrderId);
  }, [initialOrderId, load]);

  return (
    <div>
      <label style={{ display: "block", fontSize: 14 }}>
        Order ID
        <input
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
        />
      </label>
      <button
        type="button"
        disabled={busy || !orderId.trim()}
        onClick={() => void load(orderId)}
        style={{
          marginTop: dialTokens.space.sm,
          padding: `${dialTokens.space.sm} ${dialTokens.space.lg}`,
          borderRadius: 8,
          border: "none",
          background: dialTokens.color.brand.primary,
          color: "#fff",
          fontWeight: 600,
        }}
      >
        {busy ? "Loading…" : "Track"}
      </button>
      {data?.error ? (
        <p style={{ color: "#a11", fontSize: 14 }}>{data.error}</p>
      ) : null}
      {data && !data.error ? (
        <section style={{ marginTop: dialTokens.space.lg }}>
          <p>
            Status: <strong>{data.status}</strong> (from {data.statusFrom})
          </p>
          <p style={{ fontSize: 14 }}>{data.windowLabel}</p>
          <p style={{ fontSize: 13, opacity: 0.75 }}>{data.coldChainNotes}</p>
          <p style={{ fontSize: 14 }}>
            USD {((Number(data.totalUsdMinor) || 0) / 100).toFixed(2)} · Sold by {data.soldBy}
          </p>
          <p style={{ fontSize: 12, opacity: 0.55 }}>
            liquorAllowed: {String(data.liquorAllowed)}
          </p>
        </section>
      ) : null}
    </div>
  );
}
