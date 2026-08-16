/**
 * OEM specialist routing thin vertical — Mercedes ranked, Honda not forced, no AI money.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { guidedIntake } from "@dial/ai";
import {
  __resetJobsForTests,
  runOemSpecialistRoutingThinVertical,
} from "@dial/jobs";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { POST as techPost } from "../../app/api/tech/technician/route.js";
import {
  GET as servicesGet,
  POST as servicesPost,
} from "../../app/api/tech/services/route.js";
import { diagnoseTechSymptom } from "./specialistRouting.js";

const here = dirname(fileURLToPath(import.meta.url));
const techRoot = join(here, "../../app/tech");

test("OEM specialist routing: Mercedes ranked; Honda not forced; no amountMinor", async () => {
  __resetJobsForTests();
  const pkg = runOemSpecialistRoutingThinVertical();
  assert.equal(pkg.mercedesRanked, true);
  assert.equal(pkg.hondaNotForced, true);
  assert.equal(pkg.payableFromAi, false);

  const mercedesAi = guidedIntake({
    customerText: "Mercedes Benz powertrain warning",
  });
  assert.equal(mercedesAi.specialistHint.required, true);
  assert.equal(mercedesAi.specialistHint.brand, "mercedes");
  assert.equal("amountMinor" in mercedesAi, false);
  assert.doesNotMatch(JSON.stringify(mercedesAi), /amountMinor|tech_/);

  const hondaAi = guidedIntake({
    customerText: "Honda Civic rough idle on the highway",
  });
  assert.equal(hondaAi.specialistHint.required, false);

  __resetJobsForTests();
  const mercedes = diagnoseTechSymptom("My Mercedes-Benz gearbox is slipping");
  assert.equal(mercedes.payableFromAi, false);
  assert.equal(mercedes.assessment.specialistHint.required, true);
  assert.equal(mercedes.recommendedSpecialists[0]?.technicianId, "tech_mercedes_spec");
  assert.equal(
    mercedes.recommendedSpecialists.some((t) => t.technicianId === "tech_guide_choice"),
    false,
  );
  assert.ok(
    mercedes.fallbackTechnicians.some((t) => t.technicianId === "tech_guide_choice"),
  );

  __resetJobsForTests();
  const honda = diagnoseTechSymptom("Honda Civic rough idle on the highway");
  assert.equal(honda.assessment.specialistHint.required, false);
  assert.equal(honda.recommendedSpecialists.length, 0);
  assert.ok(honda.fallbackTechnicians.length >= 1);

  __resetAuthForTests();
  __resetJobsForTests();
  const { token } = createSession({
    email: "oem.specialist@dial.test",
    buyerSegment: "b2c",
  });
  const cookie = `${sessionCookieName()}=${token}`;

  const mercedesRes = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "resolve_checklist_by_symptom",
        symptom: "Mercedes MB powertrain fault",
      }),
    }),
  );
  assert.equal(mercedesRes.status, 200);
  const mercedesJson = (await mercedesRes.json()) as {
    payableFromAi?: boolean;
    assessment?: {
      specialistHint?: { required?: boolean; brand?: string | null };
    };
    recommendedSpecialists?: Array<{ technicianId: string }>;
  };
  assert.equal(mercedesJson.payableFromAi, false);
  assert.equal(mercedesJson.assessment?.specialistHint?.required, true);
  assert.equal(mercedesJson.assessment?.specialistHint?.brand, "mercedes");
  assert.equal(
    mercedesJson.recommendedSpecialists?.[0]?.technicianId,
    "tech_mercedes_spec",
  );
  assert.equal("amountMinor" in (mercedesJson.assessment ?? {}), false);

  const hondaRes = await servicesPost(
    new Request("http://localhost/api/tech/services", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "diagnose",
        customerText: "Honda Civic rough idle on the highway",
      }),
    }),
  );
  assert.equal(hondaRes.status, 200);
  const hondaJson = (await hondaRes.json()) as {
    assessment?: { specialistHint?: { required?: boolean } };
    recommendedSpecialists?: unknown[];
    payableFromAi?: boolean;
  };
  assert.equal(hondaJson.payableFromAi, false);
  assert.equal(hondaJson.assessment?.specialistHint?.required, false);
  assert.equal((hondaJson.recommendedSpecialists ?? []).length, 0);

  const profiles = await servicesGet(
    new Request("http://localhost/api/tech/services?view=profiles&oem=Benz", {
      headers: { cookie },
    }),
  );
  assert.equal(profiles.status, 200);
  const profileJson = (await profiles.json()) as {
    recommendedSpecialists?: Array<{ technicianId: string }>;
    matchedOnBrand?: string | null;
  };
  assert.equal(profileJson.matchedOnBrand, "mercedes");
  assert.equal(
    profileJson.recommendedSpecialists?.[0]?.technicianId,
    "tech_mercedes_spec",
  );

  const guide = readFileSync(join(techRoot, "guide/page.tsx"), "utf8");
  assert.match(guide, /RecommendedSpecialists/);
  assert.match(guide, /resolve_checklist_by_symptom/);
  const modal = readFileSync(
    join(techRoot, "services/_components/BookingModal.tsx"),
    "utf8",
  );
  assert.match(modal, /action: "diagnose"/);
  const nav = readFileSync(
    join(here, "../../components/common/Navbar.tsx"),
    "utf8",
  );
  assert.match(nav, /\/tech\/guide/);
});
