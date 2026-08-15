/**
 * PD18 checkout done — place ERP spare order after pay; link to track.
 */
import Link from "next/link";
import { dialTokens } from "@dial/design-tokens";
import { getCart, placeSpareOrder } from "@dial/catalogue";

export default async function SpareCheckoutDonePage({
  searchParams,
}: {
  searchParams: Promise<{
    method?: string;
    intentId?: string;
    codId?: string;
    cartId?: string;
  }>;
}) {
  const { method, intentId, codId, cartId } = await searchParams;
  let orderId: string | null = null;
  let soldBy: string | null = null;
  if (cartId) {
    const cart = getCart(cartId);
    if (cart && cart.lines.length > 0) {
      try {
        const order = placeSpareOrder({
          cart: {
            id: cart.id,
            currency: "USD",
            totalUsdMinor: cart.total.amountMinor,
            lines: cart.lines.map((l) => ({
              offerId: l.offerId,
              title: l.title,
              qty: l.qty,
              unitPriceUsdMinor: l.unitPrice.amountMinor,
              lineTotalUsdMinor: l.lineTotal.amountMinor,
              soldBy: l.soldBy,
              supplierFormality: l.supplierFormality,
            })),
          },
          payChoice: method === "cod" ? "cod" : "ecocash",
        });
        orderId = order.orderId;
        soldBy = order.soldBySummary;
      } catch {
        /* cart may already be consumed in demos */
      }
    }
  }

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
        {soldBy ? (
          <p style={{ fontSize: 14 }}>Sold by {soldBy} (agency D-58)</p>
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
