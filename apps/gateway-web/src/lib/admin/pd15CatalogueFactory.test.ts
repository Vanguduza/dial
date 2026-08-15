/**
 * PD15 Catalogue Factory admin tests — CSV → approve → Meili + demand-gap.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  __resetCatalogueForTests,
  ingestCatalogueCsv,
  runPd15CatalogueFactoryThinVertical,
} from "@dial/catalogue";
import {
  GET as reviewGet,
  POST as reviewPost,
} from "../../app/api/admin/catalogue/review/route.js";

const factoryPage = join(
  process.cwd(),
  "src/app/admin/catalogue/factory/page.tsx",
);

test("PD15 admin Factory UI exists", () => {
  const src = readFileSync(factoryPage, "utf8");
  assert.match(src, /Catalogue Factory/);
  assert.match(src, /Ingest CSV|ingest_csv/);
  assert.match(src, /Publish to Meili|publish_grocery/);
  assert.match(src, /Demand-gap|noResultCount|no-result/i);
  assert.match(src, /No AI auto-publish|no auto-publish/i);
  assert.match(src, /No liquor/);
  assert.doesNotMatch(src, /autoPublish\s*[:=]\s*true/);
});

test("PD15 package thin vertical: CSV → approve → Meili spare+grocery", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const out = await runPd15CatalogueFactoryThinVertical();
  assert.equal(out.spareOfferId, "off_pd15_formal");
  assert.equal(out.groceryOfferId, "groc_pd15_oats");
  assert.ok(out.spareIndex.includes("spare") || out.spareIndex.length > 0);
  assert.ok(out.groceryIndex.includes("grocery") || out.groceryIndex.length > 0);
  assert.equal(out.informalB2bLeaks, 0);
  assert.equal(out.autoPublishForbidden, true);
  assert.equal(out.payableFromAi, false);
  assert.ok(out.demandGap.noResultCount >= 1);
});

test("PD15 CSV rejects liquor and float prices", () => {
  __resetCatalogueForTests();
  const out = ingestCatalogueCsv(
    [
      "vertical,offerId,title,unitPriceUsdMinor,supplierFormality,brand,oem,qualityTier",
      "spare,off_ok,Ok part,100,formal,Brand,OEM,OES",
      "liquor,beer,Beer,200,formal,Brand,750ml,ambient",
      "spare,off_float,Bad,12.5,formal,Brand,OEM,OES",
    ].join("\n"),
  );
  assert.equal(out.batches.length, 1);
  assert.ok(out.rejectedRows.length >= 2);
  assert.ok(out.reviews.every((r) => r.draft?.payableFromAi === false));
});

test("PD15 admin API: fail closed, ingest, approve, publish grocery", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetCatalogueForTests();
  delete process.env.INTERNAL_API_SECRET;

  const closed = await reviewGet(new Request("http://localhost/api/admin/catalogue/review"));
  assert.equal(closed.status, 503);

  process.env.INTERNAL_API_SECRET = "pd15-test-secret";
  const unauth = await reviewGet(
    new Request("http://localhost/api/admin/catalogue/review", {
      headers: { "x-internal-secret": "wrong" },
    }),
  );
  assert.equal(unauth.status, 401);

  const headers = {
    "content-type": "application/json",
    "x-internal-secret": "pd15-test-secret",
  };

  const csv = [
    "vertical,offerId,title,unitPriceUsdMinor,supplierFormality,brand,oem,qualityTier",
    "grocery,groc_api_pd15,API oats,399,formal,Dairibord,1kg,ambient",
  ].join("\n");

  const ingest = await reviewPost(
    new Request("http://localhost/api/admin/catalogue/review", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "ingest_csv", csvText: csv }),
    }),
  );
  assert.equal(ingest.status, 200);
  const ingestJson = (await ingest.json()) as {
    reviews: Array<{ reviewId: string; batchId: string; status: string }>;
  };
  assert.equal(ingestJson.reviews.length, 1);

  const approve = await reviewPost(
    new Request("http://localhost/api/admin/catalogue/review", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "approve",
        reviewId: ingestJson.reviews[0]!.reviewId,
      }),
    }),
  );
  assert.equal(approve.status, 200);

  const publish = await reviewPost(
    new Request("http://localhost/api/admin/catalogue/review", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "publish_grocery",
        batchId: ingestJson.reviews[0]!.batchId,
      }),
    }),
  );
  assert.equal(publish.status, 200);
  const pubJson = (await publish.json()) as {
    offerId: string;
    taskUid: string;
    indexUid: string;
  };
  assert.equal(pubJson.offerId, "groc_api_pd15");
  assert.equal(pubJson.taskUid, "fixture");
  assert.ok(pubJson.indexUid);

  const gapRes = await reviewGet(
    new Request("http://localhost/api/admin/catalogue/review?view=demand_gap", {
      headers,
    }),
  );
  assert.equal(gapRes.status, 200);
  const gapJson = (await gapRes.json()) as { demandGap: { pendingReview: number } };
  assert.equal(gapJson.demandGap.pendingReview, 0);
});
