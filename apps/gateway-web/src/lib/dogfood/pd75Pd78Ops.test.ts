/**
 * PD75–PD78 dogfood — active vehicle, WHT cert, complete stop, marketing consent.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runPd75SetActiveGarageVehicleThinVertical } from "@dial/catalogue";
import {
  __resetDeliveryForTests,
  runPd77CompleteStopThinVertical,
} from "@dial/delivery";
import { runPd78MarketingConsentThinVertical } from "@dial/identity";
import { runPd76WhtCertificateDownloadThinVertical } from "@dial/payments";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
  testAuthCookie,
} from "../auth/session.js";
import {
  GET as garageGet,
  PATCH as garagePatch,
  POST as garagePost,
} from "../../app/api/spare/garage/route.js";
import { POST as takeHomePost } from "../../app/api/admin/tech/take-home/route.js";
import {
  GET as consentGet,
  POST as consentPost,
} from "../../app/api/account/consent/route.js";
import { POST as courierPost } from "../../app/api/delivery/courier/route.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("PD75 set active garage vehicle", async () => {
  const page = readFileSync(join(root, "app/spare/garage/page.tsx"), "utf8");
  assert.match(page, /spare-garage-hub/);
  assert.match(page, /Set active/);
  const thin = runPd75SetActiveGarageVehicleThinVertical();
  assert.equal(thin.activeCount, 1);

  const cookie = testAuthCookie({ userId: "cust_pd75_api" });
  const a = await garagePost(
    new Request("http://localhost/api/spare/garage", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        label: "A",
        chassisHint: "A1",
        reminderConsent: false,
      }),
    }),
  );
  assert.equal(a.status, 200);
  const b = await garagePost(
    new Request("http://localhost/api/spare/garage", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        label: "B",
        chassisHint: "B1",
        reminderConsent: false,
      }),
    }),
  );
  assert.equal(b.status, 200);
  const bodyB = (await b.json()) as { vehicle: { vehicleId: string } };
  const set = await garagePatch(
    new Request("http://localhost/api/spare/garage", {
      method: "PATCH",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        vehicleId: bodyB.vehicle.vehicleId,
        setActive: true,
      }),
    }),
  );
  assert.equal(set.status, 200);
  const list = await garageGet(
    new Request("http://localhost/api/spare/garage", {
      headers: { cookie },
    }),
  );
  assert.equal(list.status, 200);
  const listed = (await list.json()) as {
    vehicles: Array<{ vehicleId: string; isActive: boolean }>;
  };
  assert.equal(listed.vehicles.filter((v) => v.isActive).length, 1);
  assert.equal(
    listed.vehicles.find((v) => v.isActive)?.vehicleId,
    bodyB.vehicle.vehicleId,
  );
});

test("PD76 WHT certificate download", async () => {
  const page = readFileSync(
    join(root, "app/admin/tech/take-home/page.tsx"),
    "utf8",
  );
  assert.match(page, /Download WHT cert \(PD76\)/);
  const thin = runPd76WhtCertificateDownloadThinVertical({
    technicianId: "tech_pd76_dog",
  });
  assert.equal(thin.certificateDownloaded, true);

  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "pd76_secret";
  try {
    await takeHomePost(
      new Request("http://localhost/api/admin/tech/take-home", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd76_secret",
        },
        body: JSON.stringify({
          action: "apply_wht",
          technicianId: "tech_pd76_api",
          payoutUsdMinor: "10000",
          hasItf263: false,
        }),
      }),
    );
    const dl = await takeHomePost(
      new Request("http://localhost/api/admin/tech/take-home", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd76_secret",
        },
        body: JSON.stringify({
          action: "download_certificate",
          technicianId: "tech_pd76_api",
        }),
      }),
    );
    assert.equal(dl.status, 200);
    const body = (await dl.json()) as {
      certificate?: { contentType?: string; stubPdfBase64?: string };
    };
    assert.equal(body.certificate?.contentType, "application/pdf");
    assert.ok(body.certificate?.stubPdfBase64);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("PD77 complete_stop courier API", async () => {
  const thin = await runPd77CompleteStopThinVertical({
    courierId: "cour_pd77_dog",
  });
  assert.equal(thin.runCompleted, true);

  __resetDeliveryForTests();
  __resetAuthForTests();
  const { token } = createSession({
    email: "pd77@dial.test",
    role: "technician",
  });
  const cookie = `${sessionCookieName()}=${token}`;

  const seed = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({ action: "seed_offer", orderId: "ord_pd77_api" }),
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
  const transit = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "start_transit",
        jobId: seeded.job?.id,
      }),
    }),
  );
  assert.equal(transit.status, 200);
  const nav = (await transit.json()) as {
    navigate?: { stops?: Array<{ id: string }> };
  };
  const stops = nav.navigate?.stops ?? [];
  assert.ok(stops.length >= 1);
  let lastStatus = 0;
  for (const s of stops) {
    const done = await courierPost(
      new Request("http://localhost/api/delivery/courier", {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({
          action: "complete_stop",
          jobId: seeded.job?.id,
          stopId: s.id,
        }),
      }),
    );
    lastStatus = done.status;
    assert.equal(done.status, 200);
  }
  assert.equal(lastStatus, 200);
});

test("PD78 marketing consent", async () => {
  const page = readFileSync(
    join(root, "app/account/consent/page.tsx"),
    "utf8",
  );
  assert.match(page, /account-marketing-consent/);
  const thin = runPd78MarketingConsentThinVertical();
  assert.equal(thin.granted, true);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd78@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const grant = await consentPost(
    new Request("http://localhost/api/account/consent", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ marketing: true }),
    }),
  );
  assert.equal(grant.status, 200);
  const get = await consentGet(
    new Request("http://localhost/api/account/consent", {
      headers: { cookie },
    }),
  );
  assert.equal(get.status, 200);
  const body = (await get.json()) as {
    consent?: { marketing?: boolean };
  };
  assert.equal(body.consent?.marketing, true);
});
