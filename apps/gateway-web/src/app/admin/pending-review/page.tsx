/**
 * PD66 — Admin pending_review claim/resolve queue (Pack §10).
 */
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type ReviewItem = {
  reviewId: string;
  batchId: string;
  offerId: string;
  status: string;
  vertical: string;
  claimedBy?: string;
};

export default function AdminPendingReviewPage() {
  const [secret, setSecret] = useState("");
  const [pending, setPending] = useState<ReviewItem[]>([]);
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
      const res = await fetch("/api/admin/catalogue/review", { headers: headers() });
      const data = (await res.json()) as {
        error?: string;
        pending?: ReviewItem[];
        queue?: ReviewItem[];
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setPending(data.pending ?? data.queue?.filter((q) => q.status === "queued" || q.status === "claimed") ?? []);
    } finally {
      setBusy(false);
    }
  }

  async function seed() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/catalogue/review", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ action: "enqueue", rowCount: 1 }),
      });
      const data = (await res.json()) as { error?: string; pending?: ReviewItem[] };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setPending(data.pending ?? []);
      setMessage("Seeded pending_review item");
    } finally {
      setBusy(false);
    }
  }

  async function act(action: "claim" | "approve" | "reject", reviewId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/catalogue/review", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          action,
          reviewId,
          claimedBy: "ops_pending_review",
        }),
      });
      const data = (await res.json()) as { error?: string; pending?: ReviewItem[] };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setPending(data.pending ?? []);
      setMessage(`${action} ok · ${reviewId}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="admin-pending-review"
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
        <Link href="/admin/suppliers/bonds">Supplier bonds</Link>
        {" · "}
        <Link href="/admin/command-centre">Command Centre</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Pending review
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
            Seed enqueue
          </button>
        </div>
        {message ? <p style={{ marginTop: 12 }}>{message}</p> : null}
        <ul style={{ listStyle: "none", padding: 0, marginTop: 20 }}>
          {pending.length === 0 ? (
            <li style={{ opacity: 0.7, fontSize: 14 }}>No pending_review items</li>
          ) : (
            pending.map((item) => (
              <li
                key={item.reviewId}
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(0,0,0,0.08)",
                  display: "grid",
                  gap: 8,
                }}
              >
                <strong>
                  {item.vertical} · {item.status}
                </strong>
                <span style={{ fontSize: 13, opacity: 0.75 }}>
                  {item.reviewId} · batch {item.batchId}
                  {item.claimedBy ? ` · claimed by ${item.claimedBy}` : ""}
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {item.status === "queued" ? (
                    <button
                      type="button"
                      disabled={busy || !secret}
                      onClick={() => void act("claim", item.reviewId)}
                    >
                      Claim
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={busy || !secret}
                    onClick={() => void act("approve", item.reviewId)}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busy || !secret}
                    onClick={() => void act("reject", item.reviewId)}
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
