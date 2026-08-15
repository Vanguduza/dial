/**
 * PD18 Spare orders API — list / place / track (session customer optional).
 */
import { NextResponse } from "next/server";
import {
  getCart,
  listSpareOrders,
  placeSpareOrder,
  trackSpareOrder,
} from "@dial/catalogue";

export const runtime = "nodejs";

function serializeOrder(o: NonNullable<ReturnType<typeof listSpareOrders>[number]>) {
  return {
    ...o,
    totalUsdMinor: o.totalUsdMinor.toString(),
    lines: o.lines.map((l) => ({
      ...l,
      unitPriceUsdMinor: l.unitPriceUsdMinor.toString(),
      lineTotalUsdMinor: l.lineTotalUsdMinor.toString(),
    })),
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("orderId");
  const customerId = url.searchParams.get("customerId");
  if (orderId) {
    try {
      const track = trackSpareOrder(orderId);
      return NextResponse.json({
        order: serializeOrder(track.order),
        statusFrom: track.statusFrom,
        zigOnTrack: track.zigOnTrack,
      });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "track failed" },
        { status: 404 },
      );
    }
  }
  const orders = listSpareOrders(customerId);
  return NextResponse.json({ orders: orders.map(serializeOrder) });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    cartId?: string;
    customerId?: string;
    payChoice?: "ecocash" | "cod";
  };
  if (!body.cartId || (body.payChoice !== "ecocash" && body.payChoice !== "cod")) {
    return NextResponse.json(
      { error: "cartId and payChoice ecocash|cod required" },
      { status: 400 },
    );
  }
  const cart = getCart(body.cartId);
  if (!cart) {
    return NextResponse.json({ error: "Unknown cart" }, { status: 404 });
  }
  try {
    const order = placeSpareOrder({
      cart: {
        id: cart.id,
        currency: "USD",
        totalUsdMinor: cart.total.amountMinor,
        lines: cart.lines.map((l) => ({
          offerId: l.offerId,
          title: l.title,
          qty: l.qty,
          unitPriceUsdMinor: l.unitPrice.amountMinor,
          lineTotalUsdMinor: l.lineTotal.amountMinor,
          soldBy: l.soldBy,
          supplierFormality: l.supplierFormality,
        })),
      },
      customerId: body.customerId ?? null,
      payChoice: body.payChoice,
    });
    return NextResponse.json({ ok: true, order: serializeOrder(order) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "place order failed" },
      { status: 400 },
    );
  }
}
