/**
 * PD58 Customer delivery track — read-only MapLibre (Pack §9.5).
 */
"use client";

import Link from "next/link";
import { useState } from "react";
import { dialTokens } from "@dial/design-tokens";
import { DialMap } from "../../../components/map/DialMap";

export default function CustomerDeliveryTrackPage() {
  const [orderId, setOrderId] = useState("ord_pd58");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function load() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/delivery/track?orderId=${encodeURIComponent(orderId)}`,
      );
      const data = (await res.json()) as {
        error?: string;
        readOnly?: boolean;
        mapSor?: string;
        location?: { lat: number; lng: number } | null;
        job?: { status: string } | null;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setLat(data.location?.lat ?? null);
      setLng(data.location?.lng ?? null);
      setStatus(data.job?.status ?? null);
      setMessage(
        `readOnly=${String(data.readOnly)} · mapSor=${data.mapSor} · status=${data.job?.status ?? "none"}`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="customer-delivery-track"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <Link href="/spare/orders">Spare orders</Link>
        {" · "}
        <Link href="/admin/delivery/track">Admin live track</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
          }}
        >
          Track delivery
        </h1>
        <label style={{ display: "block", marginTop: 12 }}>
          Order id
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => void load()}
          style={{ marginTop: 12 }}
        >
          Refresh track
        </button>
        {message ? <p role="status">{message}</p> : null}
        {lat != null && lng != null ? (
          <>
            <p style={{ marginTop: 12 }}>
              Pin {lat.toFixed(4)}, {lng.toFixed(4)} · job {status}
            </p>
            <DialMap pins={[{ id: orderId, lat, lng, label: orderId }]} />
          </>
        ) : (
          <DialMap pins={[]} />
        )}
      </div>
    </main>
  );
}
