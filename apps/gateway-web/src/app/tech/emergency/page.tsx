import Link from "next/link";
import { dialTokens } from "@dial/design-tokens";
import { draftTechQuote } from "../../../lib/tech/stubs";

/** Emergency path bypasses AI (Pack T4). */
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
        <Link href="/tech">Back</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: "#a33",
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Emergency
        </h1>
        <p style={{ fontWeight: 600 }}>AI pricing bypassed — dispatch + rate-card stub only.</p>
        <p style={{ fontSize: 14, opacity: 0.75 }}>
          Draft USD {(Number(quote.draftAmountUsdMinor) / 100).toFixed(2)} — human confirms payable.
        </p>
        <Link href="/tech/checklist/emergency_roadside">Open emergency checklist</Link>
      </div>
    </main>
  );
}
