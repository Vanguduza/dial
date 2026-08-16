/**
 * PD78 — Customer marketing consent centre (Pack Matrix B).
 * Session SoR; grant/revoke with audit.
 */
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type Consent = {
  customerId: string;
  marketing: boolean;
  updatedAt: string;
};

type AuditEvent = {
  eventId: string;
  action: string;
  at: string;
};

export default function AccountConsentPage() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/consent");
      const data = (await res.json()) as {
        error?: string;
        consent?: Consent;
        audit?: AuditEvent[];
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setConsent(data.consent ?? null);
      setAudit(data.audit ?? []);
    } finally {
      setBusy(false);
    }
  }, []);

  async function setMarketing(marketing: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marketing }),
      });
      const data = (await res.json()) as {
        error?: string;
        consent?: Consent;
        audit?: AuditEvent[];
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setConsent(data.consent ?? null);
      setAudit(data.audit ?? []);
      setMessage(marketing ? "Marketing consent granted" : "Marketing consent revoked");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="account-marketing-consent"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <nav style={{ marginBottom: dialTokens.space.md, fontSize: 14 }}>
          <Link href="/account/promo">Promo</Link>
          {" · "}
          <Link href="/home">Home</Link>
        </nav>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Marketing consent</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" disabled={busy} onClick={() => void refresh()}>
            Refresh
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void setMarketing(true)}
          >
            Grant
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void setMarketing(false)}
          >
            Revoke
          </button>
        </div>
        {consent ? (
          <p style={{ marginTop: 16, fontSize: 14 }}>
            marketing={String(consent.marketing)} · updated {consent.updatedAt}
          </p>
        ) : null}
        {message ? <p role="status">{message}</p> : null}
        {audit.length > 0 ? (
          <section style={{ marginTop: dialTokens.space.lg }}>
            <h2 style={{ fontSize: 16 }}>Audit</h2>
            <ul>
              {audit.map((e) => (
                <li key={e.eventId}>
                  {e.action} · {e.at}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
