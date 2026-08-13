/**
 * PaynowAdapter — Pack §6.6 initiate + SHA512 hash (D-43).
 * Docs: https://developers.paynow.co.zw/
 * POST https://www.paynow.co.zw/interface/initiatetransaction
 */
import {
  fixtureWebhook,
  sha512Upper,
  timingSafeEqualStr,
} from "./crypto.js";
import {
  type CreatePaymentInput,
  type PaymentSession,
  type PspAdapter,
  type WebhookAdmission,
  integrationMode,
  requireSecret,
} from "./types.js";

const INITIATE_URL = "https://www.paynow.co.zw/interface/initiatetransaction";

function amountMajor(minor: bigint): string {
  const neg = minor < 0n;
  const abs = neg ? -minor : minor;
  const whole = abs / 100n;
  const frac = abs % 100n;
  const s = `${whole}.${frac.toString().padStart(2, "0")}`;
  return neg ? `-${s}` : s;
}

/** Build Paynow hash field: concat values + integration key → SHA512 uppercase. */
export function paynowHash(
  fields: string[],
  integrationKey: string,
): string {
  return sha512Upper(fields.join("") + integrationKey);
}

export class PaynowAdapter implements PspAdapter {
  readonly code = "paynow" as const;

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
    const mode = integrationMode();
    if (mode === "fixture") {
      return {
        providerRef: `paynow_fx_${input.reference}`,
        status: "redirect_required",
        redirectUrl: `https://www.paynow.co.zw/Payment/ConfirmPayment?fixture=${encodeURIComponent(input.reference)}`,
        pollUrl: `https://www.paynow.co.zw/interface/pollfixture/${input.reference}`,
        customerAction: "open_redirect",
      };
    }
    const id = requireSecret("PAYNOW_INTEGRATION_ID");
    const key = requireSecret("PAYNOW_INTEGRATION_KEY");
    const amount = amountMajor(input.money.amountMinor);
    const status = "Message";
    const hash = paynowHash(
      [
        id,
        input.reference,
        amount,
        input.returnUrl,
        input.resultUrl,
        status,
      ],
      key,
    );
    const body = new URLSearchParams({
      id,
      reference: input.reference,
      amount,
      returnurl: input.returnUrl,
      resulturl: input.resultUrl,
      status,
      hash,
    });
    const res = await fetch(INITIATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Paynow initiate HTTP ${res.status}`);
    }
    const parsed = Object.fromEntries(new URLSearchParams(text));
    if ((parsed.status ?? "").toLowerCase() === "error") {
      throw new Error(parsed.error ?? "Paynow initiate error");
    }
    const session: PaymentSession = {
      providerRef: parsed.pollurl ?? parsed.browserurl ?? input.reference,
      status: "redirect_required",
      customerAction: "open_redirect",
    };
    if (parsed.browserurl) session.redirectUrl = parsed.browserurl;
    if (parsed.pollurl) session.pollUrl = parsed.pollurl;
    return session;
  }

  async pollStatus(providerRefOrPollUrl: string): Promise<PaymentSession["status"]> {
    if (integrationMode() === "fixture") {
      return providerRefOrPollUrl.includes("paid") ? "paid" : "awaiting_customer";
    }
    const res = await fetch(providerRefOrPollUrl);
    const text = await res.text();
    const parsed = Object.fromEntries(new URLSearchParams(text));
    const s = (parsed.status ?? "").toLowerCase();
    if (s === "paid" || s === "awaiting delivery") return "paid";
    if (s === "cancelled") return "cancelled";
    if (s === "failed") return "failed";
    return "pending";
  }

  async verifyWebhook(
    headers: Record<string, string>,
    rawBody: string,
  ): Promise<WebhookAdmission> {
    const key =
      process.env.PAYNOW_INTEGRATION_KEY?.trim() ||
      (integrationMode() === "fixture" ? "fixture_key" : "");
    if (!key) throw new Error("PAYNOW_INTEGRATION_KEY unset — fail closed");

    const params = Object.fromEntries(new URLSearchParams(rawBody));
    const received = (params.hash ?? headers["x-paynow-hash"] ?? "").toUpperCase();
    const { hash: _h, ...rest } = params;
    const computed = paynowHash(Object.values(rest), key);
    if (!timingSafeEqualStr(computed, received) && integrationMode() !== "fixture") {
      throw new Error("Paynow webhook hash invalid");
    }
    if (integrationMode() === "fixture" && !received) {
      return fixtureWebhook({
        eventId: params.paynowreference ?? `evt_${params.reference ?? "fx"}`,
        type: "paynow.result",
        providerRef: params.pollurl ?? params.reference ?? "unknown",
        status: (params.status ?? "").toLowerCase() === "paid" ? "paid" : "pending",
        payload: params,
      });
    }
    if (!timingSafeEqualStr(computed, received)) {
      throw new Error("Paynow webhook hash invalid");
    }
    const st = (params.status ?? "").toLowerCase();
    return {
      eventId: String(params.paynowreference ?? params.reference ?? "evt"),
      type: "paynow.result",
      providerRef: String(params.pollurl ?? params.reference ?? ""),
      status: st === "paid" ? "paid" : st === "cancelled" ? "cancelled" : "pending",
      payload: params,
    };
  }
}
