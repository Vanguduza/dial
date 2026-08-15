/**
 * PD18 Spare orders API — list / place / track / cancel (PD92).
 */
import { NextResponse } from "next/server";
import {
  cancelSpareOrder,
  getCart,
  listSpareOrders,
  placeSpareOrder,
  trackSpareOrder,
} from "@dial/catalogue";
import {
  getSessionFromToken,
  parseSessionCookie,
} from "../../../../lib/auth/session";

export const runtime = "nodejs";

function customerIdFromSession(email: string): string {
  return `cust_${email.split("@")[0]!.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
}

function serializeOrder(o: NonNullable<ReturnType<typeof listSpareOrders>[number]>) {
  return {
    ...o,
    totalUsdMinor: o.totalUsdMinor.toString(),
    lines: o.lines.map((l) => ({
      ...l,
      unitPriceUsdMinor: l.unitPriceUsdMinor.toString(),
      lineTotalUsdMinor: l.lineTotalUsdMinor.toString(),
    })),
    timeline: o.timeline ?? [],
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
        timeline: track.timeline,
        statusLabel: track.statusLabel,
        payableFromAi: false,
        note: "PD115 — ERP track timeline; no ZiG on track (D-57)",
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
    action?: string;
    cartId?: string;
    customerId?: string;
    orderId?: string;
    payChoice?: "ecocash" | "cod";
    userId?: string;
    role?: string;
  };
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }

  if (body.action === "cancel") {
    const session = getSessionFromToken(
      parseSessionCookie(req.headers.get("cookie")),
    );
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const customerId = customerIdFromSession(session.email);
    try {
      const order = cancelSpareOrder({
        orderId: String(body.orderId ?? ""),
        customerId,
      });
      return NextResponse.json({
        ok: true,
        order: serializeOrder(order),
        payableFromAi: false,
        note: "PD92 — 7-day cancellation window",
      });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "cancel failed" },
        { status: 400 },
      );
    }
  }

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
