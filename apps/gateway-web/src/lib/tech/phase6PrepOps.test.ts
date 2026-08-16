/**
 * Phase 6 prep dogfood — checklist 42 seeds, customer book path, emergency never AI-blocked,
 * capability review citation for intake (D-56).
 * Does not claim G6 (needs tech Android device PNG — G3 signing).
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runPhase6PrepChecklistLibrary42SeedThinVertical } from "@dial/jobs";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import {
  GET as servicesGet,
  POST as servicesPost,
} from "../../app/api/tech/services/route.js";

const techRoot = join(dirname(fileURLToPath(import.meta.url)), "../../app/tech");

test("Phase6-prep Pack checklist library 42 catalogIds loadable (not G6)", () => {
  const out = runPhase6PrepChecklistLibrary42SeedThinVertical();
  assert.equal(out.catalogSeedCount, 42);
  assert.equal(out.library42Seeded, true);
  assert.equal(out.g6Claimed, false);
  assert.equal(out.payableFromAi, false);
});

test("Phase6-prep customer web book path rate_card + emergency never blocked on AI", async () => {
  const bookPage = readFileSync(join(techRoot, "book/page.tsx"), "utf8");
  const bookForm = readFileSync(join(techRoot, "book/TechBookForm.tsx"), "utf8");
  const emergencyPage = readFileSync(join(techRoot, "emergency/page.tsx"), "utf8");
  const emergencyForm = readFileSync(
    join(techRoot, "emergency/EmergencyBookForm.tsx"),
    "utf8",
  );
  assert.match(bookPage, /rate_card|TechBookForm/);
  assert.match(bookForm, /\/api\/tech\/services/);
  assert.match(emergencyPage, /EmergencyBookForm/);
  assert.match(emergencyForm, /emergency_book/);
  assert.doesNotMatch(emergencyForm, /wait.*AI|blocked.*AI/i);

  __resetAuthForTests();
  const { token } = createSession({
    email: "customer.p6prep@dial.test",
    buyerSegment: "b2c",
  });
  const cookie = `${sessionCookieName()}=${token}`;

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
    job: { payableFromAi: boolean };
    g6Claimed?: boolean;
  };
  assert.equal(bookJson.job.payableFromAi, false);
  assert.notEqual(bookJson.g6Claimed, true);

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
    job: { emergency: boolean };
  };
  assert.equal(emgJson.aiPricingBypassed, true);
  assert.equal(emgJson.job.emergency, true);
});

test("Phase6-prep capability review citation for guided intake (D-56, not G6)", () => {
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../../..");
  const auditPath = join(
    repoRoot,
    "docs/agent-audits/ai-capability-G6-intake-2026-08-16.md",
  );
  assert.ok(existsSync(auditPath), "G6 intake capability audit missing");
  const audit = readFileSync(auditPath, "utf8");
  assert.match(audit, /guidedIntake|guided-intake/i);
  assert.match(audit, /payableFromAi|never writes payable/i);
  assert.match(audit, /emergency/i);
  assert.match(audit, /\| Critical \| — \| none \|/);

  const intakeRoute = readFileSync(
    join(repoRoot, "apps/gateway-web/src/app/api/ai/guided-intake/route.ts"),
    "utf8",
  );
  assert.match(intakeRoute, /guidedIntake/);
  assert.match(intakeRoute, /payableFromAi:\s*false/);
});
