/**
 * PD7 Admin delivery track — MapLibre SoR (D-44); pins from @dial/delivery courier_locations.
 * Job engine remains packages/delivery + DeliveryDispatchWorkflow (D-45).
 */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { dialTokens } from "@dial/design-tokens";
import { DialMap } from "../../../../components/map/DialMap";

type Loc = {
  courierId: string;
  lat: number;
  lng: number;
  recordedAt: string;
  jobId?: string;
};

export default function AdminDeliveryTrackPage() {
  const [locations, setLocations] = useState<Loc[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/delivery/courier?view=track");
      const data = (await res.json()) as {
        locations?: Loc[];
        error?: string;
        mapSor?: string;
      };
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        setLocations([]);
        return;
      }
      setLocations(data.locations ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "track fetch failed");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 5000);
    return () => clearInterval(t);
  }, [refresh]);

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
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <Link href="/home">Home</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Delivery live track
        </h1>
        
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={busy}
          style={{
            marginTop: 8,
            padding: "8px 12px",
            borderRadius: 8,
            border: "none",
            background: dialTokens.color.brand.primary,
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {busy ? "Refreshing…" : "Refresh pins"}
        </button>
        {error ? (
          <p style={{ color: "crimson", marginTop: 8 }}>{error}</p>
        ) : null}

        <DialMap
          pins={locations.map((loc) => ({
            id: `${loc.courierId}-${loc.recordedAt}`,
            lat: loc.lat,
            lng: loc.lng,
            label: loc.courierId,
          }))}
        />

        <ul style={{ marginTop: 16, paddingLeft: 18, fontSize: 13 }}>
          {locations.map((loc) => (
            <li key={`${loc.courierId}-${loc.recordedAt}`}>
              <strong>{loc.courierId}</strong> · {loc.lat.toFixed(5)},{" "}
              {loc.lng.toFixed(5)}
              {loc.jobId ? ` · job ${loc.jobId}` : ""} · {loc.recordedAt}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
