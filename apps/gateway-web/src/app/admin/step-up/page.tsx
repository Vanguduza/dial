/**
 * PD73 — Admin step-up gate UI (Pack §10).
 */
"use client";

import Link from "next/link";
import { useState } from "react";
import { dialTokens } from "@dial/design-tokens";

export default function AdminStepUpPage() {
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("step-up-ok");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function request() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/step-up", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "request",
          purpose: "money_sensitive_admin",
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        challengeId?: string;
        fixtureHint?: string;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setChallengeId(data.challengeId ?? null);
      if (data.fixtureHint) setCode(data.fixtureHint);
      setMessage(`Challenge ${data.challengeId}`);
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!challengeId) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/step-up", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          challengeId,
          code,
        }),
      });
      const data = (await res.json()) as { error?: string; status?: string };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(`Verified · ${data.status}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="admin-step-up"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <Link href="/admin/command-centre">Command Centre</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Step-up auth
        </h1>
        <p style={{ fontSize: 14, opacity: 0.8 }}>
          PD73 — session-bound step-up before money-sensitive admin actions (D-47).
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          <button
            type="button"
            disabled={busy}
            onClick={() => void request()}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "none",
              background: dialTokens.color.brand.primary,
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Request step-up
          </button>
          <button
            type="button"
            disabled={busy || !challengeId}
            onClick={() => void verify()}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#fff",
            }}
          >
            Verify
          </button>
        </div>
        <label style={{ display: "grid", gap: 6, fontSize: 14, marginTop: 16 }}>
          Code
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc" }}
          />
        </label>
        {challengeId ? (
          <p style={{ fontSize: 13, marginTop: 8 }}>
            Challenge <code>{challengeId}</code>
          </p>
        ) : null}
        {message ? <p role="status">{message}</p> : null}
      </div>
    </main>
  );
}
