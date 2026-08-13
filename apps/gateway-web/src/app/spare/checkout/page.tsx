/**
 * T3 pay-step mock — ZiG conversion only here (D-57).
 * Required CTAs: EcoCash | COD (same as WA FLOW_SPARE_CHECKOUT).
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { dialTokens } from "@dial/design-tokens";
import { getCart } from "@dial/catalogue";
import {
  createCheckoutPayment,
  getActiveFxRate,
  setDailyZigRate,
  usdToZig,
} from "@dial/payments";

export default async function SpareCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ cartId?: string; error?: string }>;
}) {
  const { cartId, error } = await searchParams;
  const cart = cartId ? getCart(cartId) : undefined;
  let rate = getActiveFxRate();
  if (!rate) {
    // Stub ops rate so local pay-step demos are not blocked (admin UI remains SoR).
    rate = setDailyZigRate({
      zigMinorPerUsd: 2500_00n,
      setBy: "spare_checkout_stub",
    });
  }
  const usdMinor = cart?.total.amountMinor ?? 0n;
  const zigMinor = usdToZig(usdMinor, rate).amountMinor;

  async function payEcoCash() {
    "use server";
    if (!cartId) redirect("/spare/cart");
    const c = getCart(cartId);
    if (!c || c.lines.length === 0) redirect("/spare/cart");
    try {
      const { intent } = await createCheckoutPayment({
        choice: "ecocash",
        orderId: `ord_${cartId}`,
        amountUsdMinor: c.total.amountMinor,
        idempotencyKey: `web-ecocash-${cartId}`,
      });
      redirect(
        `/spare/checkout/done?method=ecocash&intentId=${encodeURIComponent(intent?.id ?? "")}&cartId=${encodeURIComponent(cartId)}`,
      );
    } catch (e) {
      redirect(
        `/spare/checkout?cartId=${encodeURIComponent(cartId)}&error=${encodeURIComponent(e instanceof Error ? e.message : "pay failed")}`,
      );
    }
  }

  async function payCod() {
    "use server";
    if (!cartId) redirect("/spare/cart");
    const c = getCart(cartId);
    if (!c || c.lines.length === 0) redirect("/spare/cart");
    try {
      const { intent, codOrder } = await createCheckoutPayment({
        choice: "cod",
        orderId: `ord_${cartId}`,
        amountUsdMinor: c.total.amountMinor,
        idempotencyKey: `web-cod-${cartId}`,
      });
      redirect(
        `/spare/checkout/done?method=cod&intentId=${encodeURIComponent(intent?.id ?? "")}&codId=${encodeURIComponent(codOrder?.id ?? "")}&cartId=${encodeURIComponent(cartId)}`,
      );
    } catch (e) {
      redirect(
        `/spare/checkout?cartId=${encodeURIComponent(cartId)}&error=${encodeURIComponent(e instanceof Error ? e.message : "pay failed")}`,
      );
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
        <nav style={{ marginBottom: dialTokens.space.lg, display: "flex", gap: dialTokens.space.md, flexWrap: "wrap" }}>
          <Link href="/spare">Browse</Link>
          <Link href={cartId ? `/spare/cart?cartId=${encodeURIComponent(cartId)}` : "/spare/cart"}>
            Cart
          </Link>
        </nav>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Checkout — pay
        </h1>
        <p style={{ fontSize: 14, opacity: 0.75 }}>
          Cart stays USD. ZiG appears only on this pay step from ops Daily ZiG rate (
          {rate.fxRateId}). Sold by agency supplier (D-58).
        </p>
        {!cart || cart.lines.length === 0 ? (
          <p>Cart missing — <Link href="/spare">return to browse</Link>.</p>
        ) : (
          <>
            <p style={{ fontWeight: 700 }}>
              USD {(Number(usdMinor) / 100).toFixed(2)}
            </p>
            <p style={{ fontSize: 14 }}>
              Payable ZiG (indicative): {(Number(zigMinor) / 100).toFixed(2)} ZWG
            </p>
            {error ? (
              <p style={{ color: "#a33", fontSize: 14 }} role="alert">
                {error}
              </p>
            ) : null}
            <div
              style={{
                display: "grid",
                gap: dialTokens.space.sm,
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                marginTop: dialTokens.space.lg,
              }}
            >
              <form action={payEcoCash}>
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: dialTokens.space.md,
                    borderRadius: 8,
                    border: "none",
                    background: dialTokens.color.brand.primary,
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  EcoCash
                </button>
              </form>
              <form action={payCod}>
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: dialTokens.space.md,
                    borderRadius: 8,
                    border: "none",
                    background: dialTokens.color.brand.accent,
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  COD
                </button>
              </form>
            </div>
            <p style={{ fontSize: 12, opacity: 0.6, marginTop: dialTokens.space.md }}>
              Required pay CTAs only (D-57) — mirrors WA FLOW_SPARE_CHECKOUT EcoCash | COD buttons.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
