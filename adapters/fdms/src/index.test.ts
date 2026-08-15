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

test("S123 pingFdmsHealth fixture ok + sandbox fail-closed without keys", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const { pingFdmsHealth } = await import("./index.js");
  const fx = await pingFdmsHealth();
  assert.equal(fx.ok, true);
  assert.equal(fx.mode, "fixture");
  assert.ok(fx.fixtureDayId);

  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.FDMS_BASE_URL;
  delete process.env.FDMS_DEVICE_ID;
  delete process.env.FDMS_ACTIVATION_KEY;
  const closed = await pingFdmsHealth();
  assert.equal(closed.ok, false);
  assert.ok(closed.error?.includes("fail closed"));
  process.env.DIAL_INTEGRATION_MODE = "fixture";
});

test("PD11 sandbox Virtual Gateway: keys + open → agency submit → close", async () => {
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  process.env.FDMS_BASE_URL = "https://fdms.sandbox.dial.local";
  process.env.FDMS_DEVICE_ID = "dev_pd11";
  process.env.FDMS_ACTIVATION_KEY = "act_pd11_secret";
  delete process.env.FDMS_SANDBOX_HTTP;
  const {
    ZimraVirtualGatewayAdapter,
    __resetFdmsSandboxForTests,
    getSandboxFiscalDaySnapshot,
  } = await import("./index.js");
  __resetFdmsSandboxForTests();
  const gw = new ZimraVirtualGatewayAdapter();
  await assert.rejects(
    () =>
      gw.submitReceipt({
        receiptClass: "DIAL_FEE",
        amountMinor: "100",
        currency: "USD",
      }),
    /not open/,
  );
  const day = await gw.openFiscalDay();
  assert.match(day.fiscalDayId, /^fd_sb_/);
  assert.equal(getSandboxFiscalDaySnapshot().open, true);
  for (const receiptClass of [
    "DIAL_FEE",
    "GOODS_FORMAL",
    "GOODS_INFORMAL",
  ] as const) {
    const r = await gw.submitReceipt({
      receiptClass,
      amountMinor: "2500",
      currency: "USD",
      orderId: "ord_pd11",
    });
    assert.match(r.fiscalCode, new RegExp(`FISCAL_SB_${receiptClass}_`));
  }
  const closed = await gw.closeFiscalDay();
  assert.ok(closed.closedAt);
  assert.equal(getSandboxFiscalDaySnapshot().open, false);
  process.env.DIAL_INTEGRATION_MODE = "fixture";
});
