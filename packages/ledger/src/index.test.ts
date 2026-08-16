import assert from "node:assert/strict";
import { test } from "node:test";
import { money } from "@dial/shared";
import {
  __resetLedgerForTests,
  assertNoDialOwnedPath,
  drainMoneyOutbox,
  enqueueMoneyOutbox,
  listMoneyOutbox,
  postJournal,
  postPspCaptureSimple,
  getJournalDurable,
  runPd126FormanceConsoleExplorerThinVertical,
} from "./index.js";

test("postJournal rejects unbalanced batch", () => {
  __resetLedgerForTests();
  assert.throws(() =>
    postJournal({
      orderId: "ord_1",
      currency: "USD",
      idempotencyKey: "bad",
      lines: [{ account: "cash_psp", amountMinor: 100n, memo: "x" }],
    }),
  );
});

test("PSP capture posts balanced entries; idempotent replay", () => {
  __resetLedgerForTests();
  const a = postPspCaptureSimple({
    orderId: "ord_1",
    amount: money(2500n, "USD"),
    idempotencyKey: "cap_1",
  });
  const b = postPspCaptureSimple({
    orderId: "ord_1",
    amount: money(2500n, "USD"),
    idempotencyKey: "cap_1",
  });
  assert.equal(a.id, b.id);
  const sum = a.entries.reduce((s, e) => s + e.amountMinor, 0n);
  assert.equal(sum, 0n);
  assertNoDialOwnedPath();
});

test("PD126 Formance Console explorer pattern", () => {
  const out = runPd126FormanceConsoleExplorerThinVertical();
  assert.ok(out.journalCount >= 1);
  assert.ok(out.entryCount >= 2);
  assert.equal(out.formanceMoneySor, false);
  assert.equal(out.dialLedgerSor, true);
  assert.equal(out.moneyAuthority, "dial_ledger");
});

test("S114 money outbox drain links FiscalReceiptQueued side-effects", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetLedgerForTests();
  const { __resetTaxForTests, enqueueFiscalReceipt } = await import("@dial/tax");
  const { __resetQueuesForTests, drainFixtureOutboxJobs } = await import(
    "@dial/queues"
  );
  __resetTaxForTests();
  __resetQueuesForTests();

  postJournal({
    orderId: "ord_s114",
    currency: "USD",
    idempotencyKey: "s114_jr",
    lines: [
      { account: "cash_psp", amountMinor: 100n, memo: "in" },
      { account: "dial_fee_revenue", amountMinor: -100n, memo: "out" },
    ],
  });
  const fee = enqueueFiscalReceipt({
    orderId: "ord_s114",
    receiptClass: "DIAL_FEE",
    amount: money(100n, "USD"),
    channel: "web",
  });
  enqueueMoneyOutbox({ kind: "fiscal_queued", refId: fee.id });
  assert.ok(listMoneyOutbox().length >= 2);

  const drained = await drainMoneyOutbox({ enqueueSideEffects: true });
  assert.ok(drained.some((d) => d.kind === "ledger_posted" && d.status === "drained"));
  assert.ok(
    drained.some(
      (d) => d.kind === "fiscal_queued" && d.status === "fiscal_submitted",
    ),
  );
  assert.equal(listMoneyOutbox().length, 0);
  const side = drainFixtureOutboxJobs();
  assert.ok(side.some((j) => j.topic === "money.ledger_posted"));
  assert.ok(side.some((j) => j.topic === "fdms.submitted"));
});

test("PD11 sandbox thin vertical: money outbox agency receipts via Virtual Gateway", async () => {
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  process.env.FDMS_BASE_URL = "https://fdms.sandbox.dial.local";
  process.env.FDMS_DEVICE_ID = "dev_pd11";
  process.env.FDMS_ACTIVATION_KEY = "act_pd11";
  delete process.env.FDMS_SANDBOX_HTTP;
  const { runPd11FdmsSandboxThinVertical } = await import("./index.js");
  const out = await runPd11FdmsSandboxThinVertical({ orderId: "ord_pd11_ledger" });
  assert.equal(out.mode, "sandbox");
  assert.ok(out.dayOpened.fiscalDayId);
  assert.ok(out.dayClosed.closedAt);
  assert.equal(out.moneyDrain.length, 3);
  assert.ok(out.fiscalCodes.some((c) => c.includes("GOODS_FORMAL")));
  assert.ok(out.fiscalCodes.some((c) => c.includes("GOODS_INFORMAL")));
  assert.ok(out.fiscalCodes.some((c) => c.includes("DIAL_FEE")));
  process.env.DIAL_INTEGRATION_MODE = "fixture";
});

test("getJournalDurable stays in-memory in fixture", async () => {
  __resetLedgerForTests();
  const j = postJournal({
    orderId: "ord_durable_fx",
    currency: "USD",
    idempotencyKey: "idem_durable_fx",
    lines: [
      { account: "cash_psp", amountMinor: 100n, memo: "d" },
      { account: "customer_clearing", amountMinor: -100n, memo: "c" },
    ],
  });
  const loaded = await getJournalDurable(j.id);
  assert.equal(loaded?.id, j.id);
  assert.equal(await getJournalDurable("missing_journal"), undefined);
});
