/**
 * PD14 grocery order track — session + object-level AuthZ (D-47).
 */
import { NextResponse } from "next/server";
import { getGroceryOrderDurable, trackGroceryOrder } from "@dial/catalogue";
import {
  apiError,
  newRequestId,
} from "@dial/shared";
import {
  assertResourceAccess,
  requireSession,
} from "../../../../lib/auth/session.js";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const requestId = newRequestId(req.headers.get("x-request-id"));
  const session = await requireSession(req);
  if (!session) {
    return NextResponse.json(apiError("session required", "unauthorized", requestId), {
      status: 401,
    });
  }
  const orderId = new URL(req.url).searchParams.get("orderId") ?? "";
  if (!orderId) {
    return NextResponse.json(apiError("orderId required", "invalid_body", requestId), {
      status: 400,
    });
  }
  try {
    await getGroceryOrderDurable(orderId);
    const track = trackGroceryOrder(orderId);
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
