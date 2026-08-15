/**
 * PD55 Admin orders queue — spare + grocery (Pack §9.5).
 * Fail closed without INTERNAL_API_SECRET. No AI money; no liquor.
 */
import { NextResponse } from "next/server";
import {
  advanceGroceryOrderStatus,
  advanceSpareOrderStatus,
  listGroceryOrders,
  listSpareOrders,
} from "@dial/catalogue";

export const runtime = "nodejs";

function assertInternalSecret(req: Request): NextResponse | null {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "INTERNAL_API_SECRET unset — fail closed" },
      { status: 503 },
    );
  }
  if ((req.headers.get("x-internal-secret") ?? "") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

function serializeSpare(o: ReturnType<typeof listSpareOrders>[number]) {
  return {
    vertical: "spare" as const,
    orderId: o.orderId,
    customerId: o.customerId,
    status: o.status,
    totalUsdMinor: o.totalUsdMinor.toString(),
    currency: o.currency,
    payChoice: o.payChoice,
    soldBy: o.soldBySummary,
    createdAt: o.createdAt,
    payableFromAi: false as const,
  };
}

function serializeGrocery(o: ReturnType<typeof listGroceryOrders>[number]) {
  return {
    vertical: "grocery" as const,
    orderId: o.orderId,
    customerId: o.customerId,
    status: o.status,
    totalUsdMinor: o.totalUsdMinor.toString(),
    currency: o.currency,
    payChoice: o.payChoice,
    soldBy: o.soldBy,
    createdAt: o.createdAt,
    liquorAllowed: false as const,
    payableFromAi: false as const,
  };
}

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const spare = listSpareOrders().map(serializeSpare);
  const grocery = listGroceryOrders().map(serializeGrocery);
  return NextResponse.json({
    orders: [...spare, ...grocery].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    ),
    spareCount: spare.length,
    groceryCount: grocery.length,
    liquorAllowed: false,
    payableFromAi: false,
    note: "PD55 — admin orders queue; food/spare only",
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const body = (await req.json()) as {
    action?: string;
    vertical?: "spare" | "grocery";
    orderId?: string;
  };
  if (body.action !== "advance" || !body.orderId || !body.vertical) {
    return NextResponse.json(
      { error: "action=advance, vertical, orderId required" },
      { status: 400 },
    );
  }
  try {
    if (body.vertical === "spare") {
      const order = advanceSpareOrderStatus(body.orderId);
      return NextResponse.json({
        ok: true,
        order: serializeSpare(order),
        payableFromAi: false,
      });
    }
    const order = advanceGroceryOrderStatus(body.orderId);
    return NextResponse.json({
      ok: true,
      order: serializeGrocery(order),
      payableFromAi: false,
      liquorAllowed: false,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "advance failed" },
      { status: 400 },
    );
  }
}
