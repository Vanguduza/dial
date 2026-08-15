/**
 * PD55 Admin orders queue — Spare + grocery (Pack §9.5).
 */
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type OrderRow = {
  vertical: "spare" | "grocery";
  orderId: string;
  status: string;
  totalUsdMinor: string;
  soldBy: string;
};

export default function AdminOrdersPage() {
  const [secret, setSecret] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
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
      const res = await fetch("/api/admin/orders", { headers: headers() });
      const data = (await res.json()) as {
        error?: string;
        orders?: OrderRow[];
        spareCount?: number;
        groceryCount?: number;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setOrders(data.orders ?? []);
      setMessage(
        `Spare ${data.spareCount ?? 0} · grocery ${data.groceryCount ?? 0}`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function advance(o: OrderRow) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          action: "advance",
          vertical: o.vertical,
          orderId: o.orderId,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(`Advanced ${o.orderId}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="admin-orders-queue"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link href="/admin/returns">Returns</Link>
        {" · "}
        <Link href="/admin/delivery/dispatch">Dispatch</Link>
        {" · "}
        <Link href="/admin/command-centre">Command Centre</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
          }}
        >
          Orders queue
        </h1>
        <p style={{ fontSize: 14, opacity: 0.75 }}>
          PD55 — Spare + grocery ops queue. Advance ERP status only. Food/pantry —
          no liquor. AI never writes payable amounts.
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
        <button
          type="button"
          disabled={busy}
          onClick={() => void refresh()}
          style={{ marginTop: 12 }}
        >
          Load orders
        </button>
        {message ? <p role="status">{message}</p> : null}
        <ul style={{ marginTop: 16 }}>
          {orders.map((o) => (
            <li key={`${o.vertical}-${o.orderId}`} style={{ marginBottom: 10 }}>
              [{o.vertical}] {o.orderId} · {o.status} · {o.totalUsdMinor} USD ·{" "}
              {o.soldBy}
              <button
                type="button"
                disabled={busy}
                onClick={() => void advance(o)}
                style={{ marginLeft: 8 }}
              >
                Advance
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
