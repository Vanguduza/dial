/**
 * T3 Spare cart — USD only (D-57); agency disclosure; no supplierId / no ZiG lines.
 */
import Link from "next/link";
import { dialTokens } from "@dial/design-tokens";
import { getCart } from "@dial/catalogue";

export default async function SpareCartPage({
  searchParams,
}: {
  searchParams: Promise<{ cartId?: string }>;
}) {
  const { cartId } = await searchParams;
  const cart = cartId ? getCart(cartId) : undefined;

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
        <nav style={{ marginBottom: dialTokens.space.lg }}>
          <Link href="/spare">Continue shopping</Link>
          {" · "}
          <Link href="/spare/orders">Orders</Link>
          {" · "}
          <Link href="/spare/garage">Garage</Link>
        </nav>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
          }}
        >
          Cart · USD only (D-57) · no ZiG lines
        </h1>
        {!cart || cart.lines.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {cart.lines.map((line) => (
                <li
                  key={line.offerId}
                  style={{
                    padding: dialTokens.space.md,
                    marginBottom: dialTokens.space.sm,
                    background: "#fff",
                    borderRadius: 8,
                  }}
                >
                  <strong>{line.title}</strong>
                  <div style={{ fontSize: 14 }}>
                    qty {line.qty} · USD{" "}
                    {(Number(line.lineTotal.amountMinor) / 100).toFixed(2)}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    Sold by {line.soldBy} · {line.supplierFormality} · currency{" "}
                    {cart.currency}
                  </div>
                </li>
              ))}
            </ul>
            <p style={{ fontWeight: 700, fontSize: "1.15rem" }}>
              Total USD {(Number(cart.total.amountMinor) / 100).toFixed(2)}
            </p>
            <p style={{ fontSize: 13, opacity: 0.7 }}>
              No ZiG on this cart (D-57). Pay step converts with ops Daily ZiG rate.
            </p>
            <Link
              href={`/spare/checkout?cartId=${encodeURIComponent(cart.id)}`}
              style={{
                display: "inline-block",
                marginTop: dialTokens.space.md,
                padding: `${dialTokens.space.sm} ${dialTokens.space.lg}`,
                borderRadius: 8,
                background: dialTokens.color.brand.primary,
                color: "#fff",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Checkout
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
