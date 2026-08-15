/**
 * PD45 Admin support tickets + consent audit (Pack §9.5 / ENH-049/050).
 * Chatwoot is handoff only — ERP ticket status SoR.
 */
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type ConsentRow = {
  sessionId: string;
  customerId?: string;
  consents: Record<string, boolean>;
  at: string;
};

type TicketRow = {
  ticketId: string;
  topic: string;
  status: string;
  statusFrom: string;
  customerId?: string;
};

export default function AdminSupportPage() {
  const [secret, setSecret] = useState("");
  const [consents, setConsents] = useState<ConsentRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
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
      const res = await fetch("/api/admin/support", { headers: headers() });
      const data = (await res.json()) as {
        error?: string;
        consents?: ConsentRow[];
        tickets?: TicketRow[];
        chatwootIsStatusSor?: boolean;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setConsents(data.consents ?? []);
      setTickets(data.tickets ?? []);
      setMessage(
        data.chatwootIsStatusSor
          ? "WARN: Chatwoot must not be status SoR"
          : "Chatwoot ≠ status SoR · ERP tickets listed",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="admin-support-consent"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link href="/admin/wa">WA templates</Link>
        {" · "}
        <Link href="/admin/returns">Returns</Link>
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
          Support + consent audit
        </h1>
        <p style={{ fontSize: 14, opacity: 0.8 }}>
          ERP support tickets (SoR) and marketing/consent audit trail. Chatwoot
          is handoff only — never ticket status SoR. No AI payables.
        </p>
        <label style={{ display: "grid", gap: 6, fontSize: 14, marginTop: 16 }}>
          Internal API secret
          <input
            type="password"
            autoComplete="off"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            style={{
              padding: 12,
              borderRadius: 8,
              border: "1px solid #ccc",
              maxWidth: 360,
            }}
          />
        </label>
        <button
          type="button"
          disabled={busy || !secret}
          onClick={() => void refresh()}
          style={{
            marginTop: 12,
            padding: "10px 14px",
            borderRadius: 8,
            border: "none",
            background: dialTokens.color.brand.primary,
            color: "#fff",
            fontWeight: 600,
          }}
        >
          Refresh
        </button>
        {message ? <p role="status">{message}</p> : null}
        <h2 style={{ fontSize: "1.1rem", marginTop: 20 }}>ERP tickets</h2>
        <ul data-testid="support-ticket-list" style={{ fontSize: 13 }}>
          {tickets.length === 0 ? (
            <li>None yet — open via FLOW_SUPPORT_TICKET / Chatwoot handoff</li>
          ) : (
            tickets.map((t) => (
              <li key={t.ticketId}>
                <code>{t.ticketId}</code> · {t.topic} · {t.status} · SoR=
                {t.statusFrom}
              </li>
            ))
          )}
        </ul>
        <h2 style={{ fontSize: "1.1rem", marginTop: 20 }}>Consent audit</h2>
        <ul data-testid="consent-audit-list" style={{ fontSize: 13 }}>
          {consents.length === 0 ? (
            <li>No consent events yet</li>
          ) : (
            consents.map((c) => (
              <li key={`${c.sessionId}-${c.at}`}>
                {c.at} · session {c.sessionId}
                {c.customerId ? ` · ${c.customerId}` : ""} · marketing=
                {String(c.consents.marketing ?? false)}
              </li>
            ))
          )}
        </ul>
      </div>
    </main>
  );
}
