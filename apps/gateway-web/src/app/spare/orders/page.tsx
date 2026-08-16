/**
 * PD18 Spare orders list — USD; Sold by; track links (Pack §9.2).
 */
import Link from "next/link";
import { dialTokens } from "@dial/design-tokens";
import { listSpareOrders } from "@dial/catalogue";

export default async function SpareOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;
  const orders = listSpareOrders(customerId ?? null);

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
            flexWrap: "wrap",
            gap: dialTokens.space.md,
            marginBottom: dialTokens.space.lg,
          }}
        >
          <Link href="/spare">Browse</Link>
          <Link href="/spare/cart">Cart</Link>
          <Link href="/spare/garage">Garage</Link>
          <Link href="/spare/returns">Returns</Link>
        </nav>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
          }}
        >
          Orders
        </h1>
        
        {orders.length === 0 ? (
          <p>No orders yet — <Link href="/spare">browse spares</Link>.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {orders.map((o) => (
              <li
                key={o.orderId}
                style={{
                  padding: dialTokens.space.md,
                  marginBottom: dialTokens.space.sm,
                  background: "#fff",
                  borderRadius: 8,
                }}
              >
                <strong>{o.orderId}</strong> · {o.status}
                <div style={{ fontSize: 14 }}>
                  USD {(Number(o.totalUsdMinor) / 100).toFixed(2)} · Sold by{" "}
                  {o.soldBySummary}
                </div>
                <Link href={`/spare/orders/${encodeURIComponent(o.orderId)}`}>
                  Track
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
