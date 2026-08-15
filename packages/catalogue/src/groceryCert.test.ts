/**
 * PD35 — grocery brand polish + KYC / food-safety cert badges.
 */
import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  __resetGroceryForTests,
  publishGroceryOfferFromFactory,
  resolveGroceryCertBadge,
  runPd35GroceryBrandKycThinVertical,
  searchGroceryOffers,
} from "./grocery.js";

beforeEach(() => {
  __resetGroceryForTests();
});

describe("PD35 grocery KYC / food-safety cert badges", () => {
  it("thin vertical greens", () => {
    const r = runPd35GroceryBrandKycThinVertical();
    assert.equal(r.chilledBadge, "food_safety_certified");
    assert.equal(r.ambientBadge, "kyc_verified");
    assert.equal(r.informalBadge, null);
    assert.equal(r.payableFromAi, false);
    assert.equal(r.liquorAllowed, false);
    assert.equal(r.b2bFormalOnly, true);
  });

  it("informal never badges; chilled missing cert shows required", () => {
    assert.equal(
      resolveGroceryCertBadge({
        supplierFormality: "informal",
        coldChain: "chilled",
        supplierKycStatus: "none",
        foodSafetyCertStatus: "n_a",
      }),
      null,
    );
    const missing = resolveGroceryCertBadge({
      supplierFormality: "formal",
      coldChain: "frozen",
      supplierKycStatus: "verified",
      foodSafetyCertStatus: "missing",
    });
    assert.equal(missing?.kind, "food_safety_required");
  });

  it("factory publish defaults KYC/cert; B2B formal only", () => {
    const formal = publishGroceryOfferFromFactory({
      offerId: "groc_pd35_frozen",
      title: "Frozen peas 500g",
      brand: "Cairns",
      unitPriceUsdMinor: 2_20n,
      unitLabel: "500g",
      coldChain: "frozen",
      supplierFormality: "formal",
      supplierDisplayName: "OK Express Agency",
      foodSafetyCertStatus: "certified",
      supplierKycStatus: "verified",
    });
    assert.equal(formal.foodSafetyCertStatus, "certified");
    assert.equal(resolveGroceryCertBadge(formal)?.kind, "food_safety_certified");

    const informal = publishGroceryOfferFromFactory({
      offerId: "groc_pd35_informal",
      title: "Informal greens",
      brand: "Local",
      unitPriceUsdMinor: 90n,
      unitLabel: "bunch",
      coldChain: "ambient",
      supplierFormality: "informal",
      supplierDisplayName: "Street stall",
    });
    assert.equal(informal.supplierKycStatus, "none");
    assert.equal(resolveGroceryCertBadge(informal), null);

    const b2b = searchGroceryOffers("pd35", { sessionRole: "b2b" });
    assert.ok(b2b.every((o) => o.supplierFormality === "formal"));
  });
});
