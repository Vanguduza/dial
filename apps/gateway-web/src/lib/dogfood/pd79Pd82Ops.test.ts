/**
 * PD79–PD82 dogfood — garage CRUD, COD confirm, checklist symptom, account profile.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runPd79GarageCrudThinVertical } from "@dial/catalogue";
import {
  __resetDeliveryForTests,
  runPd80CodConfirmThinVertical,
} from "@dial/delivery";
import { runPd82AccountProfileThinVertical } from "@dial/identity";
import { runPd81ChecklistBySymptomThinVertical } from "@dial/jobs";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import {
  DELETE as garageDelete,
  PATCH as garagePatch,
  POST as garagePost,
} from "../../app/api/spare/garage/route.js";
import { POST as courierPost } from "../../app/api/delivery/courier/route.js";
import { POST as techPost } from "../../app/api/tech/technician/route.js";
import {
  GET as profileGet,
  PATCH as profilePatch,
} from "../../app/api/account/profile/route.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("PD79 garage CRUD update + delete", async () => {
  const page = readFileSync(join(root, "app/spare/garage/page.tsx"), "utf8");
  assert.match(page, /Delete/);
  const thin = runPd79GarageCrudThinVertical();
  assert.equal(thin.deleted, true);
  assert.equal(thin.promotedActive, true);

  const a = await garagePost(
    new Request("http://localhost/api/spare/garage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customerId: "cust_pd79_api",
        label: "A",
        chassisHint: "A1",
        reminderConsent: false,
      }),
    }),
  );
  assert.equal(a.status, 200);
  const bodyA = (await a.json()) as { vehicle: { vehicleId: string } };
  await garagePost(
    new Request("http://localhost/api/spare/garage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customerId: "cust_pd79_api",
        label: "B",
        chassisHint: "B1",
        reminderConsent: false,
      }),
    }),
  );
  const upd = await garagePatch(
    new Request("http://localhost/api/spare/garage", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        vehicleId: bodyA.vehicle.vehicleId,
        label: "A Updated",
        chassisHint: "A2",
      }),
    }),
  );
  assert.equal(upd.status, 200);
  const del = await garageDelete(
    new Request(
      `http://localhost/api/spare/garage?vehicleId=${bodyA.vehicle.vehicleId}`,
      { method: "DELETE" },
    ),
  );
  assert.equal(del.status, 200);
  const delBody = (await del.json()) as { deleted?: boolean };
  assert.equal(delBody.deleted, true);
});

test("PD80 COD confirm", async () => {
  const thin = runPd80CodConfirmThinVertical({ courierId: "cour_pd80_dog" });
  assert.equal(thin.confirmed, true);
  assert.equal(thin.settleUsdMinor, "1500");

  __resetDeliveryForTests();
  __resetAuthForTests();
  const { token } = createSession({
    email: "pd80@dial.test",
    role: "technician",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const seed = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "seed_offer",
        orderId: "ord_pd80_api",
        codUsdMinor: "1800",
      }),
    }),
  );
  assert.equal(seed.status, 200);
  const seeded = (await seed.json()) as {
    offer?: { id: string };
    job?: { id: string };
  };
  const accept = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "accept_offer",
        offerId: seeded.offer?.id,
      }),
    }),
  );
  assert.equal(accept.status, 200);
  const attempt = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "cod_collect_attempt",
        jobId: seeded.job?.id,
        collectUsdMinor: "1800",
        acknowledgedWarning: true,
      }),
    }),
  );
  assert.equal(attempt.status, 200);
  const attemptBody = (await attempt.json()) as {
    attempt?: { attemptId: string };
  };
  const confirm = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "cod_confirm",
        jobId: seeded.job?.id,
        attemptId: attemptBody.attempt?.attemptId,
      }),
    }),
  );
  assert.equal(confirm.status, 200);
  const confBody = (await confirm.json()) as {
    confirmed?: boolean;
    settleUsdMinor?: string;
  };
  assert.equal(confBody.confirmed, true);
  assert.equal(confBody.settleUsdMinor, "1800");
});

test("PD81 checklist by symptom", async () => {
  const thin = runPd81ChecklistBySymptomThinVertical();
  assert.equal(thin.completed, true);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd81@dial.test",
    role: "technician",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const resolve = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "resolve_checklist_by_symptom",
        symptom: "flat tyre highway stranded",
      }),
    }),
  );
  assert.equal(resolve.status, 200);
  const resolved = (await resolve.json()) as {
    checklist?: { id: string; steps: string[] };
  };
  assert.equal(resolved.checklist?.id, "emergency_roadside");

  const book = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "book",
        jobClass: "roadside",
        emergency: true,
        assignSelf: true,
      }),
    }),
  );
  assert.equal(book.status, 200);
  const booked = (await book.json()) as { job?: { id: string } };
  const start = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "start_checklist",
        jobId: booked.job?.id,
        checklistId: resolved.checklist?.id,
      }),
    }),
  );
  assert.equal(start.status, 200);
  const started = (await start.json()) as { run?: { runId: string } };
  const answers = (resolved.checklist?.steps ?? []).map((s, i) => `ok_${i}_${s}`);
  const submit = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "submit_checklist_answers",
        runId: started.run?.runId,
        answers,
      }),
    }),
  );
  assert.equal(submit.status, 200);
  const submitted = (await submit.json()) as {
    run?: { status: string; answers: string[] };
  };
  assert.equal(submitted.run?.status, "completed");
  assert.equal(submitted.run?.answers.length, answers.length);
});

test("PD82 account profile", async () => {
  const page = readFileSync(
    join(root, "app/account/profile/page.tsx"),
    "utf8",
  );
  assert.match(page, /account-profile/);
  const thin = runPd82AccountProfileThinVertical();
  assert.equal(thin.displayNameUpdated, true);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd82@dial.test",
    role: "customer",
    userId: "usr_pd82_api",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const get = await profileGet(
    new Request("http://localhost/api/account/profile", {
      headers: { cookie },
    }),
  );
  assert.equal(get.status, 200);
  const patch = await profilePatch(
    new Request("http://localhost/api/account/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ displayName: "PD82 Customer" }),
    }),
  );
  assert.equal(patch.status, 200);
  const body = (await patch.json()) as {
    profile?: { displayName?: string };
  };
  assert.equal(body.profile?.displayName, "PD82 Customer");
});
