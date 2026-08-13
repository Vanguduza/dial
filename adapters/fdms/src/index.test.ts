import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CloudEsdSignerStub,
  ZimraVirtualGatewayAdapter,
} from "./index.js";

test("FDMS fixture: open → submit → close without keys", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const gw = new ZimraVirtualGatewayAdapter();
  const day = await gw.openFiscalDay();
  assert.ok(day.fiscalDayId);
  const receipt = await gw.submitReceipt({
    receiptClass: "DIAL_FEE",
    amountMinor: "100",
    currency: "USD",
  });
  assert.match(receipt.fiscalCode, /^FISCAL_/);
  const closed = await gw.closeFiscalDay();
  assert.ok(closed.closedAt);
  const signer = new CloudEsdSignerStub();
  assert.ok((await signer.signReceiptPayload({ a: 1 })).signature.startsWith("cloudesd"));
});

test("S107 submitReceipt live-shape fields (amountMinor string, agency class)", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const gw = new ZimraVirtualGatewayAdapter();
  for (const receiptClass of [
    "DIAL_FEE",
    "GOODS_FORMAL",
    "GOODS_INFORMAL",
  ] as const) {
    const r = await gw.submitReceipt({
      outboxId: `ob_${receiptClass}`,
      orderId: "ord_s107",
      receiptClass,
      amountMinor: "2500",
      currency: "USD",
      channel: "wa",
      gateway: "zimra_virtual_in_house",
    });
    assert.ok(r.fiscalCode);
  }
});
