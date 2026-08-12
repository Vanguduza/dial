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
