"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

/**
 * PD128 — Plane-pattern ops triage (claim → resolve; SLA badges).
 */
export default function AdminOpsTriagePage() {
  const [secret, setSecret] = useState("");
  const [inbox, setInbox] = useState<
    Array<{
      ticketId: string;
      title: string;
      kind: string;
      status: string;
      slaBadge: string;
      correlationRef: string;
    }>
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

  const load = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/ops/triage", { headers: headers() });
      const data = (await res.json()) as {
        error?: string;
        inbox?: typeof inbox;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setInbox(data.inbox ?? []);
      setMessage("Plane pattern — Chatwoot ≠ status SoR");
    } finally {
      setBusy(false);
    }
  }, [headers]);

  async function act(action: "claim" | "resolve", ticketId: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/ops/triage", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          action,
          ticketId,
          claimedBy: "ops_ui",
          resolvedBy: "ops_ui",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="pd128-plane-triage"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: "1.5rem",
      }}
    >
      <p>
        <Link href="/admin/support">Support</Link>
      </p>
      <h1>Ops triage</h1>
      <p>Claim → resolve inbox with SLA badges (Plane UX pattern only).</p>
      <label>
        Internal secret{" "}
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          autoComplete="off"
        />
      </label>{" "}
      <button type="button" disabled={busy} onClick={() => void load()}>
        Refresh
      </button>
      {message ? <p role="status">{message}</p> : null}
      <ul>
        {inbox.map((t) => (
          <li key={t.ticketId}>
            [{t.slaBadge}] {t.kind} · {t.title} · {t.status} · {t.correlationRef}{" "}
            <button
              type="button"
              disabled={busy || t.status !== "open"}
              onClick={() => void act("claim", t.ticketId)}
            >
              Claim
            </button>{" "}
            <button
              type="button"
              disabled={busy || t.status !== "claimed"}
              onClick={() => void act("resolve", t.ticketId)}
            >
              Resolve
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
