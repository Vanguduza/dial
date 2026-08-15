/**
 * PD13 customer job status list (Pack §9.3).
 */
import Link from "next/link";
import { dialTokens } from "@dial/design-tokens";
import { TechJobsList } from "./TechJobsList";

export default function TechJobsPage() {
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
          My service jobs
        </h1>
        <p style={{ fontSize: 14, opacity: 0.75 }}>
          Status from DIAL jobs SoR. Draft amounts are rate_card only — never AI payable.
        </p>
        <TechJobsList />
      </div>
    </main>
  );
}
