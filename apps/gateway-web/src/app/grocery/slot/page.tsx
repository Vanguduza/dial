/**
 * PD14 delivery slot — cold-chain notes; liquorAllowed never true.
 */
import Link from "next/link";
import { cookies } from "next/headers";
import { dialTokens } from "@dial/design-tokens";
import { getGroceryCart, listGroceryDeliverySlots } from "@dial/catalogue";
import { GROCERY_CART_COOKIE } from "../../../lib/grocery/cookies";
import { GrocerySlotForm } from "./GrocerySlotForm";

export default async function GrocerySlotPage() {
  const jar = await cookies();
  const cartId = jar.get(GROCERY_CART_COOKIE)?.value;
  const cart = cartId ? getGroceryCart(cartId) : undefined;
  const slots = listGroceryDeliverySlots();

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
        <Link href="/grocery/cart">Back to cart</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Delivery window
        </h1>
        {!cart || cart.lines.length === 0 ? (
          <p>
            <Link href="/grocery">Add items</Link> before choosing a slot.
          </p>
        ) : (
          <GrocerySlotForm
            cartId={cart.id}
            slots={slots.map((s) => ({
              slotId: s.slotId,
              windowLabel: s.windowLabel,
              coldChainNotes: s.coldChainNotes,
            }))}
            selected={cart.slotId ?? ""}
          />
        )}
      </div>
    </main>
  );
}
