/**
 * Phase 4 prep — confirm-SLA ops board (Pack §9.4 / G4 DoD item).
 * Fail closed without INTERNAL_API_SECRET. Does not claim G4 green.
 */
import { NextResponse } from "next/server";
import {
  ackSlaEscalation,
  confirmOrder,
  enqueueConfirmOrder,
  listConfirmSlaBoard,
  onboardSupplier,
  syncSupplierSlaEscalations,
} from "@dial/suppliers";

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

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const board = listConfirmSlaBoard();
  return NextResponse.json({
    ok: true,
    queue: board.queue.map((o) => ({
      ...o,
      amountUsdMinor: o.amountUsdMinor.toString(),
    })),
    openEscalations: board.openEscalations,
    supplierCount: board.supplierCount,
    payableFromAi: false,
  });
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
      case "seed_board": {
        const formalId = String(body.formalSupplierId ?? "sup_sla_formal");
        const informalId = String(body.informalSupplierId ?? "sup_sla_informal");
        onboardSupplier({
          supplierId: formalId,
          displayName: "SLA Formal Agency",
          formality: "formal",
          tier: "silver",
        });
        onboardSupplier({
          supplierId: informalId,
          displayName: "SLA Informal Agency",
          formality: "informal",
          tier: "bronze",
        });
        enqueueConfirmOrder({
          supplierId: formalId,
          amountUsdMinor: BigInt(String(body.amountUsdMinor ?? "4500")),
          slaMs: 120_000,
        });
        enqueueConfirmOrder({
          supplierId: informalId,
          amountUsdMinor: 20_00n,
          slaMs: 1,
        });
        syncSupplierSlaEscalations(informalId, { now: Date.now() + 50 });
        const board = listConfirmSlaBoard(Date.now() + 100);
        return NextResponse.json({
          ok: true,
          seeded: true,
          queueCount: board.queue.length,
          openEscalations: board.openEscalations.length,
          payableFromAi: false,
        });
      }
      case "confirm": {
        const order = confirmOrder({
          supplierId: String(body.supplierId ?? ""),
          orderId: String(body.orderId ?? ""),
        });
        return NextResponse.json({
          ok: true,
          order: {
            ...order,
            amountUsdMinor: order.amountUsdMinor.toString(),
          },
          payableFromAi: false,
        });
      }
      case "ack_escalation": {
        const esc = ackSlaEscalation({
          supplierId: String(body.supplierId ?? ""),
          escalationId: String(body.escalationId ?? ""),
        });
        return NextResponse.json({ ok: true, escalation: esc, payableFromAi: false });
      }
      case "sync_sla": {
        const supplierId = String(body.supplierId ?? "");
        if (!supplierId) {
          return NextResponse.json({ error: "supplierId required" }, { status: 400 });
        }
        const opened = syncSupplierSlaEscalations(supplierId);
        return NextResponse.json({
          ok: true,
          opened,
          board: listConfirmSlaBoard(),
          payableFromAi: false,
        });
      }
      default:
        return NextResponse.json(
          { error: "action must be seed_board | confirm | ack_escalation | sync_sla" },
          { status: 400 },
        );
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "confirm-sla failed" },
      { status: 400 },
    );
  }
}
