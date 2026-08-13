/**
 * Tech Take-Home UI stub (Pack §15 T5 / D-53) — draft WHT economics only.
 */
import { dialTokens } from "@dial/design-tokens";
import Link from "next/link";

export default function TechTakeHomePage() {
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
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <p style={{ fontSize: 12, opacity: 0.6 }}>
          <Link href="/home">Home</Link>
        </p>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Technician Take-Home
        </h1>
        <p style={{ fontSize: 14, opacity: 0.8 }}>
          Draft WHT economics (D-50): without ITF263 clearance, 30% withhold applies. With
          ITF263, net = gross. AI never writes payable amounts — human + pricing engine.
        </p>
        <ul style={{ lineHeight: 1.6 }}>
          <li>API: <code>GET/POST /api/admin/tech/take-home</code> (INTERNAL_API_SECRET)</li>
          <li>Balances: <code>withholding_balances</code> via @dial/payments</li>
          <li>Threat model: ThreatDragonModels/job-reserve/</li>
        </ul>
      </div>
    </main>
  );
}
