"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { dialTokens } from "@dial/design-tokens";

/**
 * PD18 Returns — ERP stub open/resolve; payableFromAi always false.
 */
function ReturnsInner() {
  const sp = useSearchParams();
  const orderIdParam = sp.get("orderId") ?? "";
  const [orderId, setOrderId] = useState(orderIdParam);
  const [claimId, setClaimId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function openClaim() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/spare/returns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "open", orderId }),
      });
      const data = (await res.json()) as {
        error?: string;
        claim?: { claimId: string; payableFromAi: boolean };
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setClaimId(data.claim?.claimId ?? null);
      setMessage(
        `Opened ${data.claim?.claimId} · payableFromAi=${String(data.claim?.payableFromAi)}`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function resolve(path: "refund" | "replace") {
    if (!claimId) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/spare/returns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "resolve", claimId, path }),
      });
      const data = (await res.json()) as { error?: string; claim?: { status: string } };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(`Resolved ${path} · ${data.claim?.status}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <label style={{ display: "block", marginTop: dialTokens.space.md }}>
        Order id
        <input
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
        />
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        <button type="button" disabled={busy || !orderId} onClick={() => void openClaim()}>
          Open return claim
        </button>
        <button
          type="button"
          disabled={busy || !claimId}
          onClick={() => void resolve("refund")}
        >
          Resolve refund
        </button>
        <button
          type="button"
          disabled={busy || !claimId}
          onClick={() => void resolve("replace")}
        >
          Resolve replace
        </button>
      </div>
      {message ? <p role="status">{message}</p> : null}
    </>
  );
}

export default function SpareReturnsPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <nav
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: dialTokens.space.md,
            marginBottom: dialTokens.space.lg,
          }}
        >
          <Link href="/spare">Browse</Link>
          <Link href="/spare/orders">Orders</Link>
          <Link href="/spare/garage">Garage</Link>
        </nav>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
          }}
        >
          Returns
        </h1>
        <p style={{ fontSize: 14, opacity: 0.75 }}>
          ERP refund_or_replace stub. AI never writes payable refund amounts.
        </p>
        <Suspense fallback={<p>Loading…</p>}>
          <ReturnsInner />
        </Suspense>
      </div>
    </main>
  );
}
