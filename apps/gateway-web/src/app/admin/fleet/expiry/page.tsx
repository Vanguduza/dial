"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

/**
 * PD124 — Tracktor fleet expiry / maintenance board (D-46).
 */
export default function AdminFleetExpiryPage() {
  const [secret, setSecret] = useState("");
  const [rows, setRows] = useState<
    Array<{
      vehicleId: string;
      label: string;
      kind: string;
      dueAt: string;
      severity: string;
    }>
  >([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/fleet/expiry", {
        headers: { "x-internal-secret": secret },
      });
      const data = (await res.json()) as {
        error?: string;
        board?: { rows?: typeof rows; courierDispatchSor?: boolean };
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setRows(data.board?.rows ?? []);
      setMessage(
        data.board?.courierDispatchSor === false
          ? "Tracktor compliance UX — not courier dispatch SoR"
          : null,
      );
    } finally {
      setBusy(false);
    }
  }, [secret]);

  return (
    <main
      data-testid="pd124-tracktor-fleet"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: "1.5rem",
      }}
    >
      <p>
        <Link href="/admin/command-centre">Command Centre</Link>
      </p>
      <h1>Fleet expiry</h1>
      <p>Insurance / licence / maintenance clocks (Tracktor pattern).</p>
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
        {rows.map((r) => (
          <li key={`${r.vehicleId}-${r.kind}-${r.dueAt}`}>
            [{r.severity}] {r.label} · {r.kind} · due {r.dueAt.slice(0, 10)}
          </li>
        ))}
      </ul>
    </main>
  );
}
