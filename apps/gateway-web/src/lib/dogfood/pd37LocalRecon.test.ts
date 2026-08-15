/**
 * PD37 — local Playwright recon dogfood.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runPd37LocalPlaywrightReconThinVertical } from "./pd37LocalReconSpine.js";

describe("PD37 local Playwright recon", () => {
  it("thin vertical greens (live or harness)", async () => {
    const r = await runPd37LocalPlaywrightReconThinVertical();
    assert.equal(r.spareUsdBrowse, true);
    assert.equal(r.groceryBrandAndCertMarkers, true);
    assert.equal(r.spareEcoCashCodCtas, true);
    assert.equal(r.groceryEcoCashCodCtas, true);
    assert.equal(r.waCloudApiNoBaileys, true);
    assert.equal(r.liquorForbidden, true);
    assert.equal(r.payableFromAi, false);
    assert.ok(r.recon.length >= 1);
    assert.ok(r.mode === "live" || r.mode === "harness");
    // Chromium preferred; source DoD still greens if browsers not installed yet.
    assert.ok(
      r.playwrightChromium === true ||
        r.recon.some((n) => n.surface === "playwright-chromium"),
    );
  });
});
