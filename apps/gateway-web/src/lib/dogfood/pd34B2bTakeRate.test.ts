/**
 * PD34 — B2B grocery polish + take-rate admin scaffold (gateway).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import {
  __resetTakeRateForTests,
  runPd34B2bTakeRateThinVertical,
  searchGroceryOffers,
} from "@dial/catalogue";
import { GET as takeRateGet, POST as takeRatePost } from "../../app/api/admin/grocery/take-rate/route";

describe("PD34 B2B grocery + take-rate admin", () => {
  it("package thin vertical greens", () => {
    const r = runPd34B2bTakeRateThinVertical();
    assert.equal(r.resolvedBps, 600);
    assert.equal(r.b2bFormalOnly, true);
  });

  it("B2B search returns formal only (D-49)", () => {
    const b2b = searchGroceryOffers("", { sessionRole: "b2b" });
    assert.ok(b2b.every((h) => h.supplierFormality === "formal"));
    const b2c = searchGroceryOffers("", { sessionRole: "b2c" });
    assert.ok(b2c.some((h) => h.supplierFormality === "informal"));
  });

  it("admin take-rate fail-closed without secret", async () => {
    __resetTakeRateForTests();
    const prev = process.env.INTERNAL_API_SECRET;
    delete process.env.INTERNAL_API_SECRET;
    try {
      const res = await takeRateGet(new NextRequest("http://localhost/api/admin/grocery/take-rate"));
      assert.equal(res.status, 503);
    } finally {
      if (prev !== undefined) process.env.INTERNAL_API_SECRET = prev;
    }
  });

  it("admin draft → publish → resolve; reject body userId", async () => {
    __resetTakeRateForTests();
    process.env.INTERNAL_API_SECRET = "pd34-test-secret";
    const headers = {
      "content-type": "application/json",
      "x-internal-secret": "pd34-test-secret",
    };

    const denied = await takeRatePost(
      new NextRequest("http://localhost/api/admin/grocery/take-rate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "draft",
          userId: "attacker",
          tiers: [{ minGmvUsdMinor: "0", takeRateBps: 700 }],
        }),
      }),
    );
    assert.equal(denied.status, 400);

    const draftRes = await takeRatePost(
      new NextRequest("http://localhost/api/admin/grocery/take-rate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "draft",
          setBy: "ops",
          label: "PD34 test",
          tiers: [
            { minGmvUsdMinor: "0", takeRateBps: 800 },
            { minGmvUsdMinor: "10000", takeRateBps: 600 },
          ],
        }),
      }),
    );
    assert.equal(draftRes.status, 200);
    const draftBody = (await draftRes.json()) as {
      ladder: { ladderId: string; payableFromAi: false };
    };
    assert.equal(draftBody.ladder.payableFromAi, false);

    const pubRes = await takeRatePost(
      new NextRequest("http://localhost/api/admin/grocery/take-rate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "publish",
          ladderId: draftBody.ladder.ladderId,
          setBy: "ops",
        }),
      }),
    );
    assert.equal(pubRes.status, 200);

    const resolveRes = await takeRatePost(
      new NextRequest("http://localhost/api/admin/grocery/take-rate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "resolve",
          gmvUsdMinor: "15000",
        }),
      }),
    );
    assert.equal(resolveRes.status, 200);
    const resolved = (await resolveRes.json()) as { takeRateBps: number };
    assert.equal(resolved.takeRateBps, 600);

    const list = await takeRateGet(
      new NextRequest("http://localhost/api/admin/grocery/take-rate", {
        headers,
      }),
    );
    assert.equal(list.status, 200);
  });
});
