/**
 * Canonical PspAdapter types — Stitch §2 / Pack §11 (D-43).
 * Domain SoR stays in @dial/payments; HTTP rails live here.
 */
export type PaymentMethodCode =
  | "paynow"
  | "contipay"
  | "ecocash_direct"
  | "paypal"
  | "cod_collection"
  | "cod_delivery"
  | "psp_escrow";

export type AdapterMoney = { amountMinor: bigint; currency: "USD" | "ZWG" };

export type CreatePaymentInput = {
  reference: string;
  money: AdapterMoney;
  method: PaymentMethodCode;
  customer: { msisdnE164?: string; email?: string; name?: string };
  returnUrl: string;
  resultUrl: string;
  metadata: Record<string, string>;
  escrowPreferred: boolean;
};

export type PaymentSession = {
  providerRef: string;
  status:
    | "created"
    | "redirect_required"
    | "awaiting_customer"
    | "pending"
    | "paid"
    | "failed"
    | "cancelled";
  redirectUrl?: string;
  pollUrl?: string;
  customerAction?:
    | "approve_on_handset"
    | "open_redirect"
    | "pay_courier"
    | "pay_at_supplier"
    | "wait_for_hold";
  /** Opaque adapter hints (never payable amounts). */
  metadata?: Record<string, string>;
};

export type WebhookAdmission = {
  eventId: string;
  type: string;
  providerRef: string;
  status: PaymentSession["status"];
  payload: unknown;
};

export interface PspAdapter {
  readonly code: PaymentMethodCode;
  capabilities(): {
    supportsHold: boolean;
    supportsSplitPayout: boolean;
    supportsRefund: boolean;
    currencies: Array<"USD" | "ZWG">;
    channels: Array<"web" | "android" | "ios" | "whatsapp">;
  };
  createPayment(input: CreatePaymentInput): Promise<PaymentSession>;
  pollStatus(providerRefOrPollUrl: string): Promise<PaymentSession["status"]>;
  capture?(input: {
    providerRef: string;
    money?: AdapterMoney;
  }): Promise<{ captureRef: string }>;
  refund?(input: {
    providerRef: string;
    money: AdapterMoney;
    reason: string;
  }): Promise<{ refundRef: string }>;
  instructRelease?(input: {
    holdRef: string;
    allocations: Array<{ partyId: string; amountMinor: bigint }>;
  }): Promise<{ instructionId: string }>;
  verifyWebhook(
    headers: Record<string, string>,
    rawBody: string,
  ): Promise<WebhookAdmission>;
}

export type IntegrationMode = "fixture" | "sandbox" | "live";

export function integrationMode(
  env: NodeJS.ProcessEnv = process.env,
): IntegrationMode {
  const m = (env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (m === "sandbox" || m === "live") return m;
  return "fixture";
}

export function requireSecret(
  name: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const v = env[name]?.trim();
  if (!v) throw new Error(`${name} unset — fail closed`);
  return v;
}
