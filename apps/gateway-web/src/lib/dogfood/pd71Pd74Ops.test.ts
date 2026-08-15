/**
 * PD71–PD74 dogfood — failover, promo approve, step-up, run polyline.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runPd74ActiveRunPolylineThinVertical } from "@dial/delivery";
import { runPd73IdentityStepUpThinVertical } from "@dial/identity";
import { runPd72PromoApproveQueueThinVertical } from "@dial/promotions";
import { runPd71OrderFailoverAcceptThinVertical } from "@dial/suppliers";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { POST as failoverPost } from "../../app/api/admin/orders/failover/route.js";
import {
  GET as promoApproveGet,
  POST as promoApprovePost,
} from "../../app/api/admin/promotions/approve/route.js";
import { POST as stepUpPost } from "../../app/api/admin/step-up/route.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("PD71 order failover", async () => {
  const page = readFileSync(
    join(root, "app/admin/orders/failover/page.tsx"),
    "utf8",
  );
  assert.match(page, /admin-order-failover/);
  const thin = runPd71OrderFailoverAcceptThinVertical();
  assert.equal(thin.failoverAccepted, true);

  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "pd71_secret";
  try {
    const seed = await failoverPost(
      new Request("http://localhost/api/admin/orders/failover", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd71_secret",
        },
        body: JSON.stringify({ action: "seed_breach" }),
      }),
    );
    assert.equal(seed.status, 200);
    const body = (await seed.json()) as {
      orderId: string;
      fromSupplierId: string;
      toSupplierId: string;
    };
    const fo = await failoverPost(
      new Request("http://localhost/api/admin/orders/failover", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd71_secret",
        },
        body: JSON.stringify({
          action: "failover_accept",
          orderId: body.orderId,
          fromSupplierId: body.fromSupplierId,
          toSupplierId: body.toSupplierId,
        }),
      }),
    );
    assert.equal(fo.status, 200);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("PD72 promo approve queue", async () => {
  const page = readFileSync(
    join(root, "app/admin/promotions/approve/page.tsx"),
    "utf8",
  );
  assert.match(page, /admin-promo-approve/);
  const thin = runPd72PromoApproveQueueThinVertical();
  assert.equal(thin.queuedThenCleared, true);

  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "pd72_secret";
  try {
    const seed = await promoApprovePost(
      new Request("http://localhost/api/admin/promotions/approve", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd72_secret",
        },
        body: JSON.stringify({ action: "seed_pending" }),
      }),
    );
    assert.equal(seed.status, 200);
    const list = await promoApproveGet(
      new Request("http://localhost/api/admin/promotions/approve", {
        headers: { "x-internal-secret": "pd72_secret" },
      }),
    );
    assert.equal(list.status, 200);
    const body = (await list.json()) as { pending: Array<{ campaignId: string }> };
    assert.ok(body.pending.length >= 1);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("PD73 identity step-up", async () => {
  const page = readFileSync(join(root, "app/admin/step-up/page.tsx"), "utf8");
  assert.match(page, /admin-step-up/);
  const thin = runPd73IdentityStepUpThinVertical();
  assert.equal(thin.gateEnforced, true);

  __resetAuthForTests();
  const { token } = createSession({
    email: "ops_pd73@dial.test",
    userId: "usr_pd73_api",
    role: "ops_admin",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const reqChallenge = await stepUpPost(
    new Request("http://localhost/api/admin/step-up", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        action: "request",
        purpose: "money_sensitive_admin",
      }),
    }),
  );
  assert.equal(reqChallenge.status, 200);
  const ch = (await reqChallenge.json()) as { challengeId: string };
  const verify = await stepUpPost(
    new Request("http://localhost/api/admin/step-up", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        action: "verify",
        challengeId: ch.challengeId,
        code: "step-up-ok",
      }),
    }),
  );
  assert.equal(verify.status, 200);
});

test("PD74 active run polyline", async () => {
  const thin = await runPd74ActiveRunPolylineThinVertical();
  assert.equal(thin.mapSor, "maplibre");
  assert.equal(thin.googleMapsSor, false);
  assert.ok(thin.coordinateCount >= 2);
});
