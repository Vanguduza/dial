/**
 * T9 cost/health dashboard stub — no live secrets; links to MetricContract / CC.
 * S142: OpenAPI primary CTA + INTEGRATION_ENV_GROUPS SoR hint (parity with /admin/integrations).
 */
export default function CostHealthStubPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        padding: "1.25rem",
        fontFamily: "var(--dial-font-sans, system-ui)",
        background: "linear-gradient(165deg, #0f172a 0%, #1e293b 55%, #0f172a 100%)",
        color: "#e2e8f0",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>Cost / health (stub)</h1>
      <p style={{ margin: "0 0 0.75rem", maxWidth: "36rem", color: "#94a3b8" }}>
        T9 placeholder for LiteLLM/Gemini spend + worker health. Money SoR remains ledger
        packages — this page never authorizes payouts.
      </p>
      <p
        style={{ margin: "0 0 1rem", maxWidth: "36rem", color: "#94a3b8", fontSize: 13 }}
        data-testid="env-groups-sor-hint"
      >
        Env-group SoR: <code>INTEGRATION_ENV_GROUPS</code> +{" "}
        <code>INTEGRATION_ENV_GROUP_LABELS</code> (OpenAPI{" "}
        <code>info.x-dial-sor</code>) — see readiness UI for live probes.
      </p>
      <p style={{ margin: "0 0 1.25rem" }}>
        <a
          href="/api/openapi"
          data-testid="openapi-primary-link"
          style={{
            display: "inline-block",
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #64748b",
            color: "#e2e8f0",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          OpenAPI skeleton
        </a>
      </p>
      <ul style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.6 }}>
        <li>LLM cost events → outbox (AI cost) — not implemented live</li>
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
        <li>Restore drill: docs/security/restore-drill.md</li>
      </ul>
    </main>
  );
}
