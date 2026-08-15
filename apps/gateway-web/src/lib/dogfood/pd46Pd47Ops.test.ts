/**
 * PD46–PD47 dogfood — supplier co-op spend + Command Centre recommended actions.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runPd46SupplierCoopSpendThinVertical } from "@dial/promotions";
import {
  runPd47CommandCentreActionsThinVertical,
  listMetricTiles,
  __resetIntelligenceForTests,
  ensureDefaultMetricContracts,
} from "@dial/ai";
import { __resetSuppliersForTests, onboardSupplier } from "@dial/suppliers";
import {
  __resetLedgerForTests,
  enqueueMoneyOutbox,
} from "@dial/ledger";
import {
  POST as promoPost,
  GET as promoGet,
} from "../../app/api/admin/promotions/route.js";
import { GET as ccGet } from "../../app/api/admin/command-centre/route.js";

describe("PD46 supplier co-op spend", () => {
  it("package thin vertical greens", () => {
    const r = runPd46SupplierCoopSpendThinVertical();
    assert.equal(r.coopStatus, "live");
    assert.equal(r.cashOutForbidden, true);
    assert.equal(r.payableFromAi, false);
  });

  it("admin record_coop_spend writes budget + statement", async () => {
    __resetSuppliersForTests();
    const prev = process.env.INTERNAL_API_SECRET;
    process.env.INTERNAL_API_SECRET = "pd46_secret";
    try {
      const propose = await promoPost(
        new Request("http://localhost/api/admin/promotions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-internal-secret": "pd46_secret",
          },
          body: JSON.stringify({
            action: "propose_coop",
            name: "PD46 API coop",
            supplierId: "sup_pd46_api",
            offerIds: ["off_api"],
            supplierFundShareBps: 5000,
            dialFundShareBps: 5000,
            budgetSpendLimitMinor: "20000",
          }),
        }),
      );
      assert.equal(propose.status, 200);
      const proposed = (await propose.json()) as {
        campaignId?: string;
        snapshot: { coopAgreements: Array<{ campaignId: string; status: string }> };
      };
      const campaignId =
        proposed.campaignId ??
        proposed.snapshot.coopAgreements.find((a) => a.status === "proposed")
          ?.campaignId;
      assert.ok(campaignId);

      onboardSupplier({
        supplierId: "sup_pd46_api",
        displayName: "PD46 API",
        formality: "formal",
        tier: "bronze",
      });

      await promoPost(
        new Request("http://localhost/api/admin/promotions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-internal-secret": "pd46_secret",
          },
          body: JSON.stringify({ action: "accept_coop", campaignId }),
        }),
      );
      await promoPost(
        new Request("http://localhost/api/admin/promotions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-internal-secret": "pd46_secret",
          },
          body: JSON.stringify({ action: "approve_coop", campaignId }),
        }),
      );
      const spend = await promoPost(
        new Request("http://localhost/api/admin/promotions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-internal-secret": "pd46_secret",
          },
          body: JSON.stringify({
            action: "record_coop_spend",
            campaignId,
            spendMinor: "700",
          }),
        }),
      );
      assert.equal(spend.status, 200);
      const body = (await spend.json()) as {
        ok: boolean;
        statementLineId: string;
        cashOutForbidden: boolean;
        budgetUsedMinor: string;
      };
      assert.equal(body.ok, true);
      assert.equal(body.cashOutForbidden, true);
      assert.ok(body.statementLineId);
      assert.equal(body.budgetUsedMinor, "700");

      const list = await promoGet(
        new Request("http://localhost/api/admin/promotions", {
          headers: { "x-internal-secret": "pd46_secret" },
        }),
      );
      assert.equal(list.status, 200);
    } finally {
      if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
      else process.env.INTERNAL_API_SECRET = prev;
    }
  });
});

describe("PD47 Command Centre recommended actions", () => {
  it("package thin vertical greens", () => {
    const r = runPd47CommandCentreActionsThinVertical();
    assert.equal(r.everyActionAutoPayFalse, true);
    assert.equal(r.simulatedNeverPays, true);
    assert.equal(r.canDrivePayout, false);
  });

  it("GET tiles expose recommendedActions with autoPay=false", async () => {
    __resetIntelligenceForTests();
    __resetLedgerForTests();
    ensureDefaultMetricContracts();
    for (let i = 0; i < 55; i++) {
      enqueueMoneyOutbox({ kind: "fiscal_queued", refId: `pd47_out_${i}` });
    }
    const prev = process.env.INTERNAL_API_SECRET;
    process.env.INTERNAL_API_SECRET = "pd47_secret";
    try {
      const res = await ccGet(
        new Request("http://localhost/api/admin/command-centre?mode=actual", {
          headers: { "x-internal-secret": "pd47_secret" },
        }),
      );
      assert.equal(res.status, 200);
      const body = (await res.json()) as {
        tiles: Array<{
          id: string;
          status: string;
          canDrivePayout: boolean;
          recommendedActions: Array<{ autoPay: boolean; href: string }>;
        }>;
        banner: { autoPayAllowed: boolean };
      };
      assert.equal(body.banner.autoPayAllowed, false);
      const outbox = body.tiles.find((t) => t.id === "metric.money_outbox_depth");
      assert.ok(outbox);
      assert.equal(outbox.status, "critical");
      assert.equal(outbox.canDrivePayout, false);
      assert.ok((outbox.recommendedActions?.length ?? 0) >= 1);
      assert.ok(outbox.recommendedActions.every((a) => a.autoPay === false));

      const local = listMetricTiles("simulated");
      assert.ok(local.every((t) => t.canDrivePayout === false));
    } finally {
      if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
      else process.env.INTERNAL_API_SECRET = prev;
      __resetLedgerForTests();
    }
  });
});
