/**
 * PD123–PD126 dogfood — Schedule-X roster, Tracktor fleet, tableflow CSV, Formance explorer.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { runPd123ScheduleXRosterThinVertical } from "@dial/jobs";
import { runPd124TracktorFleetExpiryThinVertical } from "@dial/catalogue";
import { runPd125TableflowCsvPreviewThinVertical } from "@dial/suppliers";
import { runPd126FormanceConsoleExplorerThinVertical } from "@dial/ledger";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { GET as rosterGet } from "../../app/api/admin/roster/route.js";
import { GET as fleetGet } from "../../app/api/admin/fleet/expiry/route.js";
import { GET as explorerGet } from "../../app/api/admin/ledger/explorer/route.js";
import { POST as supplierPost } from "../../app/api/supplier/portal/route.js";

const root = join(process.cwd(), "src");

test("PD123 Schedule-X roster API + UI", async () => {
  const thin = await runPd123ScheduleXRosterThinVertical();
  assert.ok(thin.eventCount >= 1);
  assert.equal(thin.calComSlotsReplaced, false);

  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "pd123_secret";
  try {
    const missing = await rosterGet(
      new Request("http://localhost/api/admin/roster"),
    );
    assert.equal(missing.status, 401);

    const ok = await rosterGet(
      new Request("http://localhost/api/admin/roster", {
        headers: { "x-internal-secret": "pd123_secret" },
      }),
    );
    assert.equal(ok.status, 200);
    const json = (await ok.json()) as {
      board: { scheduleXPattern: boolean; calComSlotsReplaced: boolean };
    };
    assert.equal(json.board.scheduleXPattern, true);
    assert.equal(json.board.calComSlotsReplaced, false);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }

  const page = readFileSync(join(root, "app/admin/roster/page.tsx"), "utf8");
  assert.match(page, /pd123-schedule-x-roster/);
});

test("PD124 Tracktor fleet expiry API + UI", async () => {
  const thin = runPd124TracktorFleetExpiryThinVertical();
  assert.ok(thin.overdue >= 1);

  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "pd124_secret";
  try {
    const ok = await fleetGet(
      new Request("http://localhost/api/admin/fleet/expiry", {
        headers: { "x-internal-secret": "pd124_secret" },
      }),
    );
    assert.equal(ok.status, 200);
    const json = (await ok.json()) as {
      board: { tracktorPattern: boolean; courierDispatchSor: boolean };
    };
    assert.equal(json.board.tracktorPattern, true);
    assert.equal(json.board.courierDispatchSor, false);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }

  const page = readFileSync(
    join(root, "app/admin/fleet/expiry/page.tsx"),
    "utf8",
  );
  assert.match(page, /pd124-tracktor-fleet/);
});

test("PD125 tableflow CSV preview via supplier portal", async () => {
  const thin = runPd125TableflowCsvPreviewThinVertical();
  assert.equal(thin.ingested, false);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd125@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const res = await supplierPost(
    new Request("http://localhost/api/supplier/portal", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "preview_stock_csv",
        csvText: "sku,title,qty,unitPriceUsdMinor\nA,Part,1,100\nB,Bad,1,1.5",
      }),
    }),
  );
  assert.equal(res.status, 200);
  const json = (await res.json()) as {
    preview: {
      validCount: number;
      invalidCount: number;
      ingested: boolean;
      tableflowCloudSor: boolean;
    };
  };
  assert.ok(json.preview.validCount >= 1);
  assert.ok(json.preview.invalidCount >= 1);
  assert.equal(json.preview.ingested, false);
  assert.equal(json.preview.tableflowCloudSor, false);
});

test("PD126 Formance Console explorer API + UI", async () => {
  const thin = runPd126FormanceConsoleExplorerThinVertical();
  assert.equal(thin.formanceMoneySor, false);
  assert.equal(thin.dialLedgerSor, true);

  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "pd126_secret";
  try {
    const ok = await explorerGet(
      new Request("http://localhost/api/admin/ledger/explorer", {
        headers: { "x-internal-secret": "pd126_secret" },
      }),
    );
    assert.equal(ok.status, 200);
    const json = (await ok.json()) as {
      snapshot: { formanceMoneySor: boolean; dialLedgerSor: boolean };
    };
    assert.equal(json.snapshot.formanceMoneySor, false);
    assert.equal(json.snapshot.dialLedgerSor, true);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }

  const page = readFileSync(
    join(root, "app/admin/ledger/explorer/page.tsx"),
    "utf8",
  );
  assert.match(page, /pd126-formance-explorer/);
});
