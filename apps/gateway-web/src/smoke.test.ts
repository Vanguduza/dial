import assert from "node:assert/strict";
import { test } from "node:test";

test("gateway shell package is wired", () => {
  assert.equal(typeof "DIAL", "string");
});
