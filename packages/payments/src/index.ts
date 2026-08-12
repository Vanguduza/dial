/**
 * E2a payments spine (D-43 / D-57 / D-60) — integer money only; AI never writes payables.
 * Phase 0: in-memory SoR + PspAdapter stubs (no live EcoCash/Paynow keys).
 */
import { type Money, money } from "@dial/shared";

export type PaymentMethodCode =
  | "ecocash_direct"
  | "cod_cash"
  | "cod_ecocash"
  | "paynow_hosted"
  | "contipay"
  | "paypal"
  | "escrow_hold";

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

/**
 * Ops Daily ZiG rate (D-57) — audited store.
 * Admin UI / API call this; EcoCash checkout reads active row via getActiveFxRate.
 */
export function setDailyZigRate(input: {
  zigMinorPerUsd: bigint;
  setBy: string;
  effectiveAt?: string;
}): FxDailyRate {
  if (typeof input.zigMinorPerUsd !== "bigint" || input.zigMinorPerUsd <= 0n) {
    throw new TypeError("zigMinorPerUsd must be positive bigint");
  }
  if (!input.setBy.trim()) {
    throw new Error("setBy required for Daily ZiG audit");
  }
  const row: FxDailyRate = {
    fxRateId: id("fx"),
    zigMinorPerUsd: input.zigMinorPerUsd,
    effectiveAt: input.effectiveAt ?? new Date().toISOString(),
    setBy: input.setBy.trim(),
  };
  fxStore.unshift(row);
  return row;
}

export function getActiveFxRate(): FxDailyRate | undefined {
  return fxStore[0];
}

/** Audit trail (who / when / effective / rate) — newest first. */
export function listFxRateAudit(): readonly FxDailyRate[] {
  return fxStore;
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

export class PaynowPspStub implements PspAdapter {
  readonly method = "paynow_hosted" as const;
  async initiate(input: {
    amount: Money;
    orderId: string;
    idempotencyKey: string;
  }) {
    return {
      externalRef: `paynow_stub_${input.idempotencyKey}`,
      status: "awaiting_customer" as const,
    };
  }
}

export class ContiPayPspStub implements PspAdapter {
  readonly method = "contipay" as const;
  async initiate(input: {
    amount: Money;
    orderId: string;
    idempotencyKey: string;
  }) {
    return {
      externalRef: `conti_stub_${input.idempotencyKey}`,
      status: "awaiting_customer" as const,
    };
  }
}

export class PayPalPspStub implements PspAdapter {
  readonly method = "paypal" as const;
  async initiate(input: {
    amount: Money;
    orderId: string;
    idempotencyKey: string;
  }) {
    return {
      externalRef: `pp_stub_${input.idempotencyKey}`,
      status: "awaiting_customer" as const,
    };
  }
}

/** Job Reserve escrow hold — capture/release only from verified webhook. */
export class EscrowPspStub implements PspAdapter {
  readonly method = "escrow_hold" as const;
  async initiate(input: {
    amount: Money;
    orderId: string;
    idempotencyKey: string;
  }) {
    if (input.amount.currency !== "USD") {
      throw new Error("Job Reserve escrow currency-of-record USD");
    }
    return {
      externalRef: `escrow_stub_${input.idempotencyKey}`,
      status: "authorized" as const,
    };
  }
}

/** D-43 registry — every launch rail must be present. */
export const PSP_ADAPTER_REGISTRY: Readonly<
  Record<PaymentMethodCode, new () => PspAdapter>
> = {
  ecocash_direct: EcoCashPspStub,
  cod_cash: CodPspStub,
  cod_ecocash: CodPspStub,
  paynow_hosted: PaynowPspStub,
  contipay: ContiPayPspStub,
  paypal: PayPalPspStub,
  escrow_hold: EscrowPspStub,
};

export function getPspAdapter(method: PaymentMethodCode): PspAdapter {
  const Ctor = PSP_ADAPTER_REGISTRY[method];
  if (!Ctor) throw new Error(`Unknown PSP method ${method}`);
  return new Ctor();
}

export function listPspMethods(): PaymentMethodCode[] {
  return Object.keys(PSP_ADAPTER_REGISTRY) as PaymentMethodCode[];
}

export type JobReserveStatus =
  | "quoted"
  | "authorized"
  | "captured"
  | "released"
  | "cancelled";

export type JobReserve = {
  id: string;
  jobId: string;
  amount: Money;
  status: JobReserveStatus;
  intentId?: string;
  idempotencyKey: string;
  createdAt: string;
};

const jobReserves = new Map<string, JobReserve>();
const jobReservesByIdem = new Map<string, string>();

/** Job Reserve authorize via escrow adapter — capture only on webhook. */
export async function authorizeJobReserve(input: {
  jobId: string;
  amountUsdMinor: bigint;
  idempotencyKey: string;
}): Promise<JobReserve> {
  const existingId = jobReservesByIdem.get(input.idempotencyKey);
  if (existingId) {
    const existing = jobReserves.get(existingId);
    if (existing) return existing;
  }
  const amount = money(input.amountUsdMinor, "USD");
  const psp = getPspAdapter("escrow_hold");
  const initiated = await psp.initiate({
    amount,
    orderId: input.jobId,
    idempotencyKey: input.idempotencyKey,
  });
  const intent: PaymentIntent = {
    id: id("pi"),
    method: "escrow_hold",
    amount,
    status: initiated.status,
    orderId: input.jobId,
    idempotencyKey: input.idempotencyKey,
    createdAt: new Date().toISOString(),
  };
  intents.set(intent.id, intent);
  intentsByIdem.set(input.idempotencyKey, intent.id);

  const reserve: JobReserve = {
    id: id("jr"),
    jobId: input.jobId,
    amount,
    status: "authorized",
    intentId: intent.id,
    idempotencyKey: input.idempotencyKey,
    createdAt: new Date().toISOString(),
  };
  jobReserves.set(reserve.id, reserve);
  jobReservesByIdem.set(input.idempotencyKey, reserve.id);
  return reserve;
}

export function applyJobReserveWebhook(input: {
  reserveId: string;
  eventId: string;
  action: "capture" | "release";
  signatureValid: boolean;
}): JobReserve {
  if (!input.signatureValid) {
    throw new Error("Job Reserve webhook signature invalid");
  }
  const reserve = jobReserves.get(input.reserveId);
  if (!reserve) throw new Error("Unknown JobReserve");
  if (processedPspEvents.has(input.eventId)) {
    return reserve;
  }
  processedPspEvents.add(input.eventId);
  if (input.action === "capture") {
    reserve.status = "captured";
    if (reserve.intentId) {
      const intent = intents.get(reserve.intentId);
      if (intent) intent.status = "captured";
    }
  } else {
    reserve.status = "released";
    if (reserve.intentId) {
      const intent = intents.get(reserve.intentId);
      if (intent) intent.status = "cancelled";
    }
  }
  return reserve;
}

export function getJobReserve(id: string): JobReserve | undefined {
  return jobReserves.get(id);
}

/** Tech WHT — ITF263 clearance or 30% withhold (D-50). Never assume WHT disappears. */
export type WithholdingBalance = {
  technicianId: string;
  yearOfAssessment: number;
  grossPaidMinor: bigint;
  withheldMinor: bigint;
  hasItf263: boolean;
};

const withholding = new Map<string, WithholdingBalance>();

function whKey(technicianId: string, year: number): string {
  return `${technicianId}:${year}`;
}

export function computeTechPayoutWithholding(input: {
  technicianId: string;
  yearOfAssessment: number;
  payoutUsdMinor: bigint;
  hasItf263: boolean;
}): { netPayoutMinor: bigint; withholdMinor: bigint; rateBps: number } {
  if (typeof input.payoutUsdMinor !== "bigint" || input.payoutUsdMinor < 0n) {
    throw new TypeError("payoutUsdMinor must be non-negative bigint");
  }
  const key = whKey(input.technicianId, input.yearOfAssessment);
  let row = withholding.get(key);
  if (!row) {
    row = {
      technicianId: input.technicianId,
      yearOfAssessment: input.yearOfAssessment,
      grossPaidMinor: 0n,
      withheldMinor: 0n,
      hasItf263: input.hasItf263,
    };
    withholding.set(key, row);
  }
  row.hasItf263 = input.hasItf263;
  row.grossPaidMinor += input.payoutUsdMinor;
  if (input.hasItf263) {
    return { netPayoutMinor: input.payoutUsdMinor, withholdMinor: 0n, rateBps: 0 };
  }
  const withholdMinor = (input.payoutUsdMinor * 30n) / 100n;
  row.withheldMinor += withholdMinor;
  return {
    netPayoutMinor: input.payoutUsdMinor - withholdMinor,
    withholdMinor,
    rateBps: 3000,
  };
}

export function getWithholdingBalance(
  technicianId: string,
  yearOfAssessment: number,
): WithholdingBalance | undefined {
  return withholding.get(whKey(technicianId, yearOfAssessment));
}

/**
 * Verified PSP webhook admission for gateway routes — signature + event idempotency.
 * Capture mutates intent only after both pass (webhook-as-truth).
 */
export function admitPspWebhookEvent(input: {
  eventId: string;
  signatureValid: boolean;
  intentId: string;
  action: "capture" | "ignore";
}): "captured" | "rejected_signature" | "duplicate" | "ignored" {
  if (!input.signatureValid) return "rejected_signature";
  if (processedPspEvents.has(input.eventId)) return "duplicate";
  processedPspEvents.add(input.eventId);
  if (input.action === "ignore") return "ignored";
  const intent = intents.get(input.intentId);
  if (!intent) throw new Error("Unknown intent");
  intent.status = "captured";
  return "captured";
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

/** Frozen offer at checkout — AI cannot set payable (C-1). */
export type OfferSnapshot = {
  offerSnapshotId: string;
  orderId: string;
  supplierDisplayName: string;
  /** Agency disclosure — Sold by {Supplier}. */
  soldBy: string;
  formality: "formal" | "informal";
  amount: Money;
  frozenAt: string;
};

const offerSnapshots = new Map<string, OfferSnapshot>();
const processedPspEvents = new Set<string>();

export function freezeOfferSnapshot(input: {
  orderId: string;
  supplierDisplayName: string;
  formality: "formal" | "informal";
  amountUsdMinor: bigint;
  /** Rejected if provided — AI must not write payable. */
  aiSuggestedPayableMinor?: bigint;
}): OfferSnapshot {
  if (input.aiSuggestedPayableMinor !== undefined) {
    throw new Error("AI cannot set payable amount");
  }
  if (typeof input.amountUsdMinor !== "bigint" || input.amountUsdMinor <= 0n) {
    throw new TypeError("amountUsdMinor must be positive bigint");
  }
  const snap: OfferSnapshot = {
    offerSnapshotId: id("ofs"),
    orderId: input.orderId,
    supplierDisplayName: input.supplierDisplayName,
    soldBy: `Sold by ${input.supplierDisplayName}`,
    formality: input.formality,
    amount: money(input.amountUsdMinor, "USD"),
    frozenAt: new Date().toISOString(),
  };
  offerSnapshots.set(snap.offerSnapshotId, snap);
  return snap;
}

export function assertB2bMayPurchase(input: {
  buyerSegment: "b2c" | "b2b";
  formality: "formal" | "informal";
}): void {
  if (input.buyerSegment === "b2b" && input.formality === "informal") {
    throw new Error("B2B cannot purchase informal stock (D-49)");
  }
}

/**
 * E1a thin path: freeze → authorize stub → verified webhook capture → ledger → FiscalReceiptQueued.
 */
export async function runE1aMoneySpine(input: {
  orderId: string;
  supplierDisplayName: string;
  formality: "formal" | "informal";
  amountUsdMinor: bigint;
  dialFeeUsdMinor: bigint;
  buyerSegment: "b2c" | "b2b";
  channel: "web" | "wa" | "native";
  pspEventId: string;
  signatureValid: boolean;
}): Promise<{
  snapshot: OfferSnapshot;
  intent: PaymentIntent;
  journalId: string;
  fiscalIds: string[];
  webhook: "captured" | "rejected_signature" | "duplicate";
}> {
  const { postPspCaptureSimple } = await import("@dial/ledger");
  const { enqueueFiscalReceipt } = await import("@dial/tax");

  assertB2bMayPurchase({
    buyerSegment: input.buyerSegment,
    formality: input.formality,
  });

  const snapshot = freezeOfferSnapshot({
    orderId: input.orderId,
    supplierDisplayName: input.supplierDisplayName,
    formality: input.formality,
    amountUsdMinor: input.amountUsdMinor,
  });

  const authorizeKey = `auth_${input.orderId}`;
  let intentId = intentsByIdem.get(authorizeKey);
  let intent = intentId ? intents.get(intentId) : undefined;
  if (!intent) {
    intent = {
      id: id("pi"),
      method: "paynow_hosted",
      amount: snapshot.amount,
      status: "authorized",
      orderId: input.orderId,
      idempotencyKey: authorizeKey,
      createdAt: new Date().toISOString(),
    };
    intents.set(intent.id, intent);
    intentsByIdem.set(authorizeKey, intent.id);
  }

  if (!input.signatureValid) {
    return {
      snapshot,
      intent,
      journalId: "",
      fiscalIds: [],
      webhook: "rejected_signature",
    };
  }

  if (processedPspEvents.has(input.pspEventId)) {
    return {
      snapshot,
      intent,
      journalId: "",
      fiscalIds: [],
      webhook: "duplicate",
    };
  }
  processedPspEvents.add(input.pspEventId);

  intent.status = "captured";
  const journal = postPspCaptureSimple({
    orderId: input.orderId,
    amount: snapshot.amount,
    idempotencyKey: `ledger_${input.pspEventId}`,
  });

  const { enqueueMoneyOutbox } = await import("@dial/ledger");
  const goodsClass =
    input.formality === "formal" ? "GOODS_FORMAL" : "GOODS_INFORMAL";
  const goods = enqueueFiscalReceipt({
    orderId: input.orderId,
    receiptClass: goodsClass,
    amount: snapshot.amount,
    channel: input.channel,
  });
  const fee = enqueueFiscalReceipt({
    orderId: input.orderId,
    receiptClass: "DIAL_FEE",
    amount: money(input.dialFeeUsdMinor, "USD"),
    channel: input.channel,
  });
  enqueueMoneyOutbox({ kind: "fiscal_queued", refId: goods.id });
  enqueueMoneyOutbox({ kind: "fiscal_queued", refId: fee.id });

  return {
    snapshot,
    intent,
    journalId: journal.id,
    fiscalIds: [goods.id, fee.id],
    webhook: "captured",
  };
}

/** Test helper — wipe in-memory stores. */
export function __resetPaymentsForTests(): void {
  fxStore.length = 0;
  intents.clear();
  intentsByIdem.clear();
  codOrders.clear();
  offerSnapshots.clear();
  processedPspEvents.clear();
  jobReserves.clear();
  jobReservesByIdem.clear();
  withholding.clear();
}
