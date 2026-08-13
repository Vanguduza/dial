/**
 * Bridge @dial/payments domain methods → canonical @dial/adapter-psp (Stitch §2).
 * Domain SoR stays in payments; HTTP rails live in adapters.
 */
import {
  createPspRegistry,
  type PaymentMethodCode as CanonicalCode,
  type PaymentSession,
} from "@dial/adapter-psp";
import type { Money } from "@dial/shared";

/** Domain method codes used by @dial/payments registry (Pack T5). */
export type DomainPaymentMethodCode =
  | "ecocash_direct"
  | "cod_cash"
  | "cod_ecocash"
  | "paynow_hosted"
  | "contipay"
  | "paypal"
  | "escrow_hold";

const DOMAIN_TO_CANONICAL: Record<DomainPaymentMethodCode, CanonicalCode> = {
  paynow_hosted: "paynow",
  contipay: "contipay",
  ecocash_direct: "ecocash_direct",
  paypal: "paypal",
  cod_cash: "cod_delivery",
  cod_ecocash: "cod_delivery",
  escrow_hold: "psp_escrow",
};

export function toCanonicalPspCode(
  method: DomainPaymentMethodCode,
): CanonicalCode {
  return DOMAIN_TO_CANONICAL[method];
}

/**
 * Create a vendor payment session via canonical adapters.
 * Fixture mode never requires secrets; sandbox/live fail closed inside adapters.
 */
export async function createVendorPaymentSession(input: {
  method: DomainPaymentMethodCode;
  reference: string;
  amount: Money;
  returnUrl?: string;
  resultUrl?: string;
  customer?: { msisdnE164?: string; email?: string; name?: string };
  escrowPreferred?: boolean;
  metadata?: Record<string, string>;
}): Promise<PaymentSession> {
  const code = toCanonicalPspCode(input.method);
  const adapter = createPspRegistry()[code];
  const currency = input.amount.currency as "USD" | "ZWG";
  if (currency !== "USD" && currency !== "ZWG") {
    throw new Error(`Unsupported currency ${input.amount.currency}`);
  }
  return adapter.createPayment({
    reference: input.reference,
    money: { amountMinor: input.amount.amountMinor, currency },
    method: code,
    customer: input.customer ?? {},
    returnUrl:
      input.returnUrl ??
      process.env.PAYNOW_RETURN_URL ??
      "https://dialaspare.co.zw/checkout/return",
    resultUrl:
      input.resultUrl ??
      process.env.PAYNOW_RESULT_URL ??
      "https://api.example/webhooks/paynow",
    metadata: input.metadata ?? {},
    escrowPreferred: input.escrowPreferred ?? code === "psp_escrow",
  });
}
