/**
 * T9 cost/health dashboard stub — no live secrets; links to MetricContract / CC.
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
      <p style={{ margin: "0 0 1rem", maxWidth: "36rem", color: "#94a3b8" }}>
        T9 placeholder for LiteLLM/Gemini spend + worker health. Money SoR remains ledger
        packages — this page never authorizes payouts.
      </p>
      <ul style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.6 }}>
        <li>LLM cost events → outbox (AI cost) — not implemented live</li>
        <li>
          Command Centre: <a href="/admin/command-centre">/admin/command-centre</a>
        </li>
        <li>Restore drill: docs/security/restore-drill.md</li>
      </ul>
    </main>
  );
}
