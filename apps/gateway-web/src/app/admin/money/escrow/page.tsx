/**
 * PD49 Escrow sandbox Job Reserve ops (≠ ENH-020 live partner).
 */
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

export default function AdminEscrowSandboxPage() {
  const [secret, setSecret] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reserveId, setReserveId] = useState<string | null>(null);

  const headers = useCallback(
    () => ({
      "content-type": "application/json",
      "x-internal-secret": secret,
    }),
    [secret],
  );

  async function runSandboxCheck() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/money/escrow", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ action: "run_sandbox_vertical" }),
      });
      const data = (await res.json()) as {
        error?: string;
        sandboxFailClosed?: boolean;
        fixtureHoldRelease?: boolean;
        liveContractRequired?: boolean;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(
        `Sandbox fail-closed=${String(data.sandboxFailClosed)} · fixture hold/release=${String(data.fixtureHoldRelease)} · liveContractRequired=${String(data.liveContractRequired)}`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function authorizeFixture() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/money/escrow", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          action: "authorize",
          jobId: "job_pd49_ui",
          amountUsdMinor: "5000",
          idempotencyKey: `pd49_ui_${Date.now()}`,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        reserve?: { id: string; status: string };
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setReserveId(data.reserve?.id ?? null);
      setMessage(`Authorized ${data.reserve?.id} status=${data.reserve?.status}`);
    } finally {
      setBusy(false);
    }
  }

  async function releaseWebhook() {
    if (!reserveId) {
      setMessage("Authorize a reserve first");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/money/escrow", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          action: "webhook",
          reserveId,
          eventId: `evt_rel_${Date.now()}`,
          webhookAction: "release",
          signatureValid: true,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        reserve?: { status: string };
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(`Webhook release → ${data.reserve?.status}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="admin-escrow-sandbox"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/admin/money/outbox">Money outbox</Link>
        {" · "}
        <Link href="/admin/returns">Returns</Link>
        {" · "}
        <Link href="/admin/command-centre">Command Centre</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
          }}
        >
          Escrow sandbox
        </h1>
        <p style={{ fontSize: 14, opacity: 0.75 }}>
          Job Reserve hold/release fixture path. Live partner contract remains
          ENH-020 (human). Sandbox without keys fails closed.
        </p>
        <label style={{ display: "block", marginTop: dialTokens.space.md }}>
          Internal secret
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button type="button" disabled={busy} onClick={() => void runSandboxCheck()}>
            Run sandbox vertical
          </button>
          <button type="button" disabled={busy} onClick={() => void authorizeFixture()}>
            Authorize fixture hold
          </button>
          <button type="button" disabled={busy} onClick={() => void releaseWebhook()}>
            Webhook release
          </button>
        </div>
        {message ? <p role="status">{message}</p> : null}
      </div>
    </main>
  );
}
