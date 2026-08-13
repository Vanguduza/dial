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
