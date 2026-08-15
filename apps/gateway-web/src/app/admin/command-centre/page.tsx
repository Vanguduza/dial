/**
 * PD10 / PD47 Command Centre — MetricContract tiles + recommended actions (D-54).
 * Simulated never auto-pays. Actions never auto-pay.
 */
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type RecommendedAction = {
  id: string;
  label: string;
  permissionRole: string;
  href: string;
  severity: string;
  autoPay: boolean;
};

type Tile = {
  id: string;
  calculation: string;
  status: string;
  value: number | null;
  mode: string;
  canDrivePayout: boolean;
  ownerRole: string;
  recommendedActions?: RecommendedAction[];
};

export default function CommandCentrePage() {
  const [secret, setSecret] = useState("");
  const [mode, setMode] = useState<"actual" | "simulated">("actual");
  const [watermark, setWatermark] = useState("");
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const headers = useCallback(
    () => ({
      "content-type": "application/json",
      "x-internal-secret": secret,
    }),
    [secret],
  );

  async function refresh() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/command-centre?mode=${mode}`, {
        headers: headers(),
      });
      const data = (await res.json()) as {
        error?: string;
        banner?: { watermark: string; autoPayAllowed: boolean };
        tiles?: Tile[];
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setWatermark(data.banner?.watermark ?? "");
      setTiles(data.tiles ?? []);
    } finally {
      setBusy(false);
    }
  }

  async function attemptPayout() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/command-centre", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          action: "attempt_payout",
          mode,
          amountMinor: "10000",
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        payout?: { refused: boolean; reason: string };
        autoPayAllowed?: boolean;
      };
      if (mode === "simulated") {
        setMessage(data.error ?? "Simulated payout blocked (D-54)");
        return;
      }
      setMessage(
        data.payout?.refused
          ? `Actual refused: ${data.payout.reason}`
          : data.error ?? `HTTP ${res.status}`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="admin-command-centre"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <Link href="/home">Home</Link>
        {" · "}
        <Link href="/admin/money/outbox">Money outbox</Link>
        {" · "}
        <Link href="/admin/delivery/dispatch">Dispatch</Link>
        {" · "}
        <Link href="/admin/promotions">Promotions</Link>
        {" · "}
        <Link href="/admin/tech/take-home">Take-Home</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Command Centre
        </h1>
        <p style={{ fontSize: 14, opacity: 0.8 }}>
          Every KPI registers a MetricContract. Severity→recommended permissioned
          actions (PD47). Simulated never auto-pays (D-54). CC is not money SoR.
        </p>
        <label style={{ display: "grid", gap: 6, fontSize: 14, marginTop: 16 }}>
          Internal API secret
          <input
            type="password"
            autoComplete="off"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc", maxWidth: 360 }}
          />
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12, alignItems: "center" }}>
          <label style={{ fontSize: 14 }}>
            Mode{" "}
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as "actual" | "simulated")}
              style={{ padding: 8, marginLeft: 6 }}
            >
              <option value="actual">Actual</option>
              <option value="simulated">Simulated</option>
            </select>
          </label>
          <button
            type="button"
            disabled={busy || !secret}
            onClick={() => void refresh()}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "none",
              background: dialTokens.color.brand.primary,
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Load tiles
          </button>
          <button
            type="button"
            disabled={busy || !secret}
            onClick={() => void attemptPayout()}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: `1px solid ${dialTokens.color.brand.accent}`,
              background: "transparent",
              fontWeight: 600,
            }}
          >
            Attempt payout (must refuse)
          </button>
        </div>
        {watermark ? (
          <p
            style={{
              marginTop: 16,
              padding: dialTokens.space.sm,
              background:
                mode === "simulated" ? dialTokens.color.brand.accent : dialTokens.color.brand.primary,
              color: "#fff",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            {watermark} · autoPayAllowed=false
          </p>
        ) : null}
        {message ? <p role="status">{message}</p> : null}
        <div
          data-testid="cc-metric-tiles"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginTop: 20,
          }}
        >
          {tiles.map((t) => (
            <div
              key={t.id}
              style={{
                padding: 14,
                borderRadius: 10,
                border: `1px solid ${dialTokens.color.brand.primary}33`,
                background: "#fff",
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.7 }}>{t.id}</div>
              <div style={{ fontWeight: 700, fontSize: "1.4rem", marginTop: 4 }}>
                {t.value === null ? "—" : t.value}
              </div>
              <div style={{ fontSize: 12, marginTop: 6 }}>
                {t.status} · owner {t.ownerRole}
              </div>
              <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4 }}>{t.calculation}</div>
              <div style={{ fontSize: 11, marginTop: 6 }}>
                canDrivePayout={String(t.canDrivePayout)}
              </div>
              {(t.recommendedActions ?? []).length > 0 ? (
                <ul
                  data-testid={`cc-actions-${t.id}`}
                  style={{ margin: "10px 0 0", paddingLeft: 16, fontSize: 12 }}
                >
                  {(t.recommendedActions ?? []).map((a) => (
                    <li key={a.id}>
                      <Link href={a.href}>{a.label}</Link>
                      {" · "}
                      {a.severity} · autoPay={String(a.autoPay)} · {a.permissionRole}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: 11, opacity: 0.55, marginTop: 8 }}>No actions (ok)</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
