/**
 * PD49 — Escrow sandbox Job Reserve path (no live partner contract / ≠ ENH-020).
 * Sandbox fail-closed without PSP_ESCROW_*; fixture hold → release → webhook.
 */
import { EscrowPspAdapter } from "./EscrowPspAdapter.js";
import type { CreatePaymentInput } from "./types.js";

function baseInput(): CreatePaymentInput {
  return {
    method: "psp_escrow",
    money: { amountMinor: 50_00n, currency: "USD" },
    reference: "pd49_job_reserve",
    returnUrl: "https://dial.local/return",
    resultUrl: "https://dial.local/webhooks/escrow",
    customer: { email: "pd49@dial.local" },
    metadata: { fx_rate_id: "fx_pd49" },
    escrowPreferred: true,
  };
}

export async function runPd49EscrowSandboxThinVertical(): Promise<{
  sandboxFailClosed: true;
  fixtureHoldRelease: true;
  liveContractRequired: false;
  payableFromAi: false;
}> {
  const prev = process.env.DIAL_INTEGRATION_MODE;
  const cleared = [
    "PSP_ESCROW_BASE_URL",
    "PSP_ESCROW_API_KEY",
    "PSP_WEBHOOK_SECRET",
  ] as const;
  const saved: Record<string, string | undefined> = {};
  for (const k of cleared) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  try {
    process.env.DIAL_INTEGRATION_MODE = "sandbox";
    const escrow = new EscrowPspAdapter();
    let closed = 0;
    try {
      await escrow.createPayment(baseInput());
    } catch {
      closed += 1;
    }
    try {
      await escrow.instructRelease({
        holdRef: "hold_missing",
        allocations: [{ partyId: "tech_1", amountMinor: 10_00n }],
      });
    } catch {
      closed += 1;
    }
    try {
      await escrow.verifyWebhook(
        { "x-psp-signature": "x" },
        JSON.stringify({ eventId: "e1", holdId: "h1", status: "released" }),
      );
    } catch {
      closed += 1;
    }
    if (closed !== 3) {
      throw new Error(`PD49 sandbox must fail-closed 3 ways, got ${closed}`);
    }

    process.env.DIAL_INTEGRATION_MODE = "fixture";
    const fx = new EscrowPspAdapter();
    const hold = await fx.createPayment(baseInput());
    if (!hold.providerRef.startsWith("escrow_fx_")) {
      throw new Error("PD49 fixture hold must work");
    }
    const release = await fx.instructRelease({
      holdRef: hold.providerRef,
      allocations: [{ partyId: "tech_pd49", amountMinor: 50_00n }],
    });
    if (!release.instructionId.startsWith("escrow_rel_")) {
      throw new Error("PD49 fixture release must work");
    }
    const admitted = await fx.verifyWebhook(
      {},
      JSON.stringify({
        eventId: "pd49_evt_1",
        holdId: hold.providerRef,
        status: "released",
      }),
    );
    if (admitted.eventId !== "pd49_evt_1" || admitted.providerRef !== hold.providerRef) {
      throw new Error("PD49 fixture webhook must admit hold release");
    }

    return {
      sandboxFailClosed: true,
      fixtureHoldRelease: true,
      liveContractRequired: false,
      payableFromAi: false,
    };
  } finally {
    if (prev === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prev;
    for (const k of cleared) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}
