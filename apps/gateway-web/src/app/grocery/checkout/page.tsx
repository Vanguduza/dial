/**
 * PD14 grocery checkout — ZiG only on this pay step (D-57); EcoCash | COD CTAs.
 */
import Link from "next/link";
import { cookies } from "next/headers";
import { dialTokens } from "@dial/design-tokens";
import { getGroceryCart, getGroceryDeliverySlot } from "@dial/catalogue";
import {
  getActiveFxRate,
  setDailyZigRate,
  usdToZig,
} from "@dial/payments";
import { GROCERY_CART_COOKIE } from "../../../lib/grocery/cookies";
import { GroceryCheckoutForm } from "./GroceryCheckoutForm";

export default async function GroceryCheckoutPage() {
  const jar = await cookies();
  const cartId = jar.get(GROCERY_CART_COOKIE)?.value;
  const cart = cartId ? getGroceryCart(cartId) : undefined;
  let rate = getActiveFxRate();
  if (!rate) {
    rate = setDailyZigRate({
      zigMinorPerUsd: 2500_00n,
      setBy: "pd14_checkout_page_stub",
    });
  }
  const usdMinor = cart?.total.amountMinor ?? 0n;
  const zigMinor = usdToZig(usdMinor, rate).amountMinor;
  const slot = cart?.slotId ? getGroceryDeliverySlot(cart.slotId) : undefined;

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
          <Link href="/grocery/cart">Cart</Link>
          <Link href="/grocery/slot">Slot</Link>
        </nav>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Grocery checkout
        </h1>
        <p style={{ fontSize: 14, opacity: 0.75 }}>
          Cart stayed USD. ZiG appears only here from ops Daily ZiG rate. Required pay CTAs:
          EcoCash | COD (D-57). No liquor. IMTT not a line item (D-60).
        </p>
        {!cart || cart.lines.length === 0 ? (
          <p>
            <Link href="/grocery">Browse</Link> to fill your cart.
          </p>
        ) : !cart.slotId ? (
          <p>
            Choose a <Link href="/grocery/slot">delivery slot</Link> before paying.
          </p>
        ) : (
          <>
            <p style={{ fontWeight: 600 }}>
              USD {(Number(usdMinor) / 100).toFixed(2)} → ZiG{" "}
              {(Number(zigMinor) / 100).toFixed(2)} ({rate.fxRateId})
            </p>
            <p style={{ fontSize: 13 }}>
              Slot {slot?.windowLabel} · {slot?.coldChainNotes}
            </p>
            <GroceryCheckoutForm cartId={cart.id} />
          </>
        )}
      </div>
    </main>
  );
}
