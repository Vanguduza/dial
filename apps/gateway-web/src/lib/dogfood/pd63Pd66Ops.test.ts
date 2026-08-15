/**
 * PD63–PD66 dogfood — POD media, catalogue claim, bonds, pending-review queue.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  runPd64CatalogueClaimResolveThinVertical,
  runPd66PendingReviewQueueThinVertical,
} from "@dial/catalogue";
import { runPd63PodSignatureGpsThinVertical } from "@dial/delivery";
import { runPd65SupplierBondThinVertical } from "@dial/suppliers";
import {
  GET as reviewGet,
  POST as reviewPost,
} from "../../app/api/admin/catalogue/review/route.js";
import {
  GET as bondsGet,
  POST as bondsPost,
} from "../../app/api/admin/suppliers/bonds/route.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("PD63 POD signature + GPS", async () => {
  const thin = runPd63PodSignatureGpsThinVertical();
  assert.equal(thin.hasSignature, true);
  assert.equal(thin.hasGps, true);
  assert.ok(thin.podMediaId);
  assert.equal(thin.mapSor, "maplibre");
});

test("PD64 catalogue claim resolve", async () => {
  const thin = runPd64CatalogueClaimResolveThinVertical();
  assert.equal(thin.claimedThenApproved, true);

  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "pd64_secret";
  try {
    const enqueue = await reviewPost(
      new Request("http://localhost/api/admin/catalogue/review", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd64_secret",
        },
        body: JSON.stringify({ action: "enqueue", rowCount: 1 }),
      }),
    );
    assert.equal(enqueue.status, 200);
    const body = (await enqueue.json()) as {
      pending: Array<{ reviewId: string; status: string }>;
    };
    const reviewId = body.pending[0]!.reviewId;
    const claim = await reviewPost(
      new Request("http://localhost/api/admin/catalogue/review", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd64_secret",
        },
        body: JSON.stringify({
          action: "claim",
          reviewId,
          claimedBy: "ops_dogfood",
        }),
      }),
    );
    assert.equal(claim.status, 200);
    const claimed = (await claim.json()) as {
      item: { status: string; claimedBy: string };
    };
    assert.equal(claimed.item.status, "claimed");
    assert.equal(claimed.item.claimedBy, "ops_dogfood");
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("PD65 supplier bonds", async () => {
  const page = readFileSync(
    join(root, "app/admin/suppliers/bonds/page.tsx"),
    "utf8",
  );
  assert.match(page, /admin-supplier-bonds/);

  const thin = runPd65SupplierBondThinVertical();
  assert.equal(thin.bondHeldThenReleased, true);

  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "pd65_secret";
  try {
    await bondsPost(
      new Request("http://localhost/api/admin/suppliers/bonds", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd65_secret",
        },
        body: JSON.stringify({
          action: "ensure_supplier",
          supplierId: "sup_pd65_api",
        }),
      }),
    );
    const hold = await bondsPost(
      new Request("http://localhost/api/admin/suppliers/bonds", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd65_secret",
        },
        body: JSON.stringify({
          action: "hold",
          supplierId: "sup_pd65_api",
          amountUsdMinor: "5000",
        }),
      }),
    );
    assert.equal(hold.status, 200);
    const list = await bondsGet(
      new Request(
        "http://localhost/api/admin/suppliers/bonds?supplierId=sup_pd65_api",
        { headers: { "x-internal-secret": "pd65_secret" } },
      ),
    );
    assert.equal(list.status, 200);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("PD66 pending review queue UI", async () => {
  const page = readFileSync(
    join(root, "app/admin/pending-review/page.tsx"),
    "utf8",
  );
  assert.match(page, /admin-pending-review/);
  assert.match(page, /Claim|pending_review/i);

  const thin = runPd66PendingReviewQueueThinVertical();
  assert.equal(thin.resolvedClearsPending, true);
  assert.equal(thin.claimedVisible, true);

  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "pd66_secret";
  try {
    const res = await reviewGet(
      new Request("http://localhost/api/admin/catalogue/review", {
        headers: { "x-internal-secret": "pd66_secret" },
      }),
    );
    assert.equal(res.status, 200);
    const body = (await res.json()) as { pending: unknown[] };
    assert.ok(Array.isArray(body.pending));
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});
