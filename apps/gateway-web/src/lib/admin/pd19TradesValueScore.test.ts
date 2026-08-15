/**
 * PD19 Admin Trade/JobClass + Value Score tests.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  __resetJobsForTests,
  runPd19AdminTradeValueScoreThinVertical,
} from "@dial/jobs";
import {
  GET as tradesGet,
  POST as tradesPost,
} from "../../app/api/admin/trades/route.js";

const pagePath = join(process.cwd(), "src/app/admin/trades/page.tsx");

test("PD19 admin Trade/Value Score UI exists", () => {
  const src = readFileSync(pagePath, "utf8");
  assert.match(src, /Trade \/ JobClass|Value Score/);
  assert.match(src, /lifecycle|Activate|dispute/i);
  assert.match(src, /never writes|payable/i);
});

test("PD19 package thin vertical", () => {
  const out = runPd19AdminTradeValueScoreThinVertical();
  assert.equal(out.moneyPathClean, true);
  assert.equal(out.ineligibleHighScoreBlocked, true);
  assert.equal(out.disputeStatus, "upheld");
});

test("PD19 admin API: fail closed + trade activate + score dispute", async () => {
  __resetJobsForTests();
  delete process.env.INTERNAL_API_SECRET;

  const closed = await tradesGet(
    new Request("http://localhost/api/admin/trades"),
  );
  assert.equal(closed.status, 503);

  process.env.INTERNAL_API_SECRET = "pd19-test-secret";
  const headers = {
    "content-type": "application/json",
    "x-internal-secret": "pd19-test-secret",
  };

  const create = await tradesPost(
    new Request("http://localhost/api/admin/trades", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "create_trade", name: "API Trade" }),
    }),
  );
  assert.equal(create.status, 200);
  const createJson = (await create.json()) as {
    trade: { id: string; lifecycle: string };
  };
  assert.equal(createJson.trade.lifecycle, "draft");

  const activate = await tradesPost(
    new Request("http://localhost/api/admin/trades", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "set_trade_lifecycle",
        tradeId: createJson.trade.id,
        lifecycle: "active",
      }),
    }),
  );
  assert.equal(activate.status, 200);

  await tradesPost(
    new Request("http://localhost/api/admin/trades", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "set_value_score",
        technicianId: "tech_api",
        score: 60,
      }),
    }),
  );
  const dispute = await tradesPost(
    new Request("http://localhost/api/admin/trades", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "open_dispute",
        technicianId: "tech_api",
        reason: "test",
        openedBy: "ops",
      }),
    }),
  );
  assert.equal(dispute.status, 200);
  const disputeJson = (await dispute.json()) as {
    dispute: { disputeId: string };
  };
  const resolve = await tradesPost(
    new Request("http://localhost/api/admin/trades", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "resolve_dispute",
        disputeId: disputeJson.dispute.disputeId,
        resolution: "upheld",
        resolvedBy: "ops_lead",
        compensatingDelta: 4,
      }),
    }),
  );
  assert.equal(resolve.status, 200);
  const resolveJson = (await resolve.json()) as {
    valueScore: { score: number };
  };
  assert.equal(resolveJson.valueScore.score, 64);
});
