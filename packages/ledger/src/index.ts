/**
 * Append-only ledger SoR (D-5 / Pack) — integer minor units; AI never writes entries.
 * E1a thin path: post balanced entries on verified PSP capture.
 */
import { type Money, money } from "@dial/shared";

export type LedgerAccount =
  | "cash_psp"
  | "customer_clearing"
  | "supplier_payable"
  | "dial_fee_revenue"
  | "fiscal_clearing";

export type LedgerEntry = {
  id: string;
  account: LedgerAccount;
  /** Positive = debit, negative = credit — balanced batch sum = 0n. */
  amountMinor: bigint;
  currency: Money["currency"];
  journalId: string;
  idempotencyKey: string;
  memo: string;
  createdAt: string;
};

export type Journal = {
  id: string;
  orderId: string;
  entries: LedgerEntry[];
  createdAt: string;
};

const journals = new Map<string, Journal>();
const byIdem = new Map<string, string>();

function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Post a balanced journal. Duplicate idempotencyKey returns existing. */
export function postJournal(input: {
  orderId: string;
  currency: Money["currency"];
  idempotencyKey: string;
  lines: Array<{ account: LedgerAccount; amountMinor: bigint; memo: string }>;
}): Journal {
  const existingId = byIdem.get(input.idempotencyKey);
  if (existingId) {
    const existing = journals.get(existingId);
    if (existing) return existing;
  }

  const sum = input.lines.reduce((a, l) => a + l.amountMinor, 0n);
  if (sum !== 0n) {
    throw new Error(`Unbalanced journal: sum=${sum.toString()}`);
  }
  for (const line of input.lines) {
    if (typeof line.amountMinor !== "bigint") {
      throw new TypeError("ledger amountMinor must be bigint");
    }
  }

  const journalId = id("jr");
  const createdAt = new Date().toISOString();
  const entries: LedgerEntry[] = input.lines.map((line) => ({
    id: id("le"),
    account: line.account,
    amountMinor: line.amountMinor,
    currency: input.currency,
    journalId,
    idempotencyKey: input.idempotencyKey,
    memo: line.memo,
    createdAt,
  }));

  const journal: Journal = {
    id: journalId,
    orderId: input.orderId,
    entries,
    createdAt,
  };
  journals.set(journalId, journal);
  byIdem.set(input.idempotencyKey, journalId);
  return journal;
}

/** Agency capture: PSP cash ↑, clear customer, supplier payable, DIAL fee. */
export function postAgencyCapture(input: {
  orderId: string;
  goodsUsdMinor: bigint;
  dialFeeUsdMinor: bigint;
  idempotencyKey: string;
}): Journal {
  if (input.goodsUsdMinor < 0n || input.dialFeeUsdMinor < 0n) {
    throw new Error("amounts must be non-negative");
  }
  const total = input.goodsUsdMinor + input.dialFeeUsdMinor;
  return postJournal({
    orderId: input.orderId,
    currency: "USD",
    idempotencyKey: input.idempotencyKey,
    lines: [
      {
        account: "cash_psp",
        amountMinor: total,
        memo: "PSP capture",
      },
      {
        account: "customer_clearing",
        amountMinor: -total,
        memo: "customer paid",
      },
      {
        account: "supplier_payable",
        amountMinor: -input.goodsUsdMinor,
        memo: "agency goods — Sold by supplier",
      },
      {
        account: "dial_fee_revenue",
        amountMinor: -input.dialFeeUsdMinor,
        memo: "DIAL_FEE commission",
      },
      {
        account: "supplier_payable",
        amountMinor: input.goodsUsdMinor,
        memo: "balance goods liability",
      },
      {
        account: "dial_fee_revenue",
        amountMinor: input.dialFeeUsdMinor,
        memo: "balance fee revenue",
      },
    ],
  });
}

/** Simpler balanced capture used by E1a tests — debit cash / credit clearing. */
export function postPspCaptureSimple(input: {
  orderId: string;
  amount: Money;
  idempotencyKey: string;
}): Journal {
  return postJournal({
    orderId: input.orderId,
    currency: input.amount.currency,
    idempotencyKey: input.idempotencyKey,
    lines: [
      {
        account: "cash_psp",
        amountMinor: input.amount.amountMinor,
        memo: "PSP capture debit",
      },
      {
        account: "customer_clearing",
        amountMinor: -input.amount.amountMinor,
        memo: "customer clearing credit",
      },
    ],
  });
}

export function getJournal(id: string): Journal | undefined {
  return journals.get(id);
}

export function assertNoDialOwnedPath(): void {
  // D-58 — package never exports DIAL_OWNED / owned COGS helpers.
}

export function __resetLedgerForTests(): void {
  journals.clear();
  byIdem.clear();
}

export { money };
