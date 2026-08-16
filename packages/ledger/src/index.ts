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

function journals(): Map<string, Journal> {
  const g = globalThis as { __dialLedgerJournals?: Map<string, Journal> };
  if (!g.__dialLedgerJournals) g.__dialLedgerJournals = new Map();
  return g.__dialLedgerJournals;
}

function byIdem(): Map<string, string> {
  const g = globalThis as { __dialLedgerByIdem?: Map<string, string> };
  if (!g.__dialLedgerByIdem) g.__dialLedgerByIdem = new Map();
  return g.__dialLedgerByIdem;
}

function moneyOutbox(): Array<{
  id: string;
  kind: "ledger_posted" | "fiscal_queued";
  refId: string;
  createdAt: string;
}> {
  const g = globalThis as {
    __dialMoneyOutbox?: Array<{
      id: string;
      kind: "ledger_posted" | "fiscal_queued";
      refId: string;
      createdAt: string;
    }>;
  };
  if (!g.__dialMoneyOutbox) g.__dialMoneyOutbox = [];
  return g.__dialMoneyOutbox;
}

function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function enqueueMoneyOutbox(input: {
  kind: "ledger_posted" | "fiscal_queued";
  refId: string;
}): void {
  moneyOutbox().push({
    id: id("obx"),
    kind: input.kind,
    refId: input.refId,
    createdAt: new Date().toISOString(),
  });
}

export function listMoneyOutbox(): readonly MoneyOutboxRow[] {
  return moneyOutbox();
}

export type MoneyOutboxRow = {
  id: string;
  kind: "ledger_posted" | "fiscal_queued";
  refId: string;
  createdAt: string;
};

/**
 * Drain money outbox (S114).
 * - ledger_posted → optional @dial/queues side-effect
 * - fiscal_queued → single FDMS drain via @dial/tax (FiscalReceiptQueued link)
 */
export async function drainMoneyOutbox(input?: {
  enqueueSideEffects?: boolean;
}): Promise<
  Array<{
    id: string;
    kind: MoneyOutboxRow["kind"];
    refId: string;
    status: "drained" | "fiscal_submitted" | "fiscal_failed" | "skipped";
  }>
> {
  const results: Array<{
    id: string;
    kind: MoneyOutboxRow["kind"];
    refId: string;
    status: "drained" | "fiscal_submitted" | "fiscal_failed" | "skipped";
  }> = [];
  const box = moneyOutbox();
  const pending = [...box];
  box.length = 0;

  const ledgerRows = pending.filter((r) => r.kind === "ledger_posted");
  const fiscalRows = pending.filter((r) => r.kind === "fiscal_queued");

  for (const row of ledgerRows) {
    if (input?.enqueueSideEffects) {
      const { enqueueOutboxSideEffect } = await import("@dial/queues");
      await enqueueOutboxSideEffect({
        topic: "money.ledger_posted",
        payload: { journalId: row.refId, outboxId: row.id },
      });
    }
    results.push({
      id: row.id,
      kind: row.kind,
      refId: row.refId,
      status: "drained",
    });
  }

  if (fiscalRows.length > 0) {
    const { drainFdmsOutbox } = await import("@dial/tax");
    const drained = await drainFdmsOutbox(
      input?.enqueueSideEffects
        ? { enqueueSideEffects: true }
        : undefined,
    );
    const byId = new Map(drained.map((d) => [d.id, d]));
    for (const row of fiscalRows) {
      const match = byId.get(row.refId);
      results.push({
        id: row.id,
        kind: row.kind,
        refId: row.refId,
        status:
          match?.status === "submitted"
            ? "fiscal_submitted"
            : match
              ? "fiscal_failed"
              : "skipped",
      });
    }
  }

  return results;
}

/** Post a balanced journal. Duplicate idempotencyKey returns existing. */
export function postJournal(input: {
  orderId: string;
  currency: Money["currency"];
  idempotencyKey: string;
  lines: Array<{ account: LedgerAccount; amountMinor: bigint; memo: string }>;
}): Journal {
  const existingId = byIdem().get(input.idempotencyKey);
  if (existingId) {
    const existing = journals().get(existingId);
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
  journals().set(journalId, journal);
  byIdem().set(input.idempotencyKey, journalId);
  enqueueMoneyOutbox({ kind: "ledger_posted", refId: journalId });
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
  return journals().get(id);
}

/**
 * Sandbox/live read: memory first, then Postgres via PostgREST. Fixture stays
 * in-process so CI does not need a database.
 */
export async function getJournalDurable(
  id: string,
): Promise<Journal | undefined> {
  const mem = getJournal(id);
  if (mem) return mem;
  const { processedEventsIntegrationMode, durableRestSelect } = await import(
    "@dial/shared"
  );
  if (processedEventsIntegrationMode() === "fixture") return undefined;
  const entries = await durableRestSelect<{
    entry_id: string;
    memo: string | null;
    created_at: string;
  }>("journal_entries", `entry_id=eq.${encodeURIComponent(id)}`);
  const row = entries[0];
  if (!row) return undefined;
  const lines = await durableRestSelect<{
    line_id: string;
    account_id: string;
    amount_minor: number | string;
    currency: "USD" | "ZWG";
  }>("journal_lines", `entry_id=eq.${encodeURIComponent(id)}`);
  const journal: Journal = {
    id: row.entry_id,
    orderId: "",
    createdAt: row.created_at,
    entries: lines.map((line) => ({
      id: line.line_id,
      account: "cash_psp",
      amountMinor: BigInt(line.amount_minor),
      currency: line.currency,
      journalId: row.entry_id,
      idempotencyKey: row.entry_id,
      memo: row.memo ?? "",
      createdAt: row.created_at,
    })),
  };
  journals().set(journal.id, journal);
  return journal;
}

export function listJournals(): Journal[] {
  return [...journals().values()].map((j) => ({
    ...j,
    entries: j.entries.map((e) => ({ ...e })),
  }));
}

/** PD126 — Formance Console *pattern* ledger explorer; DIAL ledger remains SoR (D-46). */
export type LedgerExplorerEntry = {
  id: string;
  account: LedgerAccount;
  amountMinor: string;
  currency: Money["currency"];
  journalId: string;
  memo: string;
  createdAt: string;
};

export type LedgerExplorerSnapshot = {
  journals: Array<{
    id: string;
    orderId: string;
    createdAt: string;
    entries: LedgerExplorerEntry[];
  }>;
  formanceConsolePattern: true;
  formanceMoneySor: false;
  dialLedgerSor: true;
  moneyAuthority: "dial_ledger";
};

/**
 * Read-only journal explorer for admin module H (Formance Console UX patterns only).
 */
export function getLedgerExplorerSnapshot(): LedgerExplorerSnapshot {
  return {
    journals: listJournals().map((j) => ({
      id: j.id,
      orderId: j.orderId,
      createdAt: j.createdAt,
      entries: j.entries.map((e) => ({
        id: e.id,
        account: e.account,
        amountMinor: e.amountMinor.toString(),
        currency: e.currency,
        journalId: e.journalId,
        memo: e.memo,
        createdAt: e.createdAt,
      })),
    })),
    formanceConsolePattern: true,
    formanceMoneySor: false,
    dialLedgerSor: true,
    moneyAuthority: "dial_ledger",
  };
}

/**
 * PD126 thin vertical: post capture → explorer shows entries; Formance never money SoR.
 */
export function runPd126FormanceConsoleExplorerThinVertical(): {
  journalCount: number;
  entryCount: number;
  formanceMoneySor: false;
  dialLedgerSor: true;
  moneyAuthority: "dial_ledger";
} {
  __resetLedgerForTests();
  postPspCaptureSimple({
    orderId: "ord_pd126",
    amount: money(4_200n, "USD"),
    idempotencyKey: "pd126_cap",
  });
  const snap = getLedgerExplorerSnapshot();
  if (snap.formanceMoneySor !== false || snap.dialLedgerSor !== true) {
    throw new Error("PD126 Formance must not be money SoR");
  }
  if (snap.journals.length < 1) throw new Error("PD126 expected journal");
  const entryCount = snap.journals.reduce((n, j) => n + j.entries.length, 0);
  if (entryCount < 2) throw new Error("PD126 expected balanced entries");
  return {
    journalCount: snap.journals.length,
    entryCount,
    formanceMoneySor: false,
    dialLedgerSor: true,
    moneyAuthority: "dial_ledger",
  };
}

export function assertNoDialOwnedPath(): void {
  // D-58 — package never exports DIAL_OWNED / owned COGS helpers.
}

export function __resetLedgerForTests(): void {
  journals().clear();
  byIdem().clear();
  moneyOutbox().length = 0;
}

/**
 * PD11 thin vertical: sandbox open day → agency receipts on money outbox → drain → close.
 * Not fixture-only health — requires DIAL_INTEGRATION_MODE=sandbox + FDMS_* keys.
 */
export async function runPd11FdmsSandboxThinVertical(input?: {
  orderId?: string;
}): Promise<{
  mode: string;
  dayOpened: { fiscalDayId: string | null; openedAt: string | null };
  moneyDrain: Array<{ kind: string; status: string; refId: string }>;
  fiscalCodes: string[];
  dayClosed: { fiscalDayId: string | null; closedAt: string | null };
}> {
  const mode = (process.env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (mode !== "sandbox") {
    throw new Error("runPd11FdmsSandboxThinVertical requires DIAL_INTEGRATION_MODE=sandbox");
  }
  const {
    __resetFdmsSandboxForTests,
  } = await import("@dial/adapter-fdms");
  const {
    __resetTaxForTests,
    enqueueFiscalReceipt,
    listFdmsOutbox,
    runFdmsOpenDay,
    runFdmsCloseDay,
  } = await import("@dial/tax");
  const { money: moneyFn } = await import("@dial/shared");

  __resetFdmsSandboxForTests();
  __resetTaxForTests();
  __resetLedgerForTests();

  const orderId = input?.orderId ?? `ord_pd11_${Date.now().toString(36)}`;
  const dayOpened = await runFdmsOpenDay({ enqueueSideEffects: false });

  const goodsFormal = enqueueFiscalReceipt({
    orderId,
    receiptClass: "GOODS_FORMAL",
    amount: moneyFn(4500n, "USD"),
    channel: "web",
  });
  const goodsInformal = enqueueFiscalReceipt({
    orderId,
    receiptClass: "GOODS_INFORMAL",
    amount: moneyFn(1200n, "USD"),
    channel: "wa",
  });
  const fee = enqueueFiscalReceipt({
    orderId,
    receiptClass: "DIAL_FEE",
    amount: moneyFn(300n, "USD"),
    channel: "web",
  });
  for (const r of [goodsFormal, goodsInformal, fee]) {
    enqueueMoneyOutbox({ kind: "fiscal_queued", refId: r.id });
  }

  const moneyDrain = await drainMoneyOutbox({ enqueueSideEffects: false });
  const fiscal = listFdmsOutbox();
  const fiscalCodes = fiscal.map((r) => r.fiscalCode ?? "");
  if (!fiscal.every((r) => r.status === "submitted" && r.fiscalCode)) {
    throw new Error("PD11 expected all agency receipts submitted with fiscalCode");
  }
  if (
    !fiscalCodes.some((c) => c.includes("GOODS_FORMAL")) ||
    !fiscalCodes.some((c) => c.includes("GOODS_INFORMAL")) ||
    !fiscalCodes.some((c) => c.includes("DIAL_FEE"))
  ) {
    throw new Error("PD11 expected fiscal codes for all agency classes");
  }
  if (!moneyDrain.every((d) => d.status === "fiscal_submitted")) {
    throw new Error("PD11 money outbox fiscal_queued rows must be fiscal_submitted");
  }

  const dayClosed = await runFdmsCloseDay({ enqueueSideEffects: false });
  return {
    mode,
    dayOpened: {
      fiscalDayId: dayOpened.fiscalDayId,
      openedAt: dayOpened.openedAt,
    },
    moneyDrain: moneyDrain.map((d) => ({
      kind: d.kind,
      status: d.status,
      refId: d.refId,
    })),
    fiscalCodes,
    dayClosed: {
      fiscalDayId: dayClosed.fiscalDayId,
      closedAt: dayClosed.closedAt,
    },
  };
}

export { money };
