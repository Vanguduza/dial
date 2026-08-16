/**
 * PD53 Admin disputes queue — Value Score open → uphold|reject (D-53).
 */
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type Dispute = {
  disputeId: string;
  technicianId: string;
  status: string;
  reason: string;
  openedBy: string;
};

export default function AdminDisputesPage() {
  const [secret, setSecret] = useState("");
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [techId, setTechId] = useState("tech_pd53");
  const [reason, setReason] = useState("missed evidence credit");
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
      const res = await fetch("/api/admin/disputes?status=open", {
        headers: headers(),
      });
      const data = (await res.json()) as {
        error?: string;
        disputes?: Dispute[];
        openCount?: number;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setDisputes(data.disputes ?? []);
      setOpenCount(data.openCount ?? 0);
      setMessage(`Open disputes: ${data.openCount ?? 0}`);
    } finally {
      setBusy(false);
    }
  }

  async function seedOpen() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/disputes", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          action: "seed_and_open",
          technicianId: techId,
          reason,
          openedBy: "ops_admin",
          seedScore: 48,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        disputes?: Dispute[];
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setDisputes(data.disputes ?? []);
      setMessage("Opened dispute");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function resolve(disputeId: string, resolution: "upheld" | "rejected") {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/disputes", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          action: "resolve",
          disputeId,
          resolution,
          resolvedBy: "ops_admin",
          compensatingDelta: resolution === "upheld" ? 5 : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(`Resolved ${disputeId} → ${resolution}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="admin-disputes-queue"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link href="/admin/trades">Trades / Value Score</Link>
        {" · "}
        <Link href="/admin/tech/take-home">Take-Home</Link>
        {" · "}
        <Link href="/admin/command-centre">Command Centre</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
          }}
        >
          Disputes queue
        </h1>
        
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
          Technician id
          <input
            value={techId}
            onChange={(e) => setTechId(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>
        <label style={{ display: "block", marginTop: 8 }}>
          Reason
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button type="button" disabled={busy} onClick={() => void refresh()}>
            Load open ({openCount})
          </button>
          <button type="button" disabled={busy} onClick={() => void seedOpen()}>
            Seed + open
          </button>
        </div>
        {message ? <p role="status">{message}</p> : null}
        <ul style={{ marginTop: 16 }}>
          {disputes.map((d) => (
            <li key={d.disputeId} style={{ marginBottom: 12 }}>
              {d.disputeId} · {d.technicianId} · {d.reason}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void resolve(d.disputeId, "upheld")}
                >
                  Uphold
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void resolve(d.disputeId, "rejected")}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
