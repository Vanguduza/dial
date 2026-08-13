import Link from "next/link";
import { dialTokens } from "@dial/design-tokens";
import { draftTechQuote } from "../../../lib/tech/stubs";

export default function TechBookPage() {
  const quote = draftTechQuote({ jobClass: "diagnostics", emergency: false });
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
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Book a tech
        </h1>
        <p style={{ fontSize: 14, opacity: 0.75 }}>
          Rate-card draft only ({quote.source}). Not a payable amount until human + pricing engine
          confirm. AI never writes payable amounts.
        </p>
        <p>
          Job class: <strong>{quote.jobClass}</strong>
        </p>
        <p>
          Draft USD {(Number(quote.draftAmountUsdMinor) / 100).toFixed(2)}{" "}
          <span style={{ fontSize: 12, opacity: 0.6 }}>(indicative)</span>
        </p>
        <button
          type="button"
          style={{
            marginTop: dialTokens.space.md,
            padding: `${dialTokens.space.sm} ${dialTokens.space.lg}`,
            borderRadius: 8,
            border: "none",
            background: dialTokens.color.brand.primary,
            color: "#fff",
            fontWeight: 600,
            width: "100%",
            maxWidth: 320,
          }}
        >
          Request booking (stub)
        </button>
      </div>
    </main>
  );
}
