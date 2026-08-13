/**
 * T3 Spare PDP — USD display; agency seller disclosure (D-58); no supplierId.
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { dialTokens } from "@dial/design-tokens";
import { addToCart, createCart, searchOffers } from "@dial/catalogue";

export default async function SparePdpPage({
  params,
}: {
  params: Promise<{ offerId: string }>;
}) {
  const { offerId } = await params;
  const offer = searchOffers("").find((o) => o.offerId === offerId);
  if (!offer) notFound();

  async function addToCartAction() {
    "use server";
    const cart = createCart();
    addToCart(cart.id, offerId, 1);
    redirect(`/spare/cart?cartId=${encodeURIComponent(cart.id)}`);
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
        <nav style={{ display: "flex", gap: dialTokens.space.md, marginBottom: dialTokens.space.lg }}>
          <Link href="/spare">Back to browse</Link>
          <Link href="/spare/cart">Cart</Link>
        </nav>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
            color: dialTokens.color.brand.primary,
          }}
        >
          {offer.title}
        </h1>
        <p>
          {offer.brand} · OEM {offer.oem} · {offer.qualityTier}
        </p>
        <p style={{ fontSize: "1.25rem", fontWeight: 700 }}>
          USD {(Number(offer.unitPriceUsdMinor) / 100).toFixed(2)}
        </p>
        <p style={{ fontSize: 14, opacity: 0.75 }}>
          Sold by an agency supplier on DIAL (marketplace agency — D-58). Price shown in USD
          (D-57). ZiG only at checkout pay step.
        </p>
        <form action={addToCartAction}>
          <button
            type="submit"
            style={{
              marginTop: dialTokens.space.md,
              padding: `${dialTokens.space.sm} ${dialTokens.space.lg}`,
              borderRadius: 8,
              border: "none",
              background: dialTokens.color.brand.accent,
              color: "#fff",
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer",
              width: "100%",
              maxWidth: 320,
            }}
          >
            Add to cart (USD)
          </button>
        </form>
      </div>
    </main>
  );
}
