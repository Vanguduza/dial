/**
 * PD62 — Unified four-eyes approval queue (Pack §9.5).
 */
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type QueueItem = {
  kind: string;
  proposalId: string;
  status: string;
  zigMinorPerUsd: string;
  proposedBy: string;
  createdAt: string;
};

export default function AdminFourEyesQueuePage() {
  const [secret, setSecret] = useState("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [approvedBy, setApprovedBy] = useState("ops_b");
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
      const res = await fetch("/api/admin/four-eyes", { headers: headers() });
      const data = (await res.json()) as { error?: string; queue?: QueueItem[] };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setQueue(data.queue ?? []);
    } finally {
      setBusy(false);
    }
  }

  async function act(action: "approve" | "reject", proposalId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/four-eyes", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(
          action === "approve"
            ? { action, proposalId, approvedBy }
            : { action, proposalId, rejectedBy: approvedBy },
        ),
      });
      const data = (await res.json()) as { error?: string; queue?: QueueItem[] };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setQueue(data.queue ?? []);
      setMessage(`${action} ok for ${proposalId}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="admin-four-eyes-queue"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/admin/fx/daily-zig">Daily ZiG rate</Link>
        {" · "}
        <Link href="/admin/platform/modules">Domain modules</Link>
        {" · "}
        <Link href="/admin/command-centre">Command Centre</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Four-eyes queue
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
          Approver / rejector id (must ≠ proposer)
          <input
            value={approvedBy}
            onChange={(e) => setApprovedBy(e.target.value)}
            style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc", maxWidth: 360 }}
          />
        </label>
        <button
          type="button"
          disabled={busy || !secret}
          onClick={() => void refresh()}
          style={{
            marginTop: 12,
            padding: "10px 14px",
            borderRadius: 8,
            border: "none",
            background: dialTokens.color.brand.primary,
            color: "#fff",
            fontWeight: 600,
          }}
        >
          Refresh queue
        </button>
        {message ? <p style={{ marginTop: 12 }}>{message}</p> : null}
        <ul style={{ listStyle: "none", padding: 0, marginTop: 20 }}>
          {queue.length === 0 ? (
            <li style={{ opacity: 0.7, fontSize: 14 }}>No pending four-eyes items</li>
          ) : (
            queue.map((item) => (
              <li
                key={item.proposalId}
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(0,0,0,0.08)",
                  display: "grid",
                  gap: 8,
                }}
              >
                <strong>{item.kind}</strong>
                <span style={{ fontSize: 13, opacity: 0.75 }}>
                  {item.proposalId} · ZiG minor/USD {item.zigMinorPerUsd} · by{" "}
                  {item.proposedBy}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    disabled={busy || !secret}
                    onClick={() => void act("approve", item.proposalId)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "none",
                      background: dialTokens.color.brand.primary,
                      color: "#fff",
                      fontWeight: 600,
                    }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busy || !secret}
                    onClick={() => void act("reject", item.proposalId)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid #ccc",
                      background: "#fff",
                    }}
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
