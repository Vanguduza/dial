/**
 * ENH-609 — copied FixItNow UI wired to DIAL catalogue + book API.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { POST as servicesPost } from "../../app/api/tech/services/route.js";
import { listTechServices } from "./fixitnowCatalogue.js";

const techRoot = join(dirname(fileURLToPath(import.meta.url)), "../../app/tech");

test("FixItNow copy: landing + services routes exist under /tech", () => {
  const home = readFileSync(join(techRoot, "page.tsx"), "utf8");
  const services = readFileSync(join(techRoot, "services/page.tsx"), "utf8");
  const pdp = readFileSync(join(techRoot, "services/[id]/page.tsx"), "utf8");
  const techs = readFileSync(join(techRoot, "find-technicians/page.tsx"), "utf8");
  assert.match(home, /HeroCarousel/);
  assert.match(services, /All Services/);
  assert.match(pdp, /BookingModal/);
  assert.match(techs, /Find Your Technician/);
});

test("FixItNow catalogue lists USD rate_card drafts", async () => {
  const listed = await listTechServices();
  assert.equal(listed.success, true);
  assert.ok(listed.data.length >= 1);
  const plumbing = listed.data.find((s) => s.id === "svc_plumbing");
  assert.ok(plumbing);
  assert.equal(plumbing.jobClass, "diagnostics");
  assert.ok(plumbing.price > 0);
  assert.match(plumbing.amountUsdMinor, /^\d+$/);
});

test("FixItNow BookingModal posts DIAL /api/tech/services (no body userId)", () => {
  const modal = readFileSync(
    join(techRoot, "services/_components/BookingModal.tsx"),
    "utf8",
  );
  assert.match(modal, /\/api\/tech\/services/);
  assert.match(modal, /action: emergency \? "emergency_book" : "book"/);
  assert.doesNotMatch(modal, /userId/);
  assert.doesNotMatch(modal, /SSLCommerz|Stripe|serviceBooking/);
});

test("FixItNow book path still hits DIAL session API", async () => {
  __resetAuthForTests();
  const { token } = createSession({
    email: "customer.fixitnow@dial.test",
    buyerSegment: "b2c",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const bookRes = await servicesPost(
    new Request("http://localhost/api/tech/services", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "book",
        jobClass: "diagnostics",
        slotId: "slot_fixitnow_copy",
      }),
    }),
  );
  assert.equal(bookRes.status, 200);
  const json = (await bookRes.json()) as {
    job: { payableFromAi: boolean };
  };
  assert.equal(json.job.payableFromAi, false);
});
