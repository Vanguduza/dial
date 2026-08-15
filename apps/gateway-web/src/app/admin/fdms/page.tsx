"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

/**
 * PD11 Admin FDMS Virtual Gateway — open/close day + agency receipt drain (D-59).
 * No physical printer. Sandbox requires FDMS_* keys (not fixture-only health).
 */
export default function AdminFdmsPage() {
  const [secret, setSecret] = useState("");
  const [day, setDay] = useState<{
    fiscalDayId: string | null;
    openedAt: string | null;
    closedAt: string | null;
  } | null>(null);
  const [outbox, setOutbox] = useState<
    Array<{ id: string; receiptClass?: string; status: string; fiscalCode?: string }>
  >([]);
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
      const res = await fetch("/api/admin/fdms/outbox", { headers: headers() });
      const data = (await res.json()) as {
        error?: string;
        day?: typeof day;
        fdmsOutbox?: typeof outbox;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setDay(data.day ?? null);
      setOutbox(data.fdmsOutbox ?? []);
    } finally {
      setBusy(false);
    }
  }

  async function dayAction(action: "open" | "close") {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/fdms/day", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ action, requestedBy: "ops_pd11" }),
      });
      const data = (await res.json()) as { error?: string; day?: typeof day };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setDay(data.day ?? null);
      setMessage(`Day ${action} ok · ${data.day?.fiscalDayId ?? ""}`);
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
        fdmsOutbox?: typeof outbox;
        day?: typeof day;
      };
      if (!drain.ok) {
        setMessage(drainJson.error ?? `drain HTTP ${drain.status}`);
        return;
      }
      setOutbox(drainJson.fdmsOutbox ?? []);
      setDay(drainJson.day ?? null);
      setMessage("Seeded GOODS_* + DIAL_FEE → money outbox drain submitted");
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
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link href="/admin/money/outbox">Money outbox</Link>
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
          <code>GOODS_INFORMAL</code> (D-59). Sandbox open/close day + money-outbox submit —{" "}
          <strong>no physical printer</strong>. Not fixture-only health.
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
        {day ? (
          <p style={{ marginTop: 16, fontSize: 14 }}>
            Day <code>{day.fiscalDayId ?? "—"}</code>
            {day.openedAt ? ` · opened ${day.openedAt}` : ""}
            {day.closedAt ? ` · closed ${day.closedAt}` : " · open"}
          </p>
        ) : null}
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
