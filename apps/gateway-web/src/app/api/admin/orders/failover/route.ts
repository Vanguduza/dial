/**
 * PD71 — order failover accept after confirm SLA breach (Pack §10).
 * PD103 — Idempotency-Key required on failover_accept.
 */
import { NextResponse } from "next/server";
import {
  enqueueConfirmOrder,
  failoverAcceptOrder,
  listConfirmQueue,
  onboardSupplier,
} from "@dial/suppliers";
import { requireIdempotencyKey } from "@dial/payments";

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

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected — session/secret SoR only (D-47)" },
      { status: 400 },
    );
  }
  const action = String(body.action ?? "");
  try {
    switch (action) {
      case "seed_breach": {
        const primary = String(body.fromSupplierId ?? "sup_failover_a");
        const alternate = String(body.toSupplierId ?? "sup_failover_b");
        onboardSupplier({
          supplierId: primary,
          displayName: "Primary",
          formality: "formal",
          tier: "bronze",
        });
        onboardSupplier({
          supplierId: alternate,
          displayName: "Alternate",
          formality: "formal",
          tier: "silver",
        });
        const order = enqueueConfirmOrder({
          supplierId: primary,
          amountUsdMinor: BigInt(String(body.amountUsdMinor ?? "2500")),
          slaMs: 1,
        });
        listConfirmQueue(primary, Date.now() + 50);
        return NextResponse.json({
          ok: true,
          orderId: order.orderId,
          fromSupplierId: primary,
          toSupplierId: alternate,
          note: "PD71 — seeded SLA breach path",
        });
      }
      case "failover_accept": {
        let idempotencyKey: string;
        try {
          idempotencyKey = requireIdempotencyKey(req.headers);
        } catch (e) {
          return NextResponse.json(
            {
              error:
                e instanceof Error ? e.message : "Idempotency-Key required",
            },
            { status: 400 },
          );
        }
        const result = failoverAcceptOrder({
          orderId: String(body.orderId ?? ""),
          fromSupplierId: String(body.fromSupplierId ?? ""),
          toSupplierId: String(body.toSupplierId ?? ""),
          idempotencyKey,
        });
        return NextResponse.json({
          ok: true,
          result,
          payableFromAi: false,
          note: "PD103 — failover accept (Idempotency-Key)",
        });
      }
      default:
        return NextResponse.json(
          { error: "action must be seed_breach | failover_accept" },
          { status: 400 },
        );
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "failover failed" },
      { status: 400 },
    );
  }
}
