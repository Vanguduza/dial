/**
 * Agency FDMS outbox (D-40a / D-59) — virtual fiscalisation; in-house Gateway default.
 * AI never writes fiscal amounts.
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

const outbox: FiscalReceiptQueued[] = [];

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

/**
 * Drain FDMS outbox through ZIMRA Virtual Gateway adapter (D-40a / D-59).
 * Enqueues side-effect jobs on @dial/queues when requested.
 */
export async function drainFdmsOutbox(input?: {
  enqueueSideEffects?: boolean;
}): Promise<
  Array<{ id: string; status: "submitted" | "failed"; fiscalCode?: string }>
> {
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

export function __resetTaxForTests(): void {
  outbox.length = 0;
}
