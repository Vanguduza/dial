/**
 * PD23 Compliance/WHT + Commercial Simulation tests.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  __resetPaymentsForTests,
  runPd23WhtRemittanceThinVertical,
} from "@dial/payments";
import {
  __resetCommercialSimForTests,
  runPd23CommercialSimThinVertical,
} from "@dial/ai";
import {
  GET as whtGet,
  POST as whtPost,
} from "../../app/api/admin/compliance/wht/route.js";
import {
  GET as simGet,
  POST as simPost,
} from "../../app/api/admin/commercial-simulation/route.js";

const whtPage = join(process.cwd(), "src/app/admin/compliance/wht/page.tsx");
const simPage = join(
  process.cwd(),
  "src/app/admin/commercial-simulation/page.tsx",
);

test("PD23 admin UI: WHT remittance + Commercial Simulation", () => {
  const wht = readFileSync(whtPage, "utf8");
  const sim = readFileSync(simPage, "utf8");
  assert.match(wht, /WHT remittance|withholding_balances|D-50/);
  assert.match(wht, /payableFromAi|never writes payable/i);
  assert.match(sim, /Commercial Simulation|D-54|never auto-pays/i);
  assert.match(sim, /Simulated|Actual/);
});

test("PD23 package thin verticals", () => {
  __resetPaymentsForTests();
  const wht = runPd23WhtRemittanceThinVertical();
  assert.equal(wht.rateBps, 3000);
  assert.equal(wht.withholdMinor, "3000");
  assert.equal(wht.remittanceStatus, "acknowledged");
  assert.equal(wht.payableFromAi, false);

  __resetCommercialSimForTests();
  const sim = runPd23CommercialSimThinVertical();
  assert.equal(sim.simulatedNeverPays, true);
  assert.equal(sim.actualRefusesMoneySor, true);
  assert.equal(sim.autoPayAllowed, false);
});

test("PD23 admin APIs: fail closed + remittance + sim payout block", async () => {
  __resetPaymentsForTests();
  __resetCommercialSimForTests();
  delete process.env.INTERNAL_API_SECRET;

  assert.equal(
    (await whtGet(new Request("http://localhost/api/admin/compliance/wht")))
      .status,
    503,
  );
  assert.equal(
    (
      await simGet(
        new Request("http://localhost/api/admin/commercial-simulation"),
      )
    ).status,
    503,
  );

  process.env.INTERNAL_API_SECRET = "pd23-test-secret";
  const headers = {
    "content-type": "application/json",
    "x-internal-secret": "pd23-test-secret",
  };

  const payout = await whtPost(
    new Request("http://localhost/api/admin/compliance/wht", {
      method: "POST",
      headers: {
        ...headers,
        "Idempotency-Key": "pd23-record-payout-1",
      },
      body: JSON.stringify({
        action: "record_payout",
        technicianId: "tech_api_23",
        payoutUsdMinor: "10000",
        hasItf263: false,
      }),
    }),
  );
  assert.equal(payout.status, 200);
  const payoutJson = (await payout.json()) as {
    withholdMinor: string;
    rateBps: number;
  };
  assert.equal(payoutJson.withholdMinor, "3000");
  assert.equal(payoutJson.rateBps, 3000);

  const draft = await whtPost(
    new Request("http://localhost/api/admin/compliance/wht", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "create_remittance_draft" }),
    }),
  );
  assert.equal(draft.status, 200);
  const draftJson = (await draft.json()) as {
    batch: { batchId: string; payableFromAi: boolean };
  };
  assert.equal(draftJson.batch.payableFromAi, false);

  const submit = await whtPost(
    new Request("http://localhost/api/admin/compliance/wht", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "submit_remittance",
        batchId: draftJson.batch.batchId,
        submittedBy: "ops_api",
      }),
    }),
  );
  assert.equal(submit.status, 200);

  const createSim = await simPost(
    new Request("http://localhost/api/admin/commercial-simulation", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "create_run",
        title: "API scenario",
        mode: "simulated",
        projectedMarginMinor: "2500",
      }),
    }),
  );
  assert.equal(createSim.status, 200);
  const simJson = (await createSim.json()) as {
    run: { runId: string; autoPayAllowed: boolean };
  };
  assert.equal(simJson.run.autoPayAllowed, false);

  const pay = await simPost(
    new Request("http://localhost/api/admin/commercial-simulation", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "attempt_payout",
        runId: simJson.run.runId,
        amountMinor: "1000",
      }),
    }),
  );
  assert.equal(pay.status, 403);
  const payJson = (await pay.json()) as { autoPayAllowed: boolean };
  assert.equal(payJson.autoPayAllowed, false);
});
