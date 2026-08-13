import assert from "node:assert/strict";
import { test } from "node:test";
import { pingInternalApiHealth } from "./internalApi.js";

test("S131 pingInternalApiHealth fixture ok + sandbox fail-closed", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const fx = await pingInternalApiHealth();
  assert.equal(fx.ok, true);
  assert.equal(fx.configured, true);

  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.INTERNAL_API_SECRET;
  const closed = await pingInternalApiHealth();
  assert.equal(closed.ok, false);
  assert.ok(closed.error?.includes("fail closed"));
  process.env.DIAL_INTEGRATION_MODE = "fixture";
});
