/**
 * PD48 Admin returns / refunds ops queue (Pack §9.5).
 * Human resolve refund|replace only — payableFromAi always false.
 */
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type ClaimRow = {
  claimId: string;
  orderId: string;
  path: string;
  status: string;
  resolution: string | null;
  payableFromAi: false;
  createdAt: string;
};

export default function AdminReturnsPage() {
  const [secret, setSecret] = useState("");
  const [claims, setClaims] = useState<ClaimRow[]>([]);
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
      const res = await fetch("/api/admin/returns?status=opened", {
        headers: headers(),
      });
      const data = (await res.json()) as {
        error?: string;
        claims?: ClaimRow[];
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setClaims(data.claims ?? []);
      setMessage(`Open claims: ${(data.claims ?? []).length}`);
    } finally {
      setBusy(false);
    }
  }

  async function resolve(claimId: string, path: "refund" | "replace") {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/returns", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ claimId, path }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(`Resolved ${claimId} → ${path}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="admin-returns-queue"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link href="/admin/support">Support</Link>
        {" · "}
        <Link href="/admin/command-centre">Command Centre</Link>
        {" · "}
        <Link href="/admin/money/outbox">Money outbox</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
          }}
        >
          Returns / refunds
        </h1>
        <p style={{ fontSize: 14, opacity: 0.75 }}>
          Admin queue for Spare return claims. Refund or replace is human-only —
          AI never writes payable amounts.
        </p>
        <label style={{ display: "block", marginTop: dialTokens.space.md }}>
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
          Load open claims
        </button>
        {message ? <p role="status">{message}</p> : null}
        <ul style={{ marginTop: dialTokens.space.md }}>
          {claims.map((c) => (
            <li key={c.claimId} style={{ marginBottom: 12 }}>
              {c.claimId} · order {c.orderId} · {c.path} · payableFromAi=
              {String(c.payableFromAi)}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void resolve(c.claimId, "refund")}
                >
                  Refund
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void resolve(c.claimId, "replace")}
                >
                  Replace
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
