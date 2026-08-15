/**
 * PD67–PD70 dogfood — run inbox, offer countdown, variations, promo balance.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  runPd67DeliveryRunInboxThinVertical,
  runPd68OfferCountdownTimeoutThinVertical,
} from "@dial/delivery";
import { runPd69JobVariationApproveThinVertical } from "@dial/jobs";
import { runPd70CustomerPromoBalanceThinVertical } from "@dial/promotions";
import {
  GET as variationsGet,
  POST as variationsPost,
} from "../../app/api/admin/jobs/variations/route.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("PD67 delivery run inbox", () => {
  const thin = runPd67DeliveryRunInboxThinVertical();
  assert.equal(thin.started, true);
  assert.ok(thin.runId);
  assert.equal(thin.mapSor, "maplibre");
});

test("PD68 offer countdown timeout", () => {
  const thin = runPd68OfferCountdownTimeoutThinVertical();
  assert.equal(thin.countdownOk, true);
  assert.equal(thin.timedOut, true);
});

test("PD69 job variations admin", async () => {
  const page = readFileSync(
    join(root, "app/admin/jobs/variations/page.tsx"),
    "utf8",
  );
  assert.match(page, /admin-job-variations/);

  const thin = runPd69JobVariationApproveThinVertical();
  assert.equal(thin.aiProposeBlocked, true);
  assert.equal(thin.approved, true);

  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "pd69_secret";
  try {
    const propose = await variationsPost(
      new Request("http://localhost/api/admin/jobs/variations", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd69_secret",
        },
        body: JSON.stringify({
          action: "propose",
          jobId: "job_pd69_api",
          proposedBy: "tech_api",
          draftDeltaUsdMinor: "1200",
          reason: "Wiring harness",
        }),
      }),
    );
    assert.equal(propose.status, 200);
    const body = (await propose.json()) as {
      variation: { variationId: string };
    };
    const list = await variationsGet(
      new Request(
        "http://localhost/api/admin/jobs/variations?status=proposed",
        { headers: { "x-internal-secret": "pd69_secret" } },
      ),
    );
    assert.equal(list.status, 200);
    const approve = await variationsPost(
      new Request("http://localhost/api/admin/jobs/variations", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd69_secret",
        },
        body: JSON.stringify({
          action: "approve",
          variationId: body.variation.variationId,
          approvedBy: "ops_api",
        }),
      }),
    );
    assert.equal(approve.status, 200);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("PD70 account promo balance UI", () => {
  const page = readFileSync(join(root, "app/account/promo/page.tsx"), "utf8");
  assert.match(page, /account-promo-balance/);
  assert.match(page, /cash-out|D-42/i);

  const thin = runPd70CustomerPromoBalanceThinVertical();
  assert.equal(thin.cashOutForbidden, true);
  assert.equal(thin.balanceMinor, "1500");
});
