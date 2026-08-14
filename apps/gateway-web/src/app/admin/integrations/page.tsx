"use client";

import { dialTokens } from "@dial/design-tokens";
import { useCallback, useEffect, useState } from "react";
import {
  INTEGRATIONS_NOTE_BUILDER_SOR_DOCS,
  INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID,
  parseIntegrationsHealth,
  probeEntries,
  truncateIntegrationsHealthNote,
  type IntegrationsHealthSnapshot,
} from "../../../lib/integrationsReadiness.js";

/**
 * S133/S154/S179/S185 Admin integrations readiness — ready/probes/groups + truncated
 * health note from GET /api/health/integrations (never displays secret values).
 */
export default function IntegrationsReadinessPage() {
  const [snap, setSnap] = useState<IntegrationsHealthSnapshot | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/health/integrations");
      const data: unknown = await res.json();
      if (!res.ok) {
        setMessage(`HTTP ${res.status}`);
        setSnap(null);
        return;
      }
      const parsed = parseIntegrationsHealth(data);
      if ("error" in parsed) {
        setMessage(parsed.error);
        setSnap(null);
        return;
      }
      setSnap(parsed);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "fetch failed");
      setSnap(null);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: `linear-gradient(165deg, ${dialTokens.color.brand.surface} 0%, #e4e8df 50%, ${dialTokens.color.brand.primary}18 100%)`,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.lg,
      }}
    >
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
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
        <h1 style={{ fontSize: "1.35rem", fontWeight: 600, marginTop: dialTokens.space.sm }}>
          Integration readiness
        </h1>
        <p style={{ opacity: 0.8, fontSize: 14, marginTop: dialTokens.space.sm }}>
          Snapshot of{" "}
          <code>/api/health/integrations</code> — plug-in key status without secret
          values. See <code>docs/integrations/README.md</code>.
        </p>
        <p
          style={{ opacity: 0.75, fontSize: 13, marginTop: dialTokens.space.sm }}
          data-testid="env-groups-sor-hint"
        >
          Env-group SoR: <code>INTEGRATION_ENV_GROUPS</code> +{" "}
          <code>INTEGRATION_ENV_GROUP_LABELS</code> in{" "}
          <code>integrationsReadiness.ts</code> (OpenAPI{" "}
          <code>info.x-dial-sor</code>). Health note:{" "}
          <code>buildIntegrationsHealthNote</code>. Health note UI max:{" "}
          <code>INTEGRATIONS_HEALTH_NOTE_UI_MAX</code>.
        </p>
        <p
          style={{ opacity: 0.75, fontSize: 13, marginTop: dialTokens.space.sm }}
          data-testid={INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID}
        >
          Note-builder SoR: <code>buildIntegrationsHealthNote</code> (
          <a href="/api/openapi">OpenAPI</a>{" "}
          <code>x-dial-sor.healthNote</code>) · full note in{" "}
          <a href="/api/health/integrations">Health JSON</a> · docs{" "}
          <code>{INTEGRATIONS_NOTE_BUILDER_SOR_DOCS}</code>.
        </p>

        <div
          style={{
            marginTop: dialTokens.space.lg,
            display: "flex",
            flexWrap: "wrap",
            gap: dialTokens.space.sm,
            alignItems: "center",
          }}
        >
          <button
            type="button"
            disabled={busy}
            onClick={() => void refresh()}
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              border: "none",
              background: dialTokens.color.brand.primary,
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
          <a
            href="/api/openapi"
            data-testid="openapi-primary-link"
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              border: `1px solid ${dialTokens.color.brand.primary}55`,
              background: "transparent",
              color: dialTokens.color.brand.ink,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            OpenAPI skeleton
          </a>
          {snap ? (
            <p
              style={{ margin: 0, fontSize: 14, fontWeight: 600 }}
              data-testid="ready-flag"
              role="status"
            >
              ready={String(snap.ready)} · mode={snap.mode}
            </p>
          ) : null}
        </div>

        {snap?.note ? (
          <p
            style={{
              marginTop: dialTokens.space.md,
              fontSize: 13,
              opacity: 0.85,
              lineHeight: 1.5,
            }}
            data-testid="health-note"
            title={snap.note}
          >
            {truncateIntegrationsHealthNote(snap.note)}
          </p>
        ) : null}

        {message ? (
          <p style={{ marginTop: dialTokens.space.md, fontSize: 14 }} role="alert">
            {message}
          </p>
        ) : null}

        {snap ? (
          <>
            <h2 style={{ fontSize: "1.05rem", marginTop: dialTokens.space.xl }}>
              Probes
            </h2>
            <ul
              style={{
                margin: `${dialTokens.space.sm} 0 0`,
                paddingLeft: dialTokens.space.lg,
                fontSize: 14,
                lineHeight: 1.7,
              }}
              data-testid="probes-list"
            >
              {probeEntries(snap.probes).map((p) => (
                <li key={p.name}>
                  {p.name}: {p.ok ? "ok" : "fail"}
                </li>
              ))}
            </ul>

            <h2 style={{ fontSize: "1.05rem", marginTop: dialTokens.space.xl }}>
              Env groups
            </h2>
            <ul
              style={{
                margin: `${dialTokens.space.sm} 0 0`,
                paddingLeft: dialTokens.space.lg,
                fontSize: 14,
                lineHeight: 1.7,
              }}
              data-testid="groups-list"
            >
              {snap.groups.map((g) => (
                <li key={g.label}>
                  {g.label}: {g.configured ? "configured" : "incomplete"} (
                  {g.presentCount}/{g.requiredCount}
                  {g.missing.length ? `; missing ${g.missing.length}` : ""})
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <p style={{ marginTop: dialTokens.space.xl, fontSize: 13, opacity: 0.75 }}>
          Related:{" "}
          <a href="/admin/cost-health">Cost / health</a> ·{" "}
          <a href="/admin/fx/daily-zig">Daily ZiG</a> ·{" "}
          <a href="/admin/command-centre">Command Centre</a> ·{" "}
          <a href="/api/openapi">OpenAPI</a> ·{" "}
          <a href="/api/health/integrations">Health JSON</a>
        </p>
      </section>
    </main>
  );
}
