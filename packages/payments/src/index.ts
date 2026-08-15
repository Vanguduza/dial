/**
 * E2a payments spine (D-43 / D-57 / D-60) — integer money only; AI never writes payables.
 * Phase 0: in-memory SoR + PspAdapter stubs (no live EcoCash/Paynow keys).
 */
import {
  type Money,
  money,
  claimProcessedEvent,
  __resetIdempotencyForTests,
} from "@dial/shared";
import { createVendorPaymentSession } from "./adapterBridge.js";

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
  /** Vendor session ref from @dial/adapter-psp (PD4). */
  providerRef?: string;
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

function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Cross-module store (gateway + adapter copies share one SoR in sandbox tests). */
function fxStore(): FxDailyRate[] {
  const g = globalThis as { __dialFxStore?: FxDailyRate[] };
  if (!g.__dialFxStore) g.__dialFxStore = [];
  return g.__dialFxStore;
}

function intentStore(): Map<string, PaymentIntent> {
  const g = globalThis as { __dialPaymentIntents?: Map<string, PaymentIntent> };
  if (!g.__dialPaymentIntents) g.__dialPaymentIntents = new Map();
  return g.__dialPaymentIntents;
}

function intentIdemStore(): Map<string, string> {
  const g = globalThis as { __dialPaymentIntentIdem?: Map<string, string> };
  if (!g.__dialPaymentIntentIdem) g.__dialPaymentIntentIdem = new Map();
  return g.__dialPaymentIntentIdem;
}

function codOrderStore(): Map<string, CodOrder> {
  const g = globalThis as { __dialCodOrders?: Map<string, CodOrder> };
  if (!g.__dialCodOrders) g.__dialCodOrders = new Map();
  return g.__dialCodOrders;
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
  fxStore().unshift(row);
  return row;
}

export function getActiveFxRate(): FxDailyRate | undefined {
  return fxStore()[0];
}

/** Audit trail (who / when / effective / rate) — newest first. */
export function listFxRateAudit(): readonly FxDailyRate[] {
  return fxStore();
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
  intentStore().set(intent.id, intent);
  intentIdemStore().set(input.idempotencyKey, intent.id);

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
      const intent = intentStore().get(reserve.intentId);
      if (intent) intent.status = "captured";
    }
  } else {
    reserve.status = "released";
    if (reserve.intentId) {
      const intent = intentStore().get(reserve.intentId);
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

/** PD10 — durable withholding_balances listing for admin Take-Home. */
export function listWithholdingBalances(): WithholdingBalance[] {
  return [...withholding.values()].map((b) => ({ ...b }));
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
  if (
    claimProcessedEvent({ eventId: input.eventId, source: "psp" }) ===
    "duplicate"
  ) {
    return "duplicate";
  }
  processedPspEvents.add(input.eventId);
  if (input.action === "ignore") return "ignored";
  const intent = intentStore().get(input.intentId);
  if (!intent) throw new Error("Unknown intent");
  intent.status = "captured";
  return "captured";
}

function formalityForOrder(orderId: string): "formal" | "informal" {
  for (const snap of offerSnapshots.values()) {
    if (snap.orderId === orderId) return snap.formality;
  }
  return "formal";
}

/**
 * After verified capture — post DIAL ledger + enqueue FiscalReceiptQueued (agency D-59).
 * Idempotent on pspEventId. Amounts remain integer minor units (no float / no AI).
 */
export async function completePspCaptureSettlement(input: {
  intentId: string;
  pspEventId: string;
  dialFeeUsdMinor?: bigint;
  channel?: "web" | "wa" | "native";
}): Promise<{
  journalId: string;
  fiscalIds: string[];
  duplicate: boolean;
}> {
  if (settledPspCaptures.has(input.pspEventId)) {
    return { journalId: "", fiscalIds: [], duplicate: true };
  }
  const intent = intentStore().get(input.intentId);
  if (!intent) throw new Error("Unknown intent");
  if (intent.status !== "captured") {
    throw new Error("Intent must be captured before settlement");
  }

  const { postPspCaptureSimple, enqueueMoneyOutbox } = await import(
    "@dial/ledger"
  );
  const { enqueueFiscalReceipt } = await import("@dial/tax");

  const journal = postPspCaptureSimple({
    orderId: intent.orderId,
    amount: intent.amount,
    idempotencyKey: `ledger_${input.pspEventId}`,
  });

  const formality = formalityForOrder(intent.orderId);
  const channel = input.channel ?? "web";
  const goodsClass =
    formality === "formal" ? "GOODS_FORMAL" : "GOODS_INFORMAL";
  const goods = enqueueFiscalReceipt({
    orderId: intent.orderId,
    receiptClass: goodsClass,
    amount: intent.amount,
    channel,
  });
  const feeMinor = input.dialFeeUsdMinor ?? 100n;
  const fee = enqueueFiscalReceipt({
    orderId: intent.orderId,
    receiptClass: "DIAL_FEE",
    amount: money(feeMinor, "USD"),
    channel,
  });
  enqueueMoneyOutbox({ kind: "fiscal_queued", refId: goods.id });
  enqueueMoneyOutbox({ kind: "fiscal_queued", refId: fee.id });
  settledPspCaptures.add(input.pspEventId);

  return {
    journalId: journal.id,
    fiscalIds: [goods.id, fee.id],
    duplicate: false,
  };
}

/**
 * PD4 thin path: OfferSnapshot → adapter createPayment (Paynow|EcoCash) →
 * signed webhook verify → admit capture → ledger → FiscalReceiptQueued.
 * Fixture: no outbound HTTP. Sandbox/live: adapters fail closed without keys.
 */
export async function runPd4MoneySpine(input: {
  rail: "paynow_hosted" | "ecocash_direct";
  orderId: string;
  supplierDisplayName: string;
  formality: "formal" | "informal";
  amountUsdMinor: bigint;
  dialFeeUsdMinor: bigint;
  buyerSegment: "b2c" | "b2b";
  channel: "web" | "wa" | "native";
  pspEventId: string;
  /** When false, stop after authorize (signature rejected). */
  signatureValid?: boolean;
  msisdnE164?: string;
}): Promise<{
  snapshot: OfferSnapshot;
  intent: PaymentIntent;
  vendorSession: { providerRef: string; status: string };
  journalId: string;
  fiscalIds: string[];
  webhook: "captured" | "rejected_signature" | "duplicate";
}> {
  const { createPspRegistry } = await import("@dial/adapter-psp");

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

  let displayPayable: Money | undefined;
  let chargeAmount = snapshot.amount;
  if (input.rail === "ecocash_direct") {
    const rate = getActiveFxRate();
    if (!rate) {
      throw new Error("No active Daily ZiG rate — set via setDailyZigRate before EcoCash");
    }
    displayPayable = usdToZig(input.amountUsdMinor, rate);
    chargeAmount = displayPayable;
  }

  const vendorSession = await createVendorPaymentSession({
    method: input.rail,
    reference: input.orderId,
    amount: chargeAmount,
    customer: { msisdnE164: input.msisdnE164 ?? "+263771234567" },
    metadata: { orderId: input.orderId },
  });

  const authorizeKey = `pd4_auth_${input.rail}_${input.orderId}`;
  let intentId = intentIdemStore().get(authorizeKey);
  let intent = intentId ? intentStore().get(intentId) : undefined;
  if (!intent) {
    intent = {
      id: id("pi"),
      method: input.rail,
      amount: snapshot.amount,
      ...(displayPayable !== undefined ? { displayPayable } : {}),
      status: "authorized",
      orderId: input.orderId,
      idempotencyKey: authorizeKey,
      createdAt: new Date().toISOString(),
      providerRef: vendorSession.providerRef,
    };
    intentStore().set(intent.id, intent);
    intentIdemStore().set(authorizeKey, intent.id);
  }

  if (input.signatureValid === false) {
    return {
      snapshot,
      intent,
      vendorSession: {
        providerRef: vendorSession.providerRef,
        status: vendorSession.status,
      },
      journalId: "",
      fiscalIds: [],
      webhook: "rejected_signature",
    };
  }

  const registry = createPspRegistry();
  const adapter =
    input.rail === "paynow_hosted"
      ? registry.paynow
      : registry.ecocash_direct;
  const rawBody =
    input.rail === "paynow_hosted"
      ? new URLSearchParams({
          reference: intent.id,
          paynowreference: vendorSession.providerRef,
          amount: "10.00",
          status: "Paid",
          pollurl: vendorSession.pollUrl ?? "",
          hash: "",
        }).toString()
      : JSON.stringify({
          eventId: input.pspEventId,
          transactionId: vendorSession.providerRef,
          status: "SUCCESS",
          reference: intent.id,
        });
  const admission = await adapter.verifyWebhook({}, rawBody);
  if (
    processedPspEvents.has(admission.eventId) ||
    processedPspEvents.has(input.pspEventId)
  ) {
    return {
      snapshot,
      intent,
      vendorSession: {
        providerRef: vendorSession.providerRef,
        status: vendorSession.status,
      },
      journalId: "",
      fiscalIds: [],
      webhook: "duplicate",
    };
  }

  const admitted = admitPspWebhookEvent({
    eventId: input.pspEventId || admission.eventId,
    intentId: intent.id,
    signatureValid: true,
    action: admission.status === "cancelled" ? "ignore" : "capture",
  });
  if (admitted === "ignored") {
    return {
      snapshot,
      intent,
      vendorSession: {
        providerRef: vendorSession.providerRef,
        status: vendorSession.status,
      },
      journalId: "",
      fiscalIds: [],
      webhook: "rejected_signature",
    };
  }
  if (admitted !== "captured") {
    return {
      snapshot,
      intent,
      vendorSession: {
        providerRef: vendorSession.providerRef,
        status: vendorSession.status,
      },
      journalId: "",
      fiscalIds: [],
      webhook: admitted === "duplicate" ? "duplicate" : "rejected_signature",
    };
  }

  const settled = await completePspCaptureSettlement({
    intentId: intent.id,
    pspEventId: input.pspEventId,
    dialFeeUsdMinor: input.dialFeeUsdMinor,
    channel: input.channel,
  });

  return {
    snapshot,
    intent,
    vendorSession: {
      providerRef: vendorSession.providerRef,
      status: vendorSession.status,
    },
    journalId: settled.journalId,
    fiscalIds: settled.fiscalIds,
    webhook: settled.duplicate ? "duplicate" : "captured",
  };
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
  const existingId = intentIdemStore().get(input.idempotencyKey);
  if (existingId) {
    const existing = intentStore().get(existingId);
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
    const vendor = await createVendorPaymentSession({
      method: "ecocash_direct",
      reference: input.orderId,
      amount: zig,
      customer: { msisdnE164: "+263771234567" },
      metadata: { fx_rate_id: rate.fxRateId },
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
      providerRef: vendor.providerRef,
    };
    intentStore().set(intent.id, intent);
    intentIdemStore().set(input.idempotencyKey, intent.id);
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
  codOrderStore().set(cod.id, cod);

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
  intentStore().set(intent.id, intent);
  intentIdemStore().set(input.idempotencyKey, intent.id);
  return { intent, codOrder: cod };
}

export function getPaymentIntent(id: string): PaymentIntent | undefined {
  return intentStore().get(id);
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
/** Ledger/fiscal settlement idempotency (PD4) — keyed by psp event id. */
const settledPspCaptures = new Set<string>();

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
  let intentId = intentIdemStore().get(authorizeKey);
  let intent = intentId ? intentStore().get(intentId) : undefined;
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
    intentStore().set(intent.id, intent);
    intentIdemStore().set(authorizeKey, intent.id);
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
  fxStore().length = 0;
  intentStore().clear();
  intentIdemStore().clear();
  codOrderStore().clear();
  offerSnapshots.clear();
  processedPspEvents.clear();
  settledPspCaptures.clear();
  __resetIdempotencyForTests();
  jobReserves.clear();
  jobReservesByIdem.clear();
  withholding.clear();
}

export {
  createVendorPaymentSession,
  toCanonicalPspCode,
  type DomainPaymentMethodCode,
} from "./adapterBridge.js";
