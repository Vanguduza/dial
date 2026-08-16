/**
 * G2 / PD18 checkout done — order already placed by G2 spine; show track link + money evidence.
 */
import Link from "next/link";
import { dialTokens } from "@dial/design-tokens";
import { getSpareOrder } from "@dial/catalogue";

export default async function SpareCheckoutDonePage({
  searchParams,
}: {
  searchParams: Promise<{
    method?: string;
    intentId?: string;
    codId?: string;
    cartId?: string;
    orderId?: string;
    jr?: string;
    journal?: string;
  }>;
}) {
  const { method, intentId, codId, orderId, jr, journal } = await searchParams;
  const order = orderId ? getSpareOrder(orderId) : undefined;
  const soldBy = order?.soldBySummary ?? null;

  return (
    <main
      data-testid="spare-checkout-done"
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
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Order placed
        </h1>
        <p>
          Method: <strong>{method ?? "—"}</strong>
        </p>
        {intentId ? <p style={{ fontSize: 14 }}>Intent {intentId}</p> : null}
        {codId ? <p style={{ fontSize: 14 }}>COD {codId}</p> : null}
        {jr ? <p style={{ fontSize: 14 }}>Job Reserve {jr}</p> : null}
        {journal ? <p style={{ fontSize: 14 }}>Ledger journal {journal}</p> : null}
        {soldBy ? (
          <p style={{ fontSize: 14 }}>Sold by {soldBy}</p>
        ) : null}
        {orderId ? (
          <p>
            <Link href={`/spare/orders/${encodeURIComponent(orderId)}`}>
              Track order {orderId}
            </Link>
          </p>
        ) : (
          <p>
            <Link href="/spare/orders">View orders</Link>
          </p>
        )}
        <Link href="/spare">Back to Spare</Link>
      </div>
    </main>
  );
}
