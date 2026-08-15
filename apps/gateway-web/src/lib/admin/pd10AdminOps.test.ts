/**
 * PD10 admin ops: money outbox + dispatch board + Command Centre + Take-Home WHT.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { __resetIntelligenceForTests } from "@dial/ai";
import { __resetDeliveryForTests } from "@dial/delivery";
import { __resetLedgerForTests } from "@dial/ledger";
import { __resetPaymentsForTests } from "@dial/payments";
import {
  GET as moneyGet,
  POST as moneyPost,
  __testMoneyOutbox,
} from "../../app/api/admin/money/outbox/route.js";
import {
  GET as dispatchGet,
  POST as dispatchPost,
} from "../../app/api/admin/delivery/dispatch/route.js";
import {
  GET as ccGet,
  POST as ccPost,
} from "../../app/api/admin/command-centre/route.js";
import {
  GET as takeHomeGet,
  POST as takeHomePost,
} from "../../app/api/admin/tech/take-home/route.js";

const SECRET = "pd10_internal_secret";

function withSecret(init?: RequestInit): RequestInit {
  return {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "x-internal-secret": SECRET,
      "content-type": "application/json",
    },
  };
}

test("PD10 admin UI sources exist (outbox / dispatch / CC / take-home)", () => {
  const root = join(process.cwd(), "src/app/admin");
  const outbox = readFileSync(join(root, "money/outbox/page.tsx"), "utf8");
  const dispatch = readFileSync(join(root, "delivery/dispatch/page.tsx"), "utf8");
  const cc = readFileSync(join(root, "command-centre/page.tsx"), "utf8");
  const th = readFileSync(join(root, "tech/take-home/page.tsx"), "utf8");
  assert.match(outbox, /\/api\/admin\/money\/outbox/);
  assert.match(dispatch, /\/api\/admin\/delivery\/dispatch/);
  assert.match(cc, /MetricContract|metric\./);
  assert.match(cc, /Simulated|never auto-pays|autoPayAllowed/);
  assert.match(th, /withholding|view=all|Take-Home/);
});

test("PD10 thin vertical: outbox drain + dispatch FIFO + CC Simulated≠pay + durable WHT", async () => {
  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = SECRET;
  try {
    __resetLedgerForTests();
    __resetDeliveryForTests();
    __resetIntelligenceForTests();
    __resetPaymentsForTests();
    __testMoneyOutbox.enqueue({ kind: "ledger_posted", refId: "jr_pd10" });
    __testMoneyOutbox.enqueue({ kind: "fiscal_queued", refId: "fr_pd10" });

    const depthRes = await moneyGet(
      new Request("http://localhost/api/admin/money/outbox", withSecret()),
    );
    assert.equal(depthRes.status, 200);
    const depthJson = (await depthRes.json()) as { depth: number };
    assert.ok(depthJson.depth >= 2);

    const drainRes = await moneyPost(
      new Request(
        "http://localhost/api/admin/money/outbox",
        withSecret({
          method: "POST",
          body: JSON.stringify({ enqueueSideEffects: false }),
        }),
      ),
    );
    assert.equal(drainRes.status, 200);
    const drainJson = (await drainRes.json()) as { remaining: number };
    assert.equal(drainJson.remaining, 0);

    const seed = await dispatchPost(
      new Request(
        "http://localhost/api/admin/delivery/dispatch",
        withSecret({
          method: "POST",
          body: JSON.stringify({ action: "seed_fifo_job" }),
        }),
      ),
    );
    assert.equal(seed.status, 200);
    const seedJson = (await seed.json()) as {
      fifoJobIds: string[];
      workflowPhase: string;
    };
    assert.ok(seedJson.fifoJobIds.length >= 1);
    assert.equal(seedJson.workflowPhase, "fifo");

    const board = await dispatchGet(
      new Request("http://localhost/api/admin/delivery/dispatch", withSecret()),
    );
    assert.equal(board.status, 200);

    const ccActual = await ccGet(
      new Request("http://localhost/api/admin/command-centre?mode=actual", withSecret()),
    );
    assert.equal(ccActual.status, 200);
    const ccJson = (await ccActual.json()) as {
      tiles: Array<{ id: string; canDrivePayout: boolean }>;
      banner: { autoPayAllowed: boolean };
    };
    assert.equal(ccJson.banner.autoPayAllowed, false);
    assert.ok(ccJson.tiles.length >= 3);
    assert.equal(ccJson.tiles.every((t) => t.canDrivePayout === false), true);

    const simPay = await ccPost(
      new Request(
        "http://localhost/api/admin/command-centre",
        withSecret({
          method: "POST",
          body: JSON.stringify({
            action: "attempt_payout",
            mode: "simulated",
            amountMinor: "5000",
          }),
        }),
      ),
    );
    assert.equal(simPay.status, 403);
    const simJson = (await simPay.json()) as { error: string; autoPayAllowed: boolean };
    assert.match(simJson.error, /never auto-pay/i);
    assert.equal(simJson.autoPayAllowed, false);

    const actualPay = await ccPost(
      new Request(
        "http://localhost/api/admin/command-centre",
        withSecret({
          method: "POST",
          body: JSON.stringify({
            action: "attempt_payout",
            mode: "actual",
            amountMinor: "5000",
          }),
        }),
      ),
    );
    assert.equal(actualPay.status, 200);
    const actualJson = (await actualPay.json()) as {
      payout: { refused: boolean };
    };
    assert.equal(actualJson.payout.refused, true);

    const wht = await takeHomePost(
      new Request(
        "http://localhost/api/admin/tech/take-home",
        withSecret({
          method: "POST",
          body: JSON.stringify({
            technicianId: "tech_pd10",
            payoutUsdMinor: "10000",
            hasItf263: false,
          }),
        }),
      ),
    );
    assert.equal(wht.status, 200);
    const whtJson = (await wht.json()) as {
      withholdMinor: string;
      balance: { grossPaidMinor: string };
    };
    assert.equal(whtJson.withholdMinor, "3000");
    assert.equal(whtJson.balance.grossPaidMinor, "10000");

    const list = await takeHomeGet(
      new Request(
        "http://localhost/api/admin/tech/take-home?view=all",
        withSecret(),
      ),
    );
    assert.equal(list.status, 200);
    const listJson = (await list.json()) as {
      balances: Array<{ technicianId: string }>;
    };
    assert.ok(listJson.balances.some((b) => b.technicianId === "tech_pd10"));
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});
