/**
 * PD18 Spare order track — ERP status + PD115 timeline; Sold by; no ZiG (D-57).
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
  const { order, timeline, statusLabel } = track;

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
        <p style={{ fontWeight: 700 }}>
          Status: {statusLabel ?? order.status}
        </p>
        <p style={{ fontSize: 14 }}>
          USD {(Number(order.totalUsdMinor) / 100).toFixed(2)} · {order.payChoice} ·
          Sold by {order.soldBySummary}
        </p>
        <p style={{ fontSize: 13, opacity: 0.7 }}>
          Status from ERP (not Simulated). Cancellable until{" "}
          {new Date(order.cancellableUntil).toLocaleString()} (7-day aware). No ZiG
          on track (D-57).
        </p>
        {timeline.length > 0 ? (
          <div style={{ marginTop: dialTokens.space.md }}>
            <p style={{ fontSize: 13, fontWeight: 600 }}>Timeline</p>
            <ul
              data-testid="pd115-order-timeline"
              style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}
            >
              {timeline.map((t) => (
                <li key={`${t.at}-${t.event}`}>
                  {t.event} · {t.status} · {new Date(t.at).toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
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
