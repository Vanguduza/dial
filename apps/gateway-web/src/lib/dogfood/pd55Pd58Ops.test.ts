/**
 * PD55–PD58 dogfood — orders queue, manual assign, ZiG four-eyes, customer track.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  __resetSpareCustomerForTests,
  placeSpareOrder,
  runPd55AdminOrdersThinVertical,
} from "@dial/catalogue";
import {
  __resetDeliveryForTests,
  acceptOffer,
  createDeliveryJob,
  getDeliveryJob,
  postCourierLocation,
  runPd56ManualOverrideAssignThinVertical,
  runPd58CustomerDeliveryTrackThinVertical,
  setCourierAvailabilityStatus,
  startDeliveryDispatchWorkflow,
} from "@dial/delivery";
import { runPd57DailyZigFourEyesThinVertical } from "@dial/payments";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import {
  GET as ordersGet,
  POST as ordersPost,
} from "../../app/api/admin/orders/route.js";
import { POST as dispatchPost } from "../../app/api/admin/delivery/dispatch/route.js";
import {
  GET as fxGet,
  POST as fxPost,
} from "../../app/api/admin/fx/daily-zig/route.js";
import { GET as trackGet } from "../../app/api/delivery/track/route.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("PD55 admin orders queue", async () => {
  const page = readFileSync(join(root, "app/admin/orders/page.tsx"), "utf8");
  assert.match(page, /admin-orders-queue/);
  assert.match(page, /liquor|grocery|spare/i);

  const thin = runPd55AdminOrdersThinVertical();
  assert.equal(thin.spareAdvanced, true);
  assert.equal(thin.groceryAdvanced, true);
  assert.equal(thin.payableFromAi, false);
  assert.equal(thin.liquorAllowed, false);

  process.env.INTERNAL_API_SECRET = "pd55_secret";
  const list = await ordersGet(
    new Request("http://localhost/api/admin/orders", {
      headers: { "x-internal-secret": "pd55_secret" },
    }),
  );
  assert.equal(list.status, 200);
  const body = (await list.json()) as {
    orders: Array<{ orderId: string; vertical: string }>;
  };
  assert.ok(body.orders.some((o) => o.orderId === thin.spareOrderId));
  assert.ok(body.orders.some((o) => o.orderId === thin.groceryOrderId));

  const adv = await ordersPost(
    new Request("http://localhost/api/admin/orders", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": "pd55_secret",
      },
      body: JSON.stringify({
        action: "advance",
        vertical: "spare",
        orderId: thin.spareOrderId,
      }),
    }),
  );
  assert.equal(adv.status, 200);
  delete process.env.INTERNAL_API_SECRET;
});

test("PD56 manual override assign", async () => {
  const page = readFileSync(
    join(root, "app/admin/delivery/dispatch/page.tsx"),
    "utf8",
  );
  assert.match(page, /Manual override assign|overrideAssign/);

  const thin = runPd56ManualOverrideAssignThinVertical();
  assert.equal(thin.status, "assigned");
  assert.equal(thin.removedFromFifo, true);
  assert.equal(thin.payableFromAi, false);

  process.env.INTERNAL_API_SECRET = "pd56_secret";
  __resetDeliveryForTests();
  const seed = await dispatchPost(
    new Request("http://localhost/api/admin/delivery/dispatch", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": "pd56_secret",
      },
      body: JSON.stringify({ action: "seed_fifo_job" }),
    }),
  );
  assert.equal(seed.status, 200);
  const seeded = (await seed.json()) as { jobId: string };
  const ov = await dispatchPost(
    new Request("http://localhost/api/admin/delivery/dispatch", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": "pd56_secret",
      },
      body: JSON.stringify({
        action: "manual_override_assign",
        jobId: seeded.jobId,
        courierId: "cour_api_56",
        assignedBy: "ops_api",
      }),
    }),
  );
  assert.equal(ov.status, 200);
  const assigned = (await ov.json()) as {
    job: { status: string; assignedCourierId: string };
  };
  assert.equal(assigned.job.status, "assigned");
  assert.equal(assigned.job.assignedCourierId, "cour_api_56");
  delete process.env.INTERNAL_API_SECRET;
});

test("PD57 Daily ZiG four-eyes", async () => {
  const page = readFileSync(
    join(root, "app/admin/fx/daily-zig/page.tsx"),
    "utf8",
  );
  assert.match(page, /four-eyes|Propose|Approve/i);

  const thin = runPd57DailyZigFourEyesThinVertical();
  assert.equal(thin.fourEyesEnforced, true);
  assert.equal(thin.payableFromAi, false);

  process.env.INTERNAL_API_SECRET = "pd57_secret";
  const prop = await fxPost(
    new Request("http://localhost/api/admin/fx/daily-zig", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": "pd57_secret",
      },
      body: JSON.stringify({
        action: "propose",
        zigMinorPerUsd: "270000",
        proposedBy: "ops_x",
      }),
    }),
  );
  assert.equal(prop.status, 200);
  const proposed = (await prop.json()) as {
    proposal: { proposalId: string };
  };
  const same = await fxPost(
    new Request("http://localhost/api/admin/fx/daily-zig", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": "pd57_secret",
      },
      body: JSON.stringify({
        action: "approve",
        proposalId: proposed.proposal.proposalId,
        approvedBy: "ops_x",
      }),
    }),
  );
  assert.equal(same.status, 400);
  const ok = await fxPost(
    new Request("http://localhost/api/admin/fx/daily-zig", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": "pd57_secret",
      },
      body: JSON.stringify({
        action: "approve",
        proposalId: proposed.proposal.proposalId,
        approvedBy: "ops_y",
      }),
    }),
  );
  assert.equal(ok.status, 200);
  const get = await fxGet(
    new Request("http://localhost/api/admin/fx/daily-zig", {
      headers: { "x-internal-secret": "pd57_secret" },
    }),
  );
  assert.equal(get.status, 200);
  delete process.env.INTERNAL_API_SECRET;
});

test("PD58 customer delivery track read-only", async () => {
  const page = readFileSync(
    join(root, "app/delivery/track/page.tsx"),
    "utf8",
  );
  assert.match(page, /customer-delivery-track/);
  assert.match(page, /read-only|MapLibre/i);

  const thin = runPd58CustomerDeliveryTrackThinVertical();
  assert.equal(thin.readOnly, true);
  assert.equal(thin.mapSor, "maplibre");

  __resetAuthForTests();
  __resetSpareCustomerForTests();
  __resetDeliveryForTests();
  const { token } = createSession({
    email: "pd58@dial.test",
    buyerSegment: "b2c",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const spare = placeSpareOrder({
    cart: {
      id: "cart_pd58_api",
      currency: "USD",
      totalUsdMinor: 10_00n,
      lines: [
        {
          offerId: "off_pd58",
          title: "PD58 part",
          qty: 1,
          unitPriceUsdMinor: 10_00n,
          lineTotalUsdMinor: 10_00n,
          soldBy: "Agency",
          supplierFormality: "formal",
        },
      ],
    },
    customerId: "cust_pd58",
    payChoice: "cod",
  });
  setCourierAvailabilityStatus("cour_pd58_api", "available");
  const job = createDeliveryJob({
    orderId: spare.orderId,
    from: "hub",
    to: "home",
    codUsdMinor: 10_00n,
  });
  startDeliveryDispatchWorkflow(job.id);
  const offered = getDeliveryJob(job.id)!;
  acceptOffer(offered.offerId!, "cour_pd58_api");
  postCourierLocation({
    courierId: "cour_pd58_api",
    lat: -17.8,
    lng: 31.0,
    jobId: job.id,
  });

  const res = await trackGet(
    new Request(
      `http://localhost/api/delivery/track?orderId=${spare.orderId}`,
      { headers: { cookie } },
    ),
  );
  assert.equal(res.status, 200);
  const body = (await res.json()) as {
    readOnly: boolean;
    mapSor: string;
    location: { lat: number } | null;
  };
  assert.equal(body.readOnly, true);
  assert.equal(body.mapSor, "maplibre");
  assert.ok(body.location);
});
