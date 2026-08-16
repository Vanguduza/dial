/**
 * PD48–PD50 dogfood — admin returns, escrow sandbox, Vehicle Hub deepen.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  __resetSpareCustomerForTests,
  listSpareReturnClaims,
  openSpareReturnClaim,
  runPd18SpareWebThinVertical,
  runPd48AdminReturnsThinVertical,
  runPd50VehicleHubThinVertical,
} from "@dial/catalogue";
import { runPd49EscrowSandboxThinVertical } from "@dial/adapter-psp";
import {
  GET as returnsGet,
  POST as returnsPost,
} from "../../app/api/admin/returns/route.js";
import {
  GET as escrowGet,
  POST as escrowPost,
} from "../../app/api/admin/money/escrow/route.js";
import {
  GET as garageGet,
  PATCH as garagePatch,
  POST as garagePost,
} from "../../app/api/spare/garage/route.js";
import { testAuthCookie } from "../auth/session.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("PD48 admin returns UI + thin vertical", async () => {
  const page = readFileSync(
    join(root, "app/admin/returns/page.tsx"),
    "utf8",
  );
  assert.match(page, /admin-returns-queue/);
  assert.match(page, /payableFromAi/);
  assert.match(page, /Refund|Replace/);

  const thin = runPd48AdminReturnsThinVertical();
  assert.equal(thin.listed, true);
  assert.equal(thin.resolvedPath, "refund");
  assert.equal(thin.payableFromAi, false);
  assert.equal(thin.openCountAfterResolve, 0);

  __resetSpareCustomerForTests();
  const pd18 = await runPd18SpareWebThinVertical();
  // PD18 already opens one claim — open a second for admin resolve path
  const claim = openSpareReturnClaim({
    orderId: pd18.orderId,
    path: "refund_or_replace",
  });
  assert.ok(listSpareReturnClaims({ status: "opened" }).length >= 1);

  process.env.INTERNAL_API_SECRET = "pd48_secret";
  const listRes = await returnsGet(
    new Request("http://localhost/api/admin/returns?status=opened", {
      headers: { "x-internal-secret": "pd48_secret" },
    }),
  );
  assert.equal(listRes.status, 200);
  const listed = (await listRes.json()) as {
    claims: Array<{ claimId: string }>;
    payableFromAi: boolean;
  };
  assert.equal(listed.payableFromAi, false);
  assert.ok(listed.claims.some((c) => c.claimId === claim.claimId));

  const resolveRes = await returnsPost(
    new Request("http://localhost/api/admin/returns", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": "pd48_secret",
      },
      body: JSON.stringify({ claimId: claim.claimId, path: "replace" }),
    }),
  );
  assert.equal(resolveRes.status, 200);
  const resolved = (await resolveRes.json()) as {
    claim: { resolution: string; payableFromAi: boolean };
  };
  assert.equal(resolved.claim.resolution, "replace");
  assert.equal(resolved.claim.payableFromAi, false);

  delete process.env.INTERNAL_API_SECRET;
  const fail = await returnsGet(
    new Request("http://localhost/api/admin/returns"),
  );
  assert.equal(fail.status, 503);
});

test("PD49 escrow sandbox vertical + admin API", async () => {
  const page = readFileSync(
    join(root, "app/admin/money/escrow/page.tsx"),
    "utf8",
  );
  assert.match(page, /admin-escrow-sandbox/);
  assert.match(page, /ENH-020|live partner/i);

  const out = await runPd49EscrowSandboxThinVertical();
  assert.equal(out.sandboxFailClosed, true);
  assert.equal(out.fixtureHoldRelease, true);
  assert.equal(out.liveContractRequired, false);
  assert.equal(out.payableFromAi, false);

  process.env.INTERNAL_API_SECRET = "pd49_secret";
  const auth = await escrowPost(
    new Request("http://localhost/api/admin/money/escrow", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": "pd49_secret",
      },
      body: JSON.stringify({
        action: "authorize",
        jobId: "job_pd49_api",
        amountUsdMinor: "2500",
        idempotencyKey: "pd49_api_idem_1",
      }),
    }),
  );
  assert.equal(auth.status, 200);
  const authBody = (await auth.json()) as {
    reserve: { id: string; status: string };
  };
  assert.equal(authBody.reserve.status, "authorized");

  const rel = await escrowPost(
    new Request("http://localhost/api/admin/money/escrow", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": "pd49_secret",
      },
      body: JSON.stringify({
        action: "webhook",
        reserveId: authBody.reserve.id,
        eventId: "pd49_api_evt_rel",
        webhookAction: "release",
        signatureValid: true,
      }),
    }),
  );
  assert.equal(rel.status, 200);
  const relBody = (await rel.json()) as { reserve: { status: string } };
  assert.equal(relBody.reserve.status, "released");

  const get = await escrowGet(
    new Request(
      `http://localhost/api/admin/money/escrow?reserveId=${authBody.reserve.id}`,
      { headers: { "x-internal-secret": "pd49_secret" } },
    ),
  );
  assert.equal(get.status, 200);
  const getBody = (await get.json()) as {
    liveContractRequired: boolean;
    reserve: { status: string };
  };
  assert.equal(getBody.liveContractRequired, false);
  assert.equal(getBody.reserve.status, "released");
  delete process.env.INTERNAL_API_SECRET;
});

test("PD50 Vehicle Hub deepen — consent audit + chassis browse", async () => {
  const garagePage = readFileSync(
    join(root, "app/spare/garage/page.tsx"),
    "utf8",
  );
  assert.match(garagePage, /Browse parts/);
  assert.match(garagePage, /Revoke consent/);
  assert.match(garagePage, /Vehicle Hub/);

  const thin = runPd50VehicleHubThinVertical();
  assert.equal(thin.consentRevoked, true);
  assert.equal(thin.auditHasRevoke, true);
  assert.match(thin.browsePath, /chassis=KUN26/);
  assert.equal(thin.payableFromAi, false);

  __resetSpareCustomerForTests();
  const cookie = testAuthCookie({ userId: "cust_pd50_api" });
  const add = await garagePost(
    new Request("http://localhost/api/spare/garage", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        label: "API Hilux",
        chassisHint: "KUN26",
        reminderConsent: true,
      }),
    }),
  );
  assert.equal(add.status, 200);
  const added = (await add.json()) as { vehicle: { vehicleId: string } };

  const patch = await garagePatch(
    new Request("http://localhost/api/spare/garage", {
      method: "PATCH",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        vehicleId: added.vehicle.vehicleId,
        reminderConsent: false,
      }),
    }),
  );
  assert.equal(patch.status, 200);
  const patched = (await patch.json()) as {
    vehicle: { reminderConsent: boolean };
    browsePath: string;
    consentAudit: Array<{ action: string }>;
  };
  assert.equal(patched.vehicle.reminderConsent, false);
  assert.match(patched.browsePath, /chassis=KUN26/);
  assert.ok(patched.consentAudit.some((e) => e.action === "revoke"));

  const list = await garageGet(
    new Request("http://localhost/api/spare/garage?includeAudit=1", {
      headers: { cookie },
    }),
  );
  assert.equal(list.status, 200);
  const listed = (await list.json()) as {
    consentAudit: Array<{ action: string }>;
  };
  assert.ok(listed.consentAudit.some((e) => e.action === "grant"));
});
