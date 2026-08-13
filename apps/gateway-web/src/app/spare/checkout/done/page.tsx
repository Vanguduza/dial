import Link from "next/link";
import { dialTokens } from "@dial/design-tokens";

export default async function SpareCheckoutDonePage({
  searchParams,
}: {
  searchParams: Promise<{ method?: string; intentId?: string; codId?: string }>;
}) {
  const { method, intentId, codId } = await searchParams;
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
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
          }}
        >
          Order placed
        </h1>
        <p>
          Method: <strong>{method ?? "—"}</strong>
        </p>
        {intentId ? <p style={{ fontSize: 14 }}>Intent {intentId}</p> : null}
        {codId ? <p style={{ fontSize: 14 }}>COD {codId}</p> : null}
        <Link href="/spare">Back to Spare</Link>
      </div>
    </main>
  );
}
