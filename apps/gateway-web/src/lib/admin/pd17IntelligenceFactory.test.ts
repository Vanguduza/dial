/**
 * PD17 Intelligence Factory admin tests.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  __resetIntelligenceForTests,
  runPd17IntelligenceFactoryThinVertical,
} from "@dial/ai";
import {
  GET as intelGet,
  POST as intelPost,
} from "../../app/api/admin/intelligence/route.js";

const pagePath = join(
  process.cwd(),
  "src/app/admin/intelligence/factory/page.tsx",
);

test("PD17 admin Factory UI exists", () => {
  const src = readFileSync(pagePath, "utf8");
  assert.match(src, /Intelligence Factory/);
  assert.match(src, /Promptfoo/);
  assert.match(src, /Human approve|human_approve/);
  assert.match(src, /auto-publish|auto_publish/i);
  assert.match(src, /Simulated|never auto-pays/i);
  assert.match(src, /Flash-Lite|P1/);
  assert.doesNotMatch(src, /autoPublish\s*[:=]\s*true/);
});

test("PD17 package thin vertical", () => {
  const out = runPd17IntelligenceFactoryThinVertical();
  assert.equal(out.canPromoteOnlyWithBothGates, true);
  assert.equal(out.autoPublishForbidden, true);
  assert.equal(out.simulatedNeverPays, true);
  assert.equal(out.payableFromAi, false);
});

test("PD17 admin API: fail closed + shadow→promptfoo→human→promote", async () => {
  __resetIntelligenceForTests();
  delete process.env.INTERNAL_API_SECRET;

  const closed = await intelGet(
    new Request("http://localhost/api/admin/intelligence"),
  );
  assert.equal(closed.status, 503);

  process.env.INTERNAL_API_SECRET = "pd17-test-secret";
  const headers = {
    "content-type": "application/json",
    "x-internal-secret": "pd17-test-secret",
  };

  const create = await intelPost(
    new Request("http://localhost/api/admin/intelligence", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "create_shadow",
        title: "API checklist",
        draftBody: "Step A — human quote required",
        kind: "checklist",
      }),
    }),
  );
  assert.equal(create.status, 200);
  const createJson = (await create.json()) as { shadowId: string };
  assert.ok(createJson.shadowId);

  const earlyPromote = await intelPost(
    new Request("http://localhost/api/admin/intelligence", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "promote",
        shadowId: createJson.shadowId,
      }),
    }),
  );
  assert.equal(earlyPromote.status, 400);

  await intelPost(
    new Request("http://localhost/api/admin/intelligence", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "promptfoo",
        shadowId: createJson.shadowId,
        promptfooPassed: true,
      }),
    }),
  );
  await intelPost(
    new Request("http://localhost/api/admin/intelligence", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "human_approve",
        shadowId: createJson.shadowId,
        approver: "ops_test",
      }),
    }),
  );
  const promote = await intelPost(
    new Request("http://localhost/api/admin/intelligence", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "promote",
        shadowId: createJson.shadowId,
      }),
    }),
  );
  assert.equal(promote.status, 200);
  const promoteJson = (await promote.json()) as { datasetVersionId: string };
  assert.ok(promoteJson.datasetVersionId);

  const auto = await intelPost(
    new Request("http://localhost/api/admin/intelligence", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "attempt_auto_publish" }),
    }),
  );
  assert.equal(auto.status, 200);
  const autoJson = (await auto.json()) as { blocked?: boolean };
  assert.equal(autoJson.blocked, true);
});
