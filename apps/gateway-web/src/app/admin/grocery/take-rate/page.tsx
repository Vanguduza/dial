"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type Ladder = {
  ladderId: string;
  label: string;
  status: string;
  payableFromAi: false;
  liquorAllowed: false;
  tiers: Array<{ minGmvUsdMinor: string; takeRateBps: number }>;
};

/**
 * PD34 Grocery take-rate admin — ops set integer bps ladders.
 * Draft economics only; AI never writes payable amounts. No liquor.
 */
export default function GroceryTakeRateAdminPage() {
  const [secret, setSecret] = useState("");
  const [label, setLabel] = useState("Grocery take-rate");
  const [tier0Bps, setTier0Bps] = useState("800");
  const [tier1Bps, setTier1Bps] = useState("600");
  const [ladders, setLadders] = useState<Ladder[]>([]);
  const [published, setPublished] = useState<Ladder | null>(null);
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
      const res = await fetch("/api/admin/grocery/take-rate", {
        headers: headers(),
      });
      const data = (await res.json()) as {
        error?: string;
        ladders?: Ladder[];
        published?: Ladder | null;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setLadders(data.ladders ?? []);
      setPublished(data.published ?? null);
    } finally {
      setBusy(false);
    }
  }

  async function createDraft() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/grocery/take-rate", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          action: "draft",
          label,
          setBy: "ops_admin",
          tiers: [
            { minGmvUsdMinor: "0", takeRateBps: Number(tier0Bps) },
            { minGmvUsdMinor: "10000", takeRateBps: Number(tier1Bps) },
          ],
        }),
      });
      const data = (await res.json()) as { error?: string; ladder?: Ladder };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(`Draft ${data.ladder?.ladderId}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function publish(ladderId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/grocery/take-rate", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          action: "publish",
          ladderId,
          setBy: "ops_admin",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(`Published ${ladderId}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: dialTokens.space.md,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        color: dialTokens.color.brand.ink,
        background: dialTokens.color.brand.surface,
      }}
    >
      <header style={{ maxWidth: 720, margin: "0 auto" }}>
        <p
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
            margin: 0,
            color: dialTokens.color.brand.primary,
          }}
        >
          Grocery take-rate
        </p>
        <p style={{ opacity: 0.7, fontSize: 14 }}>
          PD34 · integer bps from ops · payableFromAi=false · no liquor
        </p>
        <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
          <Link href="/admin/command-centre">Command Centre</Link>
          <Link href="/admin/catalogue/factory">Catalogue Factory</Link>
          <Link href="/grocery">Grocery browse</Link>
        </nav>
      </header>

      <section style={{ maxWidth: 720, margin: "24px auto 0" }}>
        <label style={{ display: "block", marginBottom: 8 }}>
          Internal secret
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>
        <button type="button" disabled={busy} onClick={() => void refresh()}>
          Refresh ladders
        </button>
        {message ? (
          <p style={{ marginTop: 12, fontSize: 14 }} role="status">
            {message}
          </p>
        ) : null}
        {published ? (
          <p style={{ marginTop: 12, fontSize: 14 }}>
            Published: {published.label} ({published.ladderId})
          </p>
        ) : (
          <p style={{ marginTop: 12, fontSize: 14, opacity: 0.7 }}>
            No published grocery take-rate yet
          </p>
        )}
      </section>

      <section style={{ maxWidth: 720, margin: "24px auto 0" }}>
        <h2 style={{ fontSize: 18 }}>New draft</h2>
        <label style={{ display: "block", marginBottom: 8 }}>
          Label
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 8 }}>
          Tier 0 bps (from $0)
          <input
            value={tier0Bps}
            onChange={(e) => setTier0Bps(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 8 }}>
          Tier 1 bps (from $100 GMV)
          <input
            value={tier1Bps}
            onChange={(e) => setTier1Bps(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>
        <button type="button" disabled={busy} onClick={() => void createDraft()}>
          Create draft
        </button>
      </section>

      <ul style={{ maxWidth: 720, margin: "24px auto 0", padding: 0, listStyle: "none" }}>
        {ladders.map((l) => (
          <li
            key={l.ladderId}
            style={{
              padding: 12,
              marginBottom: 8,
              background: "#fff",
              borderRadius: 8,
            }}
          >
            <strong>{l.label}</strong> · {l.status} · {l.ladderId}
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
              {l.tiers
                .map((t) => `${t.minGmvUsdMinor}+ → ${t.takeRateBps} bps`)
                .join(" · ")}
            </div>
            {l.status === "draft" ? (
              <button
                type="button"
                disabled={busy}
                style={{ marginTop: 8 }}
                onClick={() => void publish(l.ladderId)}
              >
                Publish
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
