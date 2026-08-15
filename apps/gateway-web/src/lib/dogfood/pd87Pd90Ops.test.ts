/**
 * PD87–PD90 dogfood — coop propose/ack, guided intake, ops draft quote, tech availability.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  runPd88GuidedIntakeThinVertical,
  runPd89OpsDraftQuoteThinVertical,
} from "@dial/ai";
import { runPd90TechnicianAvailabilityThinVertical } from "@dial/jobs";
import { runPd87SupplierCoopProposeAckThinVertical } from "@dial/promotions";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { POST as supplierPost } from "../../app/api/supplier/portal/route.js";
import { POST as guidedPost } from "../../app/api/ai/guided-intake/route.js";
import { POST as opsDraftPost } from "../../app/api/ai/ops-draft-quote/route.js";
import {
  GET as techGet,
  POST as techPost,
} from "../../app/api/tech/technician/route.js";

test("PD87 supplier coop propose + accept", async () => {
  const thin = runPd87SupplierCoopProposeAckThinVertical();
  assert.equal(thin.afterAccept, "supplier_accepted");
  assert.equal(thin.afterOps, "live");
  assert.equal(thin.cashOutForbidden, true);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd87sup@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  await supplierPost(
    new Request("http://localhost/api/supplier/portal", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "onboard",
        displayName: "PD87 Co-op Supplier",
        formality: "formal",
        tier: "gold",
      }),
    }),
  );
  const propose = await supplierPost(
    new Request("http://localhost/api/supplier/portal", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "propose_coop",
        name: "PD87 Portal Pads",
        offerIds: ["off_pd87_api"],
        supplierFundShareBps: 5000,
        dialFundShareBps: 5000,
        budgetSpendLimitMinor: "5000",
      }),
    }),
  );
  assert.equal(propose.status, 200);
  const proposed = (await propose.json()) as {
    campaignId?: string;
    agreementStatus?: string;
  };
  assert.equal(proposed.agreementStatus, "proposed");
  assert.ok(proposed.campaignId);

  const accept = await supplierPost(
    new Request("http://localhost/api/supplier/portal", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "accept_coop",
        campaignId: proposed.campaignId,
      }),
    }),
  );
  assert.equal(accept.status, 200);
  const accepted = (await accept.json()) as { agreementStatus?: string };
  assert.equal(accepted.agreementStatus, "supplier_accepted");
});

test("PD88 guided intake API", async () => {
  const thin = runPd88GuidedIntakeThinVertical();
  assert.equal(thin.payableFromAi, false);
  assert.equal(thin.identityOmitted, true);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd88@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const res = await guidedPost(
    new Request("http://localhost/api/ai/guided-intake", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        customerText: "won't start battery maybe",
      }),
    }),
  );
  assert.equal(res.status, 200);
  const body = (await res.json()) as {
    assessment?: { needsHumanQuote?: boolean; urgency?: string };
    payableFromAi?: boolean;
  };
  assert.equal(body.payableFromAi, false);
  assert.equal(body.assessment?.needsHumanQuote, true);
});

test("PD89 ops draft quote API", async () => {
  const thin = runPd89OpsDraftQuoteThinVertical();
  assert.equal(thin.ledgerWrite, false);
  assert.equal(thin.humanApprovalRequired, true);

  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "pd89_secret";
  try {
    const res = await opsDraftPost(
      new Request("http://localhost/api/ai/ops-draft-quote", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd89_secret",
        },
        body: JSON.stringify({ customerText: "idle rattle" }),
      }),
    );
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      draft?: { humanApprovalRequired?: boolean; ledgerWrite?: boolean };
      payableFromAi?: boolean;
    };
    assert.equal(body.payableFromAi, false);
    assert.equal(body.draft?.humanApprovalRequired, true);
    assert.equal(body.draft?.ledgerWrite, false);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("PD90 technician availability", async () => {
  const thin = runPd90TechnicianAvailabilityThinVertical();
  assert.deepEqual(thin.statuses, ["available", "busy", "offline"]);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd90tech@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const set = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ action: "set_availability", status: "available" }),
    }),
  );
  assert.equal(set.status, 200);
  const get = await techGet(
    new Request("http://localhost/api/tech/technician?view=availability", {
      headers: { cookie },
    }),
  );
  assert.equal(get.status, 200);
  const body = (await get.json()) as {
    availability?: { status?: string };
  };
  assert.equal(body.availability?.status, "available");
});
