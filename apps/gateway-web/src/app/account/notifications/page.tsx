"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

/**
 * PD131 — Notification preference centre (channel × topic).
 */
export default function AccountNotificationsPage() {
  const [cells, setCells] = useState<
    Array<{
      channel: string;
      topic: string;
      enabled: boolean;
      costClass: string;
    }>
  >([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/notifications");
      const data = (await res.json()) as {
        error?: string;
        matrix?: { cells?: typeof cells };
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setCells(data.matrix?.cells ?? []);
    } finally {
      setBusy(false);
    }
  }, []);

  async function toggle(cell: (typeof cells)[number]) {
    setBusy(true);
    try {
      const res = await fetch("/api/account/notifications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          channel: cell.channel,
          topic: cell.topic,
          enabled: !cell.enabled,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        matrix?: { cells?: typeof cells };
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setCells(data.matrix?.cells ?? []);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="pd131-notification-prefs"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: "1.5rem",
      }}
    >
      <p>
        <Link href="/account/consent">Marketing consent</Link>
      </p>
      <h1>Notification preferences</h1>
      <p>Channel × topic matrix — utility on by default; marketing opt-in.</p>
      <button type="button" disabled={busy} onClick={() => void refresh()}>
        Load
      </button>
      {message ? <p role="status">{message}</p> : null}
      <ul>
        {cells.map((c) => (
          <li key={`${c.channel}-${c.topic}`}>
            [{c.costClass}] {c.channel} · {c.topic} —{" "}
            {c.enabled ? "on" : "off"}{" "}
            <button
              type="button"
              disabled={busy}
              onClick={() => void toggle(c)}
            >
              Toggle
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
