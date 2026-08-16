/**
 * PD111–PD114 dogfood — intake book, Paynow URL, Formbricks/PostHog stubs, checklist seed.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  runPd111IntakeBookThinVertical,
  runPd114ChecklistCatalogSeedThinVertical,
  __resetJobsForTests,
  createJobIntake,
  listBookingSlots,
} from "@dial/jobs";
import {
  runPd112PaynowUrlCheckoutThinVertical,
  __resetPaymentsForTests,
  setDailyZigRate,
} from "@dial/payments";
import { runPd113FormbricksPosthogStubThinVertical } from "@dial/shared";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import {
  GET as servicesGet,
  POST as servicesPost,
} from "../../app/api/tech/services/route.js";
import { POST as spareCheckoutPost } from "../../app/api/spare/checkout/route.js";
import {
  GET as experienceGet,
  POST as experiencePost,
} from "../../app/api/experience/route.js";
import { addToCart, createCart, __resetCatalogueForTests } from "@dial/catalogue";

test("PD111 intake → book same job id API", async () => {
  const thin = runPd111IntakeBookThinVertical();
  assert.equal(thin.sameJobId, true);
  assert.equal(thin.status, "booked");

  __resetJobsForTests();
  __resetAuthForTests();
  const { token } = createSession({
    email: "pd111@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const intake = await servicesPost(
    new Request("http://localhost/api/tech/services", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "create_intake",
        customerText: "check engine light mornings",
      }),
    }),
  );
  assert.equal(intake.status, 200);
  const intakeJson = (await intake.json()) as { job: { id: string; status: string } };
  assert.equal(intakeJson.job.status, "intake");

  const slotsRes = await servicesGet(
    new Request("http://localhost/api/tech/services?view=slots", {
      headers: { cookie },
    }),
  );
  const slotsJson = (await slotsRes.json()) as { slots: { slotId: string }[] };
  const slotId = slotsJson.slots[0]!.slotId;

  const booked = await servicesPost(
    new Request("http://localhost/api/tech/services", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "book_intake",
        jobId: intakeJson.job.id,
        slotId,
      }),
    }),
  );
  assert.equal(booked.status, 200);
  const bookedJson = (await booked.json()) as {
    job: { id: string; status: string; slotId: string };
    sameJobId: boolean;
    payableFromAi: boolean;
  };
  assert.equal(bookedJson.sameJobId, true);
  assert.equal(bookedJson.job.id, intakeJson.job.id);
  assert.equal(bookedJson.job.status, "booked");
  assert.equal(bookedJson.job.slotId, slotId);
  assert.equal(bookedJson.payableFromAi, false);
  void createJobIntake;
  void listBookingSlots;
});

test("PD112 Paynow hosted URL on spare checkout", async () => {
  const thin = await runPd112PaynowUrlCheckoutThinVertical();
  assert.equal(thin.hostedUrlPresent, true);
  assert.equal(thin.requiredRailsPresent, true);

  __resetPaymentsForTests();
  __resetCatalogueForTests();
  __resetAuthForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "pd112" });
  const { token } = createSession({
    email: "pd112@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const cart = createCart();
  addToCart(cart.id, "off_filter_oil_kun26", 1);

  const res = await spareCheckoutPost(
    new Request("http://localhost/api/spare/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
        "Idempotency-Key": "pd112-dogfood-paynow",
      },
      body: JSON.stringify({ cartId: cart.id, choice: "paynow" }),
    }),
  );
  assert.equal(res.status, 200);
  const json = (await res.json()) as {
    choice: string;
    hostedUrl: string | null;
    payableFromAi: boolean;
  };
  assert.equal(json.choice, "paynow");
  assert.ok(json.hostedUrl && json.hostedUrl.includes("paynow"));
  assert.equal(json.payableFromAi, false);
});

test("PD113 Formbricks + PostHog experience stubs API", async () => {
  const thin = runPd113FormbricksPosthogStubThinVertical();
  assert.equal(thin.surveySkippedWithoutKey, true);
  assert.equal(thin.flagOffWithoutKey, true);

  const get = await experienceGet(new Request("http://localhost/api/experience"));
  assert.equal(get.status, 200);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd113@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const survey = await experiencePost(
    new Request("http://localhost/api/experience", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "queue_survey",
        surveyId: "csat_post_job",
        jobId: "job_pd113",
      }),
    }),
  );
  assert.equal(survey.status, 200);
  const surveyJson = (await survey.json()) as {
    survey: { status: string; payableFromAi: boolean };
  };
  assert.equal(surveyJson.survey.status, "skipped_no_key");
  assert.equal(surveyJson.survey.payableFromAi, false);

  const flag = await experiencePost(
    new Request("http://localhost/api/experience", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "evaluate_flag",
        flagKey: "staff_dogfood_ai_field",
      }),
    }),
  );
  assert.equal(flag.status, 200);
  const flagJson = (await flag.json()) as {
    flag: { enabled: boolean; moneyAuthority: boolean };
  };
  assert.equal(flagJson.flag.enabled, false);
  assert.equal(flagJson.flag.moneyAuthority, false);
});

test("PD114 checklist catalog seed via services view", async () => {
  const thin = runPd114ChecklistCatalogSeedThinVertical();
  assert.ok(thin.catalogSeedCount >= 8);
  assert.equal(thin.trancheNotFullLibrary, true);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd114@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const res = await servicesGet(
    new Request("http://localhost/api/tech/services?view=checklists", {
      headers: { cookie },
    }),
  );
  assert.equal(res.status, 200);
  const json = (await res.json()) as {
    checklists: { id: string; catalogId?: string }[];
  };
  const withCat = json.checklists.filter((c) => c.catalogId);
  assert.ok(withCat.length >= 8);
  assert.ok(withCat.some((c) => c.catalogId === "auto.wont_start.v1"));
});
