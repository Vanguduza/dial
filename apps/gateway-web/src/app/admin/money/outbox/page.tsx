"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

/**
 * PD10 Admin money outbox ops — drain ledger/fiscal outbox (@dial/ledger).
 * Fail-closed INTERNAL_API_SECRET (same pattern as Daily ZiG).
 */
export default function AdminMoneyOutboxPage() {
  const [secret, setSecret] = useState("");
  const [depth, setDepth] = useState<number | null>(null);
  const [pending, setPending] = useState<
    Array<{ id: string; kind: string; refId: string; createdAt: string }>
  >([]);
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
      const res = await fetch("/api/admin/money/outbox", { headers: headers() });
      const data = (await res.json()) as {
        error?: string;
        depth?: number;
        pending?: typeof pending;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setDepth(data.depth ?? 0);
      setPending(data.pending ?? []);
    } finally {
      setBusy(false);
    }
  }

  async function drain() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/money/outbox", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ enqueueSideEffects: true }),
      });
      const data = (await res.json()) as {
        error?: string;
        drained?: unknown[];
        remaining?: number;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(`Drained ${data.drained?.length ?? 0} · remaining ${data.remaining ?? 0}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

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
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/admin/command-centre">Command Centre</Link>
        {" · "}
        <Link href="/home">Home</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Money outbox
        </h1>
        <p style={{ fontSize: 14, opacity: 0.8 }}>
          Ops drain of <code>@dial/ledger</code> money outbox (ledger_posted / fiscal_queued). Not
          Command Centre Simulated — live money path only.
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
            Refresh depth
          </button>
          <button
            type="button"
            disabled={busy || !secret}
            onClick={() => void drain()}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: `1px solid ${dialTokens.color.brand.primary}`,
              background: "transparent",
              fontWeight: 600,
            }}
          >
            Drain outbox
          </button>
        </div>
        {depth !== null ? (
          <p style={{ marginTop: 12 }}>
            Depth: <strong>{depth}</strong>
          </p>
        ) : null}
        {message ? <p role="status">{message}</p> : null}
        <ul style={{ fontSize: 13, lineHeight: 1.6 }}>
          {pending.map((r) => (
            <li key={r.id}>
              <code>{r.id}</code> · {r.kind} · {r.refId} · {r.createdAt}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
