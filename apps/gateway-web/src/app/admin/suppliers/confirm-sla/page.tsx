/**
 * Phase 4 prep — Confirm-SLA ops board (Pack §9.4).
 * Queue + open escalations; fail-closed API. Does not claim G4.
 */
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type QueueRow = {
  orderId: string;
  supplierId: string;
  amountUsdMinor: string;
  status: string;
  slaDeadlineAt: number;
};

type Escalation = {
  escalationId: string;
  supplierId: string;
  kind: string;
  orderId: string | null;
  status: string;
};

export default function AdminConfirmSlaPage() {
  const [secret, setSecret] = useState("");
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
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
      const res = await fetch("/api/admin/suppliers/confirm-sla", {
        headers: headers(),
      });
      const data = (await res.json()) as {
        error?: string;
        queue?: QueueRow[];
        openEscalations?: Escalation[];
        supplierCount?: number;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setQueue(data.queue ?? []);
      setEscalations(data.openEscalations ?? []);
      setMessage(`Suppliers ${data.supplierCount ?? 0} · queue ${data.queue?.length ?? 0}`);
    } finally {
      setBusy(false);
    }
  }

  async function seedBoard() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/suppliers/confirm-sla", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ action: "seed_board" }),
      });
      const data = (await res.json()) as { error?: string; queueCount?: number };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(`Seeded queue ${data.queueCount ?? 0}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function confirm(row: QueueRow) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/suppliers/confirm-sla", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          action: "confirm",
          supplierId: row.supplierId,
          orderId: row.orderId,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(`Confirmed ${row.orderId}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function ack(esc: Escalation) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/suppliers/confirm-sla", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          action: "ack_escalation",
          supplierId: esc.supplierId,
          escalationId: esc.escalationId,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(`Acked ${esc.escalationId}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="admin-confirm-sla"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <p style={{ marginBottom: 8 }}>
        <Link href="/admin/orders">Orders</Link>
        {" · "}
        <Link href="/admin/orders/failover">Failover</Link>
        {" · "}
        <Link href="/admin/suppliers/bonds">Bonds</Link>
      </p>
      <h1
        style={{
          fontFamily: `${dialTokens.font.display}, Georgia, serif`,
          color: dialTokens.color.brand.primary,
          fontSize: "clamp(1.5rem, 4vw, 2rem)",
        }}
      >
        Confirm SLA board
      </h1>
      <p style={{ opacity: 0.75, marginBottom: 16, maxWidth: 560 }}>
        Ops queue for supplier confirm deadlines and open escalations. Agency
        only — no AI payable writes.
      </p>
      <label style={{ display: "grid", gap: 6, fontSize: 14, marginTop: 16 }}>
        Internal API secret
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          autoComplete="off"
          style={{
            display: "block",
            width: "100%",
            maxWidth: 360,
            padding: 8,
          }}
        />
      </label>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", marginTop: 12 }}>
        <button type="button" disabled={busy} onClick={() => void refresh()}>
          Refresh
        </button>
        <button type="button" disabled={busy} onClick={() => void seedBoard()}>
          Seed board
        </button>
      </div>
      {message ? <p data-testid="confirm-sla-message">{message}</p> : null}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16 }}>Confirm queue</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {queue.length === 0 ? (
            <li style={{ opacity: 0.65 }}>No confirm orders</li>
          ) : (
            queue.map((o) => (
              <li
                key={o.orderId}
                style={{
                  padding: 12,
                  marginBottom: 8,
                  background: "#fff",
                  borderRadius: 8,
                }}
              >
                <strong>{o.orderId}</strong> · {o.supplierId} · {o.status} · USD{" "}
                {(Number(o.amountUsdMinor) / 100).toFixed(2)}
                {o.status === "awaiting_confirm" ? (
                  <button
                    type="button"
                    style={{ marginLeft: 12 }}
                    disabled={busy}
                    onClick={() => void confirm(o)}
                  >
                    Confirm
                  </button>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </section>
      <section>
        <h2 style={{ fontSize: 16 }}>Open escalations</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {escalations.length === 0 ? (
            <li style={{ opacity: 0.65 }}>No open escalations</li>
          ) : (
            escalations.map((e) => (
              <li
                key={e.escalationId}
                style={{
                  padding: 12,
                  marginBottom: 8,
                  background: "#fff",
                  borderRadius: 8,
                }}
              >
                <strong>{e.kind}</strong> · {e.supplierId}
                {e.orderId ? ` · ${e.orderId}` : ""}
                <button
                  type="button"
                  style={{ marginLeft: 12 }}
                  disabled={busy}
                  onClick={() => void ack(e)}
                >
                  Ack
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
      </div>
    </main>
  );
}
