/**
 * PD71 — Order failover accept (Pack §10).
 */
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

export default function AdminOrderFailoverPage() {
  const [secret, setSecret] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [fromSupplierId, setFrom] = useState("sup_failover_a");
  const [toSupplierId, setTo] = useState("sup_failover_b");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const headers = useCallback(
    () => ({
      "content-type": "application/json",
      "x-internal-secret": secret,
    }),
    [secret],
  );

  async function seed() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/orders/failover", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          action: "seed_breach",
          fromSupplierId,
          toSupplierId,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        orderId?: string;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setOrderId(data.orderId ?? null);
      setMessage(`Seeded breached order ${data.orderId}`);
    } finally {
      setBusy(false);
    }
  }

  async function failover() {
    if (!orderId) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/orders/failover", {
        method: "POST",
        headers: {
          ...headers(),
          "Idempotency-Key": `admin-failover-${orderId}-${Date.now()}`,
        },
        body: JSON.stringify({
          action: "failover_accept",
          orderId,
          fromSupplierId,
          toSupplierId,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        result?: { toSupplierId: string; status: string };
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(
        `Failover accepted → ${data.result?.toSupplierId} (${data.result?.status})`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="admin-order-failover"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <Link href="/admin/orders">Orders</Link>
        {" · "}
        <Link href="/admin/promotions/approve">Promo approve</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Order failover
        </h1>
        <p style={{ fontSize: 14, opacity: 0.8 }}>
          PD71 — after confirm SLA breach, accept failover to an alternate
          supplier.
        </p>
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
            onClick={() => void seed()}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "none",
              background: dialTokens.color.brand.primary,
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Seed SLA breach
          </button>
          <button
            type="button"
            disabled={busy || !secret || !orderId}
            onClick={() => void failover()}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#fff",
            }}
          >
            Failover accept
          </button>
        </div>
        {orderId ? (
          <p style={{ marginTop: 12, fontSize: 13 }}>
            Order <code>{orderId}</code> · {fromSupplierId} → {toSupplierId}
          </p>
        ) : null}
        {message ? <p role="status">{message}</p> : null}
      </div>
    </main>
  );
}
