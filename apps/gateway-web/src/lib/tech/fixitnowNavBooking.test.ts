/**
 * FixItNow Dial a Tech nav + booking overlay (audit §4–5).
 * Draft quotes = rate_card; AI never writes payable; emergency is not AI-gated.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  __resetJobsForTests,
  ensureDialTechProfileFixtures,
} from "@dial/jobs";
import {
  __resetPaymentsForTests,
  setDailyZigRate,
} from "@dial/payments";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import {
  GET as servicesGet,
  POST as servicesPost,
} from "../../app/api/tech/services/route.js";

const here = dirname(fileURLToPath(import.meta.url));
const techRoot = join(here, "../../app/tech");
const navbarPath = join(here, "../../components/common/Navbar.tsx");

function sessionCookie(email = "nav.booking@dial.test") {
  __resetAuthForTests();
  const { token } = createSession({ email, buyerSegment: "b2c" });
  return `${sessionCookieName()}=${token}`;
}

test("Navbar: Diagnose, Emergency, signed-in My jobs; Contact not primary", () => {
  const nav = readFileSync(navbarPath, "utf8");
  assert.match(nav, /href: '\/tech\/guide'/);
  assert.match(nav, /label: 'Diagnose'/);
  assert.match(nav, /href: '\/tech\/emergency'/);
  assert.match(nav, /label: 'Emergency'/);
  assert.match(nav, /\/tech\/jobs/);
  assert.match(nav, /My jobs/);
  assert.doesNotMatch(nav, /href: '\/tech\/contact'/);
  assert.doesNotMatch(nav, /from ["'].*AppShell/);
});

test("How-it-works + home timeline: Diagnose then EcoCash/COD Job Reserve, not card pay", () => {
  const steps = readFileSync(
    join(techRoot, "_components/bookingProcessData.ts"),
    "utf8",
  );
  const homeHow = readFileSync(join(techRoot, "_components/HowItWorks.tsx"), "utf8");
  const pageHow = readFileSync(join(techRoot, "how-it-works/page.tsx"), "utf8");
  const timeline = readFileSync(
    join(techRoot, "_components/BookingProcessTimeline.tsx"),
    "utf8",
  );
  assert.match(steps, /Diagnose/);
  assert.match(steps, /EcoCash or COD/);
  assert.match(steps, /Job Reserve/);
  assert.doesNotMatch(steps, /CreditCard|pay by card|secure online payment/i);
  assert.match(homeHow, /bookingSteps/);
  assert.match(pageHow, /bookingSteps/);
  assert.match(timeline, /bookingSteps/);
});

test("Booking modal: rate-card draft labelled; note diagnose is ranking only", () => {
  const modal = readFileSync(
    join(techRoot, "services/_components/BookingModal.tsx"),
    "utf8",
  );
  assert.match(modal, /booking-rate-card-draft/);
  assert.match(modal, /Rate-card draft/);
  assert.match(modal, /view: "quote"/);
  assert.match(modal, /action: "diagnose"/);
  assert.match(modal, /Confirm draft booking/);
  assert.doesNotMatch(modal, /amountMinor/);
  assert.doesNotMatch(modal, /ops-draft-quote|Stripe|SSLCommerz/);
});

test("Emergency UI does not call guidedIntake as a gate", () => {
  const page = readFileSync(join(techRoot, "emergency/page.tsx"), "utf8");
  const form = readFileSync(
    join(techRoot, "emergency/EmergencyBookForm.tsx"),
    "utf8",
  );
  const hero = readFileSync(join(techRoot, "_components/HeroCarousel.tsx"), "utf8");
  assert.match(form, /action: "emergency_book"/);
  assert.doesNotMatch(form, /guided-intake|action: "diagnose"|resolve_checklist/);
  assert.doesNotMatch(page, /guided-intake|action: "diagnose"/);
  assert.match(page, /draftTechQuote/);
  assert.match(hero, /\/tech\/emergency/);
  assert.match(hero, /hero-emergency/);
});

test("Contact has no Google Maps embed (D-44)", () => {
  const contact = readFileSync(join(techRoot, "contact/page.tsx"), "utf8");
  assert.doesNotMatch(contact, /google\.com\/maps|maps\.google|iframe/);
  assert.match(contact, /Harare/);
});

test("Guide + job page keep specialist/checklist seats in FixItNow chrome", () => {
  const guide = readFileSync(join(techRoot, "guide/page.tsx"), "utf8");
  const job = readFileSync(join(techRoot, "jobs/[jobId]/TechJobDetail.tsx"), "utf8");
  assert.match(guide, /RecommendedSpecialists/);
  assert.match(guide, /resolve_checklist_by_symptom/);
  assert.match(guide, /pd137-tech-guide/);
  assert.match(job, /pay-ecocash/);
  assert.match(job, /pay-cod/);
  assert.match(job, /Open checklist/);
  assert.match(job, /Assigned/);
  assert.doesNotMatch(job, /Stripe|SSLCommerz|google\.com\/maps/);
});

test("GET quote is rate_card draft; diagnose has no payable; Mercedes still ranks", async () => {
  __resetJobsForTests();
  ensureDialTechProfileFixtures();
  const cookie = sessionCookie("quote.rank@dial.test");

  const quoteRes = await servicesGet(
    new Request(
      "http://localhost/api/tech/services?view=quote&jobClass=diagnostics&emergency=false",
      { headers: { cookie } },
    ),
  );
  assert.equal(quoteRes.status, 200);
  const quoteJson = (await quoteRes.json()) as {
    quote: {
      source: string;
      payableFromAi: boolean;
      labelledDraft: boolean;
      draftAmountUsdMinor: string;
    };
  };
  assert.equal(quoteJson.quote.source, "rate_card");
  assert.equal(quoteJson.quote.payableFromAi, false);
  assert.equal(quoteJson.quote.labelledDraft, true);
  assert.ok(Number(quoteJson.quote.draftAmountUsdMinor) > 0);

  const diagnoseRes = await servicesPost(
    new Request("http://localhost/api/tech/services", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "diagnose",
        note: "Mercedes Benz powertrain warning",
      }),
    }),
  );
  assert.equal(diagnoseRes.status, 200);
  const diagnosed = (await diagnoseRes.json()) as {
    payableFromAi?: boolean;
    assessment?: Record<string, unknown> & {
      specialistHint?: { required?: boolean; brand?: string | null };
    };
    recommendedSpecialists?: Array<{ technicianId: string }>;
  };
  assert.equal(diagnosed.payableFromAi, false);
  assert.equal("amountMinor" in (diagnosed.assessment ?? {}), false);
  assert.doesNotMatch(JSON.stringify(diagnosed), /"amountMinor"/);
  assert.equal(diagnosed.assessment?.specialistHint?.required, true);
  assert.equal(diagnosed.assessment?.specialistHint?.brand, "mercedes");
  assert.equal(
    diagnosed.recommendedSpecialists?.[0]?.technicianId,
    "tech_mercedes_spec",
  );
});

test("emergency_book is not gated on guidedIntake; pay uses EcoCash|COD + Job Reserve", async () => {
  __resetJobsForTests();
  __resetPaymentsForTests();
  const cookie = sessionCookie("emergency.pay@dial.test");

  const emgRes = await servicesPost(
    new Request("http://localhost/api/tech/services", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ action: "emergency_book" }),
    }),
  );
  assert.equal(emgRes.status, 200);
  const emgJson = (await emgRes.json()) as {
    aiPricingBypassed: boolean;
    guidedIntakeGated: boolean;
    job: { id: string; emergency: boolean; payableFromAi: boolean };
    quote: { source: string };
  };
  assert.equal(emgJson.aiPricingBypassed, true);
  assert.equal(emgJson.guidedIntakeGated, false);
  assert.equal(emgJson.job.emergency, true);
  assert.equal(emgJson.job.payableFromAi, false);
  assert.equal(emgJson.quote.source, "rate_card");
  assert.equal("assessment" in emgJson, false);

  const closed = await servicesPost(
    new Request("http://localhost/api/tech/services", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
        "Idempotency-Key": "tech-pay-closed-1",
      },
      body: JSON.stringify({
        action: "pay",
        jobId: emgJson.job.id,
        choice: "ecocash",
      }),
    }),
  );
  assert.equal(closed.status, 503);
  const closedJson = (await closed.json()) as {
    failClosed?: boolean;
    railsReady?: boolean;
  };
  assert.equal(closedJson.failClosed, true);
  assert.equal(closedJson.railsReady, false);

  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "ops_tech_nav" });
  const payRes = await servicesPost(
    new Request("http://localhost/api/tech/services", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
        "Idempotency-Key": "tech-pay-eco-1",
      },
      body: JSON.stringify({
        action: "pay",
        jobId: emgJson.job.id,
        choice: "ecocash",
      }),
    }),
  );
  assert.equal(payRes.status, 200);
  const payJson = (await payRes.json()) as {
    ok: boolean;
    choice: string;
    payableFromAi: boolean;
    jobReserve?: { status: string };
    intent?: { method: string };
  };
  assert.equal(payJson.ok, true);
  assert.equal(payJson.choice, "ecocash");
  assert.equal(payJson.payableFromAi, false);
  assert.equal(payJson.jobReserve?.status, "authorized");
  assert.equal(payJson.intent?.method, "ecocash_direct");

  const detail = await servicesGet(
    new Request(
      `http://localhost/api/tech/services?view=job&jobId=${emgJson.job.id}`,
      { headers: { cookie } },
    ),
  );
  assert.equal(detail.status, 200);
  const detailJson = (await detail.json()) as {
    checklistHref?: string;
    pay?: { rails?: string[]; ready?: boolean };
    job?: { labelledDraft?: boolean };
  };
  assert.equal(detailJson.checklistHref, "/tech/checklist/emergency_roadside");
  assert.deepEqual(detailJson.pay?.rails, ["ecocash", "cod"]);
  assert.equal(detailJson.job?.labelledDraft, true);
});
