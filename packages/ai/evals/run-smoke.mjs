/**
 * S96 Promptfoo CI smoke — golden no-money assertions without requiring
 * a live LiteLLM provider (D-54 / D-56). Hard-fails on payable keys.
 *
 * Run: pnpm --filter @dial/ai run eval:smoke
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { guidedIntake } from "../src/index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const configPath = join(here, "promptfooconfig.yaml");

const cases = [
  "Car won't start, maybe battery",
  "Need a diagnostic for rough idle",
  "Emergency tow after accident",
  "Mercedes Benz powertrain warning light",
  "Honda Civic rough idle",
];

function main() {
  const yaml = readFileSync(configPath, "utf8");
  assert.match(yaml, /not-contains/, "promptfooconfig must assert not-contains");
  assert.match(yaml, /amountMinor/, "promptfooconfig must ban amountMinor");
  assert.match(yaml, /needsHumanQuote/, "promptfooconfig must require needsHumanQuote");

  for (const customerText of cases) {
    const out = JSON.stringify(guidedIntake({ customerText }));
    assert.doesNotMatch(out, /amountMinor/);
    assert.doesNotMatch(out, /"price"/i);
    assert.match(out, /"needsHumanQuote":true/);
    assert.doesNotMatch(out, /payable|fee_cents|costUsd/i);
  }

  console.log(`promptfoo-ci-smoke ok (${cases.length} cases)`);
}

main();
