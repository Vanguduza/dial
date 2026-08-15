import { CodAdapter } from "./CodAdapter.js";
import { ContiPayAdapter } from "./ContiPayAdapter.js";
import { EcoCashDirectAdapter } from "./EcoCashDirectAdapter.js";
import { EscrowPspAdapter } from "./EscrowPspAdapter.js";
import { PaynowAdapter } from "./PaynowAdapter.js";
import { PayPalAdapter } from "./PayPalAdapter.js";
import {
  integrationMode,
  type IntegrationMode,
  type PaymentMethodCode,
  type PspAdapter,
} from "./types.js";

export * from "./types.js";
export { paynowHash } from "./PaynowAdapter.js";
export { PaynowAdapter } from "./PaynowAdapter.js";
export { ContiPayAdapter } from "./ContiPayAdapter.js";
export { EcoCashDirectAdapter } from "./EcoCashDirectAdapter.js";
export { PayPalAdapter } from "./PayPalAdapter.js";
export { CodAdapter } from "./CodAdapter.js";
export { EscrowPspAdapter } from "./EscrowPspAdapter.js";
export { runPd39ContiPayPaypalSandboxThinVertical } from "./pd39Sandbox.js";

/** Stitch §2 registry — one adapter per PaymentMethodCode. */
export function createPspRegistry(): Record<PaymentMethodCode, PspAdapter> {
  return {
    paynow: new PaynowAdapter(),
    contipay: new ContiPayAdapter(),
    ecocash_direct: new EcoCashDirectAdapter(),
    paypal: new PayPalAdapter(),
    cod_collection: new CodAdapter("cod_collection"),
    cod_delivery: new CodAdapter("cod_delivery"),
    psp_escrow: new EscrowPspAdapter(),
  };
}

export function getCanonicalPspAdapter(code: PaymentMethodCode): PspAdapter {
  return createPspRegistry()[code];
}

export function listCanonicalPspMethods(): PaymentMethodCode[] {
  return Object.keys(createPspRegistry()) as PaymentMethodCode[];
}

function present(env: NodeJS.ProcessEnv, name: string): boolean {
  return Boolean(env[name]?.trim());
}

/**
 * S130 — PSP env readiness aggregate (no secret values). Fixture always ok;
 * sandbox/live ok when ≥1 paid rail is configured (COD always available).
 */
export async function pingPspHealth(
  env: NodeJS.ProcessEnv = process.env,
): Promise<{
  ok: boolean;
  mode: IntegrationMode;
  rails: Record<string, boolean>;
  methods: PaymentMethodCode[];
  error?: string;
}> {
  const mode = integrationMode(env);
  const methods = listCanonicalPspMethods();
  const rails = {
    paynow:
      present(env, "PAYNOW_INTEGRATION_ID") &&
      present(env, "PAYNOW_INTEGRATION_KEY"),
    contipay:
      present(env, "CONTIPAY_API_KEY") &&
      present(env, "CONTIPAY_API_SECRET") &&
      present(env, "CONTIPAY_MERCHANT_ID"),
    ecocash_direct:
      present(env, "ECOCASH_API_KEY") &&
      present(env, "ECOCASH_MERCHANT_CODE") &&
      present(env, "ECOCASH_WEBHOOK_SECRET"),
    paypal:
      present(env, "PAYPAL_CLIENT_ID") &&
      present(env, "PAYPAL_CLIENT_SECRET") &&
      present(env, "PAYPAL_WEBHOOK_ID"),
    cod_collection: true,
    cod_delivery: true,
    psp_escrow:
      present(env, "PSP_ESCROW_BASE_URL") &&
      present(env, "PSP_ESCROW_API_KEY") &&
      present(env, "PSP_WEBHOOK_SECRET"),
  };
  if (mode === "fixture") {
    return {
      ok: true,
      mode,
      methods,
      rails: {
        paynow: true,
        contipay: true,
        ecocash_direct: true,
        paypal: true,
        cod_collection: true,
        cod_delivery: true,
        psp_escrow: true,
      },
    };
  }
  const paidConfigured =
    rails.paynow ||
    rails.contipay ||
    rails.ecocash_direct ||
    rails.paypal ||
    rails.psp_escrow;
  if (!paidConfigured) {
    return {
      ok: false,
      mode,
      methods,
      rails,
      error: "no paid PSP rail configured — fail closed",
    };
  }
  return { ok: true, mode, methods, rails };
}
