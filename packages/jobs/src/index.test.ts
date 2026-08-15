import assert from "node:assert/strict";
import { test } from "node:test";
import {
  __resetJobsForTests,
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
  setValueScoreSnapshot,
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
