/**
 * PD9 technician API contract + thin vertical vs @dial/jobs.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { __resetJobsForTests, runPd9TechThinVertical } from "@dial/jobs";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { GET as techGet, POST as techPost } from "../../app/api/tech/technician/route.js";

const androidRoot = join(process.cwd(), "../technician-android");

test("PD9 Android sources exist (Compose technician client)", () => {
  const client = readFileSync(
    join(
      androidRoot,
      "core/network/src/main/kotlin/zw/co/dial/technician/network/DialTechnicianClient.kt",
    ),
    "utf8",
  );
  const app = readFileSync(
    join(androidRoot, "app/src/main/java/zw/co/dial/technician/ui/TechnicianApp.kt"),
    "utf8",
  );
  assert.match(client, /api\/tech\/technician/);
  assert.match(client, /dial_session/);
  assert.match(client, /never send userId\/role/);
  assert.match(client, /uploadEvidence|upload_evidence/);
  assert.match(client, /startChecklist|start_checklist/);
  assert.match(app, /Compose|@Composable/);
  assert.match(app, /Take-Home|take_home|WHT/);
});

test("PD9 package thin vertical uses rate_card + Cal.com fixture", async () => {
  __resetJobsForTests();
  const out = await runPd9TechThinVertical({
    customerId: "cust_api",
    technicianId: "tech_api",
  });
  assert.equal(out.quote.source, "rate_card");
  assert.ok(out.slot.source.includes("calcom"));
  assert.equal(out.run.status, "completed");
});

test("PD9 gateway technician: slots + seed job + checklist + evidence + WHT", async () => {
  __resetJobsForTests();
  __resetAuthForTests();
  const { token } = createSession({
    email: "tech.pd9@dial.test",
    buyerSegment: "b2c",
  });
  const cookie = `${sessionCookieName()}=${token}`;

  const slotsRes = await techGet(
    new Request("http://localhost/api/tech/technician?view=slots", {
      headers: { cookie },
    }),
  );
  assert.equal(slotsRes.status, 200);
  const slotsJson = (await slotsRes.json()) as {
    slots: Array<{ slotId: string }>;
    quote: { source: string };
  };
  assert.ok(slotsJson.slots.length >= 1);
  assert.equal(slotsJson.quote.source, "rate_card");

  const seed = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ action: "seed_assigned_job" }),
    }),
  );
  assert.equal(seed.status, 200);
  const seedJson = (await seed.json()) as { job: { id: string } };
  const jobId = seedJson.job.id;

  const start = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "start_checklist",
        jobId,
        checklistId: "automotive_basic",
      }),
    }),
  );
  assert.equal(start.status, 200);
  const startJson = (await start.json()) as { run: { runId: string } };

  let done = false;
  for (let i = 0; i < 8; i++) {
    const adv = await techPost(
      new Request("http://localhost/api/tech/technician", {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({
          action: "advance_checklist",
          runId: startJson.run.runId,
        }),
      }),
    );
    assert.equal(adv.status, 200);
    const advJson = (await adv.json()) as { run: { status: string } };
    if (advJson.run.status === "completed") {
      done = true;
      break;
    }
  }
  assert.equal(done, true);

  const ev = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "upload_evidence",
        jobId,
        kind: "photo",
        payloadRef: "data:image/jpeg;base64,pd9",
      }),
    }),
  );
  assert.equal(ev.status, 200);

  const wht = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "take_home_preview",
        payoutUsdMinor: "10000",
        hasItf263: false,
      }),
    }),
  );
  assert.equal(wht.status, 200);
  const whtJson = (await wht.json()) as {
    withholdMinor: string;
    netPayoutMinor: string;
  };
  assert.equal(whtJson.withholdMinor, "3000");
  assert.equal(whtJson.netPayoutMinor, "7000");

  const bad = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "upload_evidence",
        jobId,
        userId: "attacker",
        payloadRef: "x",
      }),
    }),
  );
  assert.equal(bad.status, 400);
});
