import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  __resetTakeRateForTests,
  createGroceryTakeRateDraft,
  getPublishedGroceryTakeRate,
  publishTakeRateLadder,
  resolveTakeRateBps,
  runPd34B2bTakeRateThinVertical,
} from "./takeRate.js";

describe("PD34 grocery take-rate", () => {
  it("draft → publish → resolve bps; never AI payable; no liquor", () => {
    __resetTakeRateForTests();
    const draft = createGroceryTakeRateDraft({
      setBy: "ops",
      tiers: [
        { minGmvUsdMinor: 0n, takeRateBps: 800 },
        { minGmvUsdMinor: 50_00n, takeRateBps: 500 },
      ],
    });
    assert.equal(draft.status, "draft");
    assert.equal(draft.payableFromAi, false);
    assert.equal(draft.liquorAllowed, false);
    const published = publishTakeRateLadder(draft.ladderId, "ops");
    assert.equal(published.status, "published");
    assert.equal(getPublishedGroceryTakeRate()?.ladderId, draft.ladderId);
    assert.equal(resolveTakeRateBps(published, 10_00n), 800);
    assert.equal(resolveTakeRateBps(published, 50_00n), 500);
  });

  it("rejects non-integer / out-of-range bps", () => {
    __resetTakeRateForTests();
    assert.throws(() =>
      createGroceryTakeRateDraft({
        setBy: "ops",
        tiers: [{ minGmvUsdMinor: 0n, takeRateBps: 12.5 }],
      }),
    );
    assert.throws(() =>
      createGroceryTakeRateDraft({
        setBy: "ops",
        tiers: [{ minGmvUsdMinor: 0n, takeRateBps: 10_001 }],
      }),
    );
  });

  it("runPd34B2bTakeRateThinVertical greens", () => {
    const r = runPd34B2bTakeRateThinVertical();
    assert.equal(r.draftCreated, true);
    assert.equal(r.published, true);
    assert.equal(r.resolvedBps, 600);
    assert.equal(r.b2bFormalOnly, true);
    assert.equal(r.payableFromAi, false);
    assert.equal(r.liquorAllowed, false);
  });
});
