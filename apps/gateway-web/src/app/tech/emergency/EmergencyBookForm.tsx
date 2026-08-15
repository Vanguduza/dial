"use client";

import { useState } from "react";
import { dialTokens } from "@dial/design-tokens";

/** PD13 emergency book — AI pricing bypassed; rate_card draft only. */
export function EmergencyBookForm() {
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function requestEmergency() {
    setBusy(true);
    setError(null);
    setStatus("");
    try {
      const res = await fetch("/api/tech/services", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "emergency_book" }),
      });
      const json = (await res.json()) as {
        error?: string;
        job?: { id: string };
        aiPricingBypassed?: boolean;
      };
      if (!res.ok) {
        setError(json.error ?? "emergency book failed");
        return;
      }
      setStatus(
        `Emergency job ${json.job?.id ?? ""} · AI pricing bypassed · rate_card draft only`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "emergency book failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: dialTokens.space.md }}>
      <button
        type="button"
        disabled={busy}
        onClick={() => void requestEmergency()}
        style={{
          padding: `${dialTokens.space.sm} ${dialTokens.space.lg}`,
          borderRadius: 8,
          border: "none",
          background: "#a33",
          color: "#fff",
          fontWeight: 600,
          width: "100%",
          maxWidth: 320,
          fontSize: 16,
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? "Requesting…" : "Request emergency dispatch"}
      </button>
      {status ? <p style={{ fontSize: 14 }}>{status}</p> : null}
      {error ? (
        <p style={{ fontSize: 14, color: "#a11" }}>{error}</p>
      ) : null}
    </div>
  );
}
