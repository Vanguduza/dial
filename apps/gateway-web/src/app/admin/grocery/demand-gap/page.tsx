/**
 * PD54 Grocery Meili demand-gap admin (D-53 Catalogue Factory companion).
 * Food/pantry only — no liquor Build.
 */
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type DemandGap = {
  noResultCount: number;
  topQueries: Array<{ query: string; count: number }>;
  liquorAllowed: false;
  payableFromAi: false;
  vertical: string;
};

export default function GroceryDemandGapPage() {
  const [secret, setSecret] = useState("");
  const [gap, setGap] = useState<DemandGap | null>(null);
  const [query, setQuery] = useState("exotic quinoa missing");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const headers = useCallback(
    () => ({
      "content-type": "application/json",
      "x-internal-secret": secret,
    }),
    [secret],
  );

  async function refresh() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/grocery/demand-gap", {
        headers: headers(),
      });
      const data = (await res.json()) as {
        error?: string;
        demandGap?: DemandGap;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setGap(data.demandGap ?? null);
      setMessage(
        `Grocery no-results: ${data.demandGap?.noResultCount ?? 0} · liquorAllowed=false`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function record() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/grocery/demand-gap", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          action: "record_no_result",
          query,
          sessionRole: "b2c",
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        demandGap?: DemandGap;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setGap(data.demandGap ?? null);
      setMessage("Recorded grocery no-result");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="admin-grocery-demand-gap"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/admin/catalogue/factory">Catalogue Factory</Link>
        {" · "}
        <Link href="/admin/grocery/take-rate">Take-rate</Link>
        {" · "}
        <Link href="/admin/command-centre">Command Centre</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
          }}
        >
          Grocery demand-gap
        </h1>
        <p style={{ fontSize: 14, opacity: 0.75 }}>
          PD54 — Meili no-result rollup for Dial Groceries (food/pantry). Liquor
          excluded. Human Factory ingest follows — no AI auto-publish.
        </p>
        <label style={{ display: "block", marginTop: 12 }}>
          Internal secret
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>
        <label style={{ display: "block", marginTop: 8 }}>
          No-result query
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button type="button" disabled={busy} onClick={() => void refresh()}>
            Refresh gap
          </button>
          <button type="button" disabled={busy} onClick={() => void record()}>
            Record no-result
          </button>
        </div>
        {message ? <p role="status">{message}</p> : null}
        {gap ? (
          <section style={{ marginTop: 16 }}>
            <p>
              Count {gap.noResultCount} · vertical {gap.vertical} ·
              payableFromAi={String(gap.payableFromAi)}
            </p>
            <h2 style={{ fontSize: 16 }}>Top queries</h2>
            <ul>
              {gap.topQueries.map((t) => (
                <li key={t.query}>
                  {t.query} · {t.count}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
