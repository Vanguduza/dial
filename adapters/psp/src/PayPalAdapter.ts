/**
 * PayPalAdapter — Orders v2 AUTHORIZE preferred when escrowPreferred (D-43).
 */
import { fixtureWebhook, timingSafeEqualStr } from "./crypto.js";
import {
  type CreatePaymentInput,
  type PaymentSession,
  type PspAdapter,
  type WebhookAdmission,
  integrationMode,
  requireSecret,
} from "./types.js";

function apiBase(): string {
  const mode = (process.env.PAYPAL_MODE ?? "sandbox").toLowerCase();
  return mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function accessToken(): Promise<string> {
  const id = requireSecret("PAYPAL_CLIENT_ID");
  const secret = requireSecret("PAYPAL_CLIENT_SECRET");
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal OAuth HTTP ${res.status}`);
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("PayPal OAuth missing token");
  return data.access_token;
}

export class PayPalAdapter implements PspAdapter {
  readonly code = "paypal" as const;

  capabilities() {
    return {
      supportsHold: true,
      supportsSplitPayout: false,
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
        providerRef: `pp_fx_${input.reference}`,
        status: "redirect_required",
        redirectUrl: `https://www.sandbox.paypal.com/checkoutnow?token=fixture_${input.reference}`,
        customerAction: "open_redirect",
      };
    }
    const token = await accessToken();
    const intent = input.escrowPreferred ? "AUTHORIZE" : "CAPTURE";
    const value = (Number(input.money.amountMinor) / 100).toFixed(2);
    const res = await fetch(`${apiBase()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent,
        purchase_units: [
          {
            reference_id: input.reference,
            amount: { currency_code: input.money.currency, value },
          },
        ],
        application_context: {
          return_url: input.returnUrl,
          cancel_url: input.returnUrl,
        },
      }),
    });
    if (!res.ok) throw new Error(`PayPal create order HTTP ${res.status}`);
    const data = (await res.json()) as {
      id?: string;
      links?: Array<{ rel?: string; href?: string }>;
    };
    const approve = data.links?.find((l) => l.rel === "approve")?.href;
    const session: PaymentSession = {
      providerRef: data.id ?? input.reference,
      status: "redirect_required",
      customerAction: "open_redirect",
    };
    if (approve) session.redirectUrl = approve;
    return session;
  }

  async pollStatus(providerRefOrPollUrl: string): Promise<PaymentSession["status"]> {
    if (integrationMode() === "fixture") {
      return providerRefOrPollUrl.includes("paid") ? "paid" : "pending";
    }
    const token = await accessToken();
    const res = await fetch(
      `${apiBase()}/v2/checkout/orders/${encodeURIComponent(providerRefOrPollUrl)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) throw new Error(`PayPal get order HTTP ${res.status}`);
    const data = (await res.json()) as { status?: string };
    const s = (data.status ?? "").toUpperCase();
    if (s === "COMPLETED" || s === "APPROVED") return "paid";
    if (s === "VOIDED") return "cancelled";
    return "pending";
  }

  async capture(input: {
    providerRef: string;
  }): Promise<{ captureRef: string }> {
    if (integrationMode() === "fixture") {
      return { captureRef: `pp_cap_${input.providerRef}` };
    }
    const token = await accessToken();
    const res = await fetch(
      `${apiBase()}/v2/checkout/orders/${encodeURIComponent(input.providerRef)}/capture`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      },
    );
    if (!res.ok) throw new Error(`PayPal capture HTTP ${res.status}`);
    const data = (await res.json()) as { id?: string };
    return { captureRef: data.id ?? input.providerRef };
  }

  async verifyWebhook(
    headers: Record<string, string>,
    rawBody: string,
  ): Promise<WebhookAdmission> {
    const webhookId =
      process.env.PAYPAL_WEBHOOK_ID?.trim() ||
      (integrationMode() === "fixture" ? "WH_FIXTURE" : "");
    if (!webhookId) throw new Error("PAYPAL_WEBHOOK_ID unset — fail closed");
    const transmissionId = headers["paypal-transmission-id"] ?? "";
    if (integrationMode() === "fixture") {
      const payload = JSON.parse(rawBody || "{}") as Record<string, unknown>;
      return fixtureWebhook({
        eventId: transmissionId || String(payload.id ?? "pp_fx"),
        type: String(payload.event_type ?? "PAYMENT.CAPTURE.COMPLETED"),
        providerRef: String(
          (payload.resource as { id?: string } | undefined)?.id ?? "unknown",
        ),
        status: "paid",
        payload,
      });
    }
    // Live: call PayPal verify-webhook-signature (requires OAuth).
    const token = await accessToken();
    const res = await fetch(`${apiBase()}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: headers["paypal-auth-algo"],
        cert_url: headers["paypal-cert-url"],
        transmission_id: transmissionId,
        transmission_sig: headers["paypal-transmission-sig"],
        transmission_time: headers["paypal-transmission-time"],
        webhook_id: webhookId,
        webhook_event: JSON.parse(rawBody),
      }),
    });
    if (!res.ok) throw new Error(`PayPal verify webhook HTTP ${res.status}`);
    const data = (await res.json()) as { verification_status?: string };
    if (!timingSafeEqualStr(data.verification_status ?? "", "SUCCESS")) {
      throw new Error("PayPal webhook verification failed");
    }
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    return {
      eventId: transmissionId || String(payload.id ?? ""),
      type: String(payload.event_type ?? "paypal.event"),
      providerRef: String(
        (payload.resource as { id?: string } | undefined)?.id ?? "",
      ),
      status: "paid",
      payload,
    };
  }
}
