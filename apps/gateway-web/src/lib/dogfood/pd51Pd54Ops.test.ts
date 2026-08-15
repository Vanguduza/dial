/**
 * PD51–PD54 dogfood — courier UX, Take-Home polish, disputes, grocery demand-gap.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runPd51CourierUxThinVertical } from "@dial/delivery";
import { runPd52TakeHomePolishThinVertical } from "@dial/payments";
import { runPd53AdminDisputesThinVertical } from "@dial/jobs";
import { runPd54GroceryDemandGapThinVertical } from "@dial/catalogue";
import {
  GET as disputesGet,
  POST as disputesPost,
} from "../../app/api/admin/disputes/route.js";
import {
  GET as demandGet,
  POST as demandPost,
} from "../../app/api/admin/grocery/demand-gap/route.js";
import { POST as takeHomePost } from "../../app/api/admin/tech/take-home/route.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const androidRoot = join(process.cwd(), "../delivery-android");

test("PD51 courier UX deepen — POD photo + float banner surfaces", () => {
  const page = readFileSync(
    join(root, "app/delivery/courier/page.tsx"),
    "utf8",
  );
  assert.match(page, /courier-hub/);
  assert.match(page, /cod-float-banner|floatBanner|Ack COD float/);
  assert.match(page, /photoRef|Capture POD/);

  const app = readFileSync(
    join(androidRoot, "app/src/main/java/zw/co/dial/delivery/ui/DeliveryApp.kt"),
    "utf8",
  );
  assert.match(app, /FLOAT_BANNER|float banner|Ack float/i);
  assert.match(app, /photoRef|POD photo/);

  const client = readFileSync(
    join(
      androidRoot,
      "core/network/src/main/kotlin/zw/co/dial/delivery/network/DialDeliveryClient.kt",
    ),
    "utf8",
  );
  assert.match(client, /photoRef/);

  const out = runPd51CourierUxThinVertical();
  assert.equal(out.podPhotoCaptured, true);
  assert.equal(out.floatBannerShown, true);
  assert.equal(out.codAckRecorded, true);
  assert.equal(out.mapSor, "maplibre");
  assert.equal(out.payableFromAi, false);
});

test("PD52 Take-Home polish — ITF263 + breakdown API", async () => {
  const page = readFileSync(
    join(root, "app/admin/tech/take-home/page.tsx"),
    "utf8",
  );
  assert.match(page, /admin-tech-take-home/);
  assert.match(page, /Upload ITF263|Verify ITF263|Compute Take-Home/);

  const thin = runPd52TakeHomePolishThinVertical({
    technicianId: "tech_pd52_dog",
  });
  assert.equal(thin.beforeRateBps, 3000);
  assert.equal(thin.afterRateBps, 0);
  assert.equal(thin.payableFromAi, false);

  process.env.INTERNAL_API_SECRET = "pd52_secret";
  const res = await takeHomePost(
    new Request("http://localhost/api/admin/tech/take-home", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": "pd52_secret",
      },
      body: JSON.stringify({
        action: "breakdown",
        technicianId: "tech_pd52_api",
        grossUsdMinor: "12000",
        dialFeeUsdMinor: "2000",
      }),
    }),
  );
  assert.equal(res.status, 200);
  const body = (await res.json()) as {
    breakdown: { rateBps: number; payableFromAi: boolean };
  };
  assert.equal(body.breakdown.payableFromAi, false);
  assert.equal(body.breakdown.rateBps, 3000);
  delete process.env.INTERNAL_API_SECRET;
});

test("PD53 admin disputes queue", async () => {
  const page = readFileSync(
    join(root, "app/admin/disputes/page.tsx"),
    "utf8",
  );
  assert.match(page, /admin-disputes-queue/);
  assert.match(page, /Uphold|Reject/);

  const thin = runPd53AdminDisputesThinVertical();
  assert.equal(thin.resolvedStatus, "upheld");
  assert.equal(thin.payableFromAi, false);

  process.env.INTERNAL_API_SECRET = "pd53_secret";
  const seed = await disputesPost(
    new Request("http://localhost/api/admin/disputes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": "pd53_secret",
      },
      body: JSON.stringify({
        action: "seed_and_open",
        technicianId: "tech_pd53_api",
        reason: "api dispute",
        openedBy: "ops",
      }),
    }),
  );
  assert.equal(seed.status, 200);
  const seeded = (await seed.json()) as {
    dispute: { disputeId: string };
  };
  const list = await disputesGet(
    new Request("http://localhost/api/admin/disputes?status=open", {
      headers: { "x-internal-secret": "pd53_secret" },
    }),
  );
  assert.equal(list.status, 200);
  const resolve = await disputesPost(
    new Request("http://localhost/api/admin/disputes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": "pd53_secret",
      },
      body: JSON.stringify({
        action: "resolve",
        disputeId: seeded.dispute.disputeId,
        resolution: "rejected",
        resolvedBy: "ops_lead",
      }),
    }),
  );
  assert.equal(resolve.status, 200);
  delete process.env.INTERNAL_API_SECRET;
});

test("PD54 grocery Meili demand-gap admin", async () => {
  const page = readFileSync(
    join(root, "app/admin/grocery/demand-gap/page.tsx"),
    "utf8",
  );
  assert.match(page, /admin-grocery-demand-gap/);
  assert.match(page, /liquor|food/i);

  const thin = runPd54GroceryDemandGapThinVertical();
  assert.equal(thin.noResultCount, 3);
  assert.equal(thin.liquorAllowed, false);
  assert.equal(thin.payableFromAi, false);

  process.env.INTERNAL_API_SECRET = "pd54_secret";
  const get = await demandGet(
    new Request("http://localhost/api/admin/grocery/demand-gap", {
      headers: { "x-internal-secret": "pd54_secret" },
    }),
  );
  assert.equal(get.status, 200);
  const post = await demandPost(
    new Request("http://localhost/api/admin/grocery/demand-gap", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": "pd54_secret",
      },
      body: JSON.stringify({
        action: "record_no_result",
        query: "pd54 api gap",
      }),
    }),
  );
  assert.equal(post.status, 200);
  const body = (await post.json()) as {
    demandGap: { liquorAllowed: boolean; payableFromAi: boolean };
  };
  assert.equal(body.demandGap.liquorAllowed, false);
  assert.equal(body.demandGap.payableFromAi, false);
  delete process.env.INTERNAL_API_SECRET;
});
