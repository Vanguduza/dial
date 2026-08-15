"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

/**
 * PD126 — Formance Console *pattern* ledger explorer; DIAL ledger SoR.
 */
export default function AdminLedgerExplorerPage() {
  const [secret, setSecret] = useState("");
  const [journals, setJournals] = useState<
    Array<{
      id: string;
      orderId: string;
      entries: Array<{ account: string; amountMinor: string; memo: string }>;
    }>
  >([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/ledger/explorer", {
        headers: { "x-internal-secret": secret },
      });
      const data = (await res.json()) as {
        error?: string;
        snapshot?: {
          journals?: typeof journals;
          formanceMoneySor?: boolean;
          dialLedgerSor?: boolean;
        };
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setJournals(data.snapshot?.journals ?? []);
      setMessage(
        data.snapshot?.formanceMoneySor === false &&
          data.snapshot?.dialLedgerSor === true
          ? "DIAL ledger SoR — Formance Console pattern only"
          : null,
      );
    } finally {
      setBusy(false);
    }
  }, [secret]);

  return (
    <main
      data-testid="pd126-formance-explorer"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: "1.5rem",
      }}
    >
      <p>
        <Link href="/admin/money/outbox">Money outbox</Link>
      </p>
      <h1>Ledger explorer</h1>
      <p>Read-only journals (Formance Console UX pattern — never Formance SoR).</p>
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
        {journals.map((j) => (
          <li key={j.id}>
            {j.id} · order {j.orderId}
            <ul>
              {j.entries.map((e, i) => (
                <li key={`${j.id}-${i}`}>
                  {e.account}: {e.amountMinor} — {e.memo}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </main>
  );
}
