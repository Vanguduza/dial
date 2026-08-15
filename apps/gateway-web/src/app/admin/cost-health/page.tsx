"use client";

import { dialTokens } from "@dial/design-tokens";
import { useCallback, useEffect, useState } from "react";
import {
  INTEGRATIONS_NOTE_BUILDER_SOR_DOCS,
  INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID,
  INTEGRATIONS_READY_VS_GROUPS_HINT_ID,
  parseIntegrationsHealth,
  truncateIntegrationsHealthNote,
} from "../../../lib/integrationsReadiness.js";

type CostBucket = {
  channel: string;
  spentUsdMinor: string;
  thresholdUsdMinor: string;
  alert: boolean;
  killSwitchEngaged: boolean;
  rateLimitHref: string;
};

type CostSnapshot = {
  buckets: CostBucket[];
  imttOpexUsdMinor: string;
  imttOnCheckoutLines: boolean;
  anyAlert: boolean;
  anyKillSwitch: boolean;
  note?: string;
};

/**
 * PD22 Cost & health — AI/LiteLLM + cloud + SMS/WhatsApp spend, thresholds,
 * kill-switch → rate limits. IMTT = opex never checkout (D-60).
 * Preserves S135–S205 SoR hint contracts from earlier integration stages.
 */
export default function CostHealthPage() {
  const [note, setNote] = useState<string | null>(null);
  const [secret, setSecret] = useState("");
  const [snapshot, setSnapshot] = useState<CostSnapshot | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshNote = useCallback(async () => {
    try {
      const res = await fetch("/api/health/integrations");
      const data: unknown = await res.json();
      if (!res.ok) return;
      const parsed = parseIntegrationsHealth(data);
      if ("error" in parsed || !parsed.note) return;
      setNote(parsed.note);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refreshNote();
  }, [refreshNote]);

  const headers = useCallback(
    () => ({
      "content-type": "application/json",
      "x-internal-secret": secret,
    }),
    [secret],
  );

  async function refreshCosts() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/cost-health", { headers: headers() });
      const data = (await res.json()) as CostSnapshot & { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setSnapshot(data);
    } finally {
      setBusy(false);
    }
  }

  async function postAction(body: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/cost-health", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        error?: string;
        snapshot?: CostSnapshot;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      if (data.snapshot) setSnapshot(data.snapshot);
      else await refreshCosts();
      setMessage("Updated");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        padding: "1.25rem",
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        background: `linear-gradient(165deg, ${dialTokens.color.brand.surface} 0%, #e4e8df 45%, ${dialTokens.color.brand.primary}18 100%)`,
        color: dialTokens.color.brand.ink,
      }}
    >
      <p
        style={{
          fontFamily: `${dialTokens.font.display}, Georgia, serif`,
          fontSize: "2rem",
          margin: 0,
          color: dialTokens.color.brand.primary,
        }}
      >
        DIAL
      </p>
      <h1 style={{ fontSize: "1.5rem", margin: "0.5rem 0" }}>Cost / health</h1>
      <p style={{ margin: "0 0 0.75rem", maxWidth: "36rem", opacity: 0.85 }}>
        PD22 — LiteLLM/AI + cloud + SMS/WhatsApp opex with alert thresholds and
        kill-switches to rate limits. Money SoR remains ledger packages — this
        page never authorizes payouts. IMTT is DIAL opex (D-60), never a checkout
        line.
      </p>

      <p
        style={{ margin: "0 0 1rem", maxWidth: "36rem", opacity: 0.75, fontSize: 13 }}
        data-testid="env-groups-sor-hint"
      >
        Env-group SoR: <code>INTEGRATION_ENV_GROUPS</code> +{" "}
        <code>INTEGRATION_ENV_GROUP_LABELS</code> (OpenAPI{" "}
        <code>info.x-dial-sor</code>) — see readiness UI for live probes.
        Health note: <code>buildIntegrationsHealthNote</code>. Health note UI
        max: <code>INTEGRATIONS_HEALTH_NOTE_UI_MAX</code>.
      </p>
      <p
        style={{ margin: "0 0 1rem", maxWidth: "36rem", opacity: 0.75, fontSize: 13 }}
        data-testid={INTEGRATIONS_READY_VS_GROUPS_HINT_ID}
      >
        Ready≠groups: <code>ready</code> is <code>integrationsReady(probes)</code>{" "}
        only — not all <code>groups[].configured</code> (OpenAPI{" "}
        <code>x-dial-sor.readyVsGroups</code>).
      </p>
      <p
        style={{ margin: "0 0 1rem", maxWidth: "36rem", opacity: 0.75, fontSize: 13 }}
        data-testid={INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID}
      >
        Note-builder SoR: <code>buildIntegrationsHealthNote</code> (
        <a href="/api/openapi">OpenAPI</a>{" "}
        <code>x-dial-sor.healthNote</code>) · full note in{" "}
        <a href="/api/health/integrations">Health JSON</a> · docs{" "}
        <code>{INTEGRATIONS_NOTE_BUILDER_SOR_DOCS}</code>.
      </p>
      {note ? (
        <p
          style={{
            margin: "0 0 1rem",
            maxWidth: "36rem",
            opacity: 0.75,
            fontSize: 13,
            lineHeight: 1.5,
          }}
          data-testid="health-note"
          title={note}
        >
          {truncateIntegrationsHealthNote(note)}
        </p>
      ) : null}

      <label style={{ display: "grid", gap: 6, maxWidth: 420, marginBottom: 12 }}>
        <span style={{ fontSize: 13 }}>INTERNAL_API_SECRET</span>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #94a3b8" }}
        />
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={() => void refreshCosts()}
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          border: "none",
          background: dialTokens.color.brand.primary,
          color: "#fff",
          fontWeight: 600,
          marginRight: 8,
        }}
      >
        Load spend
      </button>
      <a
        href="/admin/fx/daily-zig"
        style={{ marginRight: 12, fontSize: 14 }}
      >
        Daily ZiG rate
      </a>
      <a
        href="/api/openapi"
        data-testid="openapi-primary-link"
        style={{
          display: "inline-block",
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid #64748b",
          color: dialTokens.color.brand.ink,
          textDecoration: "none",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        OpenAPI skeleton
      </a>

      {message ? (
        <p style={{ color: dialTokens.color.brand.primary, marginTop: 12 }}>{message}</p>
      ) : null}

      {snapshot ? (
        <section style={{ marginTop: 20, maxWidth: 560 }}>
          <p style={{ fontSize: 13, opacity: 0.8 }}>
            IMTT opex USD {(Number(snapshot.imttOpexUsdMinor) / 100).toFixed(2)} ·
            checkout lines={String(snapshot.imttOnCheckoutLines)} (must be false)
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: "12px 0", display: "grid", gap: 10 }}>
            {snapshot.buckets.map((b) => (
              <li
                key={b.channel}
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: "#fff",
                  border: b.alert
                    ? `2px solid ${dialTokens.color.brand.accent}`
                    : "1px solid #cbd5e1",
                }}
              >
                <strong>{b.channel}</strong>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  Spent USD {(Number(b.spentUsdMinor) / 100).toFixed(2)} / threshold{" "}
                  {(Number(b.thresholdUsdMinor) / 100).toFixed(2)}
                  {b.alert ? " · ALERT" : ""}
                  {b.killSwitchEngaged ? " · KILL-SWITCH ON" : ""}
                </div>
                <a href={b.rateLimitHref} style={{ fontSize: 13 }}>
                  Rate-limit kill-switch link
                </a>
                <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void postAction({
                        action: "record_spend",
                        channel: b.channel,
                        amountUsdMinor: "500",
                      })
                    }
                  >
                    +$5 spend
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void postAction({
                        action: "engage_kill_switch",
                        channel: b.channel,
                      })
                    }
                  >
                    Engage kill-switch
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void postAction({
                        action: "release_kill_switch",
                        channel: b.channel,
                      })
                    }
                  >
                    Release
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void postAction({ action: "record_imtt_opex", amountUsdMinor: "100" })
            }
          >
            Record IMTT opex +$1
          </button>
        </section>
      ) : null}

      <ul style={{ margin: "1.5rem 0 0", paddingLeft: "1.25rem", lineHeight: 1.6 }}>
        <li>LLM cost events → outbox (AI cost) via spend buckets above</li>
        <li>
          Integrations readiness:{" "}
          <a href="/admin/integrations">/admin/integrations</a>
        </li>
        <li>
          Health JSON: <a href="/api/health/integrations">/api/health/integrations</a>
        </li>
        <li>
          OpenAPI skeleton: <a href="/api/openapi">/api/openapi</a>
        </li>
        <li>
          Command Centre: <a href="/admin/command-centre">/admin/command-centre</a>
        </li>
        <li>
          Daily ZiG (D-57): <a href="/admin/fx/daily-zig">/admin/fx/daily-zig</a>
        </li>
        <li>Restore drill: docs/security/restore-drill.md</li>
      </ul>
    </main>
  );
}
