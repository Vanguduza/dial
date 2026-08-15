/**
 * PD93 — customer shadow-failover after supplier confirm SLA breach (Pack §9.2).
 * Session SoR; never body userId/role (D-47).
 */
import { NextResponse } from "next/server";
import {
  acceptShadowFailoverAsCustomer,
  enqueueConfirmOrder,
  listConfirmQueue,
  listShadowFailoverOffersForCustomer,
  onboardSupplier,
} from "@dial/suppliers";
import {
  getSessionFromToken,
  parseSessionCookie,
} from "../../../../lib/auth/session";

export const runtime = "nodejs";

function sessionOr401(req: Request) {
  return getSessionFromToken(parseSessionCookie(req.headers.get("cookie")));
}

function customerIdFromSession(email: string): string {
  return `cust_${email.split("@")[0]!.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
}

export async function GET(req: Request) {
  const session = sessionOr401(req);
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
  const customerId = customerIdFromSession(session.email);
  return NextResponse.json({
    customerId,
    offers: listShadowFailoverOffersForCustomer(customerId),
    payableFromAi: false,
    note: "PD93 — shadow failover after confirm SLA breach",
  });
}

export async function POST(req: Request) {
  const session = sessionOr401(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as Record<string, unknown>;
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }
  const customerId = customerIdFromSession(session.email);
  const action = String(body.action ?? "");
  try {
    if (action === "seed_breach") {
      const primary = String(body.fromSupplierId ?? "sup_pd93_a");
      const alternate = String(body.toSupplierId ?? "sup_pd93_b");
      onboardSupplier({
        supplierId: primary,
        displayName: "PD93 Primary",
        formality: "formal",
        tier: "bronze",
      });
      onboardSupplier({
        supplierId: alternate,
        displayName: "PD93 Alternate",
        formality: "formal",
        tier: "silver",
      });
      const order = enqueueConfirmOrder({
        supplierId: primary,
        customerId,
        amountUsdMinor: BigInt(String(body.amountUsdMinor ?? "4000")),
        slaMs: 1,
      });
      listConfirmQueue(primary, Date.now() + 50);
      return NextResponse.json({
        ok: true,
        orderId: order.orderId,
        offers: listShadowFailoverOffersForCustomer(customerId),
        payableFromAi: false,
      });
    }
    if (action === "accept") {
      const result = acceptShadowFailoverAsCustomer({
        customerId,
        orderId: String(body.orderId ?? ""),
        toSupplierId: String(body.toSupplierId ?? ""),
      });
      return NextResponse.json({
        ok: true,
        result,
        payableFromAi: false,
        note: "PD93 — customer accepted shadow failover",
      });
    }
    return NextResponse.json(
      { error: "action must be seed_breach | accept" },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "failover failed" },
      { status: 400 },
    );
  }
}
