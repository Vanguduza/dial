import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import {
  __resetRateLimitForTests,
  apiError,
  parseJsonBody,
  rateLimitTake,
} from "./http.js";

test("parseJsonBody rejects identity fields and unknown-safe schemas", async () => {
  const schema = z.object({ slotId: z.string() }).strict();
  const bad = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ slotId: "s1", userId: "evil" }),
  });
  const rejected = await parseJsonBody(bad, schema);
  assert.equal(rejected.ok, false);
  if (!rejected.ok) assert.equal(rejected.code, "identity_from_body");

  const good = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ slotId: "s1" }),
  });
  const parsed = await parseJsonBody(good, schema);
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.equal(parsed.data.slotId, "s1");
});

test("rateLimitTake exhausts then recovers", () => {
  __resetRateLimitForTests();
  const key = "auth:127.0.0.1";
  for (let i = 0; i < 3; i += 1) {
    assert.equal(rateLimitTake({ key, limit: 3, windowMs: 60_000 }).ok, true);
  }
  const blocked = rateLimitTake({ key, limit: 3, windowMs: 60_000 });
  assert.equal(blocked.ok, false);
  const later = rateLimitTake({
    key,
    limit: 3,
    windowMs: 60_000,
    now: Date.now() + 60_000,
  });
  assert.equal(later.ok, true);
});

test("apiError envelope shape", () => {
  const body = apiError("nope", "unauthorized", "req_test");
  assert.deepEqual(body, {
    error: "nope",
    code: "unauthorized",
    requestId: "req_test",
  });
});
