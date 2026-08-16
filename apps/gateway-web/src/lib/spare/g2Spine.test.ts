import assert from "node:assert/strict";
import { test } from "node:test";
import { __resetCatalogueForTests, countInformalB2bLeaks } from "@dial/catalogue";
import {
  __resetPaymentsForTests,
  getJobReserve,
  getPaymentIntent,
  setDailyZigRate,
} from "@dial/payments";
import { listJournals } from "@dial/ledger";
import { listFdmsOutbox } from "@dial/tax";
import {
  browseSpareForSession,
  probeB2bInformalLeak,
  runG2SparePaynowHosted,
  runG2SpareThinVertical,
} from "./g2Spine.js";

test("G2 spine: EcoCash → snapshot + JR + ledger + FiscalReceiptQueued; leak=0", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetCatalogueForTests();
  __resetPaymentsForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "g2_test_ops" });

  const eco = await runG2SpareThinVertical({
    offerId: "off_filter_oil_kun26",
    payChoice: "ecocash",
    buyerSegment: "b2c",
    customerId: "cust_g2_eco",
    idempotencyKey: "g2-test-eco-1",
  });

  assert.equal(eco.currency, "USD");
  assert.equal(eco.webhook, "captured");
  assert.ok(eco.snapshotId);
  assert.ok(eco.orderId.startsWith("sord_g2_"));
  assert.ok(eco.intentId);
  assert.ok(eco.jobReserveId);
  assert.ok(eco.journalId);
  assert.ok(eco.fiscalIds && eco.fiscalIds.length >= 2);
  assert.equal(eco.displayPayableCurrency, "ZWG");
  assert.equal(eco.b2bInformalLeaks, 0);
  assert.equal(eco.payableFromAi, false);
  assert.equal(eco.imttOnCheckoutLines, false);
  assert.equal(eco.durable.mode, "fixture");
  assert.equal(eco.durable.snapshot, "fixture_skip");

  const intent = getPaymentIntent(eco.intentId!);
  assert.ok(intent);
  assert.equal(intent!.status, "captured");
  assert.ok(getJobReserve(eco.jobReserveId));
  assert.ok(listJournals().some((j) => j.id === eco.journalId));
  const fiscal = listFdmsOutbox().filter((r) => r.orderId === eco.orderId);
  assert.ok(fiscal.length >= 2);
});

test("G2 spine: COD → durable place path + JR + ledger + fiscal; leak=0", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetCatalogueForTests();
  __resetPaymentsForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "g2_test_ops" });

  const cod = await runG2SpareThinVertical({
    offerId: "off_filter_oil_kun26",
    payChoice: "cod",
    buyerSegment: "b2c",
    customerId: "cust_g2_cod",
    idempotencyKey: "g2-test-cod-1",
  });

  assert.equal(cod.webhook, "skipped_cod");
  assert.ok(cod.codOrderId);
  assert.ok(cod.journalId);
  assert.ok(cod.fiscalIds && cod.fiscalIds.length >= 2);
  assert.ok(cod.jobReserveId);
  assert.equal(cod.b2bInformalLeaks, 0);
  assert.equal(countInformalB2bLeaks(""), 0);
});

test("G2 spine: B2B informal purchase denied", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetCatalogueForTests();
  __resetPaymentsForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "g2_test_ops" });

  // Informal offer from catalogue fixtures when present
  await assert.rejects(
    () =>
      runG2SpareThinVertical({
        offerId: "off_wiper_informal_01",
        payChoice: "cod",
        buyerSegment: "b2b",
        idempotencyKey: "g2-b2b-deny",
      }),
    /B2B|informal/,
  );
});

test("G2 browse helper: USD + leak probe", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetCatalogueForTests();
  const browse = await browseSpareForSession("oil", "b2c");
  assert.equal(browse.currency, "USD");
  assert.equal(browse.informalB2bLeaks, 0);
  const b2b = await browseSpareForSession("oil", "b2b");
  assert.equal(b2b.informalB2bLeaks, 0);
  assert.equal(b2b.informalHitsInSession, 0);
  const probe = await probeB2bInformalLeak("oil");
  assert.equal(probe.ok, true);
});

test("G2 Paynow hosted: durable pending + hostedUrl; no JR until webhook", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetCatalogueForTests();
  __resetPaymentsForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "g2_test_ops" });

  const pn = await runG2SparePaynowHosted({
    offerId: "off_filter_oil_kun26",
    buyerSegment: "b2c",
    customerId: "cust_g2_paynow",
    idempotencyKey: "g2-test-paynow-1",
  });

  assert.ok(pn.hostedUrl && pn.hostedUrl.includes("paynow"));
  assert.ok(pn.intentId);
  assert.ok(pn.orderId.startsWith("sord_g2_pn_"));
  assert.equal(pn.durable.jobReserve, "deferred_until_webhook");
  assert.equal(pn.durable.snapshot, "fixture_skip");
  assert.equal(pn.b2bInformalLeaks, 0);
  assert.equal(pn.payableFromAi, false);
  const intent = getPaymentIntent(pn.intentId);
  assert.ok(intent);
  assert.equal(intent!.method, "paynow_hosted");
});
