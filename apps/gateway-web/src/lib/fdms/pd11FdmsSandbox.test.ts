/**
 * PD11 FDMS Virtual Gateway sandbox — admin day + money-outbox agency receipts.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { __resetFdmsSandboxForTests } from "@dial/adapter-fdms";
import { __resetLedgerForTests, runPd11FdmsSandboxThinVertical } from "@dial/ledger";
import { __resetTaxForTests } from "@dial/tax";
import { GET as dayGet, POST as dayPost } from "../../app/api/admin/fdms/day/route.js";
import {
  GET as outboxGet,
  POST as outboxPost,
} from "../../app/api/admin/fdms/outbox/route.js";

const SECRET = "pd11_internal_secret";

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

test("PD11 admin FDMS UI exists (Virtual Gateway, no printer)", () => {
  const page = readFileSync(
    join(process.cwd(), "src/app/admin/fdms/page.tsx"),
    "utf8",
  );
  assert.match(page, /Open fiscal day/);
  assert.match(page, /GOODS_FORMAL|DIAL_FEE/);
  assert.match(page, /no physical printer/i);
  assert.match(page, /\/api\/admin\/fdms\/day/);
  assert.match(page, /\/api\/admin\/fdms\/outbox/);
});

test("PD11 package thin vertical sandbox open→agency→money drain→close", async () => {
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  process.env.FDMS_BASE_URL = "https://fdms.sandbox.dial.local";
  process.env.FDMS_DEVICE_ID = "dev_pd11";
  process.env.FDMS_ACTIVATION_KEY = "act_pd11";
  delete process.env.FDMS_SANDBOX_HTTP;
  __resetFdmsSandboxForTests();
  __resetTaxForTests();
  __resetLedgerForTests();
  const out = await runPd11FdmsSandboxThinVertical();
  assert.equal(out.fiscalCodes.length, 3);
  assert.ok(out.dayClosed.closedAt);
  process.env.DIAL_INTEGRATION_MODE = "fixture";
});

test("PD11 admin API: open day → seed agency → drain → close", async () => {
  const prev = process.env.INTERNAL_API_SECRET;
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  process.env.INTERNAL_API_SECRET = SECRET;
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  process.env.FDMS_BASE_URL = "https://fdms.sandbox.dial.local";
  process.env.FDMS_DEVICE_ID = "dev_pd11_api";
  process.env.FDMS_ACTIVATION_KEY = "act_pd11_api";
  delete process.env.FDMS_SANDBOX_HTTP;
  __resetFdmsSandboxForTests();
  __resetTaxForTests();
  __resetLedgerForTests();

  try {
    const open = await dayPost(
      new Request(
        "http://localhost/api/admin/fdms/day",
        withSecret({
          method: "POST",
          body: JSON.stringify({ action: "open" }),
        }),
      ),
    );
    assert.equal(open.status, 200);
    const openJson = (await open.json()) as { day: { fiscalDayId: string } };
    assert.ok(openJson.day.fiscalDayId);

    const seed = await outboxPost(
      new Request(
        "http://localhost/api/admin/fdms/outbox",
        withSecret({
          method: "POST",
          body: JSON.stringify({ action: "seed_agency_receipts" }),
        }),
      ),
    );
    assert.equal(seed.status, 200);

    const drain = await outboxPost(
      new Request(
        "http://localhost/api/admin/fdms/outbox",
        withSecret({
          method: "POST",
          body: JSON.stringify({ action: "drain" }),
        }),
      ),
    );
    assert.equal(drain.status, 200);
    const drainJson = (await drain.json()) as {
      fdmsOutbox: Array<{ status: string; fiscalCode?: string; receiptClass: string }>;
    };
    assert.equal(drainJson.fdmsOutbox.length, 3);
    assert.ok(drainJson.fdmsOutbox.every((r) => r.status === "submitted" && r.fiscalCode));
    assert.ok(drainJson.fdmsOutbox.some((r) => r.receiptClass === "DIAL_FEE"));
    assert.ok(drainJson.fdmsOutbox.some((r) => r.receiptClass === "GOODS_FORMAL"));
    assert.ok(drainJson.fdmsOutbox.some((r) => r.receiptClass === "GOODS_INFORMAL"));

    const snap = await outboxGet(
      new Request("http://localhost/api/admin/fdms/outbox", withSecret()),
    );
    assert.equal(snap.status, 200);
    const snapJson = (await snap.json()) as { printerRequired: boolean };
    assert.equal(snapJson.printerRequired, false);

    const close = await dayPost(
      new Request(
        "http://localhost/api/admin/fdms/day",
        withSecret({
          method: "POST",
          body: JSON.stringify({ action: "close" }),
        }),
      ),
    );
    assert.equal(close.status, 200);
    const closeJson = (await close.json()) as { day: { closedAt: string } };
    assert.ok(closeJson.day.closedAt);

    const daySnap = await dayGet(
      new Request("http://localhost/api/admin/fdms/day", withSecret()),
    );
    assert.equal(daySnap.status, 200);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
    if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prevMode;
  }
});
