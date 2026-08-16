"use client";

import { useState } from "react";

/** Client book form — POST /api/tech/services action=book (session cookie). */
export function TechBookForm({
  slots,
}: {
  slots: Array<{ slotId: string; label: string }>;
}) {
  const [slotId, setSlotId] = useState(slots[0]?.slotId ?? "");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function book() {
    setBusy(true);
    setError(null);
    setStatus("");
    try {
      const res = await fetch("/api/tech/services", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "book",
          jobClass: "diagnostics",
          slotId,
          emergency: false,
        }),
      });
      const json = (await res.json()) as { error?: string; job?: { id: string } };
      if (!res.ok) {
        setError(json.error ?? "book failed");
        return;
      }
      setStatus(`Booked ${json.job?.id ?? ""} · slot ${slotId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "book failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="fin-label" htmlFor="fin-slot">
        Available slot
      </label>
      <select
        id="fin-slot"
        className="fin-select"
        value={slotId}
        onChange={(e) => setSlotId(e.target.value)}
      >
        {slots.map((s) => (
          <option key={s.slotId} value={s.slotId}>
            {s.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="fin-btn fin-btn--primary"
        disabled={busy || !slotId}
        onClick={() => void book()}
        style={{ width: "100%" }}
      >
        {busy ? "Booking…" : "Request booking"}
      </button>
      {status ? <p className="fin-msg">{status}</p> : null}
      {error ? <p className="fin-msg fin-msg--err">{error}</p> : null}
    </div>
  );
}
