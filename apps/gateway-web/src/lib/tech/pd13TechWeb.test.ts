/**
 * PD13 tech-web Pack §9.3 — guide/emergency/book/status vs @dial/jobs.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { __resetJobsForTests, runPd13TechWebThinVertical } from "@dial/jobs";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import {
  GET as servicesGet,
  POST as servicesPost,
} from "../../app/api/tech/services/route.js";

const techRoot = join(process.cwd(), "src/app/tech");

test("PD13 tech-web UI exists (guide/emergency/book/jobs, design-tokens)", () => {
  const home = readFileSync(join(techRoot, "page.tsx"), "utf8");
  const book = readFileSync(join(techRoot, "book/page.tsx"), "utf8");
  const bookForm = readFileSync(join(techRoot, "book/TechBookForm.tsx"), "utf8");
  const emergency = readFileSync(join(techRoot, "emergency/page.tsx"), "utf8");
  const jobs = readFileSync(join(techRoot, "jobs/page.tsx"), "utf8");
  assert.match(home, /dialTokens|@dial\/design-tokens/);
  assert.match(home, /Diagnose|checklist/i);
  assert.match(home, /My jobs/);
  assert.match(book, /rate_card|@dial\/jobs/);
  assert.match(bookForm, /\/api\/tech\/services/);
  assert.match(emergency, /EmergencyBookForm/);
  assert.match(jobs, /My service jobs|TechJobsList/);
});

test("PD13 package thin vertical guide + emergency", async () => {
  const out = await runPd13TechWebThinVertical({ customerId: "cust_pd13_pkg" });
  assert.equal(out.guide.payableFromAi, false);
  assert.equal(out.emergency.aiPricingBypassed, true);
  assert.ok(out.customerJobs >= 2);
});

test("PD13 services API: slots → book → emergency → jobs + IDOR reject", async () => {
  __resetJobsForTests();
  __resetAuthForTests();
  const { token } = createSession({
    email: "customer.pd13@dial.test",
    buyerSegment: "b2c",
  });
  const cookie = `${sessionCookieName()}=${token}`;

  const denied = await servicesGet(
    new Request("http://localhost/api/tech/services?view=slots&userId=other", {
      headers: { cookie },
    }),
  );
  assert.equal(denied.status, 400);

  const slotsRes = await servicesGet(
    new Request("http://localhost/api/tech/services?view=slots", {
      headers: { cookie },
    }),
  );
  assert.equal(slotsRes.status, 200);
  const slotsJson = (await slotsRes.json()) as {
    slots: Array<{ slotId: string }>;
    quote: { source: string; payableFromAi: boolean };
  };
  assert.ok(slotsJson.slots.length >= 1);
  assert.equal(slotsJson.quote.source, "rate_card");
  assert.equal(slotsJson.quote.payableFromAi, false);

  const bookRes = await servicesPost(
    new Request("http://localhost/api/tech/services", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "book",
        jobClass: "diagnostics",
        slotId: slotsJson.slots[0]!.slotId,
      }),
    }),
  );
  assert.equal(bookRes.status, 200);
  const bookJson = (await bookRes.json()) as {
    job: { id: string; payableFromAi: boolean };
  };
  assert.equal(bookJson.job.payableFromAi, false);

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
    job: { id: string; emergency: boolean };
  };
  assert.equal(emgJson.aiPricingBypassed, true);
  assert.equal(emgJson.job.emergency, true);

  const jobsRes = await servicesGet(
    new Request("http://localhost/api/tech/services?view=jobs", {
      headers: { cookie },
    }),
  );
  assert.equal(jobsRes.status, 200);
  const jobsJson = (await jobsRes.json()) as { jobs: Array<{ id: string }> };
  assert.ok(jobsJson.jobs.length >= 2);

  const detailRes = await servicesGet(
    new Request(
      `http://localhost/api/tech/services?view=job&jobId=${bookJson.job.id}`,
      { headers: { cookie } },
    ),
  );
  assert.equal(detailRes.status, 200);

  const { token: otherToken } = createSession({
    email: "other.pd13@dial.test",
    buyerSegment: "b2c",
  });
  const otherCookie = `${sessionCookieName()}=${otherToken}`;
  const idor = await servicesGet(
    new Request(
      `http://localhost/api/tech/services?view=job&jobId=${bookJson.job.id}`,
      { headers: { cookie: otherCookie } },
    ),
  );
  assert.equal(idor.status, 403);
});
