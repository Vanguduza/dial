/**
 * PD72 — Dedicated promo approve queue (Pack §10).
 */
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type Pending = {
  campaignId: string;
  campaignName: string;
  supplierId: string;
  agreementStatus: string;
};

export default function AdminPromoApprovePage() {
  const [secret, setSecret] = useState("");
  const [pending, setPending] = useState<Pending[]>([]);
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
      const res = await fetch("/api/admin/promotions/approve", {
        headers: headers(),
      });
      const data = (await res.json()) as { error?: string; pending?: Pending[] };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setPending(data.pending ?? []);
    } finally {
      setBusy(false);
    }
  }

  async function seed() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/promotions/approve", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ action: "seed_pending" }),
      });
      const data = (await res.json()) as { error?: string; pending?: Pending[] };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setPending(data.pending ?? []);
      setMessage("Seeded SUPPLIER_COOP pending ops approve");
    } finally {
      setBusy(false);
    }
  }

  async function act(action: "approve" | "reject", campaignId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/promotions/approve", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ action, campaignId }),
      });
      const data = (await res.json()) as { error?: string; pending?: Pending[] };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setPending(data.pending ?? []);
      setMessage(`${action} ok · ${campaignId}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="admin-promo-approve"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/admin/promotions">Promotions</Link>
        {" · "}
        <Link href="/admin/orders/failover">Order failover</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Promo approve
        </h1>
        
        <label style={{ display: "grid", gap: 6, fontSize: 14, marginTop: 16 }}>
          Internal API secret
          <input
            type="password"
            autoComplete="off"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc" }}
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
            onClick={() => void seed()}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#fff",
            }}
          >
            Seed pending
          </button>
        </div>
        {message ? <p style={{ marginTop: 12 }}>{message}</p> : null}
        <ul style={{ listStyle: "none", padding: 0, marginTop: 20 }}>
          {pending.length === 0 ? (
            <li style={{ opacity: 0.7, fontSize: 14 }}>No pending promo approvals</li>
          ) : (
            pending.map((p) => (
              <li
                key={p.campaignId}
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(0,0,0,0.08)",
                  display: "grid",
                  gap: 8,
                }}
              >
                <strong>{p.campaignName}</strong>
                <span style={{ fontSize: 13, opacity: 0.75 }}>
                  {p.campaignId} · {p.supplierId} · {p.agreementStatus}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    disabled={busy || !secret}
                    onClick={() => void act("approve", p.campaignId)}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busy || !secret}
                    onClick={() => void act("reject", p.campaignId)}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </main>
  );
}
