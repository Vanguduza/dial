import assert from "node:assert/strict";
import { test } from "node:test";
import {
  evaluatePostHogFlag,
  queueFormbricksSurvey,
  runPd113FormbricksPosthogStubThinVertical,
  runPd117RealtimeStatusStubThinVertical,
  runPd118CsatFlowThinVertical,
} from "./experienceStubs.js";

test("PD113 Formbricks + PostHog stub thin vertical", () => {
  const out = runPd113FormbricksPosthogStubThinVertical();
  assert.equal(out.surveySkippedWithoutKey, true);
  assert.equal(out.flagOffWithoutKey, true);
  assert.equal(out.moneyAuthority, false);
  assert.equal(out.payableFromAi, false);
});

test("PD113 Formbricks queues when key set", () => {
  const prev = process.env.FORMBRICKS_API_KEY;
  process.env.FORMBRICKS_API_KEY = "fixture_key";
  try {
    const s = queueFormbricksSurvey({ surveyId: "csat", jobId: "job_1" });
    assert.equal(s.status, "queued");
    assert.equal(s.fixture, true);
    assert.equal(s.payableFromAi, false);
  } finally {
    if (prev !== undefined) process.env.FORMBRICKS_API_KEY = prev;
    else delete process.env.FORMBRICKS_API_KEY;
  }
});

test("PD113 PostHog flag has no money authority", () => {
  const f = evaluatePostHogFlag({ flagKey: "x" });
  assert.equal(f.moneyAuthority, false);
});

test("PD117 Realtime status stub thin vertical", () => {
  const out = runPd117RealtimeStatusStubThinVertical();
  assert.equal(out.skippedWithoutKeys, true);
  assert.equal(out.readOnly, true);
  assert.equal(out.mapSor, "maplibre");
  assert.equal(out.payableFromAi, false);
});

test("PD118 FLOW_CSAT thin vertical", () => {
  const out = runPd118CsatFlowThinVertical();
  assert.equal(out.score, 5);
  assert.equal(out.statusFrom, "erp");
  assert.equal(out.surveyId, "FLOW_CSAT");
  assert.equal(out.payableFromAi, false);
});
