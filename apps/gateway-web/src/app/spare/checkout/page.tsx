/**
 * T3 / PD43 / G2 pay-step — ZiG conversion only here (D-57).
 * CPA §7.5 eighteen-item disclosure + review before EcoCash | COD.
 * Checkout runs G2 spine (durable snapshot/order/JR/ledger/fiscal).
 */
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { dialTokens } from "@dial/design-tokens";
import { EIGHTEEN_ITEM_DISCLOSURES } from "@dial/adapter-whatsapp";
import { getCart } from "@dial/catalogue";
import {
  getActiveFxRate,
  setDailyZigRate,
  usdToZig,
} from "@dial/payments";
import { DisclosureReviewGate } from "../../../components/DisclosureReviewGate";
import {
  getSessionFromToken,
  sessionCookieName,
} from "../../../lib/auth/session";
import { runG2SpareThinVertical } from "../../../lib/spare/g2Spine";

/** Next.js `redirect()` / `notFound()` throw control-flow errors — must not be caught as pay failures. */
function rethrowNextControlFlow(e: unknown): void {
  if (
    e &&
    typeof e === "object" &&
    "digest" in e &&
    typeof (e as { digest?: unknown }).digest === "string"
  ) {
    const digest = (e as { digest: string }).digest;
    if (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND")) {
      throw e;
    }
  }
}

export default async function SpareCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ cartId?: string; error?: string }>;
}) {
  const { cartId, error } = await searchParams;
  const cart = cartId ? getCart(cartId) : undefined;
  let rate = getActiveFxRate();
  if (!rate) {
    const mode = (process.env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
    if (mode === "fixture" || process.env.DIAL_G2_ALLOW_FX_SEED?.trim() === "1") {
      rate = setDailyZigRate({
        zigMinorPerUsd: 2500_00n,
        setBy: mode === "fixture" ? "spare_checkout_fixture" : "g2_spare_dogfood_seed",
      });
    }
  }
  const usdMinor = cart?.total.amountMinor ?? 0n;
  const zigMinor = rate ? usdToZig(usdMinor, rate).amountMinor : 0n;

  async function payEcoCash() {
    "use server";
    if (!cartId) redirect("/spare/cart");
    const jar = await cookies();
    const session = getSessionFromToken(jar.get(sessionCookieName())?.value);
    if (!session) {
      const next = `/spare/checkout?cartId=${encodeURIComponent(cartId)}`;
      redirect(`/?next=${encodeURIComponent(next)}`);
    }
    try {
      const result = await runG2SpareThinVertical({
        cartId,
        buyerSegment: session.buyerSegment === "b2b" ? "b2b" : "b2c",
        customerId: session.userId,
        payChoice: "ecocash",
        idempotencyKey: `web-ecocash-${cartId}`,
        simulateEcoCashWebhook: true,
      });
      redirect(
        `/spare/checkout/done?method=ecocash&orderId=${encodeURIComponent(result.orderId)}&intentId=${encodeURIComponent(result.intentId ?? "")}&cartId=${encodeURIComponent(cartId)}&jr=${encodeURIComponent(result.jobReserveId)}&journal=${encodeURIComponent(result.journalId ?? "")}`,
      );
    } catch (e) {
      rethrowNextControlFlow(e);
      redirect(
        `/spare/checkout?cartId=${encodeURIComponent(cartId)}&error=${encodeURIComponent(e instanceof Error ? e.message : "pay failed")}`,
      );
    }
  }

  async function payCod() {
    "use server";
    if (!cartId) redirect("/spare/cart");
    const jar = await cookies();
    const session = getSessionFromToken(jar.get(sessionCookieName())?.value);
    if (!session) {
      const next = `/spare/checkout?cartId=${encodeURIComponent(cartId)}`;
      redirect(`/?next=${encodeURIComponent(next)}`);
    }
    try {
      const result = await runG2SpareThinVertical({
        cartId,
        buyerSegment: session.buyerSegment === "b2b" ? "b2b" : "b2c",
        customerId: session.userId,
        payChoice: "cod",
        idempotencyKey: `web-cod-${cartId}`,
      });
      redirect(
        `/spare/checkout/done?method=cod&orderId=${encodeURIComponent(result.orderId)}&codId=${encodeURIComponent(result.codOrderId ?? "")}&cartId=${encodeURIComponent(cartId)}&jr=${encodeURIComponent(result.jobReserveId)}&journal=${encodeURIComponent(result.journalId ?? "")}`,
      );
    } catch (e) {
      rethrowNextControlFlow(e);
      redirect(
        `/spare/checkout?cartId=${encodeURIComponent(cartId)}&error=${encodeURIComponent(e instanceof Error ? e.message : "pay failed")}`,
      );
    }
  }

  return (
    <main
      data-testid="spare-checkout-cpa"
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
            marginBottom: dialTokens.space.lg,
            display: "flex",
            gap: dialTokens.space.md,
            flexWrap: "wrap",
          }}
        >
          <Link href="/spare">Browse</Link>
          <Link
            href={
              cartId
                ? `/spare/cart?cartId=${encodeURIComponent(cartId)}`
                : "/spare/cart"
            }
          >
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
          Checkout — review & pay
        </h1>
        <p style={{ fontSize: 14, opacity: 0.75 }}>
          USD cart · ZiG at pay from Daily ZiG rate. Sold by agency supplier.
        </p>
        {!cart || cart.lines.length === 0 ? (
          <p>
            Cart missing — <Link href="/spare">return to browse</Link>.
          </p>
        ) : !rate ? (
          <p role="alert" style={{ color: "#a33" }}>
            Daily ZiG rate not set — ops must publish before EcoCash|COD.
          </p>
        ) : (
          <>
            <p style={{ fontWeight: 700 }}>
              USD {(Number(usdMinor) / 100).toFixed(2)}
            </p>
            <p style={{ fontSize: 14 }}>
              Payable ZiG: {(Number(zigMinor) / 100).toFixed(2)} ZWG
            </p>
            {error ? (
              <p style={{ color: "#a33", fontSize: 14 }} role="alert">
                {error}{" "}
                {/sign in required/i.test(error) && cartId ? (
                  <Link
                    href={`/?next=${encodeURIComponent(`/spare/checkout?cartId=${cartId}`)}`}
                    data-testid="checkout-sign-in"
                  >
                    Sign in to continue
                  </Link>
                ) : null}
              </p>
            ) : null}
            <DisclosureReviewGate disclosures={EIGHTEEN_ITEM_DISCLOSURES}>
              <div
                style={{
                  display: "grid",
                  gap: dialTokens.space.sm,
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                }}
              >
                <form action={payEcoCash}>
                  <button
                    type="submit"
                    data-testid="pay-ecocash"
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
                    data-testid="pay-cod"
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
                    Cash on delivery (COD)
                  </button>
                </form>
              </div>
            </DisclosureReviewGate>
          </>
        )}
      </div>
    </main>
  );
}
