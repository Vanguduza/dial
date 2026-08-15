/**
 * PD49 Escrow sandbox ops — Job Reserve hold/release without live partner (≠ ENH-020).
 * Fail closed without INTERNAL_API_SECRET.
 */
import { NextResponse } from "next/server";
import {
  applyJobReserveWebhook,
  authorizeJobReserve,
  getJobReserve,
} from "@dial/payments";
import { runPd49EscrowSandboxThinVertical } from "@dial/adapter-psp";

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
  const reserveId = new URL(req.url).searchParams.get("reserveId");
  const reserve = reserveId ? getJobReserve(reserveId) : undefined;
  return NextResponse.json({
    liveContractRequired: false,
    note: "PD49 — escrow sandbox / fixture only; ENH-020 live partner still human",
    reserve: reserve
      ? {
          id: reserve.id,
          jobId: reserve.jobId,
          status: reserve.status,
          amountMinor: reserve.amount.amountMinor.toString(),
          currency: reserve.amount.currency,
        }
      : null,
    payableFromAi: false,
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const body = (await req.json()) as {
    action?: "run_sandbox_vertical" | "authorize" | "webhook";
    jobId?: string;
    amountUsdMinor?: string;
    idempotencyKey?: string;
    reserveId?: string;
    eventId?: string;
    webhookAction?: "capture" | "release";
    signatureValid?: boolean;
  };

  try {
    if (body.action === "run_sandbox_vertical") {
      const out = await runPd49EscrowSandboxThinVertical();
      return NextResponse.json({ ok: true, ...out });
    }
    if (body.action === "authorize") {
      if (!body.jobId || !body.idempotencyKey || !body.amountUsdMinor) {
        return NextResponse.json(
          { error: "jobId, amountUsdMinor, idempotencyKey required" },
          { status: 400 },
        );
      }
      const reserve = await authorizeJobReserve({
        jobId: body.jobId,
        amountUsdMinor: BigInt(body.amountUsdMinor),
        idempotencyKey: body.idempotencyKey,
      });
      return NextResponse.json({
        ok: true,
        reserve: {
          id: reserve.id,
          jobId: reserve.jobId,
          status: reserve.status,
          amountMinor: reserve.amount.amountMinor.toString(),
          currency: reserve.amount.currency,
        },
        payableFromAi: false,
      });
    }
    if (body.action === "webhook") {
      if (
        !body.reserveId ||
        !body.eventId ||
        (body.webhookAction !== "capture" && body.webhookAction !== "release")
      ) {
        return NextResponse.json(
          {
            error:
              "reserveId, eventId, webhookAction capture|release required",
          },
          { status: 400 },
        );
      }
      const reserve = applyJobReserveWebhook({
        reserveId: body.reserveId,
        eventId: body.eventId,
        action: body.webhookAction,
        signatureValid: body.signatureValid !== false,
      });
      return NextResponse.json({
        ok: true,
        reserve: {
          id: reserve.id,
          status: reserve.status,
          amountMinor: reserve.amount.amountMinor.toString(),
          currency: reserve.amount.currency,
        },
        payableFromAi: false,
      });
    }
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "escrow failed" },
      { status: 400 },
    );
  }
}
