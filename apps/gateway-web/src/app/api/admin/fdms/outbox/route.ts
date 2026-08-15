/**
 * PD11 Admin FDMS fiscal outbox — list queued/submitted + drain via money outbox link.
 * Fail closed without INTERNAL_API_SECRET. Virtual Gateway only (no printer).
 */
import { NextResponse } from "next/server";
import { drainMoneyOutbox, enqueueMoneyOutbox, listMoneyOutbox } from "@dial/ledger";
import {
  countFdmsReceiptClasses,
  enqueueFiscalReceipt,
  getFiscalDayState,
  listFdmsOutbox,
  listQueuedFdmsReceipts,
} from "@dial/tax";
import { money } from "@dial/shared";

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
  return NextResponse.json({
    day: getFiscalDayState(),
    fdmsOutbox: listFdmsOutbox().map((r) => ({
      id: r.id,
      orderId: r.orderId,
      receiptClass: r.receiptClass,
      amountMinor: r.amount.amountMinor.toString(),
      currency: r.amount.currency,
      channel: r.channel,
      status: r.status,
      gateway: r.gateway,
      fiscalCode: r.fiscalCode,
      createdAt: r.createdAt,
      submittedAt: r.submittedAt,
    })),
    receiptClassCounts: countFdmsReceiptClasses(),
    queuedCount: listQueuedFdmsReceipts().length,
    moneyFiscalPending: listMoneyOutbox().filter((r) => r.kind === "fiscal_queued")
      .length,
    gateway: "zimra_virtual_in_house",
    printerRequired: false,
    note: "D-59 agency Virtual Gateway — no physical printer (PD41 day ops)",
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected (D-47)" },
      { status: 400 },
    );
  }
  const action = String(body.action ?? "");
  try {
    switch (action) {
      case "seed_agency_receipts": {
        const orderId = String(body.orderId ?? `ord_pd11_${Date.now().toString(36)}`);
        const classes = ["GOODS_FORMAL", "GOODS_INFORMAL", "DIAL_FEE"] as const;
        const seeded = [];
        for (const receiptClass of classes) {
          const row = enqueueFiscalReceipt({
            orderId,
            receiptClass,
            amount: money(
              receiptClass === "DIAL_FEE"
                ? 300n
                : receiptClass === "GOODS_FORMAL"
                  ? 4500n
                  : 1200n,
              "USD",
            ),
            channel: "web",
          });
          enqueueMoneyOutbox({ kind: "fiscal_queued", refId: row.id });
          seeded.push({ id: row.id, receiptClass });
        }
        return NextResponse.json({
          ok: true,
          orderId,
          seeded,
          day: getFiscalDayState(),
        });
      }
      case "drain": {
        const drained = await drainMoneyOutbox({
          enqueueSideEffects: Boolean(process.env.REDIS_URL?.trim()),
        });
        return NextResponse.json({
          ok: true,
          drained,
          remainingMoney: listMoneyOutbox().length,
          fdmsOutbox: listFdmsOutbox().map((r) => ({
            id: r.id,
            receiptClass: r.receiptClass,
            status: r.status,
            fiscalCode: r.fiscalCode,
          })),
          day: getFiscalDayState(),
        });
      }
      default:
        return NextResponse.json({ error: `unknown action ${action}` }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "fdms outbox failed" },
      { status: 400 },
    );
  }
}
