/**
 * PD30 Technician mock-location + evidence camera (Pack §9.7 / 2B-29).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  __resetJobsForTests,
  runPd30MockLocationCameraThinVertical,
} from "@dial/jobs";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { POST as techPost } from "../../app/api/tech/technician/route.js";

const androidRoot = join(process.cwd(), "../technician-android");

test("PD30 Android Compose: mock check-in + camera overlay", () => {
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
  assert.match(client, /check_in|checkIn/);
  assert.match(client, /isMockLocation/);
  assert.match(client, /capture_camera_evidence|captureCameraEvidence/);
  assert.match(client, /flush_evidence_queue|flushEvidenceQueue/);
  assert.match(client, /identity fields forbidden|never send userId/);
  assert.match(app, /mock|Camera evidence|Check-in/);
  assert.match(app, /@Composable/);
});

test("PD30 package thin vertical", async () => {
  const out = await runPd30MockLocationCameraThinVertical();
  assert.equal(out.mockBlocked, true);
  assert.equal(out.genuineAccepted, true);
  assert.equal(out.cameraOverlay, true);
  assert.equal(out.queueFlushed, true);
  assert.equal(out.payableFromAi, false);
});

test("PD30 API: mock blocked + camera queue flush", async () => {
  __resetJobsForTests();
  __resetAuthForTests();
  const { token } = createSession({
    email: "tech.pd30@dial.test",
    buyerSegment: "b2c",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const headers = {
    "content-type": "application/json",
    cookie,
  };

  const seed = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "seed_assigned_job" }),
    }),
  );
  assert.equal(seed.status, 200);
  const seedJson = (await seed.json()) as { job: { id: string } };
  const jobId = seedJson.job.id;

  const mock = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "check_in",
        jobId,
        lat: -17.8292,
        lng: 31.0522,
        isMockLocation: true,
      }),
    }),
  );
  assert.equal(mock.status, 200);
  const mockJson = (await mock.json()) as {
    checkIn: { accepted: boolean; reason: string; punctualityEligible: boolean };
  };
  assert.equal(mockJson.checkIn.accepted, false);
  assert.equal(mockJson.checkIn.reason, "mock_location_blocked");
  assert.equal(mockJson.checkIn.punctualityEligible, false);

  const genuine = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "check_in",
        jobId,
        lat: -17.8292,
        lng: 31.0522,
        isMockLocation: false,
      }),
    }),
  );
  assert.equal(genuine.status, 200);
  const genuineJson = (await genuine.json()) as {
    checkIn: { accepted: boolean; punctualityEligible: boolean };
  };
  assert.equal(genuineJson.checkIn.accepted, true);
  assert.equal(genuineJson.checkIn.punctualityEligible, true);

  const cam = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "capture_camera_evidence",
        jobId,
        payloadRef: "data:image/jpeg;base64,pd30",
        overlayChecklistStep: "Photo of fault area (optional)",
        queuedOffline: true,
      }),
    }),
  );
  assert.equal(cam.status, 200);
  const camJson = (await cam.json()) as {
    camera: {
      cameraSource: string;
      flushStatus: string;
      payableFromAi: boolean;
    };
  };
  assert.equal(camJson.camera.cameraSource, "device_camera");
  assert.equal(camJson.camera.flushStatus, "queued");
  assert.equal(camJson.camera.payableFromAi, false);

  const flush = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "flush_evidence_queue" }),
    }),
  );
  assert.equal(flush.status, 200);
  const flushJson = (await flush.json()) as { flushed: number; payableFromAi: boolean };
  assert.ok(flushJson.flushed >= 1);
  assert.equal(flushJson.payableFromAi, false);

  const reject = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "check_in",
        jobId,
        lat: -17.8292,
        lng: 31.0522,
        isMockLocation: false,
        userId: "evil",
      }),
    }),
  );
  assert.equal(reject.status, 400);
});
