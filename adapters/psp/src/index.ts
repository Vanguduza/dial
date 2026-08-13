import { CodAdapter } from "./CodAdapter.js";
import { ContiPayAdapter } from "./ContiPayAdapter.js";
import { EcoCashDirectAdapter } from "./EcoCashDirectAdapter.js";
import { EscrowPspAdapter } from "./EscrowPspAdapter.js";
import { PaynowAdapter } from "./PaynowAdapter.js";
import { PayPalAdapter } from "./PayPalAdapter.js";
import type { PaymentMethodCode, PspAdapter } from "./types.js";

export * from "./types.js";
export { paynowHash } from "./PaynowAdapter.js";
export { PaynowAdapter } from "./PaynowAdapter.js";
export { ContiPayAdapter } from "./ContiPayAdapter.js";
export { EcoCashDirectAdapter } from "./EcoCashDirectAdapter.js";
export { PayPalAdapter } from "./PayPalAdapter.js";
export { CodAdapter } from "./CodAdapter.js";
export { EscrowPspAdapter } from "./EscrowPspAdapter.js";

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
