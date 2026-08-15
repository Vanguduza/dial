/**
 * PD14 grocery cart — USD lines only (D-57); continue to slot.
 */
import Link from "next/link";
import { cookies } from "next/headers";
import { dialTokens } from "@dial/design-tokens";
import { getGroceryCart } from "@dial/catalogue";
import { GROCERY_CART_COOKIE } from "../../../lib/grocery/cookies";

export default async function GroceryCartPage() {
  const jar = await cookies();
  const cartId = jar.get(GROCERY_CART_COOKIE)?.value;
  const cart = cartId ? getGroceryCart(cartId) : undefined;

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
        <nav style={{ display: "flex", gap: dialTokens.space.md, flexWrap: "wrap" }}>
          <Link href="/grocery">Browse</Link>
          <Link href="/grocery/slot">Slot</Link>
          <Link href="/grocery/checkout">Checkout</Link>
        </nav>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Grocery cart
        </h1>
        <p style={{ fontSize: 14, opacity: 0.75 }}>
          USD only — no ZiG on cart (D-57). Agency sold-by on each line.
        </p>
        {!cart || cart.lines.length === 0 ? (
          <p>
            Cart empty. <Link href="/grocery">Browse food & pantry</Link>
          </p>
        ) : (
          <>
            <ul style={{ paddingLeft: 18 }}>
              {cart.lines.map((l) => (
                <li key={l.offerId} style={{ marginBottom: 8 }}>
                  {l.title} × {l.qty} — USD{" "}
                  {(Number(l.lineTotal.amountMinor) / 100).toFixed(2)}
                  <br />
                  <span style={{ fontSize: 12, opacity: 0.65 }}>
                    Sold by {l.supplierDisplayName}
                  </span>
                </li>
              ))}
            </ul>
            <p style={{ fontWeight: 600 }}>
              Total USD {(Number(cart.total.amountMinor) / 100).toFixed(2)}
            </p>
            {cart.slotId ? (
              <p style={{ fontSize: 13 }}>Slot: {cart.slotId}</p>
            ) : (
              <p style={{ fontSize: 13, opacity: 0.7 }}>No delivery slot yet</p>
            )}
            <Link
              href="/grocery/slot"
              style={{
                display: "inline-block",
                marginTop: dialTokens.space.md,
                padding: `${dialTokens.space.sm} ${dialTokens.space.lg}`,
                borderRadius: 8,
                background: dialTokens.color.brand.primary,
                color: "#fff",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Choose delivery slot
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
