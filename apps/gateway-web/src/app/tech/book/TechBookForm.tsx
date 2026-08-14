"use client";

import { useState } from "react";
import { dialTokens } from "@dial/design-tokens";

/** Client book form — POST /api/tech/technician action=book (session cookie). */
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
      const res = await fetch("/api/tech/technician", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "book",
          jobClass: "diagnostics",
          slotId,
          assignSelf: false,
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
    <div style={{ marginTop: dialTokens.space.md }}>
      <label style={{ display: "block", marginBottom: 8, fontSize: 14 }}>
        Cal.com slot
        <select
          value={slotId}
          onChange={(e) => setSlotId(e.target.value)}
          style={{ display: "block", width: "100%", maxWidth: 320, marginTop: 4, padding: 8 }}
        >
          {slots.map((s) => (
            <option key={s.slotId} value={s.slotId}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={busy || !slotId}
        onClick={() => void book()}
        style={{
          marginTop: dialTokens.space.sm,
          padding: `${dialTokens.space.sm} ${dialTokens.space.lg}`,
          borderRadius: 8,
          border: "none",
          background: dialTokens.color.brand.primary,
          color: "#fff",
          fontWeight: 600,
          width: "100%",
          maxWidth: 320,
          opacity: busy || !slotId ? 0.6 : 1,
        }}
      >
        {busy ? "Booking…" : "Request booking"}
      </button>
      {status ? <p style={{ fontSize: 14 }}>{status}</p> : null}
      {error ? (
        <p style={{ fontSize: 14, color: "#a11" }}>{error}</p>
      ) : null}
    </div>
  );
}
