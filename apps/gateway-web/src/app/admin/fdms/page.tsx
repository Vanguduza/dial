/**
 * PD11/PD41 Admin FDMS Virtual Gateway — open/close day + agency receipt drain (D-59).
 * Day banner, receipt-class counts, drain-only, auto-refresh. No physical printer.
 */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type DayState = {
  fiscalDayId: string | null;
  openedAt: string | null;
  closedAt: string | null;
};

type OutboxRow = {
  id: string;
  receiptClass?: string;
  status: string;
  fiscalCode?: string;
};

type ReceiptClassCounts = {
  DIAL_FEE: number;
  GOODS_FORMAL: number;
  GOODS_INFORMAL: number;
  queued: number;
  submitted: number;
  failed: number;
};

export default function AdminFdmsPage() {
  const [secret, setSecret] = useState("");
  const [day, setDay] = useState<DayState | null>(null);
  const [outbox, setOutbox] = useState<OutboxRow[]>([]);
  const [counts, setCounts] = useState<ReceiptClassCounts | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const secretRef = useRef(secret);
  secretRef.current = secret;

  const headers = useCallback(
    () => ({
      "content-type": "application/json",
      "x-internal-secret": secret,
    }),
    [secret],
  );

  async function refresh(silent = false) {
    if (!secretRef.current) return;
    if (!silent) {
      setBusy(true);
      setMessage(null);
    }
    try {
      const res = await fetch("/api/admin/fdms/outbox", {
        headers: {
          "content-type": "application/json",
          "x-internal-secret": secretRef.current,
        },
      });
      const data = (await res.json()) as {
        error?: string;
        day?: DayState;
        fdmsOutbox?: OutboxRow[];
        receiptClassCounts?: ReceiptClassCounts;
      };
      if (!res.ok) {
        if (!silent) setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setDay(data.day ?? null);
      setOutbox(data.fdmsOutbox ?? []);
      setCounts(data.receiptClassCounts ?? null);
    } finally {
      if (!silent) setBusy(false);
    }
  }

  useEffect(() => {
    if (!autoRefresh || !secret) return;
    const id = window.setInterval(() => {
      void refresh(true);
    }, 8000);
    return () => window.clearInterval(id);
  }, [autoRefresh, secret]);

  async function dayAction(action: "open" | "close") {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/fdms/day", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ action, requestedBy: "ops_pd41" }),
      });
      const data = (await res.json()) as { error?: string; day?: DayState };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setDay(data.day ?? null);
      setMessage(`Day ${action} ok · ${data.day?.fiscalDayId ?? ""}`);
      await refresh(true);
    } finally {
      setBusy(false);
    }
  }

  async function drainOnly() {
    setBusy(true);
    setMessage(null);
    try {
      const drain = await fetch("/api/admin/fdms/outbox", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ action: "drain" }),
      });
      const drainJson = (await drain.json()) as {
        error?: string;
        fdmsOutbox?: OutboxRow[];
        day?: DayState;
        receiptClassCounts?: ReceiptClassCounts;
      };
      if (!drain.ok) {
        setMessage(drainJson.error ?? `drain HTTP ${drain.status}`);
        return;
      }
      setOutbox(drainJson.fdmsOutbox ?? []);
      setDay(drainJson.day ?? null);
      setMessage("Drain-only submitted via money outbox (agency D-59)");
      await refresh(true);
    } finally {
      setBusy(false);
    }
  }

  async function seedAndDrain() {
    setBusy(true);
    setMessage(null);
    try {
      const seed = await fetch("/api/admin/fdms/outbox", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ action: "seed_agency_receipts" }),
      });
      const seedJson = (await seed.json()) as { error?: string };
      if (!seed.ok) {
        setMessage(seedJson.error ?? `seed HTTP ${seed.status}`);
        return;
      }
      const drain = await fetch("/api/admin/fdms/outbox", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ action: "drain" }),
      });
      const drainJson = (await drain.json()) as {
        error?: string;
        fdmsOutbox?: OutboxRow[];
        day?: DayState;
      };
      if (!drain.ok) {
        setMessage(drainJson.error ?? `drain HTTP ${drain.status}`);
        return;
      }
      setOutbox(drainJson.fdmsOutbox ?? []);
      setDay(drainJson.day ?? null);
      setMessage("Seeded GOODS_* + DIAL_FEE → money outbox drain submitted");
      await refresh(true);
    } finally {
      setBusy(false);
    }
  }

  const dayOpen = Boolean(day?.fiscalDayId && !day?.closedAt);
  const dayClosed = Boolean(day?.closedAt);

  return (
    <main
      data-testid="admin-fdms-day-ops"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link href="/admin/money/outbox">Money outbox</Link>
        {" · "}
        <Link href="/admin/wa">WA templates</Link>
        {" · "}
        <Link href="/admin/command-centre">Command Centre</Link>
        {" · "}
        <Link href="/home">Home</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          FDMS Virtual Gateway
        </h1>
        <p style={{ fontSize: 14, opacity: 0.8 }}>
          Agency receipts <code>DIAL_FEE</code> / <code>GOODS_FORMAL</code> /{" "}
          <code>GOODS_INFORMAL</code> (D-59). Sandbox open/close day + money-outbox
          submit — <strong>no physical printer</strong>.
        </p>

        <div
          data-testid="fdms-day-banner"
          style={{
            marginTop: 16,
            padding: "12px 14px",
            borderRadius: 10,
            background: dayOpen
              ? `${dialTokens.color.brand.primary}14`
              : dayClosed
                ? "#eee"
                : "#f7f3ea",
            border: `1px solid ${dialTokens.color.brand.primary}33`,
            fontSize: 14,
          }}
        >
          <strong>
            {dayOpen ? "Fiscal day OPEN" : dayClosed ? "Fiscal day CLOSED" : "No fiscal day"}
          </strong>
          {day?.fiscalDayId ? (
            <>
              {" · "}
              <code>{day.fiscalDayId}</code>
            </>
          ) : null}
          {day?.openedAt ? ` · opened ${day.openedAt}` : ""}
          {day?.closedAt ? ` · closed ${day.closedAt}` : ""}
        </div>

        {counts ? (
          <p data-testid="fdms-receipt-counts" style={{ fontSize: 13, marginTop: 12 }}>
            Receipt classes — DIAL_FEE ×{counts.DIAL_FEE} · GOODS_FORMAL ×
            {counts.GOODS_FORMAL} · GOODS_INFORMAL ×{counts.GOODS_INFORMAL} · queued{" "}
            {counts.queued} · submitted {counts.submitted}
          </p>
        ) : null}

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
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            data-testid="fdms-auto-refresh"
          />
          Auto-refresh every 8s
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <button
            type="button"
            disabled={busy || !secret}
            onClick={() => void dayAction("open")}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "none",
              background: dialTokens.color.brand.primary,
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Open fiscal day
          </button>
          <button
            type="button"
            disabled={busy || !secret}
            onClick={() => void seedAndDrain()}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: `1px solid ${dialTokens.color.brand.accent}`,
              background: "transparent",
              fontWeight: 600,
            }}
          >
            Seed agency + drain
          </button>
          <button
            type="button"
            disabled={busy || !secret}
            data-testid="fdms-drain-only"
            onClick={() => void drainOnly()}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: `1px solid ${dialTokens.color.brand.accent}`,
              background: "transparent",
              fontWeight: 600,
            }}
          >
            Drain only
          </button>
          <button
            type="button"
            disabled={busy || !secret}
            onClick={() => void dayAction("close")}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: `1px solid ${dialTokens.color.brand.primary}`,
              background: "transparent",
              fontWeight: 600,
            }}
          >
            Close fiscal day
          </button>
          <button
            type="button"
            disabled={busy || !secret}
            onClick={() => void refresh()}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: `1px solid ${dialTokens.color.brand.primary}55`,
              background: "transparent",
              fontWeight: 600,
            }}
          >
            Refresh
          </button>
        </div>
        {message ? <p role="status">{message}</p> : null}
        <h2 style={{ fontSize: "1.1rem", marginTop: 20 }}>Fiscal outbox</h2>
        <ul style={{ fontSize: 13, lineHeight: 1.6 }}>
          {outbox.map((r) => (
            <li key={r.id}>
              <code>{r.id}</code> · {r.receiptClass ?? "?"} · {r.status}
              {r.fiscalCode ? ` · ${r.fiscalCode}` : ""}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
