"use client";

import Link from "next/link";
import { useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type Vehicle = {
  vehicleId: string;
  label: string;
  chassisHint: string;
  reminderConsent: boolean;
  isActive?: boolean;
  browsePath?: string;
};

type ConsentEvent = {
  eventId: string;
  vehicleId: string;
  action: string;
  at: string;
};

/**
 * PD18 / PD50 Garage / Vehicle Hub — consent audit + chassis browse (Pack §9.2).
 */
export default function SpareGaragePage() {
  const [customerId, setCustomerId] = useState("cust_pd18");
  const [label, setLabel] = useState("My Hilux");
  const [chassisHint, setChassisHint] = useState("KUN26");
  const [consent, setConsent] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [audit, setAudit] = useState<ConsentEvent[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/spare/garage?customerId=${encodeURIComponent(customerId)}&includeAudit=1`,
      );
      const data = (await res.json()) as {
        error?: string;
        vehicles?: Vehicle[];
        consentAudit?: ConsentEvent[];
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setVehicles(data.vehicles ?? []);
      setAudit(data.consentAudit ?? []);
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

  async function setConsentFor(vehicleId: string, reminderConsent: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/spare/garage", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vehicleId, reminderConsent }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(
        reminderConsent ? "Consent granted" : "Consent revoked (PD50 audit)",
      );
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function setActive(vehicleId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/spare/garage", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vehicleId, setActive: true }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage("Active vehicle set (PD75)");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="spare-garage-hub"
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
          Garage · Vehicle Hub
        </h1>
        <p style={{ fontSize: 14, opacity: 0.75 }}>
          Chassis-aware browse and reminder consent audit. Reminders require
          explicit grant; revoke is recorded.
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
            <li key={v.vehicleId} style={{ marginBottom: 12 }}>
              {v.label} · {v.chassisHint} · consent={String(v.reminderConsent)}
              {v.isActive ? " · ACTIVE" : ""}
              <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                <Link href={v.browsePath ?? `/spare?chassis=${encodeURIComponent(v.chassisHint)}`}>
                  Browse parts
                </Link>
                {!v.isActive ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void setActive(v.vehicleId)}
                  >
                    Set active
                  </button>
                ) : null}
                {v.reminderConsent ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void setConsentFor(v.vehicleId, false)}
                  >
                    Revoke consent
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void setConsentFor(v.vehicleId, true)}
                  >
                    Grant consent
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        {audit.length > 0 ? (
          <section style={{ marginTop: dialTokens.space.lg }}>
            <h2 style={{ fontSize: 16 }}>Consent audit</h2>
            <ul>
              {audit.map((e) => (
                <li key={e.eventId}>
                  {e.action} · {e.vehicleId} · {e.at}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
