import assert from "node:assert/strict";
import { test } from "node:test";
import { cssVariables, dialTokens } from "./index.js";

test("tokens expose brand primary", () => {
  assert.equal(typeof dialTokens.color.brand.primary, "string");
  assert.match(dialTokens.color.brand.primary, /^#/);
});

test("cssVariables maps brand colors", () => {
  const v = cssVariables();
  assert.equal(v["--dial-color-brand-primary"], dialTokens.color.brand.primary);
});
