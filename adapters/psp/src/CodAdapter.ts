/**
 * CodAdapter — no external HTTP (D-7). Paid only after courier/admin confirm.
 */
import { fixtureWebhook } from "./crypto.js";
import {
  type CreatePaymentInput,
  type PaymentSession,
  type PspAdapter,
  type WebhookAdmission,
} from "./types.js";

export class CodAdapter implements PspAdapter {
  constructor(readonly code: "cod_collection" | "cod_delivery") {}

  capabilities() {
    return {
      supportsHold: false,
      supportsSplitPayout: false,
      supportsRefund: false,
      currencies: ["USD"] as Array<"USD" | "ZWG">,
      channels: ["web", "android", "ios", "whatsapp"] as Array<
        "web" | "android" | "ios" | "whatsapp"
      >,
    };
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentSession> {
    if (input.money.currency !== "USD") {
      throw new Error("COD settle USD (D-60)");
    }
    const max = process.env.COD_MAX_ORDER_MINOR_USD;
    if (max && input.money.amountMinor > BigInt(max)) {
      throw new Error("COD order exceeds COD_MAX_ORDER_MINOR_USD");
    }
    return {
      providerRef: `cod_${this.code}_${input.reference}`,
      status: "awaiting_customer",
      customerAction:
        this.code === "cod_delivery" ? "pay_courier" : "pay_at_supplier",
    };
  }

  async pollStatus(providerRefOrPollUrl: string): Promise<PaymentSession["status"]> {
    return providerRefOrPollUrl.includes("paid") ? "paid" : "awaiting_customer";
  }

  async verifyWebhook(
    _headers: Record<string, string>,
    rawBody: string,
  ): Promise<WebhookAdmission> {
    const payload = JSON.parse(rawBody || "{}") as Record<string, unknown>;
    return fixtureWebhook({
      eventId: String(payload.eventId ?? payload.confirmationId ?? "cod_evt"),
      type: "cod.confirmed",
      providerRef: String(payload.providerRef ?? payload.orderId ?? "unknown"),
      status: payload.confirmed === true ? "paid" : "pending",
      payload,
    });
  }
}
