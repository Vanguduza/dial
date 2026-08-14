import assert from "node:assert/strict";
import { test } from "node:test";
import { __resetDeliveryForTests, listCourierLocations } from "@dial/delivery";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import {
  GET as courierGet,
  POST as courierPost,
} from "../../app/api/delivery/courier/route.js";

test("PD7 courier API: seed → accept → location → POD → COD; track view", async () => {
  __resetDeliveryForTests();
  __resetAuthForTests();
  const { token } = createSession({ email: "rider@dial.test" });
  const cookie = `${sessionCookieName()}=${token}`;

  const bad = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ action: "set_availability", status: "available", userId: "x" }),
    }),
  );
  assert.equal(bad.status, 400);

  const seed = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ action: "seed_offer", codUsdMinor: "3000" }),
    }),
  );
  assert.equal(seed.status, 200);
  const seeded = (await seed.json()) as {
    offer: { id: string };
    job: { id: string };
  };
  assert.ok(seeded.offer?.id);

  const accept = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ action: "accept_offer", offerId: seeded.offer.id }),
    }),
  );
  assert.equal(accept.status, 200);

  await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "start_transit",
        jobId: seeded.job.id,
      }),
    }),
  );

  const loc = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "post_location",
        lat: -17.83,
        lng: 31.05,
        jobId: seeded.job.id,
      }),
    }),
  );
  assert.equal(loc.status, 200);
  assert.ok(listCourierLocations().length >= 1);

  const pod = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ action: "capture_pod", jobId: seeded.job.id }),
    }),
  );
  assert.equal(pod.status, 200);

  const cod = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ action: "reconcile_cod", jobId: seeded.job.id }),
    }),
  );
  assert.equal(cod.status, 200);
  const codJson = (await cod.json()) as {
    reconciled: boolean;
    amountUsdMinor?: string;
  };
  assert.equal(codJson.reconciled, true);
  assert.equal(codJson.amountUsdMinor, "3000");

  const track = await courierGet(
    new Request("http://localhost/api/delivery/courier?view=track", {
      headers: { cookie },
    }),
  );
  assert.equal(track.status, 200);
  const trackJson = (await track.json()) as {
    mapSor: string;
    locations: unknown[];
  };
  assert.equal(trackJson.mapSor, "maplibre");
  assert.ok(trackJson.locations.length >= 1);
});
