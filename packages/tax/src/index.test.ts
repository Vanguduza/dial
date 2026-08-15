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

test("S96 FDMS open/close day worker (fixture)", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetTaxForTests();
  const {
    runFdmsOpenDay,
    runFdmsCloseDay,
    getFiscalDayState,
  } = await import("./index.js");
  await assert.rejects(() => runFdmsCloseDay(), /not open/);
  const opened = await runFdmsOpenDay({ enqueueSideEffects: true });
  assert.ok(opened.fiscalDayId);
  assert.ok(opened.openedAt);
  assert.equal(opened.closedAt, null);
  const closed = await runFdmsCloseDay({ enqueueSideEffects: true });
  assert.equal(closed.fiscalDayId, opened.fiscalDayId);
  assert.ok(closed.closedAt);
  assert.equal(getFiscalDayState().closedAt, closed.closedAt);
});

test("S97 processFdmsDayJob open then close", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetTaxForTests();
  const { processFdmsDayJob, getFiscalDayState } = await import("./index.js");
  await processFdmsDayJob({ action: "open" });
  assert.ok(getFiscalDayState().fiscalDayId);
  await processFdmsDayJob({ action: "close" });
  assert.ok(getFiscalDayState().closedAt);
});

test("PD11 sandbox drain requires open fiscal day", async () => {
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  process.env.FDMS_BASE_URL = "https://fdms.sandbox.dial.local";
  process.env.FDMS_DEVICE_ID = "dev_pd11";
  process.env.FDMS_ACTIVATION_KEY = "act_pd11";
  const { __resetFdmsSandboxForTests } = await import("@dial/adapter-fdms");
  __resetFdmsSandboxForTests();
  __resetTaxForTests();
  const { enqueueFiscalReceipt, drainFdmsOutbox, runFdmsOpenDay } = await import(
    "./index.js"
  );
  enqueueFiscalReceipt({
    orderId: "ord_gate",
    receiptClass: "DIAL_FEE",
    amount: money(50n, "USD"),
    channel: "web",
  });
  await assert.rejects(() => drainFdmsOutbox(), /not open/);
  await runFdmsOpenDay();
  const results = await drainFdmsOutbox();
  assert.equal(results[0]?.status, "submitted");
  assert.match(results[0]?.fiscalCode ?? "", /FISCAL_SB_DIAL_FEE/);
  process.env.DIAL_INTEGRATION_MODE = "fixture";
});

test("S107 drain FDMS day queue then process", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetTaxForTests();
  const { enqueueFdmsDayJob, drainFixtureFdmsDayJobs, __resetQueuesForTests } =
    await import("@dial/queues");
  __resetQueuesForTests();
  await enqueueFdmsDayJob({ action: "open" });
  await enqueueFdmsDayJob({ action: "close" });
  const jobs = drainFixtureFdmsDayJobs();
  assert.equal(jobs.length, 2);
  const { processFdmsDayJob, getFiscalDayState } = await import("./index.js");
  for (const job of jobs) {
    await processFdmsDayJob(job);
  }
  assert.ok(getFiscalDayState().closedAt);
});
