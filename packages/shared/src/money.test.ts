import assert from "node:assert/strict";
import { test } from "node:test";
import { money, moneyFromString } from "./money.js";

test("money accepts bigint minor units", () => {
  const m = money(1500n, "USD");
  assert.equal(m.amountMinor, 1500n);
  assert.equal(m.currency, "USD");
});

test("moneyFromString parses minor units", () => {
  const m = moneyFromString("250", "ZWG");
  assert.equal(m.amountMinor, 250n);
});

test("money rejects non-bigint", () => {
  assert.throws(() => money(1.5 as unknown as bigint, "USD"), TypeError);
});
