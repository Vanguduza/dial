/**
 * Agency FDMS outbox (D-40a / D-59 / PD11) — virtual fiscalisation; in-house Gateway default.
 * AI never writes fiscal amounts. No physical printer required.
 */
import { type Money } from "@dial/shared";

export type AgencyReceiptClass =
  | "DIAL_FEE"
  | "GOODS_FORMAL"
  | "GOODS_INFORMAL";

export type FiscalReceiptQueued = {
  id: string;
  orderId: string;
  receiptClass: AgencyReceiptClass;
  amount: Money;
  channel: "web" | "wa" | "native";
  status: "queued" | "submitted" | "failed";
  gateway: "zimra_virtual_in_house";
  fiscalCode?: string;
  createdAt: string;
  submittedAt?: string;
};

const outbox: FiscalReceiptQueued[] = (() => {
  const g = globalThis as { __dialFdmsOutbox?: FiscalReceiptQueued[] };
  if (!g.__dialFdmsOutbox) g.__dialFdmsOutbox = [];
  return g.__dialFdmsOutbox;
})();

function id(): string {
  return `fdms_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function enqueueFiscalReceipt(input: {
  orderId: string;
  receiptClass: AgencyReceiptClass;
  amount: Money;
  channel: FiscalReceiptQueued["channel"];
}): FiscalReceiptQueued {
  if (typeof input.amount.amountMinor !== "bigint") {
    throw new TypeError("fiscal amountMinor must be bigint");
  }
  const row: FiscalReceiptQueued = {
    id: id(),
    orderId: input.orderId,
    receiptClass: input.receiptClass,
    amount: input.amount,
    channel: input.channel,
    status: "queued",
    gateway: "zimra_virtual_in_house",
    createdAt: new Date().toISOString(),
  };
  outbox.push(row);
  return row;
}

export function listFdmsOutbox(): readonly FiscalReceiptQueued[] {
  return outbox.map((r) => ({ ...r }));
}

export function listQueuedFdmsReceipts(): FiscalReceiptQueued[] {
  return outbox.filter((r) => r.status === "queued").map((r) => ({ ...r }));
}

function integrationMode(): "fixture" | "sandbox" | "live" {
  const m = (process.env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (m === "sandbox" || m === "live") return m;
  return "fixture";
}

/**
 * Drain FDMS outbox through ZIMRA Virtual Gateway adapter (D-40a / D-59).
 * Sandbox/live require an open fiscal day before submit.
 */
export async function drainFdmsOutbox(input?: {
  enqueueSideEffects?: boolean;
}): Promise<
  Array<{ id: string; status: "submitted" | "failed"; fiscalCode?: string }>
> {
  const mode = integrationMode();
  if (mode !== "fixture" && !fiscalDay.fiscalDayId) {
    throw new Error("FDMS fiscal day not open — openDay before draining receipts");
  }
  if (mode !== "fixture" && fiscalDay.closedAt) {
    throw new Error("FDMS fiscal day already closed — open a new day before drain");
  }

  const { ZimraVirtualGatewayAdapter } = await import("@dial/adapter-fdms");
  const gw = new ZimraVirtualGatewayAdapter();
  const results: Array<{
    id: string;
    status: "submitted" | "failed";
    fiscalCode?: string;
  }> = [];

  for (const row of outbox) {
    if (row.status !== "queued") continue;
    try {
      const submitted = await gw.submitReceipt({
        outboxId: row.id,
        orderId: row.orderId,
        receiptClass: row.receiptClass,
        amountMinor: row.amount.amountMinor.toString(),
        currency: row.amount.currency,
        channel: row.channel,
        gateway: row.gateway,
      });
      row.status = "submitted";
      row.fiscalCode = submitted.fiscalCode;
      row.submittedAt = new Date().toISOString();
      const result: {
        id: string;
        status: "submitted" | "failed";
        fiscalCode?: string;
      } = { id: row.id, status: "submitted", fiscalCode: submitted.fiscalCode };
      results.push(result);
      if (input?.enqueueSideEffects) {
        const { enqueueOutboxSideEffect } = await import("@dial/queues");
        await enqueueOutboxSideEffect({
          topic: "fdms.submitted",
          payload: {
            outboxId: row.id,
            fiscalCode: submitted.fiscalCode,
            orderId: row.orderId,
            receiptClass: row.receiptClass,
          },
        });
      }
    } catch (e) {
      row.status = "failed";
      results.push({ id: row.id, status: "failed" });
      void e;
    }
  }
  return results;
}

export type FiscalDayState = {
  fiscalDayId: string | null;
  openedAt: string | null;
  closedAt: string | null;
};

let fiscalDay: FiscalDayState = (() => {
  const g = globalThis as { __dialFiscalDay?: FiscalDayState };
  if (!g.__dialFiscalDay) {
    g.__dialFiscalDay = {
      fiscalDayId: null,
      openedAt: null,
      closedAt: null,
    };
  }
  return g.__dialFiscalDay;
})();

export function getFiscalDayState(): FiscalDayState {
  return { ...fiscalDay };
}

/**
 * FDMS fiscal-day open worker (D-40a / D-59) — Virtual Gateway openDay.
 */
export async function runFdmsOpenDay(input?: {
  enqueueSideEffects?: boolean;
}): Promise<FiscalDayState> {
  const { ZimraVirtualGatewayAdapter } = await import("@dial/adapter-fdms");
  const gw = new ZimraVirtualGatewayAdapter();
  const { fiscalDayId } = await gw.openFiscalDay();
  fiscalDay.fiscalDayId = fiscalDayId;
  fiscalDay.openedAt = new Date().toISOString();
  fiscalDay.closedAt = null;
  if (input?.enqueueSideEffects) {
    const { enqueueOutboxSideEffect } = await import("@dial/queues");
    await enqueueOutboxSideEffect({
      topic: "fdms.day.opened",
      payload: { fiscalDayId },
    });
  }
  return getFiscalDayState();
}

/**
 * FDMS fiscal-day close worker — Virtual Gateway closeDay.
 */
export async function runFdmsCloseDay(input?: {
  enqueueSideEffects?: boolean;
}): Promise<FiscalDayState> {
  if (!fiscalDay.fiscalDayId) {
    throw new Error("FDMS fiscal day not open — open before close");
  }
  const { ZimraVirtualGatewayAdapter } = await import("@dial/adapter-fdms");
  const gw = new ZimraVirtualGatewayAdapter();
  const { closedAt } = await gw.closeFiscalDay();
  fiscalDay.closedAt = closedAt;
  if (input?.enqueueSideEffects) {
    const { enqueueOutboxSideEffect } = await import("@dial/queues");
    await enqueueOutboxSideEffect({
      topic: "fdms.day.closed",
      payload: { fiscalDayId: fiscalDay.fiscalDayId, closedAt },
    });
  }
  return getFiscalDayState();
}

/**
 * Process one FDMS day queue job (open|close) via Virtual Gateway.
 */
export async function processFdmsDayJob(job: {
  action: "open" | "close";
}): Promise<FiscalDayState> {
  // Fixture always records side-effects in-memory; sandbox/live only when Redis present.
  const sideEffects =
    integrationMode() === "fixture" || Boolean(process.env.REDIS_URL?.trim());
  if (job.action === "open") {
    return runFdmsOpenDay({ enqueueSideEffects: sideEffects });
  }
  return runFdmsCloseDay({ enqueueSideEffects: sideEffects });
}

export function __resetTaxForTests(): void {
  outbox.length = 0;
  fiscalDay.fiscalDayId = null;
  fiscalDay.openedAt = null;
  fiscalDay.closedAt = null;
}
