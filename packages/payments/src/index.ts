/**
 * E2a payments spine (D-43 / D-57 / D-60) — integer money only; AI never writes payables.
 * Phase 0: in-memory SoR + PspAdapter stubs (no live EcoCash/Paynow keys).
 */
import { type Money, money } from "@dial/shared";

export type PaymentMethodCode =
  | "ecocash_direct"
  | "cod_cash"
  | "cod_ecocash"
  | "paynow_hosted";

export type PaymentIntentStatus =
  | "created"
  | "awaiting_customer"
  | "authorized"
  | "captured"
  | "cancelled";

export type FxDailyRate = {
  fxRateId: string;
  /** ZiG minor units per 1 USD (integer; e.g. 250000 = 2500.00 ZiG / USD if scale 100). */
  zigMinorPerUsd: bigint;
  effectiveAt: string;
  setBy: string;
};

export type PaymentIntent = {
  id: string;
  method: PaymentMethodCode;
  /** Ledger / settle currency for the intent. COD settle USD (D-60). */
  amount: Money;
  /** EcoCash display payable in ZiG when method is ecocash_direct. */
  displayPayable?: Money;
  fxRateId?: string;
  status: PaymentIntentStatus;
  orderId: string;
  idempotencyKey: string;
  createdAt: string;
};

export type CodOrder = {
  id: string;
  amountUsd: Money;
  indicativeZig: Money;
  fxRateId: string;
  status: "placed";
  createdAt: string;
};

export interface PspAdapter {
  readonly method: PaymentMethodCode;
  initiate(input: {
    amount: Money;
    orderId: string;
    idempotencyKey: string;
    fxRateId?: string;
    displayPayable?: Money;
  }): Promise<{ externalRef: string; status: PaymentIntentStatus }>;
}

const fxStore: FxDailyRate[] = [];
const intents = new Map<string, PaymentIntent>();
const intentsByIdem = new Map<string, string>();
const codOrders = new Map<string, CodOrder>();

function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Ops Daily ZiG rate — stub store for E2a (admin UI = E1b). */
export function setDailyZigRate(input: {
  zigMinorPerUsd: bigint;
  setBy: string;
  effectiveAt?: string;
}): FxDailyRate {
  if (typeof input.zigMinorPerUsd !== "bigint" || input.zigMinorPerUsd <= 0n) {
    throw new TypeError("zigMinorPerUsd must be positive bigint");
  }
  const row: FxDailyRate = {
    fxRateId: id("fx"),
    zigMinorPerUsd: input.zigMinorPerUsd,
    effectiveAt: input.effectiveAt ?? new Date().toISOString(),
    setBy: input.setBy,
  };
  fxStore.unshift(row);
  return row;
}

export function getActiveFxRate(): FxDailyRate | undefined {
  return fxStore[0];
}

/** Convert USD minor → ZiG minor using active daily rate (integer math only). */
export function usdToZig(usdMinor: bigint, rate: FxDailyRate): Money {
  return money(usdMinor * rate.zigMinorPerUsd / 100n, "ZWG");
}

export class EcoCashPspStub implements PspAdapter {
  readonly method = "ecocash_direct" as const;
  async initiate(input: {
    amount: Money;
    orderId: string;
    idempotencyKey: string;
    fxRateId?: string;
    displayPayable?: Money;
  }) {
    if (input.amount.currency !== "USD") {
      throw new Error("EcoCash intent amount currency-of-record remains USD; displayPayable is ZWG");
    }
    if (!input.displayPayable || input.displayPayable.currency !== "ZWG") {
      throw new Error("EcoCash requires ZWG displayPayable from daily rate");
    }
    if (!input.fxRateId) {
      throw new Error("EcoCash requires fx_rate_id");
    }
    return {
      externalRef: `eco_stub_${input.idempotencyKey}`,
      status: "awaiting_customer" as const,
    };
  }
}

export class CodPspStub implements PspAdapter {
  readonly method = "cod_cash" as const;
  async initiate(input: {
    amount: Money;
    orderId: string;
    idempotencyKey: string;
  }) {
    if (input.amount.currency !== "USD") {
      throw new Error("COD settle USD (D-60)");
    }
    return {
      externalRef: `cod_stub_${input.idempotencyKey}`,
      status: "authorized" as const,
    };
  }
}

export type CheckoutPayChoice = "ecocash" | "cod";

/**
 * FLOW_SPARE_CHECKOUT pay step — required EcoCash | COD buttons only (D-57).
 * Not free-text method selection.
 */
export async function createCheckoutPayment(input: {
  choice: CheckoutPayChoice;
  orderId: string;
  amountUsdMinor: bigint;
  idempotencyKey: string;
}): Promise<{ intent?: PaymentIntent; codOrder?: CodOrder }> {
  const existingId = intentsByIdem.get(input.idempotencyKey);
  if (existingId) {
    const existing = intents.get(existingId);
    if (existing) return { intent: existing };
  }

  const rate = getActiveFxRate();
  if (!rate) {
    throw new Error("No active Daily ZiG rate — set via setDailyZigRate before EcoCash/COD confirm");
  }

  const amountUsd = money(input.amountUsdMinor, "USD");
  const zig = usdToZig(input.amountUsdMinor, rate);

  if (input.choice === "ecocash") {
    const psp = new EcoCashPspStub();
    const initiated = await psp.initiate({
      amount: amountUsd,
      orderId: input.orderId,
      idempotencyKey: input.idempotencyKey,
      fxRateId: rate.fxRateId,
      displayPayable: zig,
    });
    const intent: PaymentIntent = {
      id: id("pi"),
      method: "ecocash_direct",
      amount: amountUsd,
      displayPayable: zig,
      fxRateId: rate.fxRateId,
      status: initiated.status,
      orderId: input.orderId,
      idempotencyKey: input.idempotencyKey,
      createdAt: new Date().toISOString(),
    };
    intents.set(intent.id, intent);
    intentsByIdem.set(input.idempotencyKey, intent.id);
    return { intent };
  }

  const cod: CodOrder = {
    id: id("cod"),
    amountUsd,
    indicativeZig: zig,
    fxRateId: rate.fxRateId,
    status: "placed",
    createdAt: new Date().toISOString(),
  };
  codOrders.set(cod.id, cod);

  const psp = new CodPspStub();
  await psp.initiate({
    amount: amountUsd,
    orderId: input.orderId,
    idempotencyKey: input.idempotencyKey,
  });

  const intent: PaymentIntent = {
    id: id("pi"),
    method: "cod_cash",
    amount: amountUsd,
    displayPayable: zig,
    fxRateId: rate.fxRateId,
    status: "authorized",
    orderId: input.orderId,
    idempotencyKey: input.idempotencyKey,
    createdAt: new Date().toISOString(),
  };
  intents.set(intent.id, intent);
  intentsByIdem.set(input.idempotencyKey, intent.id);
  return { intent, codOrder: cod };
}

export function getPaymentIntent(id: string): PaymentIntent | undefined {
  return intents.get(id);
}

/** Test helper — wipe in-memory stores. */
export function __resetPaymentsForTests(): void {
  fxStore.length = 0;
  intents.clear();
  intentsByIdem.clear();
  codOrders.clear();
}
