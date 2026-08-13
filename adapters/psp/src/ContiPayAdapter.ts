/**
 * ContiPayAdapter — REST shape from Stitch §2 (D-43).
 * Merchant approval required; sandbox when CONTIPAY_MODE=dev.
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
  const mode = (process.env.CONTIPAY_MODE ?? "dev").toLowerCase();
  return mode === "live"
    ? "https://api.contipay.co.zw"
    : "https://api-sandbox.contipay.co.zw";
}

export class ContiPayAdapter implements PspAdapter {
  readonly code = "contipay" as const;

  capabilities() {
    return {
      supportsHold: false,
      supportsSplitPayout: false,
      supportsRefund: true,
      currencies: ["USD", "ZWG"] as Array<"USD" | "ZWG">,
      channels: ["web", "android", "ios", "whatsapp"] as Array<
        "web" | "android" | "ios" | "whatsapp"
      >,
    };
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentSession> {
    if (integrationMode() === "fixture") {
      return {
        providerRef: `conti_fx_${input.reference}`,
        status: "awaiting_customer",
        redirectUrl: `${baseUrl()}/pay/fixture/${input.reference}`,
        customerAction: "open_redirect",
      };
    }
    const apiKey = requireSecret("CONTIPAY_API_KEY");
    const merchantId = requireSecret("CONTIPAY_MERCHANT_ID");
    const res = await fetch(`${baseUrl()}/v1/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Merchant-Id": merchantId,
      },
      body: JSON.stringify({
        reference: input.reference,
        amountMinor: input.money.amountMinor.toString(),
        currency: input.money.currency,
        returnUrl: input.returnUrl,
        resultUrl: input.resultUrl,
        customer: input.customer,
        metadata: input.metadata,
      }),
    });
    if (!res.ok) throw new Error(`ContiPay create HTTP ${res.status}`);
    const data = (await res.json()) as {
      id?: string;
      redirectUrl?: string;
      status?: string;
    };
    const session: PaymentSession = {
      providerRef: data.id ?? input.reference,
      status: "redirect_required",
      customerAction: "open_redirect",
    };
    if (data.redirectUrl) session.redirectUrl = data.redirectUrl;
    return session;
  }

  async pollStatus(providerRefOrPollUrl: string): Promise<PaymentSession["status"]> {
    if (integrationMode() === "fixture") {
      return providerRefOrPollUrl.includes("paid") ? "paid" : "pending";
    }
    const apiKey = requireSecret("CONTIPAY_API_KEY");
    const res = await fetch(`${baseUrl()}/v1/payments/${encodeURIComponent(providerRefOrPollUrl)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`ContiPay poll HTTP ${res.status}`);
    const data = (await res.json()) as { status?: string };
    const s = (data.status ?? "").toLowerCase();
    if (s === "paid" || s === "success") return "paid";
    if (s === "failed") return "failed";
    if (s === "cancelled") return "cancelled";
    return "pending";
  }

  async verifyWebhook(
    headers: Record<string, string>,
    rawBody: string,
  ): Promise<WebhookAdmission> {
    const secret =
      process.env.CONTIPAY_API_SECRET?.trim() ||
      (integrationMode() === "fixture" ? "fixture_secret" : "");
    if (!secret) throw new Error("CONTIPAY_API_SECRET unset — fail closed");
    const sig =
      headers["x-contipay-signature"] ??
      headers["X-ContiPay-Signature"] ??
      "";
    const expected = hmacSha256Hex(secret, rawBody);
    if (integrationMode() !== "fixture" && !timingSafeEqualStr(sig, expected)) {
      throw new Error("ContiPay webhook signature invalid");
    }
    const payload = JSON.parse(rawBody || "{}") as Record<string, unknown>;
    if (integrationMode() === "fixture" && !sig) {
      return fixtureWebhook({
        eventId: String(payload.eventId ?? payload.id ?? "conti_fx"),
        type: "contipay.payment",
        providerRef: String(payload.paymentId ?? payload.id ?? "unknown"),
        status: payload.status === "paid" ? "paid" : "pending",
        payload,
      });
    }
    return {
      eventId: String(payload.eventId ?? payload.id ?? ""),
      type: "contipay.payment",
      providerRef: String(payload.paymentId ?? payload.id ?? ""),
      status: payload.status === "paid" ? "paid" : "pending",
      payload,
    };
  }
}
