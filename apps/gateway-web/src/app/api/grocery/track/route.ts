/**
 * PD14 grocery order track — ERP status from catalogue grocery orders.
 */
import { NextResponse } from "next/server";
import { trackGroceryOrder } from "@dial/catalogue";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const orderId = new URL(req.url).searchParams.get("orderId") ?? "";
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }
  try {
    const track = trackGroceryOrder(orderId);
    return NextResponse.json({
      orderId: track.order.orderId,
      status: track.order.status,
      statusLabel: track.statusLabel,
      statusFrom: track.statusFrom,
      timeline: track.timeline,
      slotId: track.slot.slotId,
      windowLabel: track.slot.windowLabel,
      coldChainNotes: track.slot.coldChainNotes,
      liquorAllowed: track.liquorAllowed,
      totalUsdMinor: track.order.totalUsdMinor.toString(),
      currency: track.order.currency,
      payChoice: track.order.payChoice,
      soldBy: track.order.soldBy,
      deliveryJobId: track.order.deliveryJobId,
      payableFromAi: false,
      note: "PD119 — grocery ERP track timeline; liquorAllowed false",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "track failed" },
      { status: 404 },
    );
  }
}
