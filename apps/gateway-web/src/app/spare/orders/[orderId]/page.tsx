/**
 * PD18 Spare order track — ERP status; Sold by; no ZiG (D-57).
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { dialTokens } from "@dial/design-tokens";
import { trackSpareOrder } from "@dial/catalogue";

export default async function SpareOrderTrackPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  let track;
  try {
    track = trackSpareOrder(orderId);
  } catch {
    notFound();
  }
  const { order } = track;

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
          <Link href="/spare/orders">Orders</Link>
        </nav>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
          }}
        >
          Track {order.orderId}
        </h1>
        <p style={{ fontWeight: 700 }}>Status: {order.status}</p>
        <p style={{ fontSize: 14 }}>
          USD {(Number(order.totalUsdMinor) / 100).toFixed(2)} · {order.payChoice} ·
          Sold by {order.soldBySummary}
        </p>
        <p style={{ fontSize: 13, opacity: 0.7 }}>
          Status from ERP (not Simulated). Cancellable until{" "}
          {new Date(order.cancellableUntil).toLocaleString()} (7-day aware). No ZiG
          on track (D-57).
        </p>
        <ul>
          {order.lines.map((l) => (
            <li key={l.offerId}>
              {l.title} × {l.qty} — Sold by {l.soldBy}
            </li>
          ))}
        </ul>
        <p style={{ marginTop: dialTokens.space.md }}>
          <Link href={`/spare/returns?orderId=${encodeURIComponent(order.orderId)}`}>
            Open return
          </Link>
        </p>
      </div>
    </main>
  );
}
