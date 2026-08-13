/**
 * EcoCashDirectAdapter — official developers.ecocash.co.zw shape (D-43 / D-57).
 * Charge/lookup/refund; handset prompt. Amount display ZWG from Daily ZiG rate lives in @dial/payments.
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

function baseUrl(): string {
  const env = (process.env.ECOCASH_ENVIRONMENT ?? "sandbox").toLowerCase();
  return env === "live"
    ? "https://api.ecocash.co.zw"
    : "https://developers.ecocash.co.zw/api/sandbox";
}

export class EcoCashDirectAdapter implements PspAdapter {
  readonly code = "ecocash_direct" as const;

  capabilities() {
    return {
      supportsHold: false,
      supportsSplitPayout: false,
      supportsRefund: true,
      currencies: ["ZWG"] as Array<"USD" | "ZWG">,
      channels: ["web", "android", "ios", "whatsapp"] as Array<
        "web" | "android" | "ios" | "whatsapp"
      >,
    };
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentSession> {
    if (input.money.currency !== "ZWG") {
      throw new Error("EcoCash direct charge currency must be ZWG (display payable)");
    }
    if (integrationMode() === "fixture") {
      return {
        providerRef: `eco_fx_${input.reference}`,
        status: "awaiting_customer",
        customerAction: "approve_on_handset",
      };
    }
    const apiKey = requireSecret("ECOCASH_API_KEY");
    const merchant = requireSecret("ECOCASH_MERCHANT_CODE");
    const res = await fetch(`${baseUrl()}/v1/transactions/charge`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        merchantCode: merchant,
        reference: input.reference,
        amountMinor: input.money.amountMinor.toString(),
        currency: "ZWG",
        msisdn: input.customer.msisdnE164,
        resultUrl: input.resultUrl,
        metadata: input.metadata,
      }),
    });
    if (!res.ok) throw new Error(`EcoCash charge HTTP ${res.status}`);
    const data = (await res.json()) as { transactionId?: string };
    return {
      providerRef: data.transactionId ?? input.reference,
      status: "awaiting_customer",
      customerAction: "approve_on_handset",
    };
  }

  async pollStatus(providerRefOrPollUrl: string): Promise<PaymentSession["status"]> {
    if (integrationMode() === "fixture") {
      return providerRefOrPollUrl.includes("paid") ? "paid" : "awaiting_customer";
    }
    const apiKey = requireSecret("ECOCASH_API_KEY");
    const res = await fetch(
      `${baseUrl()}/v1/transactions/${encodeURIComponent(providerRefOrPollUrl)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    if (!res.ok) throw new Error(`EcoCash lookup HTTP ${res.status}`);
    const data = (await res.json()) as { status?: string };
    const s = (data.status ?? "").toLowerCase();
    if (s === "success" || s === "paid") return "paid";
    if (s === "failed") return "failed";
    return "awaiting_customer";
  }

  async verifyWebhook(
    headers: Record<string, string>,
    rawBody: string,
  ): Promise<WebhookAdmission> {
    const secret =
      process.env.ECOCASH_WEBHOOK_SECRET?.trim() ||
      (integrationMode() === "fixture" ? "fixture_secret" : "");
    if (!secret) throw new Error("ECOCASH_WEBHOOK_SECRET unset — fail closed");
    const sig = headers["x-ecocash-signature"] ?? headers["X-EcoCash-Signature"] ?? "";
    const expected = hmacSha256Hex(secret, rawBody);
    if (integrationMode() !== "fixture" && !timingSafeEqualStr(sig, expected)) {
      throw new Error("EcoCash webhook signature invalid");
    }
    const payload = JSON.parse(rawBody || "{}") as Record<string, unknown>;
    if (integrationMode() === "fixture" && !sig) {
      return fixtureWebhook({
        eventId: String(payload.eventId ?? payload.transactionId ?? "eco_fx"),
        type: "ecocash.charge",
        providerRef: String(payload.transactionId ?? "unknown"),
        status: payload.status === "SUCCESS" || payload.status === "paid" ? "paid" : "pending",
        payload,
      });
    }
    return {
      eventId: String(payload.eventId ?? payload.transactionId ?? ""),
      type: "ecocash.charge",
      providerRef: String(payload.transactionId ?? ""),
      status:
        payload.status === "SUCCESS" || payload.status === "paid" ? "paid" : "pending",
      payload,
    };
  }
}
