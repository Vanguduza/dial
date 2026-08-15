/**
 * PD103–PD106 dogfood — failover/fiscal/payout Idempotency-Key + tech profile cards.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { runPd103FailoverIdempotencyKeyThinVertical } from "@dial/suppliers";
import { runPd104FiscalIdempotencyKeyThinVertical } from "@dial/tax";
import {
  requireIdempotencyKey,
  runPd105PayoutIdempotencyKeyThinVertical,
} from "@dial/payments";
import { runPd106TechnicianProfileCardsThinVertical } from "@dial/jobs";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import {
  GET as servicesGet,
  POST as servicesPost,
} from "../../app/api/tech/services/route.js";
import { POST as failoverPost } from "../../app/api/spare/failover/route.js";
import { POST as adminFailoverPost } from "../../app/api/admin/orders/failover/route.js";
import { POST as fdmsOutboxPost } from "../../app/api/admin/fdms/outbox/route.js";
import { POST as whtPost } from "../../app/api/admin/compliance/wht/route.js";

test("PD103 failover Idempotency-Key HTTP", async () => {
  const thin = runPd103FailoverIdempotencyKeyThinVertical();
  assert.equal(thin.replaySameOrder, true);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd103@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const seed = await failoverPost(
    new Request("http://localhost/api/spare/failover", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "seed_breach",
        fromSupplierId: "sup_pd103_api_a",
        toSupplierId: "sup_pd103_api_b",
      }),
    }),
  );
  assert.equal(seed.status, 200);
  const seeded = (await seed.json()) as { orderId: string };

  const missing = await failoverPost(
    new Request("http://localhost/api/spare/failover", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "accept",
        orderId: seeded.orderId,
        toSupplierId: "sup_pd103_api_b",
      }),
    }),
  );
  assert.equal(missing.status, 400);

  const accept = await failoverPost(
    new Request("http://localhost/api/spare/failover", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
        "Idempotency-Key": "pd103-dogfood-accept",
      },
      body: JSON.stringify({
        action: "accept",
        orderId: seeded.orderId,
        toSupplierId: "sup_pd103_api_b",
      }),
    }),
  );
  assert.equal(accept.status, 200);

  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "pd103_secret";
  try {
    const adminSeed = await adminFailoverPost(
      new Request("http://localhost/api/admin/orders/failover", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd103_secret",
        },
        body: JSON.stringify({
          action: "seed_breach",
          fromSupplierId: "sup_pd103_adm_a",
          toSupplierId: "sup_pd103_adm_b",
        }),
      }),
    );
    assert.equal(adminSeed.status, 200);
    const adm = (await adminSeed.json()) as {
      orderId: string;
      fromSupplierId: string;
      toSupplierId: string;
    };
    const fo = await adminFailoverPost(
      new Request("http://localhost/api/admin/orders/failover", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd103_secret",
          "Idempotency-Key": "pd103-admin-fo",
        },
        body: JSON.stringify({
          action: "failover_accept",
          orderId: adm.orderId,
          fromSupplierId: adm.fromSupplierId,
          toSupplierId: adm.toSupplierId,
        }),
      }),
    );
    assert.equal(fo.status, 200);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("PD104 fiscal Idempotency-Key HTTP", async () => {
  const thin = runPd104FiscalIdempotencyKeyThinVertical();
  assert.equal(thin.replaySameReceipt, true);

  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "pd104_secret";
  try {
    const missing = await fdmsOutboxPost(
      new Request("http://localhost/api/admin/fdms/outbox", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd104_secret",
        },
        body: JSON.stringify({ action: "seed_agency_receipts" }),
      }),
    );
    assert.equal(missing.status, 400);

    const seed = await fdmsOutboxPost(
      new Request("http://localhost/api/admin/fdms/outbox", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd104_secret",
          "Idempotency-Key": "pd104-dogfood-seed",
        },
        body: JSON.stringify({ action: "seed_agency_receipts" }),
      }),
    );
    assert.equal(seed.status, 200);
    const a = (await seed.json()) as { seeded: Array<{ id: string }> };
    const replay = await fdmsOutboxPost(
      new Request("http://localhost/api/admin/fdms/outbox", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd104_secret",
          "Idempotency-Key": "pd104-dogfood-seed",
        },
        body: JSON.stringify({ action: "seed_agency_receipts" }),
      }),
    );
    assert.equal(replay.status, 200);
    const b = (await replay.json()) as { seeded: Array<{ id: string }> };
    assert.deepEqual(
      a.seeded.map((s) => s.id),
      b.seeded.map((s) => s.id),
    );
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("PD105 payout Idempotency-Key HTTP", async () => {
  const thin = runPd105PayoutIdempotencyKeyThinVertical();
  assert.equal(thin.noDoubleWithhold, true);
  assert.throws(() => requireIdempotencyKey(new Headers()), /Idempotency-Key/);

  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "pd105_secret";
  try {
    const missing = await whtPost(
      new Request("http://localhost/api/admin/compliance/wht", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd105_secret",
        },
        body: JSON.stringify({
          action: "record_payout",
          technicianId: "tech_pd105_api",
          payoutUsdMinor: "10000",
          hasItf263: false,
        }),
      }),
    );
    assert.equal(missing.status, 400);

    const pay = await whtPost(
      new Request("http://localhost/api/admin/compliance/wht", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd105_secret",
          "Idempotency-Key": "pd105-dogfood-payout",
        },
        body: JSON.stringify({
          action: "record_payout",
          technicianId: "tech_pd105_api",
          payoutUsdMinor: "10000",
          hasItf263: false,
        }),
      }),
    );
    assert.equal(pay.status, 200);
    const a = (await pay.json()) as { withholdMinor: string };
    const replay = await whtPost(
      new Request("http://localhost/api/admin/compliance/wht", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd105_secret",
          "Idempotency-Key": "pd105-dogfood-payout",
        },
        body: JSON.stringify({
          action: "record_payout",
          technicianId: "tech_pd105_api",
          payoutUsdMinor: "10000",
          hasItf263: false,
        }),
      }),
    );
    assert.equal(replay.status, 200);
    const b = (await replay.json()) as { withholdMinor: string };
    assert.equal(a.withholdMinor, b.withholdMinor);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("PD106 technician profile cards API + book UI", async () => {
  const thin = runPd106TechnicianProfileCardsThinVertical();
  assert.equal(thin.managersChoiceVisible, true);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd106@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const res = await servicesGet(
    new Request("http://localhost/api/tech/services?view=profiles", {
      headers: { cookie },
    }),
  );
  assert.equal(res.status, 200);
  const json = (await res.json()) as {
    profiles: Array<{ managersChoice: boolean; eligible: boolean }>;
    payableFromAi: boolean;
  };
  assert.ok(json.profiles.length >= 2);
  assert.ok(json.profiles.some((p) => p.managersChoice));
  assert.equal(json.payableFromAi, false);
  void servicesPost;
});
