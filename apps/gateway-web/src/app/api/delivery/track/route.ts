/**
 * PD58 Customer delivery track — read-only MapLibre pins (Pack §9.5).
 * Session SoR; order ownership via customerId match (D-47). Never body userId/role.
 */
import { NextResponse } from "next/server";
import { getGroceryOrder, getSpareOrder } from "@dial/catalogue";
import { getCustomerDeliveryTrack } from "@dial/delivery";
import {
  getSessionFromToken,
  parseSessionCookie,
} from "../../../../lib/auth/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = getSessionFromToken(
    parseSessionCookie(req.headers.get("cookie")),
  );
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  if (url.searchParams.has("userId") || url.searchParams.has("role")) {
    return NextResponse.json(
      { error: "role/userId from query rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }
  const orderId = url.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const spare = getSpareOrder(orderId);
  const grocery = getGroceryOrder(orderId);
  const order = spare ?? grocery;
  if (!order) {
    return NextResponse.json({ error: "Unknown order" }, { status: 404 });
  }
  const customerKey = `cust_${session.email.split("@")[0]!.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
  const owns =
    order.customerId == null ||
    order.customerId === session.email ||
    order.customerId === customerKey;
  if (!owns) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const track = getCustomerDeliveryTrack({ orderId });
  return NextResponse.json({
    ...track,
    job: track.job
      ? {
          ...track.job,
          codAmountUsdMinor: track.job.codAmountUsd?.amountMinor.toString(),
          codAmountUsd: undefined,
        }
      : null,
    note: "PD58 — customer read-only track; MapLibre SoR (not Google)",
  });
}
