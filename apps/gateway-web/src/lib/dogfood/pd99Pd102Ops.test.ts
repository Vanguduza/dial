/**
 * PD99–PD102 dogfood — grocery Idempotency-Key, create intake, job status, VS dispute.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  runPd100JobCreateIntakeThinVertical,
  runPd101CustomerJobStatusThinVertical,
  runPd102TechValueScoreDisputeThinVertical,
  __resetJobsForTests,
} from "@dial/jobs";
import {
  requireIdempotencyKey,
  runPd99GroceryIdempotencyKeyThinVertical,
  __resetPaymentsForTests,
  setDailyZigRate,
} from "@dial/payments";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { POST as groceryCheckoutPost } from "../../app/api/grocery/checkout/route.js";
import {
  GET as servicesGet,
  POST as servicesPost,
} from "../../app/api/tech/services/route.js";
import {
  GET as techGet,
  POST as techPost,
} from "../../app/api/tech/technician/route.js";
import {
  __resetGroceryForTests,
  addToGroceryCart,
  createGroceryCart,
  listGroceryDeliverySlots,
  setGroceryCartSlot,
} from "@dial/catalogue";

test("PD99 grocery Idempotency-Key required + accepted", async () => {
  const thin = await runPd99GroceryIdempotencyKeyThinVertical();
  assert.equal(thin.missingRejected, true);
  assert.equal(thin.groceryKeyAccepted, true);

  __resetPaymentsForTests();
  __resetGroceryForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "pd99" });
  __resetAuthForTests();
  const { token } = createSession({
    email: "pd99@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const cart = createGroceryCart();
  addToGroceryCart(cart.id, "groc_rice_2kg", 1);
  const slots = listGroceryDeliverySlots();
  setGroceryCartSlot(cart.id, slots[0]!.slotId);

  const missing = await groceryCheckoutPost(
    new Request("http://localhost/api/grocery/checkout", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ cartId: cart.id, choice: "cod" }),
    }),
  );
  assert.equal(missing.status, 400);
  assert.match(
    String((await missing.json() as { error?: string }).error),
    /Idempotency-Key/,
  );

  const ok = await groceryCheckoutPost(
    new Request("http://localhost/api/grocery/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
        "Idempotency-Key": "pd99-dogfood-cod",
      },
      body: JSON.stringify({ cartId: cart.id, choice: "cod" }),
    }),
  );
  assert.equal(ok.status, 200);
  void requireIdempotencyKey;
});

test("PD100 create_intake via tech services", async () => {
  const thin = runPd100JobCreateIntakeThinVertical();
  assert.equal(thin.status, "intake");

  __resetJobsForTests();
  __resetAuthForTests();
  const { token } = createSession({
    email: "pd100@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const res = await servicesPost(
    new Request("http://localhost/api/tech/services", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "create_intake",
        customerText: "brakes squeal when stopping",
      }),
    }),
  );
  assert.equal(res.status, 200);
  const json = (await res.json()) as {
    job: { status: string; intakeSummary?: string };
    needsHumanQuote: boolean;
    payableFromAi: boolean;
  };
  assert.equal(json.job.status, "intake");
  assert.ok(json.job.intakeSummary);
  assert.equal(json.needsHumanQuote, true);
  assert.equal(json.payableFromAi, false);
});

test("PD101 job status detail + timeline", async () => {
  const thin = runPd101CustomerJobStatusThinVertical();
  assert.ok(thin.evidenceCount >= 1);

  __resetJobsForTests();
  __resetAuthForTests();
  const { token } = createSession({
    email: "pd101@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const book = await servicesPost(
    new Request("http://localhost/api/tech/services", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "emergency_book",
      }),
    }),
  );
  assert.equal(book.status, 200);
  const bookJson = (await book.json()) as { job: { id: string } };

  const detail = await servicesGet(
    new Request(
      `http://localhost/api/tech/services?view=job&jobId=${bookJson.job.id}`,
      { headers: { cookie } },
    ),
  );
  assert.equal(detail.status, 200);
  const json = (await detail.json()) as {
    statusLabel: string;
    timeline: unknown[];
    evidence: unknown[];
    payableFromAi: boolean;
  };
  assert.ok(json.statusLabel);
  assert.ok(Array.isArray(json.timeline));
  assert.ok(json.timeline.length >= 1);
  assert.equal(json.payableFromAi, false);
});

test("PD102 tech self-serve Value Score dispute", async () => {
  const thin = runPd102TechValueScoreDisputeThinVertical();
  assert.equal(thin.disputeOpened, true);

  __resetJobsForTests();
  __resetAuthForTests();
  const { token } = createSession({
    email: "pd102@dial.test",
    role: "technician",
  });
  const cookie = `${sessionCookieName()}=${token}`;

  const view = await techGet(
    new Request("http://localhost/api/tech/technician?view=value_score", {
      headers: { cookie },
    }),
  );
  assert.equal(view.status, 200);

  const dispute = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "dispute_value_score",
        reason: "punctuality mis-scored after geofence check-in",
      }),
    }),
  );
  assert.equal(dispute.status, 200);
  const json = (await dispute.json()) as {
    dispute: { status: string; openedBy: string };
    payableFromAi: boolean;
  };
  assert.equal(json.dispute.status, "open");
  assert.match(json.dispute.openedBy, /^tech_/);
  assert.equal(json.payableFromAi, false);
});
