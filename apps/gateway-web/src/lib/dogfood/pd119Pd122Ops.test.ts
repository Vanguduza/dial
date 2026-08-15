/**
 * PD119–PD122 dogfood — grocery timeline, Cal.com confirm, bull-board, Rive greeting.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  advanceGroceryOrderStatus,
  createGroceryCart,
  addToGroceryCart,
  listGroceryDeliverySlots,
  placeGroceryOrder,
  runPd119GroceryOrderTrackTimelineThinVertical,
  setGroceryCartSlot,
  __resetGroceryForTests,
} from "@dial/catalogue";
import { runPd120CalComConfirmThinVertical } from "@dial/jobs";
import { runPd121BullBoardInspectorThinVertical } from "@dial/queues";
import { runPd122RiveGreetingStubThinVertical } from "@dial/shared";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { GET as groceryTrackGet } from "../../app/api/grocery/track/route.js";
import {
  GET as servicesGet,
  POST as servicesPost,
} from "../../app/api/tech/services/route.js";
import { GET as queuesGet } from "../../app/api/admin/queues/route.js";
import { buildAuthHomeSnapshot } from "../home/authHome.js";

const root = join(process.cwd(), "src");

test("PD119 grocery track timeline API + UI", async () => {
  const thin = runPd119GroceryOrderTrackTimelineThinVertical();
  assert.ok(thin.timelineLen >= 3);

  __resetGroceryForTests();
  const cart = createGroceryCart();
  addToGroceryCart(cart.id, "groc_rice_2kg", 1);
  const slots = listGroceryDeliverySlots();
  setGroceryCartSlot(cart.id, slots[0]!.slotId);
  const order = placeGroceryOrder({
    cartId: cart.id,
    customerId: "cust_pd119",
    payChoice: "cod",
    soldBy: "Agency",
  });
  advanceGroceryOrderStatus(order.orderId);

  const res = await groceryTrackGet(
    new Request(
      `http://localhost/api/grocery/track?orderId=${encodeURIComponent(order.orderId)}`,
    ),
  );
  assert.equal(res.status, 200);
  const json = (await res.json()) as {
    timeline: unknown[];
    statusLabel: string;
    liquorAllowed: boolean;
    statusFrom: string;
  };
  assert.ok(json.timeline.length >= 2);
  assert.ok(json.statusLabel);
  assert.equal(json.liquorAllowed, false);
  assert.equal(json.statusFrom, "erp");

  const ui = readFileSync(
    join(root, "app/grocery/track/GroceryTrackClient.tsx"),
    "utf8",
  );
  assert.match(ui, /pd119-grocery-timeline/);
});

test("PD120 Cal.com confirm API", async () => {
  const thin = await runPd120CalComConfirmThinVertical();
  assert.equal(thin.confirmed, true);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd120@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const slotsRes = await servicesGet(
    new Request("http://localhost/api/tech/services?view=slots", {
      headers: { cookie },
    }),
  );
  const slotsJson = (await slotsRes.json()) as { slots: { slotId: string }[] };
  const slotId = slotsJson.slots[0]!.slotId;
  const conf = await servicesPost(
    new Request("http://localhost/api/tech/services", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ action: "confirm_cal", slotId }),
    }),
  );
  assert.equal(conf.status, 200);
  const confJson = (await conf.json()) as {
    booking: { status: string; payableFromAi: boolean; slotId: string };
  };
  assert.equal(confJson.booking.status, "confirmed");
  assert.equal(confJson.booking.payableFromAi, false);
  assert.equal(confJson.booking.slotId, slotId);
});

test("PD121 bull-board queues admin API", async () => {
  const thin = await runPd121BullBoardInspectorThinVertical();
  assert.equal(thin.sawWaitingJob, true);

  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "pd121_secret";
  try {
    const missing = await queuesGet(
      new Request("http://localhost/api/admin/queues"),
    );
    assert.equal(missing.status, 401);

    const ok = await queuesGet(
      new Request("http://localhost/api/admin/queues", {
        headers: { "x-internal-secret": "pd121_secret" },
      }),
    );
    assert.equal(ok.status, 200);
    const json = (await ok.json()) as {
      snapshot: {
        bullBoardPattern: boolean;
        moneyAuthority: boolean;
        boards: unknown[];
      };
    };
    assert.equal(json.snapshot.bullBoardPattern, true);
    assert.equal(json.snapshot.moneyAuthority, false);
    assert.ok(json.snapshot.boards.length >= 3);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("PD122 Rive greeting on auth home", async () => {
  const thin = runPd122RiveGreetingStubThinVertical();
  assert.equal(thin.voice, false);

  __resetAuthForTests();
  const { session } = createSession({
    email: "pd122@dial.test",
    role: "customer",
  });
  const home = buildAuthHomeSnapshot(session);
  assert.ok(home.riveGreeting.assetRef);
  assert.equal(home.riveGreeting.voice, false);

  const page = readFileSync(join(root, "app/home/page.tsx"), "utf8");
  assert.match(page, /pd122-rive-greeting/);
});
