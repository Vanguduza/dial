import assert from "node:assert/strict";
import { test } from "node:test";
import {
  __resetJobsForTests,
  classifyJob,
  getValueScoreSnapshot,
  isTechnicianEligible,
  listJobClassDefinitions,
  listTradeDefinitions,
  quoteFromRateCard,
  setValueScoreSnapshot,
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
