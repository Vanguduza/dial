import assert from "node:assert/strict";
import { test } from "node:test";
import { money } from "@dial/shared";
import {
  __resetTaxForTests,
  enqueueFiscalReceipt,
  listFdmsOutbox,
} from "./index.js";

test("enqueue FiscalReceiptQueued agency classes on in-house Gateway", () => {
  __resetTaxForTests();
  const fee = enqueueFiscalReceipt({
    orderId: "ord_1",
    receiptClass: "DIAL_FEE",
    amount: money(100n, "USD"),
    channel: "web",
  });
  assert.equal(fee.status, "queued");
  assert.equal(fee.gateway, "zimra_virtual_in_house");
  enqueueFiscalReceipt({
    orderId: "ord_1",
    receiptClass: "GOODS_FORMAL",
    amount: money(2400n, "USD"),
    channel: "wa",
  });
  assert.equal(listFdmsOutbox().length, 2);
});

test("S95 drainFdmsOutbox submits via Gateway adapter (fixture)", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetTaxForTests();
  enqueueFiscalReceipt({
    orderId: "ord_drain",
    receiptClass: "DIAL_FEE",
    amount: money(50n, "USD"),
    channel: "web",
  });
  const { drainFdmsOutbox, listQueuedFdmsReceipts } = await import("./index.js");
  assert.equal(listQueuedFdmsReceipts().length, 1);
  const results = await drainFdmsOutbox({ enqueueSideEffects: true });
  assert.equal(results.length, 1);
  assert.equal(results[0]?.status, "submitted");
  assert.ok(results[0]?.fiscalCode);
  assert.equal(listQueuedFdmsReceipts().length, 0);
});
