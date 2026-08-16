import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertWorkerQueuesSecrets,
  assertWorkerTemporalSecrets,
  requireWorkerQueuesSecrets,
  requireWorkerTemporalSecrets,
} from "./workerSecrets.js";

test("G1 worker-queues fail-closed without REDIS_URL / INTERNAL_API_SECRET", () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const prevRedis = process.env.REDIS_URL;
  const prevSecret = process.env.INTERNAL_API_SECRET;

  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.REDIS_URL;
  delete process.env.INTERNAL_API_SECRET;
  const closed = assertWorkerQueuesSecrets();
  assert.equal(closed.ok, false);
  assert.ok(closed.missing.includes("REDIS_URL"));
  assert.ok(closed.missing.includes("INTERNAL_API_SECRET"));
  assert.throws(() => requireWorkerQueuesSecrets());

  process.env.REDIS_URL = "redis://127.0.0.1:6379";
  process.env.INTERNAL_API_SECRET = "test_secret_not_real";
  assert.equal(assertWorkerQueuesSecrets().ok, true);

  if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
  else process.env.DIAL_INTEGRATION_MODE = prevMode;
  if (prevRedis === undefined) delete process.env.REDIS_URL;
  else process.env.REDIS_URL = prevRedis;
  if (prevSecret === undefined) delete process.env.INTERNAL_API_SECRET;
  else process.env.INTERNAL_API_SECRET = prevSecret;
});

test("G1 worker-temporal fail-closed without TEMPORAL_ADDRESS / INTERNAL_API_SECRET", () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const prevAddr = process.env.TEMPORAL_ADDRESS;
  const prevSecret = process.env.INTERNAL_API_SECRET;

  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.TEMPORAL_ADDRESS;
  delete process.env.INTERNAL_API_SECRET;
  const closed = assertWorkerTemporalSecrets();
  assert.equal(closed.ok, false);
  assert.ok(closed.missing.includes("TEMPORAL_ADDRESS"));
  assert.throws(() => requireWorkerTemporalSecrets());

  if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
  else process.env.DIAL_INTEGRATION_MODE = prevMode;
  if (prevAddr === undefined) delete process.env.TEMPORAL_ADDRESS;
  else process.env.TEMPORAL_ADDRESS = prevAddr;
  if (prevSecret === undefined) delete process.env.INTERNAL_API_SECRET;
  else process.env.INTERNAL_API_SECRET = prevSecret;
});
