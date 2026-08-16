/**
 * Phase 1 / G1 — worker-queues secret gate unit evidence.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { assertWorkerQueuesSecrets } from "@dial/shared";

test("G1 worker-queues sandbox fail-closed when secrets unset", () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const prevRedis = process.env.REDIS_URL;
  const prevSecret = process.env.INTERNAL_API_SECRET;
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.REDIS_URL;
  delete process.env.INTERNAL_API_SECRET;
  const gate = assertWorkerQueuesSecrets();
  assert.equal(gate.ok, false);
  assert.ok(gate.error?.includes("fail closed"));
  if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
  else process.env.DIAL_INTEGRATION_MODE = prevMode;
  if (prevRedis === undefined) delete process.env.REDIS_URL;
  else process.env.REDIS_URL = prevRedis;
  if (prevSecret === undefined) delete process.env.INTERNAL_API_SECRET;
  else process.env.INTERNAL_API_SECRET = prevSecret;
});
