import assert from "node:assert/strict";
import { test } from "node:test";
import { money } from "@dial/shared";
import {
  __resetLedgerForTests,
  assertNoDialOwnedPath,
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
