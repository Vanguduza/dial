/**
 * PD69 — Admin job variation approve queue (Pack §10).
 */
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type Variation = {
  variationId: string;
  jobId: string;
  proposedBy: string;
  draftDeltaUsdMinor: string;
  status: string;
  reason: string;
};

export default function AdminJobVariationsPage() {
  const [secret, setSecret] = useState("");
  const [items, setItems] = useState<Variation[]>([]);
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
      const res = await fetch("/api/admin/jobs/variations?status=proposed", {
        headers: headers(),
      });
      const data = (await res.json()) as { error?: string; variations?: Variation[] };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setItems(data.variations ?? []);
    } finally {
      setBusy(false);
    }
  }

  async function seedPropose() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/jobs/variations", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          action: "propose",
          jobId: `job_var_${Date.now().toString(36)}`,
          proposedBy: "tech_ops",
          draftDeltaUsdMinor: "2500",
          reason: "Extra labour after diagnosis",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage("Proposed variation (draft only — not payable until pricing engine)");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function act(action: "approve" | "reject", variationId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/jobs/variations", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          action,
          variationId,
          approvedBy: "ops_variations",
          rejectedBy: "ops_variations",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(`${action} ok`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="admin-job-variations"
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
          Job variations
        </h1>
        <p style={{ fontSize: 14, opacity: 0.8 }}>
          PD69 — human propose/approve draft deltas. AI cannot write payables.
        </p>
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
            Refresh proposed
          </button>
          <button
            type="button"
            disabled={busy || !secret}
            onClick={() => void seedPropose()}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#fff",
            }}
          >
            Seed propose
          </button>
        </div>
        {message ? <p style={{ marginTop: 12 }}>{message}</p> : null}
        <ul style={{ listStyle: "none", padding: 0, marginTop: 20 }}>
          {items.length === 0 ? (
            <li style={{ opacity: 0.7, fontSize: 14 }}>No proposed variations</li>
          ) : (
            items.map((v) => (
              <li
                key={v.variationId}
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(0,0,0,0.08)",
                  display: "grid",
                  gap: 8,
                }}
              >
                <strong>
                  {v.jobId} · +{v.draftDeltaUsdMinor} USD minor draft
                </strong>
                <span style={{ fontSize: 13, opacity: 0.75 }}>
                  {v.variationId} · by {v.proposedBy} · {v.reason}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    disabled={busy || !secret}
                    onClick={() => void act("approve", v.variationId)}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busy || !secret}
                    onClick={() => void act("reject", v.variationId)}
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
