"use client";

import Link from "next/link";
import { useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type Vehicle = {
  vehicleId: string;
  label: string;
  chassisHint: string;
  reminderConsent: boolean;
};

/**
 * PD18 Garage / Vehicle Hub — reminders need consent (Pack §9.2).
 */
export default function SpareGaragePage() {
  const [customerId, setCustomerId] = useState("cust_pd18");
  const [label, setLabel] = useState("My Hilux");
  const [chassisHint, setChassisHint] = useState("KUN26");
  const [consent, setConsent] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/spare/garage?customerId=${encodeURIComponent(customerId)}`,
      );
      const data = (await res.json()) as { error?: string; vehicles?: Vehicle[] };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setVehicles(data.vehicles ?? []);
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/spare/garage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerId,
          label,
          chassisHint,
          reminderConsent: consent,
        }),
      });
      const data = (await res.json()) as { error?: string; vehicle?: Vehicle };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(`Added ${data.vehicle?.vehicleId}`);
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
          <Link href="/spare/returns">Returns</Link>
        </nav>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
          }}
        >
          Garage
        </h1>
        <p style={{ fontSize: 14, opacity: 0.75 }}>
          Vehicle hub for chassis-aware browse. Reminders require explicit consent.
        </p>

        <label style={{ display: "block", marginTop: dialTokens.space.md }}>
          Customer id
          <input
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>
        <label style={{ display: "block", marginTop: 8 }}>
          Label
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>
        <label style={{ display: "block", marginTop: 8 }}>
          Chassis hint
          <input
            value={chassisHint}
            onChange={(e) => setChassisHint(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>
        <label style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          I consent to service reminders for this vehicle
        </label>

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button type="button" disabled={busy} onClick={() => void add()}>
            Add vehicle
          </button>
          <button type="button" disabled={busy} onClick={() => void refresh()}>
            Refresh
          </button>
        </div>
        {message ? <p role="status">{message}</p> : null}
        <ul style={{ marginTop: dialTokens.space.md }}>
          {vehicles.map((v) => (
            <li key={v.vehicleId}>
              {v.label} · {v.chassisHint} · consent=
              {String(v.reminderConsent)}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
