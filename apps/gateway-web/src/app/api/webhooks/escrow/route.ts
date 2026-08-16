/**
 * Escrow PSP webhook — HMAC + durable idempotency + Job Reserve apply (D-43 / key-drop-in).
 */
import { NextResponse } from "next/server";
import { EscrowPspAdapter } from "@dial/adapter-psp";
import {
  applyJobReserveWebhook,
  findJobReserveForWebhook,
} from "@dial/payments";
import { claimProcessedEventDurable } from "@dial/shared";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headers = Object.fromEntries(req.headers.entries());
  try {
    const admission = await new EscrowPspAdapter().verifyWebhook(
      headers,
      rawBody,
    );
    if (
      (await claimProcessedEventDurable({
        eventId: admission.eventId,
        source: "psp_escrow",
      })) === "duplicate"
    ) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const payload = admission.payload as {
      reserveId?: string;
      jobId?: string;
      holdId?: string;
      status?: string;
      type?: string;
      action?: string;
    };
    const reserve =
      findJobReserveForWebhook(String(payload.reserveId ?? "")) ??
      findJobReserveForWebhook(String(payload.jobId ?? "")) ??
      findJobReserveForWebhook(admission.providerRef) ??
      findJobReserveForWebhook(String(payload.holdId ?? ""));

    const typeOrAction = `${payload.type ?? admission.type ?? ""} ${payload.action ?? ""} ${payload.status ?? ""}`.toLowerCase();
    let action: "capture" | "release" | undefined;
    if (
      typeOrAction.includes("capture") ||
      admission.status === "paid" ||
      payload.status === "captured"
    ) {
      action = "capture";
    } else if (
      typeOrAction.includes("release") ||
      payload.status === "released"
    ) {
      action = "release";
    }

    let bridge: "captured" | "released" | "skipped" = "skipped";
    let reserveOut: ReturnType<typeof applyJobReserveWebhook> | undefined;
    if (reserve && action) {
      reserveOut = applyJobReserveWebhook({
        reserveId: reserve.id,
        eventId: `escrow_jr_${admission.eventId}`,
        action,
        signatureValid: true,
      });
      bridge = action === "capture" ? "captured" : "released";
    }

    return NextResponse.json({
      ok: true,
      admission,
      bridge,
      reserve: reserveOut,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "webhook error" },
      { status: 401 },
    );
  }
}
