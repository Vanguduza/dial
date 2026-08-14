/**
 * PD7 Admin delivery track — MapLibre SoR (D-44); pins from @dial/delivery courier_locations.
 * Job engine remains packages/delivery + DeliveryDispatchWorkflow (D-45).
 */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

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
        <p style={{ fontSize: 14, opacity: 0.8 }}>
          MapLibre SoR (D-44) · OSRM/VROOM for ETA · job SoR ={" "}
          <code>@dial/delivery</code> + <code>DeliveryDispatchWorkflow</code> — not
          Fleetbase, not Google/Mapbox.
        </p>
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

        <div
          role="img"
          aria-label="MapLibre map with courier pins"
          style={{
            position: "relative",
            marginTop: dialTokens.space.lg,
            height: "min(50vh, 400px)",
            borderRadius: 12,
            overflow: "hidden",
            background: `linear-gradient(145deg, #c5d4c8 0%, ${dialTokens.color.brand.primary}55 55%, ${dialTokens.color.brand.accent}66 100%)`,
            border: `1px solid ${dialTokens.color.brand.primary}33`,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 12,
              fontSize: 12,
              opacity: 0.85,
              background: "rgba(255,255,255,0.75)",
              padding: "4px 8px",
              borderRadius: 6,
            }}
          >
            MapLibre canvas · {locations.length} live pin(s)
          </div>
          {locations.map((loc, i) => {
            // Project Harare-ish lat/lng into the stub canvas for visual pin placement.
            const x = ((loc.lng - 30.9) / 0.4) * 100;
            const y = ((-17.7 - loc.lat) / 0.35) * 100;
            const left = Math.min(92, Math.max(4, x));
            const top = Math.min(88, Math.max(8, y));
            return (
              <div
                key={`${loc.courierId}-${loc.recordedAt}`}
                title={`${loc.courierId} @ ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`}
                style={{
                  position: "absolute",
                  left: `${left}%`,
                  top: `${top}%`,
                  transform: "translate(-50%, -50%)",
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: dialTokens.color.brand.accent,
                  border: `2px solid ${dialTokens.color.brand.primary}`,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
                  zIndex: 2 + i,
                }}
              />
            );
          })}
          {locations.length === 0 ? (
            <p
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                margin: 0,
                fontSize: 14,
                opacity: 0.75,
              }}
            >
              No courier locations yet — post via delivery-android / API
            </p>
          ) : null}
        </div>

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
