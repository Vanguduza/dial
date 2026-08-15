/**
 * PD16 Promotions & referrals admin tests.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  __resetPromoAdminForTests,
  runPd16PromotionsAdminThinVertical,
} from "@dial/promotions";
import {
  GET as promoGet,
  POST as promoPost,
} from "../../app/api/admin/promotions/route.js";

const pagePath = join(process.cwd(), "src/app/admin/promotions/page.tsx");

test("PD16 admin promotions UI exists", () => {
  const src = readFileSync(pagePath, "utf8");
  assert.match(src, /Promotions & referrals/);
  assert.match(src, /PLATFORM|FLASH|REFERRAL/);
  assert.match(src, /SUPPLIER_COOP/);
  assert.match(src, /cash-out|Cash-out/);
  assert.match(src, /Fraud|fraud/);
  assert.doesNotMatch(src, /cash.?out.*allowed|auto.?cash/i);
});

test("PD16 package thin vertical", () => {
  const out = runPd16PromotionsAdminThinVertical();
  assert.equal(out.cashOutForbidden, true);
  assert.equal(out.edgeFraudHeld, true);
  assert.equal(out.coopStatus, "live");
});

test("PD16 admin API: fail closed + create PLATFORM + cash-out block", async () => {
  __resetPromoAdminForTests();
  delete process.env.INTERNAL_API_SECRET;

  const closed = await promoGet(
    new Request("http://localhost/api/admin/promotions"),
  );
  assert.equal(closed.status, 503);

  process.env.INTERNAL_API_SECRET = "pd16-test-secret";
  const headers = {
    "content-type": "application/json",
    "x-internal-secret": "pd16-test-secret",
  };

  const create = await promoPost(
    new Request("http://localhost/api/admin/promotions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "create_campaign",
        type: "PLATFORM",
        name: "API PLATFORM",
        budgetSpendLimitMinor: "5000",
      }),
    }),
  );
  assert.equal(create.status, 200);
  const createJson = (await create.json()) as { campaignId: string };
  assert.ok(createJson.campaignId);

  const cash = await promoPost(
    new Request("http://localhost/api/admin/promotions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "attempt_cash_out",
        customerId: "c1",
        amountMinor: "100",
      }),
    }),
  );
  assert.equal(cash.status, 200);
  const cashJson = (await cash.json()) as {
    blocked?: boolean;
    error?: string;
    snapshot?: { cashOutAttemptsBlocked: number };
  };
  assert.equal(cashJson.blocked, true);
  assert.match(cashJson.error ?? "", /cash_out_forbidden/);
  assert.ok((cashJson.snapshot?.cashOutAttemptsBlocked ?? 0) >= 1);

  const coop = await promoPost(
    new Request("http://localhost/api/admin/promotions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "propose_coop",
        name: "API Co-op",
        supplierId: "sup_x",
        offerIds: ["off_x"],
        supplierFundShareBps: 5000,
        dialFundShareBps: 5000,
        budgetSpendLimitMinor: "2000",
      }),
    }),
  );
  assert.equal(coop.status, 200);
  const coopJson = (await coop.json()) as { campaignId: string };
  await promoPost(
    new Request("http://localhost/api/admin/promotions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "accept_coop",
        campaignId: coopJson.campaignId,
      }),
    }),
  );
  const approve = await promoPost(
    new Request("http://localhost/api/admin/promotions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "approve_coop",
        campaignId: coopJson.campaignId,
      }),
    }),
  );
  assert.equal(approve.status, 200);
  const approveJson = (await approve.json()) as { agreementStatus: string };
  assert.equal(approveJson.agreementStatus, "live");
});
