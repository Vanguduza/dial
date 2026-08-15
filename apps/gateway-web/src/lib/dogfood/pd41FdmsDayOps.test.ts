/**
 * PD41 — FDMS day ops UX deepen dogfood.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  __resetTaxForTests,
  runPd41FdmsDayOpsThinVertical,
} from "@dial/tax";
import { GET as outboxGet, POST as outboxPost } from "../../app/api/admin/fdms/outbox/route.js";

describe("PD41 FDMS day ops", () => {
  it("package thin vertical greens", () => {
    const r = runPd41FdmsDayOpsThinVertical();
    assert.equal(r.agencyClassesPresent, true);
    assert.equal(r.printerRequired, false);
    assert.equal(r.payableFromAi, false);
    assert.ok(r.receiptClassCounts.DIAL_FEE >= 1);
  });

  it("outbox GET exposes receiptClassCounts; drain-only works", async () => {
    __resetTaxForTests();
    const prev = process.env.INTERNAL_API_SECRET;
    process.env.INTERNAL_API_SECRET = "pd41_secret";
    process.env.DIAL_INTEGRATION_MODE = "fixture";
    try {
      const seed = await outboxPost(
        new Request("http://localhost/api/admin/fdms/outbox", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-internal-secret": "pd41_secret",
            "Idempotency-Key": "pd41-seed-agency-1",
          },
          body: JSON.stringify({ action: "seed_agency_receipts" }),
        }),
      );
      assert.equal(seed.status, 200);

      const list = await outboxGet(
        new Request("http://localhost/api/admin/fdms/outbox", {
          headers: { "x-internal-secret": "pd41_secret" },
        }),
      );
      assert.equal(list.status, 200);
      const body = (await list.json()) as {
        receiptClassCounts: {
          DIAL_FEE: number;
          GOODS_FORMAL: number;
          GOODS_INFORMAL: number;
        };
        printerRequired: boolean;
      };
      assert.equal(body.printerRequired, false);
      assert.ok(body.receiptClassCounts.DIAL_FEE >= 1);
      assert.ok(body.receiptClassCounts.GOODS_FORMAL >= 1);
      assert.ok(body.receiptClassCounts.GOODS_INFORMAL >= 1);

      const drain = await outboxPost(
        new Request("http://localhost/api/admin/fdms/outbox", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-internal-secret": "pd41_secret",
          },
          body: JSON.stringify({ action: "drain" }),
        }),
      );
      assert.equal(drain.status, 200);
      const drainBody = (await drain.json()) as { ok: boolean };
      assert.equal(drainBody.ok, true);
    } finally {
      if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
      else process.env.INTERNAL_API_SECRET = prev;
      __resetTaxForTests();
    }
  });
});
