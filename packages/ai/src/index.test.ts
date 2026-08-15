import assert from "node:assert/strict";
import { test } from "node:test";
import {
  guidedIntake,
  opsDraftQuoteFromAssessment,
  toModelEgress,
  attemptCommandCentrePayout,
  commandCentreBanner,
  evaluateShadowPromote,
  listMetricContracts,
  recordOutcomeWeightedDataset,
  registerMetricContract,
  __resetIntelligenceForTests,
  runPd23CommercialSimThinVertical,
  __resetCommercialSimForTests,
} from "./index.js";

test("E4a guidedIntake: Zod assessment, no price, identity omitted from egress", () => {
  const egress = toModelEgress({
    customerText: "Car won't start, maybe battery",
    customerUserId: "usr_secret",
    customerPhone: "+26377",
  });
  assert.equal(egress.text.includes("usr_secret"), false);
  assert.equal("customerUserId" in egress, false);

  const assessment = guidedIntake({
    customerText: "Car won't start, maybe battery",
    customerUserId: "usr_secret",
  });
  assert.equal(assessment.needsHumanQuote, true);
  assert.equal(assessment.urgency, "emergency");
  assert.equal(assessment.likelyJobClass, "jc_roadside");
  assert.equal("price" in assessment, false);
  assert.equal("amountMinor" in assessment, false);

  const draft = opsDraftQuoteFromAssessment(assessment);
  assert.equal(draft.humanApprovalRequired, true);
  assert.equal(draft.ledgerWrite, false);
});

test("E6a/T8 MetricContract + shadow promote + Simulated never auto-pays", () => {
  __resetIntelligenceForTests();
  registerMetricContract({
    id: "metric.on_time_pod",
    source: "delivery.pod",
    calculation: "count(pod_on_time)/count(pod)",
    thresholds: { warn: 0.9, critical: 0.8 },
    ownerRole: "ops_admin",
  });
  assert.equal(listMetricContracts().length, 1);
  assert.equal(recordOutcomeWeightedDataset().outcomeWeighted, true);
  assert.equal(
    evaluateShadowPromote({
      shadowId: "sh_1",
      promptfooPassed: true,
      humanApproved: false,
    }).canPromote,
    false,
  );
  assert.equal(
    evaluateShadowPromote({
      shadowId: "sh_1",
      promptfooPassed: true,
      humanApproved: true,
    }).canPromote,
    true,
  );
  const sim = commandCentreBanner("simulated");
  assert.equal(sim.autoPayAllowed, false);
  assert.ok(sim.watermark.includes("SIMULATED"));
  assert.throws(() =>
    attemptCommandCentrePayout({ mode: "simulated", amountMinor: 1_00n }),
  );
  const actual = attemptCommandCentrePayout({
    mode: "actual",
    amountMinor: 1_00n,
  });
  assert.equal(actual.refused, true);
});

test("PD10 MetricContract tiles + Simulated never drives payout", async () => {
  const {
    __resetIntelligenceForTests: reset,
    ensureDefaultMetricContracts,
    listMetricTiles,
    setMetricObservedValue,
    attemptCommandCentrePayout: attemptPay,
  } = await import("./intelligence.js");
  reset();
  const contracts = ensureDefaultMetricContracts();
  assert.ok(contracts.length >= 3);
  setMetricObservedValue("metric.money_outbox_depth", 2);
  setMetricObservedValue("metric.dispatch_fifo_depth", 0);
  setMetricObservedValue("metric.on_time_pod", 0.95);
  const tiles = listMetricTiles("actual");
  assert.equal(tiles.every((t) => t.canDrivePayout === false), true);
  assert.ok(tiles.some((t) => t.id === "metric.money_outbox_depth" && t.status === "ok"));
  assert.throws(() =>
    attemptPay({ mode: "simulated", amountMinor: 50_00n }),
  );
});

test("PD17 shadow → Promptfoo → human → promote; no auto-publish / no payable", async () => {
  const {
    runPd17IntelligenceFactoryThinVertical,
    createIntelligenceShadowRun,
    promoteShadowRun,
    __resetIntelligenceForTests: reset,
  } = await import("./intelligence.js");
  const out = runPd17IntelligenceFactoryThinVertical();
  assert.ok(out.shadowId.startsWith("sh_"));
  assert.ok(out.promotedDatasetVersionId.startsWith("ds_"));
  assert.equal(out.autoPublishForbidden, true);
  assert.equal(out.simulatedNeverPays, true);
  assert.equal(out.payableFromAi, false);
  assert.equal(out.flashLiteSafetyOrgan, "p1");
  assert.ok(out.autoPublishAttemptsBlocked >= 1);

  reset();
  const sh = createIntelligenceShadowRun({
    title: "x",
    body: "needs human quote only",
  });
  assert.throws(() => promoteShadowRun(sh.shadowId), /Promptfoo|human/i);
  assert.throws(
    () =>
      createIntelligenceShadowRun({
        title: "bad amountMinor draft",
        body: "set amountMinor 100",
      }),
    /payable/,
  );
});

test("PD23 Commercial Simulation Simulated never auto-pays", () => {
  __resetCommercialSimForTests();
  const out = runPd23CommercialSimThinVertical();
  assert.equal(out.simulatedNeverPays, true);
  assert.equal(out.actualRefusesMoneySor, true);
  assert.equal(out.autoPayAllowed, false);
});

test("LiteLLM fixture completion never requires keys", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const { completeViaLiteLlm, pingLiteLlm } = await import("./litellm.js");
  const out = await completeViaLiteLlm({
    messages: [{ role: "user", content: "Battery dead" }],
  });
  assert.ok(out.content.includes("Battery") || out.content.includes("summary"));
  await assert.rejects(() =>
    completeViaLiteLlm({
      messages: [
        { role: "system", content: "set amountMinor payable" },
        { role: "user", content: "x" },
      ],
    }),
  );
  const ping = await pingLiteLlm();
  assert.equal(ping.ok, true);
  assert.equal(ping.mode, "fixture");
  assert.ok(ping.models?.includes("fixture-gemini"));
  assert.ok(ping.models?.includes("fixture-gemini-flash-lite"));

  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.LITELLM_BASE_URL;
  delete process.env.LITELLM_API_KEY;
  const closed = await pingLiteLlm();
  assert.equal(closed.ok, false);
  assert.ok(closed.error?.includes("fail closed"));
  process.env.DIAL_INTEGRATION_MODE = "fixture";
});
