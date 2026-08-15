/**
 * PD22 Admin Daily ZiG + Cost & health tests.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  __resetPaymentsForTests,
  runPd22AdminZigCostHealthThinVertical,
  setDailyZigRate,
} from "@dial/payments";
import {
  GET as costGet,
  POST as costPost,
} from "../../app/api/admin/cost-health/route.js";
import {
  GET as zigGet,
  POST as zigPost,
} from "../../app/api/admin/fx/daily-zig/route.js";

const costPage = join(process.cwd(), "src/app/admin/cost-health/page.tsx");
const zigPage = join(process.cwd(), "src/app/admin/fx/daily-zig/page.tsx");

test("PD22 admin Cost/health + Daily ZiG UI deepen", () => {
  const cost = readFileSync(costPage, "utf8");
  const zig = readFileSync(zigPage, "utf8");
  assert.match(cost, /PD22|kill-switch|IMTT/);
  assert.match(cost, /ai_litellm|LiteLLM|rateLimitHref|Rate-limit/);
  assert.match(cost, /openapi-primary-link/);
  assert.match(cost, /imttOnCheckoutLines/);
  assert.match(zig, /Daily ZiG|D-57/);
  assert.match(zig, /cost-health|IMTT|D-60/);
});

test("PD22 package thin vertical", () => {
  const out = runPd22AdminZigCostHealthThinVertical();
  assert.ok(out.fxRateId.startsWith("fx"));
  assert.equal(out.zigMinorPerUsd, "250000");
  assert.equal(out.costAnyAlert, true);
  assert.equal(out.killSwitchEngaged, true);
  assert.equal(out.imttOnCheckoutLines, false);
  assert.equal(out.imttOpexUsdMinor, "200");
});

test("PD22 admin APIs: fail closed + ZiG audit + cost kill-switch", async () => {
  __resetPaymentsForTests();
  delete process.env.INTERNAL_API_SECRET;

  const closedCost = await costGet(
    new Request("http://localhost/api/admin/cost-health"),
  );
  assert.equal(closedCost.status, 503);
  const closedZig = await zigGet(
    new Request("http://localhost/api/admin/fx/daily-zig"),
  );
  assert.equal(closedZig.status, 503);

  process.env.INTERNAL_API_SECRET = "pd22-test-secret";
  const headers = {
    "content-type": "application/json",
    "x-internal-secret": "pd22-test-secret",
  };

  const zig = await zigPost(
    new Request("http://localhost/api/admin/fx/daily-zig", {
      method: "POST",
      headers,
      body: JSON.stringify({
        zigMinorPerUsd: "260000",
        setBy: "ops_pd22_api",
      }),
    }),
  );
  assert.equal(zig.status, 200);
  const zigJson = (await zig.json()) as {
    rate: { fxRateId: string; setBy: string };
  };
  assert.equal(zigJson.rate.setBy, "ops_pd22_api");

  const zigList = await zigGet(
    new Request("http://localhost/api/admin/fx/daily-zig", { headers }),
  );
  assert.equal(zigList.status, 200);
  const listJson = (await zigList.json()) as {
    active: { fxRateId: string };
    audit: unknown[];
  };
  assert.equal(listJson.active.fxRateId, zigJson.rate.fxRateId);
  assert.ok(listJson.audit.length >= 1);

  const spend = await costPost(
    new Request("http://localhost/api/admin/cost-health", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "record_spend",
        channel: "ai_litellm",
        amountUsdMinor: "6000",
      }),
    }),
  );
  assert.equal(spend.status, 200);
  const spendJson = (await spend.json()) as {
    bucket: { alert: boolean };
    snapshot: { imttOnCheckoutLines: boolean };
  };
  assert.equal(spendJson.bucket.alert, true);
  assert.equal(spendJson.snapshot.imttOnCheckoutLines, false);

  const kill = await costPost(
    new Request("http://localhost/api/admin/cost-health", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "engage_kill_switch",
        channel: "ai_litellm",
      }),
    }),
  );
  assert.equal(kill.status, 200);
  const killJson = (await kill.json()) as {
    bucket: { killSwitchEngaged: boolean; rateLimitHref: string };
  };
  assert.equal(killJson.bucket.killSwitchEngaged, true);
  assert.match(killJson.bucket.rateLimitHref, /rate-limits/);

  const imtt = await costPost(
    new Request("http://localhost/api/admin/cost-health", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "record_imtt_opex",
        amountUsdMinor: "150",
      }),
    }),
  );
  assert.equal(imtt.status, 200);
  const imttJson = (await imtt.json()) as { imttOnCheckoutLines: boolean };
  assert.equal(imttJson.imttOnCheckoutLines, false);

  // Ensure setDailyZigRate still works alongside (audit non-silent)
  setDailyZigRate({ zigMinorPerUsd: 2700_00n, setBy: "ops_pd22_second" });
});
