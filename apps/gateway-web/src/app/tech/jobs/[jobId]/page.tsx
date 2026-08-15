/**
 * PD13 customer job detail — object AuthZ via session customerId (D-47).
 */
import Link from "next/link";
import { dialTokens } from "@dial/design-tokens";
import { TechJobDetail } from "./TechJobDetail";

export default async function TechJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
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
        <Link href="/tech/jobs">Back to jobs</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Job status
        </h1>
        <TechJobDetail jobId={jobId} />
      </div>
    </main>
  );
}
