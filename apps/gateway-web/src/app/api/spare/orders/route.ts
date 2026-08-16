/**
 * PD18 Spare orders API — list / place / track / cancel (PD92).
 * Session + object-level AuthZ (D-47). Never trust body/query customerId.
 */
import { NextResponse } from "next/server";
import {
  cancelSpareOrder,
  getCart,
  getSpareOrderDurable,
  listSpareOrders,
  placeSpareOrder,
  trackSpareOrder,
} from "@dial/catalogue";
import { apiError, newRequestId } from "@dial/shared";
import {
  assertResourceAccess,
  requireSession,
} from "../../../../lib/auth/session.js";

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
    timeline: o.timeline ?? [],
  };
}

export async function GET(req: Request) {
  const requestId = newRequestId(req.headers.get("x-request-id"));
  const session = await requireSession(req);
  if (!session) {
    return NextResponse.json(apiError("session required", "unauthorized", requestId), {
      status: 401,
    });
  }
  const url = new URL(req.url);
  if (url.searchParams.has("userId") || url.searchParams.has("role")) {
    return NextResponse.json(
      apiError("userId/role from query rejected — session SoR only (D-47)", "invalid_body", requestId),
      { status: 400 },
    );
  }
  if (
    url.searchParams.has("customerId") &&
    url.searchParams.get("customerId") !== session.userId
  ) {
    return NextResponse.json(
      apiError("customerId query must match session", "invalid_body", requestId),
      { status: 400 },
    );
  }
  const orderId = url.searchParams.get("orderId");
  if (orderId) {
    try {
      await getSpareOrderDurable(orderId);
      const track = trackSpareOrder(orderId);
      const ownerId = track.order.customerId ?? "";
      if (session.role !== "ops_admin") {
        if (ownerId) {
          assertResourceAccess({
            session,
            resourceOwnerId: ownerId,
            resourceKind: "order",
          });
        } else if ((process.env.DIAL_INTEGRATION_MODE ?? "fixture") !== "fixture") {
          return NextResponse.json(apiError("order has no owner", "not_found", requestId), {
            status: 404,
          });
        }
      }
      return NextResponse.json({
        requestId,
        order: serializeOrder(track.order),
        statusFrom: track.statusFrom,
        zigOnTrack: track.zigOnTrack,
        timeline: track.timeline,
        statusLabel: track.statusLabel,
        payableFromAi: false,
        note: "PD115 — ERP track timeline; no ZiG on track (D-57)",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "track failed";
      const status = msg.startsWith("IDOR") ? 403 : 404;
      return NextResponse.json(
        apiError(msg, status === 403 ? "forbidden" : "not_found", requestId),
        { status },
      );
    }
  }
  const orders = listSpareOrders(session.userId);
  return NextResponse.json({
    requestId,
    orders: orders.map(serializeOrder),
  });
}

export async function POST(req: Request) {
  const requestId = newRequestId(req.headers.get("x-request-id"));
  const session = await requireSession(req);
  if (!session) {
    return NextResponse.json(apiError("session required", "unauthorized", requestId), {
      status: 401,
    });
  }
  const body = (await req.json().catch(() => ({}))) as {
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
      apiError("userId/role from body rejected — session SoR only (D-47)", "invalid_body", requestId),
      { status: 400 },
    );
  }
  if (body.customerId !== undefined) {
    return NextResponse.json(
      apiError("customerId from body rejected — session SoR only (D-47)", "invalid_body", requestId),
      { status: 400 },
    );
  }

  if (body.action === "cancel") {
    try {
      const order = cancelSpareOrder({
        orderId: String(body.orderId ?? ""),
        customerId: session.userId,
      });
      return NextResponse.json({
        requestId,
        ok: true,
        order: serializeOrder(order),
        payableFromAi: false,
        note: "PD92 — 7-day cancellation window",
      });
    } catch (e) {
      return NextResponse.json(
        apiError(e instanceof Error ? e.message : "cancel failed", "invalid_body", requestId),
        { status: 400 },
      );
    }
  }

  if (!body.cartId || (body.payChoice !== "ecocash" && body.payChoice !== "cod")) {
    return NextResponse.json(
      apiError("cartId and payChoice ecocash|cod required", "invalid_body", requestId),
      { status: 400 },
    );
  }
  const cart = getCart(body.cartId);
  if (!cart) {
    return NextResponse.json(apiError("Unknown cart", "not_found", requestId), {
      status: 404,
    });
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
      customerId: session.userId,
      payChoice: body.payChoice,
    });
    return NextResponse.json({
      requestId,
      ok: true,
      order: serializeOrder(order),
    });
  } catch (e) {
    return NextResponse.json(
      apiError(e instanceof Error ? e.message : "place order failed", "invalid_body", requestId),
      { status: 400 },
    );
  }
}
