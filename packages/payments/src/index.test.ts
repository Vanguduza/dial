import assert from "node:assert/strict";
import { test } from "node:test";
import { money } from "@dial/shared";
import { __resetLedgerForTests } from "@dial/ledger";
import { __resetTaxForTests, listFdmsOutbox } from "@dial/tax";
import {
  __resetPaymentsForTests,
  admitPspWebhookEvent,
  applyJobReserveWebhook,
  authorizeJobReserve,
  computeTechPayoutWithholding,
  createCheckoutPayment,
  createVendorPaymentSession,
  freezeOfferSnapshot,
  getActiveFxRate,
  listFxRateAudit,
  listPspMethods,
  runE1aMoneySpine,
  setDailyZigRate,
  toCanonicalPspCode,
  usdToZig,
} from "./index.js";

test("daily ZiG rate converts USD minor to ZWG with fx_rate_id", () => {
  __resetPaymentsForTests();
  const rate = setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "ops_test" });
  assert.equal(getActiveFxRate()?.fxRateId, rate.fxRateId);
  const zig = usdToZig(10_00n, rate);
  assert.equal(zig.currency, "ZWG");
  assert.equal(zig.amountMinor, 10_00n * 2500_00n / 100n);
});

test("checkout EcoCash button creates intent with ZWG display + fx_rate_id", async () => {
  __resetPaymentsForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "ops_test" });
  const { intent } = await createCheckoutPayment({
    choice: "ecocash",
    orderId: "ord_1",
    amountUsdMinor: 15_00n,
    idempotencyKey: "eco-1",
  });
  assert.ok(intent);
  assert.equal(intent!.method, "ecocash_direct");
  assert.equal(intent!.amount.currency, "USD");
  assert.equal(intent!.displayPayable?.currency, "ZWG");
  assert.ok(intent!.fxRateId);
  assert.equal(intent!.status, "awaiting_customer");
});

test("checkout COD button places COD order settle USD + indicative ZiG", async () => {
  __resetPaymentsForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "ops_test" });
  const { intent, codOrder } = await createCheckoutPayment({
    choice: "cod",
    orderId: "ord_2",
    amountUsdMinor: 20_00n,
    idempotencyKey: "cod-1",
  });
  assert.ok(codOrder);
  assert.equal(codOrder!.amountUsd.currency, "USD");
  assert.equal(codOrder!.indicativeZig.currency, "ZWG");
  assert.equal(intent?.method, "cod_cash");
  assert.equal(intent?.status, "authorized");
});

test("payment intent idempotency key is no-op on replay", async () => {
  __resetPaymentsForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "ops_test" });
  const a = await createCheckoutPayment({
    choice: "ecocash",
    orderId: "ord_3",
    amountUsdMinor: 5_00n,
    idempotencyKey: "same-key",
  });
  const b = await createCheckoutPayment({
    choice: "ecocash",
    orderId: "ord_3",
    amountUsdMinor: 5_00n,
    idempotencyKey: "same-key",
  });
  assert.equal(a.intent?.id, b.intent?.id);
});

test("AI cannot freeze OfferSnapshot payable", () => {
  __resetPaymentsForTests();
  assert.throws(() =>
    freezeOfferSnapshot({
      orderId: "ord_ai",
      supplierDisplayName: "Acme Spares",
      formality: "formal",
      amountUsdMinor: 10_00n,
      aiSuggestedPayableMinor: 9_00n,
    }),
  );
});

test("E1a spine: OfferSnapshot → authorize → webhook → ledger → FiscalReceiptQueued", async () => {
  __resetPaymentsForTests();
  __resetLedgerForTests();
  __resetTaxForTests();

  const captured = await runE1aMoneySpine({
    orderId: "ord_e1a",
    supplierDisplayName: "Harare Filters",
    formality: "formal",
    amountUsdMinor: 50_00n,
    dialFeeUsdMinor: 5_00n,
    buyerSegment: "b2c",
    channel: "wa",
    pspEventId: "psp_evt_1",
    signatureValid: true,
  });
  assert.equal(captured.webhook, "captured");
  assert.match(captured.snapshot.soldBy, /^Sold by /);
  assert.equal(captured.intent.status, "captured");
  assert.ok(captured.journalId);
  assert.equal(captured.fiscalIds.length, 2);
  assert.equal(listFdmsOutbox().length, 2);
  assert.ok(
    listFdmsOutbox().every((r) => r.gateway === "zimra_virtual_in_house"),
  );

  const dup = await runE1aMoneySpine({
    orderId: "ord_e1a",
    supplierDisplayName: "Harare Filters",
    formality: "formal",
    amountUsdMinor: 50_00n,
    dialFeeUsdMinor: 5_00n,
    buyerSegment: "b2c",
    channel: "wa",
    pspEventId: "psp_evt_1",
    signatureValid: true,
  });
  assert.equal(dup.webhook, "duplicate");

  await assert.rejects(async () =>
    runE1aMoneySpine({
      orderId: "ord_b2b",
      supplierDisplayName: "Informal Guy",
      formality: "informal",
      amountUsdMinor: 10_00n,
      dialFeeUsdMinor: 1_00n,
      buyerSegment: "b2b",
      channel: "web",
      pspEventId: "psp_evt_2",
      signatureValid: true,
    }),
  );
});

test("D-43 PspAdapter registry includes all launch rails", () => {
  const methods = listPspMethods();
  for (const m of [
    "paynow_hosted",
    "contipay",
    "ecocash_direct",
    "paypal",
    "cod_cash",
    "escrow_hold",
  ] as const) {
    assert.ok(methods.includes(m), `missing ${m}`);
  }
});

test("Job Reserve authorize → capture/release only via signed webhook", async () => {
  __resetPaymentsForTests();
  const reserve = await authorizeJobReserve({
    jobId: "job_1",
    amountUsdMinor: 80_00n,
    idempotencyKey: "jr-1",
  });
  assert.equal(reserve.status, "authorized");
  assert.throws(() =>
    applyJobReserveWebhook({
      reserveId: reserve.id,
      eventId: "evt_bad",
      action: "capture",
      signatureValid: false,
    }),
  );
  const captured = applyJobReserveWebhook({
    reserveId: reserve.id,
    eventId: "evt_cap",
    action: "capture",
    signatureValid: true,
  });
  assert.equal(captured.status, "captured");
  const dup = applyJobReserveWebhook({
    reserveId: reserve.id,
    eventId: "evt_cap",
    action: "capture",
    signatureValid: true,
  });
  assert.equal(dup.status, "captured");
});

test("Tech WHT 30% without ITF263; zero withhold with clearance (D-50)", () => {
  __resetPaymentsForTests();
  const taxed = computeTechPayoutWithholding({
    technicianId: "tech_1",
    yearOfAssessment: 2026,
    payoutUsdMinor: 100_00n,
    hasItf263: false,
  });
  assert.equal(taxed.withholdMinor, 30_00n);
  assert.equal(taxed.netPayoutMinor, 70_00n);
  const cleared = computeTechPayoutWithholding({
    technicianId: "tech_2",
    yearOfAssessment: 2026,
    payoutUsdMinor: 100_00n,
    hasItf263: true,
  });
  assert.equal(cleared.withholdMinor, 0n);
  assert.equal(cleared.netPayoutMinor, 100_00n);
});

test("E1b admin Daily ZiG audit → EcoCash intent carries fx_rate_id", async () => {
  __resetPaymentsForTests();
  assert.throws(() => setDailyZigRate({ zigMinorPerUsd: 100n, setBy: "   " }));
  const first = setDailyZigRate({
    zigMinorPerUsd: 2400_00n,
    setBy: "ops_alice",
    effectiveAt: "2026-08-12T06:00:00.000Z",
  });
  const second = setDailyZigRate({
    zigMinorPerUsd: 2500_00n,
    setBy: "ops_bob",
  });
  const audit = listFxRateAudit();
  assert.equal(audit.length, 2);
  assert.equal(audit[0]?.fxRateId, second.fxRateId);
  assert.equal(audit[0]?.setBy, "ops_bob");
  assert.equal(audit[1]?.setBy, "ops_alice");
  assert.equal(getActiveFxRate()?.fxRateId, second.fxRateId);

  const { intent } = await createCheckoutPayment({
    choice: "ecocash",
    orderId: "ord_e1b",
    amountUsdMinor: 12_00n,
    idempotencyKey: "e1b-eco",
  });
  assert.equal(intent?.fxRateId, second.fxRateId);
  assert.equal(intent?.displayPayable?.currency, "ZWG");
  assert.notEqual(intent?.fxRateId, first.fxRateId);
});

test("PSP webhook admit: bad sig / duplicate / capture", async () => {
  __resetPaymentsForTests();
  const reserve = await authorizeJobReserve({
    jobId: "job_w",
    amountUsdMinor: 10_00n,
    idempotencyKey: "w-1",
  });
  assert.equal(
    admitPspWebhookEvent({
      eventId: "e1",
      signatureValid: false,
      intentId: reserve.intentId!,
      action: "capture",
    }),
    "rejected_signature",
  );
  assert.equal(
    admitPspWebhookEvent({
      eventId: "e2",
      signatureValid: true,
      intentId: reserve.intentId!,
      action: "capture",
    }),
    "captured",
  );
  assert.equal(
    admitPspWebhookEvent({
      eventId: "e2",
      signatureValid: true,
      intentId: reserve.intentId!,
      action: "capture",
    }),
    "duplicate",
  );
});

test("S92 bridge: domain method → canonical PSP createPayment (fixture)", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  assert.equal(toCanonicalPspCode("paynow_hosted"), "paynow");
  assert.equal(toCanonicalPspCode("escrow_hold"), "psp_escrow");
  const session = await createVendorPaymentSession({
    method: "paynow_hosted",
    reference: "ord_bridge_1",
    amount: money(10_00n, "USD"),
  });
  assert.ok(session.providerRef.includes("paynow"));
  assert.ok(session.redirectUrl || session.status);
});
