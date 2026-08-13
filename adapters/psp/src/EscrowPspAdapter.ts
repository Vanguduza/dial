/**
 * EscrowPspAdapter — Job Reserve hold/release partner (D-4 / D-43).
 */
import { fixtureWebhook, hmacSha256Hex, timingSafeEqualStr } from "./crypto.js";
import {
  type CreatePaymentInput,
  type PaymentSession,
  type PspAdapter,
  type WebhookAdmission,
  integrationMode,
  requireSecret,
} from "./types.js";

export class EscrowPspAdapter implements PspAdapter {
  readonly code = "psp_escrow" as const;

  capabilities() {
    return {
      supportsHold: true,
      supportsSplitPayout: true,
      supportsRefund: true,
      currencies: ["USD"] as Array<"USD" | "ZWG">,
      channels: ["web", "android", "ios", "whatsapp"] as Array<
        "web" | "android" | "ios" | "whatsapp"
      >,
    };
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentSession> {
    if (integrationMode() === "fixture") {
      return {
        providerRef: `escrow_fx_${input.reference}`,
        status: "pending",
      };
    }
    const base = requireSecret("PSP_ESCROW_BASE_URL");
    const key = requireSecret("PSP_ESCROW_API_KEY");
    const res = await fetch(`${base.replace(/\/$/, "")}/v1/holds`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference: input.reference,
        amountMinor: input.money.amountMinor.toString(),
        currency: input.money.currency,
        resultUrl: input.resultUrl,
        metadata: input.metadata,
      }),
    });
    if (!res.ok) throw new Error(`Escrow hold HTTP ${res.status}`);
    const data = (await res.json()) as { holdId?: string };
    return {
      providerRef: data.holdId ?? input.reference,
      status: "pending",
    };
  }

  async pollStatus(providerRefOrPollUrl: string): Promise<PaymentSession["status"]> {
    if (integrationMode() === "fixture") {
      return providerRefOrPollUrl.includes("paid") ? "paid" : "pending";
    }
    const base = requireSecret("PSP_ESCROW_BASE_URL");
    const key = requireSecret("PSP_ESCROW_API_KEY");
    const res = await fetch(
      `${base.replace(/\/$/, "")}/v1/holds/${encodeURIComponent(providerRefOrPollUrl)}`,
      { headers: { Authorization: `Bearer ${key}` } },
    );
    if (!res.ok) throw new Error(`Escrow poll HTTP ${res.status}`);
    const data = (await res.json()) as { status?: string };
    const s = (data.status ?? "").toLowerCase();
    if (s === "held" || s === "authorized") return "pending";
    if (s === "released" || s === "captured") return "paid";
    if (s === "cancelled") return "cancelled";
    return "pending";
  }

  async instructRelease(input: {
    holdRef: string;
    allocations: Array<{ partyId: string; amountMinor: bigint }>;
  }): Promise<{ instructionId: string }> {
    if (integrationMode() === "fixture") {
      return { instructionId: `escrow_rel_${input.holdRef}` };
    }
    const base = requireSecret("PSP_ESCROW_BASE_URL");
    const key = requireSecret("PSP_ESCROW_API_KEY");
    const res = await fetch(`${base.replace(/\/$/, "")}/v1/holds/${input.holdRef}/release`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        allocations: input.allocations.map((a) => ({
          partyId: a.partyId,
          amountMinor: a.amountMinor.toString(),
        })),
      }),
    });
    if (!res.ok) throw new Error(`Escrow release HTTP ${res.status}`);
    const data = (await res.json()) as { instructionId?: string };
    return { instructionId: data.instructionId ?? `rel_${input.holdRef}` };
  }

  async verifyWebhook(
    headers: Record<string, string>,
    rawBody: string,
  ): Promise<WebhookAdmission> {
    const secret =
      process.env.PSP_WEBHOOK_SECRET?.trim() ||
      (integrationMode() === "fixture" ? "fixture_secret" : "");
    if (!secret) throw new Error("PSP_WEBHOOK_SECRET unset — fail closed");
    const sig = headers["x-psp-signature"] ?? "";
    const expected = `sha256=${hmacSha256Hex(secret, rawBody)}`;
    if (integrationMode() !== "fixture" && !timingSafeEqualStr(sig, expected)) {
      throw new Error("Escrow webhook signature invalid");
    }
    const payload = JSON.parse(rawBody || "{}") as Record<string, unknown>;
    if (integrationMode() === "fixture" && !sig) {
      return fixtureWebhook({
        eventId: String(payload.eventId ?? "escrow_fx"),
        type: String(payload.type ?? "escrow.hold"),
        providerRef: String(payload.holdId ?? payload.providerRef ?? "unknown"),
        status: payload.status === "captured" ? "paid" : "pending",
        payload,
      });
    }
    return {
      eventId: String(payload.eventId ?? ""),
      type: String(payload.type ?? "escrow.event"),
      providerRef: String(payload.holdId ?? payload.providerRef ?? ""),
      status: payload.status === "captured" ? "paid" : "pending",
      payload,
    };
  }
}
