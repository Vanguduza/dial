import assert from "node:assert/strict";
import { test } from "node:test";
import {
  __resetJobsForTests,
  assertValueScoreNotMoneyPath,
  bookTechJob,
  classifyJob,
  draftTechQuote,
  getValueScoreSnapshot,
  isTechnicianEligible,
  listBookingSlots,
  listChecklists,
  listJobClassDefinitions,
  listTradeDefinitions,
  quoteFromRateCard,
  runPd9TechThinVertical,
  runPd13TechWebThinVertical,
  runPd19AdminTradeValueScoreThinVertical,
  runPd24AdminProjectsLegalThinVertical,
  runPd25ValueScoreDeviceThinVertical,
  setValueScoreSnapshot,
  setTechnicianCredential,
  uploadJobEvidence,
} from "./index.js";

test("T6 classification + rate-card quote + eligibility + Value Score", () => {
  __resetJobsForTests();
  assert.ok(listTradeDefinitions().some((t) => t.lifecycle === "active"));
  assert.ok(listJobClassDefinitions().some((j) => j.id === "jc_diag"));
  const c = classifyJob({ text: "battery flat roadside" });
  assert.equal(c.jobClassId, "jc_roadside");
  const q = quoteFromRateCard(c.jobClassId);
  assert.equal(q.source, "rate_card");
  assert.equal(q.currency, "USD");
  assert.ok(q.draftAmountUsdMinor > 0n);
  setValueScoreSnapshot({ technicianId: "tech_1", score: 72 });
  setTechnicianCredential({
    technicianId: "tech_1",
    kind: "trade_licence",
    status: "verified",
  });
  assert.equal(getValueScoreSnapshot("tech_1")?.score, 72);
  assert.equal(
    isTechnicianEligible({
      technicianId: "tech_1",
      jobClassId: "jc_roadside",
      minScore: 50,
    }),
    true,
  );
  assert.equal(
    isTechnicianEligible({
      technicianId: "tech_1",
      jobClassId: "jc_roadside",
      minScore: 90,
    }),
    false,
  );
});

test("PD9 draftTechQuote is rate_card not rate_card_stub", () => {
  __resetJobsForTests();
  const normal = draftTechQuote({ jobClass: "diagnostics" });
  assert.equal(normal.source, "rate_card");
  assert.equal(normal.emergency, false);
  const emergency = draftTechQuote({ jobClass: "roadside", emergency: true });
  assert.equal(emergency.emergency, true);
  assert.equal(emergency.source, "rate_card");
  assert.ok(listChecklists().some((c) => c.id === "automotive_basic"));
  assert.ok(listChecklists().some((c) => c.id === "emergency_roadside"));
});

test("PD9 Cal.com fixture slots + book requires slot for non-emergency", async () => {
  __resetJobsForTests();
  delete process.env.CALCOM_BASE_URL;
  delete process.env.CALCOM_API_KEY;
  const slots = await listBookingSlots();
  assert.ok(slots.length >= 1);
  assert.equal(slots[0]!.source, "calcom_fixture");
  assert.throws(() =>
    bookTechJob({
      customerId: "cust_1",
      jobClass: "diagnostics",
      emergency: false,
    }),
  );
  const job = bookTechJob({
    customerId: "cust_1",
    technicianId: "tech_pd9",
    jobClass: "diagnostics",
    slotId: slots[0]!.slotId,
  });
  assert.equal(job.status, "assigned");
  assert.equal(job.currency, "USD");
  const ev = uploadJobEvidence({
    jobId: job.id,
    technicianId: "tech_pd9",
    kind: "note",
    payloadRef: "arrived on site",
  });
  assert.equal(ev.jobId, job.id);
});

test("PD9 thin vertical book → checklist → evidence", async () => {
  __resetJobsForTests();
  const out = await runPd9TechThinVertical({
    customerId: "cust_pd9",
    technicianId: "tech_pd9",
  });
  assert.equal(out.quote.source, "rate_card");
  assert.ok(out.slot.source === "calcom_fixture" || out.slot.source === "calcom");
  assert.equal(out.run.status, "completed");
  assert.equal(out.evidence.kind, "photo");
  assert.equal(out.job.status, "completed");
});

test("PD13 tech-web thin vertical: guide book + emergency + customer jobs", async () => {
  const out = await runPd13TechWebThinVertical({ customerId: "cust_pd13" });
  assert.equal(out.guide.quoteSource, "rate_card");
  assert.equal(out.guide.payableFromAi, false);
  assert.ok(out.guide.slotId.startsWith("cal_"));
  assert.equal(out.emergency.aiPricingBypassed, true);
  assert.equal(out.emergency.checklistId, "emergency_roadside");
  assert.ok(out.customerJobs >= 2);
  assert.ok(out.checklists.includes("automotive_basic"));
});

test("PD19 Trade/JobClass lifecycle + Value Score dispute; no money writes", () => {
  __resetJobsForTests();
  const out = runPd19AdminTradeValueScoreThinVertical();
  assert.equal(out.tradeLifecycle, "active");
  assert.equal(out.jobClassLifecycle, "active");
  assert.equal(out.factorsExplainable, true);
  assert.equal(out.disputeStatus, "upheld");
  assert.equal(out.moneyPathClean, true);
  assert.equal(out.ineligibleHighScoreBlocked, true);
  assert.ok(out.valueScore >= 48);
  const money = assertValueScoreNotMoneyPath();
  assert.equal(money.writesLedger, false);
  assert.equal(money.payableFromAi, false);
});

test("PD53 admin disputes thin vertical", async () => {
  __resetJobsForTests();
  const { runPd53AdminDisputesThinVertical } = await import("./index.js");
  const out = runPd53AdminDisputesThinVertical();
  assert.equal(out.resolvedStatus, "upheld");
  assert.equal(out.payableFromAi, false);
  assert.equal(out.moneyPathClean, true);
});

test("PD24 Projects toggle + legal hub; live gated; no money path", () => {
  __resetJobsForTests();
  const out = runPd24AdminProjectsLegalThinVertical();
  assert.equal(out.defaultComingSoon, true);
  assert.equal(out.staffDraftWhileOff, true);
  assert.equal(out.liveBlockedWithoutGates, true);
  assert.equal(out.liveAfterGates, true);
  assert.equal(out.termsAccepted, true);
  assert.equal(out.checklistSeeded, true);
  assert.equal(out.moneyPathClean, true);
  assert.equal(out.payableFromAi, false);
});

test("PD25 Value Score on device factors; no money path", () => {
  __resetJobsForTests();
  const out = runPd25ValueScoreDeviceThinVertical();
  assert.equal(out.factorsExplainable, true);
  assert.equal(out.noPayableFactors, true);
  assert.equal(out.moneyPathClean, true);
  assert.equal(out.payableFromAi, false);
  assert.ok(out.score >= 70);
});

test("PD30 mock-location blocked + camera overlay queue", async () => {
  const { runPd30MockLocationCameraThinVertical } = await import("./index.js");
  const out = await runPd30MockLocationCameraThinVertical({
    technicianId: "tech_pd30_t",
  });
  assert.equal(out.mockBlocked, true);
  assert.equal(out.genuineAccepted, true);
  assert.equal(out.cameraOverlay, true);
  assert.equal(out.queueFlushed, true);
  assert.equal(out.punctualityNotFromMock, true);
  assert.equal(out.payableFromAi, false);
});

test("PD69 job variation approve", async () => {
  const { runPd69JobVariationApproveThinVertical } = await import("./index.js");
  const out = runPd69JobVariationApproveThinVertical();
  assert.equal(out.approved, true);
  assert.equal(out.aiProposeBlocked, true);
  assert.equal(out.payableFromAi, false);
  assert.equal(out.currency, "USD");
});

test("PD81 checklist by symptom + submit answers", async () => {
  const { runPd81ChecklistBySymptomThinVertical } = await import("./index.js");
  const out = runPd81ChecklistBySymptomThinVertical();
  assert.equal(out.checklistId, "emergency_roadside");
  assert.equal(out.completed, true);
  assert.ok(out.answersCount >= 4);
  assert.equal(out.payableFromAi, false);
});

test("PD86 managers choice thin vertical", async () => {
  const { runPd86ManagersChoiceThinVertical } = await import("./index.js");
  const out = runPd86ManagersChoiceThinVertical();
  assert.equal(out.flagged, true);
  assert.equal(out.cleared, true);
  assert.equal(out.moneyPathClean, true);
  assert.equal(out.payableFromAi, false);
});

test("PD90 technician availability thin vertical", async () => {
  const { runPd90TechnicianAvailabilityThinVertical } = await import("./index.js");
  const out = runPd90TechnicianAvailabilityThinVertical();
  assert.deepEqual(out.statuses, ["available", "busy", "offline"]);
  assert.equal(out.payableFromAi, false);
});

test("PD94 emergency triage thin vertical", async () => {
  const { runPd94EmergencyTriageThinVertical } = await import("./index.js");
  const out = runPd94EmergencyTriageThinVertical();
  assert.equal(out.checklistId, "emergency_triage");
  assert.equal(out.catalogId, "emergency.triage.v1");
  assert.equal(out.completed, true);
  assert.equal(out.aiPricingBypassed, true);
  assert.equal(out.payableFromAi, false);
});

test("PD98 technician credentials thin vertical", async () => {
  const { runPd98TechnicianCredentialsThinVertical } = await import("./index.js");
  const out = runPd98TechnicianCredentialsThinVertical();
  assert.equal(out.blockedWithoutCredential, true);
  assert.equal(out.eligibleWhenVerified, true);
  assert.equal(out.payableFromAi, false);
});

test("PD100 job create intake thin vertical", async () => {
  const { runPd100JobCreateIntakeThinVertical } = await import("./index.js");
  const out = runPd100JobCreateIntakeThinVertical();
  assert.equal(out.status, "intake");
  assert.equal(out.needsHumanQuote, true);
  assert.equal(out.payableFromAi, false);
  assert.ok(out.jobId);
});

test("PD101 customer job status thin vertical", async () => {
  const { runPd101CustomerJobStatusThinVertical } = await import("./index.js");
  const out = runPd101CustomerJobStatusThinVertical();
  assert.ok(out.statusLabel);
  assert.ok(out.evidenceCount >= 1);
  assert.ok(out.timelineLen >= 2);
  assert.equal(out.payableFromAi, false);
});

test("PD102 tech Value Score dispute thin vertical", async () => {
  const { runPd102TechValueScoreDisputeThinVertical } = await import("./index.js");
  const out = runPd102TechValueScoreDisputeThinVertical();
  assert.equal(out.disputeOpened, true);
  assert.equal(out.openedBySelf, true);
  assert.equal(out.moneyPathClean, true);
  assert.equal(out.payableFromAi, false);
  assert.ok(out.disputeId);
});

test("PD106 technician profile cards thin vertical", async () => {
  const { runPd106TechnicianProfileCardsThinVertical } = await import("./index.js");
  const out = runPd106TechnicianProfileCardsThinVertical();
  assert.ok(out.cardCount >= 2);
  assert.equal(out.managersChoiceVisible, true);
  assert.equal(out.eligibleCard, true);
  assert.equal(out.payableFromAi, false);
});

test("PD107 credential expiry thin vertical", async () => {
  const { runPd107CredentialExpiryThinVertical } = await import("./index.js");
  const out = runPd107CredentialExpiryThinVertical();
  assert.equal(out.blockedWhenExpired, true);
  assert.equal(out.blockedWhenPastExpiresAt, true);
  assert.equal(out.eligibleWhenReverified, true);
  assert.equal(out.payableFromAi, false);
});

test("PD111 intake → book thin vertical", async () => {
  const { runPd111IntakeBookThinVertical } = await import("./index.js");
  const out = runPd111IntakeBookThinVertical();
  assert.equal(out.sameJobId, true);
  assert.equal(out.status, "booked");
  assert.equal(out.payableFromAi, false);
  assert.ok(out.jobId);
});

test("PD114 checklist catalog seed thin vertical", async () => {
  const { runPd114ChecklistCatalogSeedThinVertical } = await import("./index.js");
  const out = runPd114ChecklistCatalogSeedThinVertical();
  assert.ok(out.catalogSeedCount >= 8);
  assert.equal(out.libraryIdsPresent, true);
  assert.equal(out.trancheNotFullLibrary, true);
  assert.equal(out.payableFromAi, false);
});

test("PD31 Bluetooth ESC/POS print hook; not ZIMRA fiscal", async () => {
  const { runPd31BluetoothPrintThinVertical } = await import("./index.js");
  const out = await runPd31BluetoothPrintThinVertical({
    technicianId: "tech_pd31_t",
  });
  assert.equal(out.paired, true);
  assert.equal(out.ticketSent, true);
  assert.equal(out.escpos, true);
  assert.equal(out.zimraFiscalSor, false);
  assert.equal(out.fdmsVirtualOnly, true);
  assert.equal(out.payableFromAi, false);
});
