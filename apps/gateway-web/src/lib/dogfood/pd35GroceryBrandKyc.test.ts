/**
 * PD35 — grocery brand polish + KYC cert badge (gateway dogfood).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveGroceryCertBadge,
  runPd35GroceryBrandKycThinVertical,
  searchGroceryOffers,
} from "@dial/catalogue";

describe("PD35 grocery brand + KYC dogfood", () => {
  it("package thin vertical greens", () => {
    const r = runPd35GroceryBrandKycThinVertical();
    assert.equal(r.brandPolish, true);
    assert.equal(r.currencyUsd, true);
    assert.equal(r.chilledBadge, "food_safety_certified");
  });

  it("browse hits expose badge fields for /grocery recon", () => {
    const hits = searchGroceryOffers("", { sessionRole: "b2c" });
    assert.ok(hits.length >= 2);
    for (const h of hits) {
      assert.ok(typeof h.brand === "string" && h.brand.length > 0);
      assert.ok(
        h.supplierKycStatus === "verified" ||
          h.supplierKycStatus === "pending" ||
          h.supplierKycStatus === "none",
      );
      const badge = resolveGroceryCertBadge(h);
      if (h.supplierFormality === "informal") {
        assert.equal(badge, null);
      } else if (h.coldChain === "chilled" || h.coldChain === "frozen") {
        assert.ok(
          badge?.kind === "food_safety_certified" ||
            badge?.kind === "food_safety_required",
        );
      }
    }
  });
});
