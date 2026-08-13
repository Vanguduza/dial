import assert from "node:assert/strict";
import { test } from "node:test";
import {
  __resetIdempotencyForTests,
  claimProcessedEvent,
  hasProcessedEvent,
} from "./idempotency.js";

test("S101 claimProcessedEvent accepts once then duplicates", () => {
  __resetIdempotencyForTests();
  assert.equal(
    claimProcessedEvent({ eventId: "evt_1", source: "paynow" }),
    "accepted",
  );
  assert.equal(hasProcessedEvent({ eventId: "evt_1", source: "paynow" }), true);
  assert.equal(
    claimProcessedEvent({ eventId: "evt_1", source: "paynow" }),
    "duplicate",
  );
  assert.equal(
    claimProcessedEvent({ eventId: "evt_1", source: "ecocash" }),
    "accepted",
  );
  assert.throws(() => claimProcessedEvent({ eventId: "", source: "x" }));
});
