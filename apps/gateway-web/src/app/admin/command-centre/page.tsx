/**
 * Command Centre Actual vs Simulated banner (D-54).
 */
import Link from "next/link";
import { dialTokens } from "@dial/design-tokens";
import { commandCentreBanner, listMetricContracts, registerMetricContract } from "@dial/ai";

export default function CommandCentrePage() {
  if (listMetricContracts().length === 0) {
    registerMetricContract({
      id: "metric.on_time_pod",
      source: "delivery.pod",
      calculation: "count(pod_on_time)/count(pod)",
      thresholds: { warn: 0.9, critical: 0.8 },
      ownerRole: "ops_admin",
    });
  }
  const actual = commandCentreBanner("actual");
  const simulated = commandCentreBanner("simulated");
  const metrics = listMetricContracts();

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
        <Link href="/home">Home</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Command Centre
        </h1>
        <p
          style={{
            padding: dialTokens.space.sm,
            background: dialTokens.color.brand.accent,
            color: "#fff",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          {simulated.watermark} · autoPayAllowed={String(simulated.autoPayAllowed)}
        </p>
        <p style={{ fontSize: 14, opacity: 0.75 }}>{actual.watermark}</p>
        <h2>MetricContracts</h2>
        <ul>
          {metrics.map((m) => (
            <li key={m.id}>
              <code>{m.id}</code> — {m.calculation} (owner {m.ownerRole})
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
