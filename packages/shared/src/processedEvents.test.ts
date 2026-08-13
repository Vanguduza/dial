import assert from "node:assert/strict";
import { test } from "node:test";
import { __resetIdempotencyForTests } from "./idempotency.js";
import { claimProcessedEventDurable } from "./processedEvents.js";

test("S102 claimProcessedEventDurable fixture uses memory store", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetIdempotencyForTests();
  assert.equal(
    await claimProcessedEventDurable({ eventId: "d1", source: "whatsapp" }),
    "accepted",
  );
  assert.equal(
    await claimProcessedEventDurable({ eventId: "d1", source: "whatsapp" }),
    "duplicate",
  );
});

test("S102 sandbox durable claim fail closed without Supabase", async () => {
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_ANON_KEY;
  await assert.rejects(() =>
    claimProcessedEventDurable({ eventId: "x", source: "psp" }),
  );
  process.env.DIAL_INTEGRATION_MODE = "fixture";
});
