"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

/**
 * PD123 — Schedule-X roster day board (D-46). Display-only capacity view.
 */
export default function AdminRosterPage() {
  const [secret, setSecret] = useState("");
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [events, setEvents] = useState<
    Array<{
      eventId: string;
      technicianId: string;
      jobId: string;
      startAt: string;
      endAt: string;
      displayOnly: boolean;
    }>
  >([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/roster?day=${encodeURIComponent(day)}`,
        { headers: { "x-internal-secret": secret } },
      );
      const data = (await res.json()) as {
        error?: string;
        board?: { events?: typeof events; calComSlotsReplaced?: boolean };
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setEvents(data.board?.events ?? []);
      setMessage(
        data.board?.calComSlotsReplaced === false
          ? "Schedule-X display only — Cal.com slots unchanged"
          : null,
      );
    } finally {
      setBusy(false);
    }
  }, [day, secret]);

  return (
    <main
      data-testid="pd123-schedule-x-roster"
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
      <h1>Tech roster</h1>
      
      <label>
        Internal secret{" "}
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          autoComplete="off"
        />
      </label>{" "}
      <label>
        Day{" "}
        <input
          type="date"
          value={day}
          onChange={(e) => setDay(e.target.value)}
        />
      </label>{" "}
      <button type="button" disabled={busy} onClick={() => void load()}>
        Load board
      </button>
      {message ? <p role="status">{message}</p> : null}
      <ul>
        {events.map((e) => (
          <li key={e.eventId}>
            {e.technicianId} · {e.jobId} · {e.startAt.slice(11, 16)}–
            {e.endAt.slice(11, 16)}
            {e.displayOnly ? " (display)" : ""}
          </li>
        ))}
      </ul>
    </main>
  );
}
