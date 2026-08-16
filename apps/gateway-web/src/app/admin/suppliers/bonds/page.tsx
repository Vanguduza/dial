/**
 * PD65 — Supplier bonds admin (Pack §9.4).
 */
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type Bond = {
  bondId: string;
  supplierId: string;
  amountUsdMinor: string;
  status: string;
  note: string;
};

export default function AdminSupplierBondsPage() {
  const [secret, setSecret] = useState("");
  const [supplierId, setSupplierId] = useState("sup_bond_ops");
  const [bonds, setBonds] = useState<Bond[]>([]);
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
      const res = await fetch(
        `/api/admin/suppliers/bonds?supplierId=${encodeURIComponent(supplierId)}`,
        { headers: headers() },
      );
      const data = (await res.json()) as { error?: string; bonds?: Bond[] };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setBonds(data.bonds ?? []);
    } finally {
      setBusy(false);
    }
  }

  async function ensureAndHold() {
    setBusy(true);
    setMessage(null);
    try {
      await fetch("/api/admin/suppliers/bonds", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          action: "ensure_supplier",
          supplierId,
          displayName: "Bond Ops Supplier",
        }),
      });
      const res = await fetch("/api/admin/suppliers/bonds", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          action: "hold",
          supplierId,
          amountUsdMinor: "10000",
          note: "Ops performance bond",
        }),
      });
      const data = (await res.json()) as { error?: string; bond?: Bond };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(`Held bond ${data.bond?.bondId}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function release(bondId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/suppliers/bonds", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          action: "release",
          bondId,
          releasedBy: "ops_bonds",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(`Released ${bondId}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="admin-supplier-bonds"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/admin/pending-review">Pending review</Link>
        {" · "}
        <Link href="/admin/command-centre">Command Centre</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Supplier bonds
        </h1>
        
        <label style={{ display: "grid", gap: 6, fontSize: 14, marginTop: 16 }}>
          Internal API secret
          <input
            type="password"
            autoComplete="off"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc", maxWidth: 360 }}
          />
        </label>
        <label style={{ display: "grid", gap: 6, fontSize: 14, marginTop: 12 }}>
          Supplier id
          <input
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc", maxWidth: 360 }}
          />
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <button
            type="button"
            disabled={busy || !secret}
            onClick={() => void refresh()}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "none",
              background: dialTokens.color.brand.primary,
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Refresh
          </button>
          <button
            type="button"
            disabled={busy || !secret}
            onClick={() => void ensureAndHold()}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#fff",
            }}
          >
            Hold $100.00 bond
          </button>
        </div>
        {message ? <p style={{ marginTop: 12 }}>{message}</p> : null}
        <ul style={{ listStyle: "none", padding: 0, marginTop: 20 }}>
          {bonds.map((b) => (
            <li
              key={b.bondId}
              style={{
                padding: "12px 0",
                borderBottom: "1px solid rgba(0,0,0,0.08)",
                display: "grid",
                gap: 8,
              }}
            >
              <strong>
                {b.status} · {b.amountUsdMinor} USD minor
              </strong>
              <span style={{ fontSize: 13, opacity: 0.75 }}>
                {b.bondId} · {b.note}
              </span>
              {b.status === "held" ? (
                <button
                  type="button"
                  disabled={busy || !secret}
                  onClick={() => void release(b.bondId)}
                >
                  Release
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
