/**
 * Admin money outbox drain (S115) — fail closed without INTERNAL_API_SECRET.
 * GET: pending depth. POST: drainMoneyOutbox (ledger → queues; fiscal → FDMS).
 */
import { NextResponse } from "next/server";
import {
  __resetLedgerForTests,
  drainMoneyOutbox,
  enqueueMoneyOutbox,
  listMoneyOutbox,
} from "@dial/ledger";

export const runtime = "nodejs";

/** Test-only: same module graph as this route (avoids dual ledger instances under tsx). */
export const __testMoneyOutbox = {
  reset: __resetLedgerForTests,
  enqueue: enqueueMoneyOutbox,
  list: listMoneyOutbox,
};

function assertInternalSecret(req: Request): NextResponse | null {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "INTERNAL_API_SECRET unset — fail closed" },
      { status: 503 },
    );
  }
  const header = req.headers.get("x-internal-secret") ?? "";
  if (header !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const pending = listMoneyOutbox();
  return NextResponse.json({
    depth: pending.length,
    pending: pending.map((r) => ({
      id: r.id,
      kind: r.kind,
      refId: r.refId,
      createdAt: r.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as {
    enqueueSideEffects?: boolean;
  };

  const drained = await drainMoneyOutbox(
    body.enqueueSideEffects === true
      ? { enqueueSideEffects: true }
      : undefined,
  );

  return NextResponse.json({
    drained,
    remaining: listMoneyOutbox().length,
  });
}
