/**
 * PD39 — ContiPay + PayPal sandbox deepen (fixture unchanged; sandbox fail-closed).
 */
import { ContiPayAdapter } from "./ContiPayAdapter.js";
import { PayPalAdapter } from "./PayPalAdapter.js";
import type { CreatePaymentInput } from "./types.js";

function baseInput(
  method: "contipay" | "paypal",
): CreatePaymentInput {
  return {
    method,
    money: {
      amountMinor: 25_00n,
      currency: "USD",
    },
    reference: `pd39_${method}`,
    returnUrl: "https://dial.local/return",
    resultUrl: "https://dial.local/result",
    customer: { email: "pd39@dial.local" },
    metadata: { fx_rate_id: "fx_pd39" },
    escrowPreferred: method === "paypal",
  };
}

export async function runPd39ContiPayPaypalSandboxThinVertical(): Promise<{
  sandboxFailClosed: true;
  fixtureOk: true;
  payableFromAi: false;
}> {
  const prev = process.env.DIAL_INTEGRATION_MODE;
  const cleared = [
    "CONTIPAY_API_KEY",
    "CONTIPAY_MERCHANT_ID",
    "CONTIPAY_API_SECRET",
    "PAYPAL_CLIENT_ID",
    "PAYPAL_CLIENT_SECRET",
    "PAYPAL_WEBHOOK_ID",
  ] as const;
  const saved: Record<string, string | undefined> = {};
  for (const k of cleared) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  try {
    process.env.DIAL_INTEGRATION_MODE = "sandbox";
    const contipay = new ContiPayAdapter();
    const paypal = new PayPalAdapter();
    let closed = 0;
    try {
      await contipay.createPayment(baseInput("contipay"));
    } catch {
      closed += 1;
    }
    try {
      await paypal.createPayment(baseInput("paypal"));
    } catch {
      closed += 1;
    }
    try {
      await contipay.verifyWebhook(
        { "x-contipay-signature": "x" },
        JSON.stringify({ eventId: "c1", paymentId: "p1", status: "paid" }),
      );
    } catch {
      closed += 1;
    }
    try {
      await paypal.verifyWebhook(
        { "paypal-transmission-id": "t1" },
        JSON.stringify({
          id: "evt",
          event_type: "PAYMENT.CAPTURE.COMPLETED",
        }),
      );
    } catch {
      closed += 1;
    }
    if (closed !== 4) {
      throw new Error(`PD39 sandbox must fail-closed 4 ways, got ${closed}`);
    }

    process.env.DIAL_INTEGRATION_MODE = "fixture";
    const fxConti = new ContiPayAdapter();
    const fxPaypal = new PayPalAdapter();
    const conti = await fxConti.createPayment(baseInput("contipay"));
    const pp = await fxPaypal.createPayment(baseInput("paypal"));
    if (!conti.providerRef.startsWith("conti_fx_") || !pp.providerRef.startsWith("pp_fx_")) {
      throw new Error("PD39 fixture createPayment must work");
    }
    return {
      sandboxFailClosed: true,
      fixtureOk: true,
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
