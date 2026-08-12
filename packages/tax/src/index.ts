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
  status: "queued";
  gateway: "zimra_virtual_in_house";
  createdAt: string;
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
  return outbox;
}

export function __resetTaxForTests(): void {
  outbox.length = 0;
}
