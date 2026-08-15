/**
 * PD14 grocery order track — ERP status.
 */
import Link from "next/link";
import { dialTokens } from "@dial/design-tokens";
import { GroceryTrackClient } from "./GroceryTrackClient";

export default async function GroceryTrackPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
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
        <Link href="/grocery">Browse</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Track grocery order
        </h1>
        <p style={{ fontSize: 14, opacity: 0.75 }}>
          Status from DIAL grocery SoR (ERP). Food/pantry only.
        </p>
        <GroceryTrackClient initialOrderId={orderId ?? ""} />
      </div>
    </main>
  );
}
