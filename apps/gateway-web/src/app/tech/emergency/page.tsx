/**
 * Pack §9.3 emergency — deterministic path; AI pricing bypassed (D-32).
 */
import Link from "next/link";
import { dialTokens } from "@dial/design-tokens";
import { draftTechQuote } from "../../../lib/tech/stubs";
import { EmergencyBookForm } from "./EmergencyBookForm";

export default function TechEmergencyPage() {
  const quote = draftTechQuote({ jobClass: "roadside_emergency", emergency: true });
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
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <nav
          style={{
            display: "flex",
            gap: dialTokens.space.md,
            flexWrap: "wrap",
            marginBottom: dialTokens.space.sm,
          }}
        >
          <Link href="/tech">Back</Link>
          <Link href="/tech/jobs">My jobs</Link>
        </nav>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: "#a33",
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Emergency
        </h1>
        <p style={{ fontWeight: 600 }}>
          AI pricing bypassed — dispatch + rate_card draft only. Human confirms payable.
        </p>
        <p style={{ fontSize: 14, opacity: 0.75 }}>
          Indicative USD {(Number(quote.draftAmountUsdMinor) / 100).toFixed(2)} ({quote.source}) —
          not a customer charge.
        </p>
        <EmergencyBookForm />
        <p style={{ marginTop: dialTokens.space.lg }}>
          <Link href="/tech/checklist/emergency_roadside">Open emergency checklist</Link>
        </p>
      </div>
    </main>
  );
}
