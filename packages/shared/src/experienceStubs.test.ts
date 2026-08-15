import assert from "node:assert/strict";
import { test } from "node:test";
import {
  evaluatePostHogFlag,
  queueFormbricksSurvey,
  runPd113FormbricksPosthogStubThinVertical,
  runPd117RealtimeStatusStubThinVertical,
  runPd118CsatFlowThinVertical,
  runPd122RiveGreetingStubThinVertical,
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

test("PD122 Rive greeting stub thin vertical", () => {
  const out = runPd122RiveGreetingStubThinVertical();
  assert.equal(out.assetPresent, true);
  assert.equal(out.voice, false);
  assert.equal(out.surface, "auth_home");
  assert.equal(out.payableFromAi, false);
});

test("PD130 Langfuse trace stub thin vertical", async () => {
  const { runPd130LangfuseTraceStubThinVertical } = await import(
    "./experienceStubs.js"
  );
  const out = runPd130LangfuseTraceStubThinVertical();
  assert.equal(out.skippedWithoutKey, true);
  assert.equal(out.moneyAuthority, false);
  assert.equal(out.payableFromAi, false);
});

test("PD128 Plane ops triage thin vertical", async () => {
  const { runPd128PlaneOpsTriageThinVertical } = await import("./opsTriage.js");
  const out = runPd128PlaneOpsTriageThinVertical();
  assert.equal(out.claimedThenResolved, true);
  assert.equal(out.slaOverdueVisible, true);
  assert.equal(out.planePattern, true);
  assert.equal(out.chatwootStatusSor, false);
  assert.equal(out.payableFromAi, false);
});
