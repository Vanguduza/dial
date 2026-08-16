/**
 * Phase 10 prep dogfood — food E2E fixture spine, liquor hidden, g10Claimed=false.
 * Does not claim G10 (needs G5+G8 sandbox order→POD + Meili live hits).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test, beforeEach } from "node:test";
import { fileURLToPath } from "node:url";
import {
  __resetGroceryForTests,
  assertGroceryPublishAllowed,
  countGroceryInformalB2bLeaks,
  searchGroceryOffers,
} from "@dial/catalogue";
import { runG1GroceryThinVertical } from "./g1Spine.js";

const groceryRoot = join(dirname(fileURLToPath(import.meta.url)), "../../app/grocery");

beforeEach(() => {
  __resetGroceryForTests();
});

test("Phase10-prep food spine g10Claimed=false + EcoCash|COD + no liquor", async () => {
  const result = await runG1GroceryThinVertical({
    offerId: "groc_milk_1l",
    payChoice: "ecocash",
    buyerSegment: "b2c",
  });
  assert.equal(result.g10Claimed, false);
  assert.equal(result.currency, "USD");
  assert.equal(result.imttOnCheckoutLines, false);
  assert.ok(result.jobReserveId.startsWith("jr_"));
  assert.ok(result.deliveryJobId.startsWith("dj_"));

  const cod = await runG1GroceryThinVertical({
    offerId: "groc_rice_2kg",
    payChoice: "cod",
    buyerSegment: "b2c",
  });
  assert.equal(cod.g10Claimed, false);
  assert.ok(cod.codOrderId);
});

test("Phase10-prep B2B informal leak=0 + liquor publish reject", () => {
  assert.equal(countGroceryInformalB2bLeaks(""), 0);
  const b2b = searchGroceryOffers("bread", { sessionRole: "b2b" });
  assert.ok(b2b.every((o) => o.supplierFormality === "formal"));
  assert.throws(
    () =>
      assertGroceryPublishAllowed({
        offerSource: "MARKETPLACE",
        vertical: "liquor",
        ageGateRequired: true,
      }),
    /liquor|age-gate/i,
  );
});

test("Phase10-prep grocery checkout web EcoCash|COD CTAs (no liquor)", () => {
  const form = readFileSync(
    join(groceryRoot, "checkout/GroceryCheckoutForm.tsx"),
    "utf8",
  );
  assert.match(form, /EcoCash/);
  assert.match(form, /Cash on delivery/);
  assert.match(form, /DisclosureReviewGate/);
  assert.match(form, /pay\("ecocash"\)/);
  assert.match(form, /pay\("cod"\)/);
  const home = readFileSync(join(groceryRoot, "page.tsx"), "utf8");
  assert.doesNotMatch(home, /\/grocery\/liquor|liquor_offers/i);
});
