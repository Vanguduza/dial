/**
 * PD29 Delivery ETA banner + navigate stops / VROOM re-optimise (Pack §9.8 / D-44 / D-45).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  __resetDeliveryForTests,
  runPd29EtaStopsVroomThinVertical,
} from "@dial/delivery";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import {
  GET as courierGet,
  POST as courierPost,
} from "../../app/api/delivery/courier/route.js";

const androidRoot = join(process.cwd(), "../delivery-android");

test("PD29 Android Compose: ETA banner + stops + VROOM", () => {
  const client = readFileSync(
    join(
      androidRoot,
      "core/network/src/main/kotlin/zw/co/dial/delivery/network/DialDeliveryClient.kt",
    ),
    "utf8",
  );
  const app = readFileSync(
    join(androidRoot, "app/src/main/java/zw/co/dial/delivery/ui/DeliveryApp.kt"),
    "utf8",
  );
  assert.match(client, /get_eta_banner|getEtaBanner/);
  assert.match(client, /list_navigate_stops|listNavigateStops/);
  assert.match(client, /reoptimise_stops|reoptimiseStops/);
  assert.match(client, /identity fields forbidden|never send userId/);
  assert.match(app, /ETA|VROOM|re-optimise|MapLibre/);
  assert.match(app, /@Composable/);
  assert.doesNotMatch(app, /GoogleMap|com\.google\.android\.gms\.maps/);
});

test("PD29 package thin vertical", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const out = await runPd29EtaStopsVroomThinVertical();
  assert.ok(out.stopCount >= 3);
  assert.ok(out.etaMinutes >= 1);
  assert.equal(out.orderChanged, true);
  assert.equal(out.mapSor, "maplibre");
  assert.equal(out.googleMapsSor, false);
  assert.equal(out.payableFromAi, false);
});

test("PD29 API: ETA + navigate stops + VROOM re-optimise", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetDeliveryForTests();
  __resetAuthForTests();
  const { token } = createSession({
    email: "rider.pd29@dial.test",
    buyerSegment: "b2c",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const headers = {
    "content-type": "application/json",
    cookie,
  };

  await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "set_availability", status: "available" }),
    }),
  );

  const seed = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "seed_offer", codUsdMinor: "1800" }),
    }),
  );
  assert.equal(seed.status, 200);
  const seedJson = (await seed.json()) as {
    offer: { id: string } | null;
    job: { id: string };
  };
  assert.ok(seedJson.offer?.id);
  const offerId = seedJson.offer!.id;
  const jobId = seedJson.job.id;

  const accept = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "accept_offer", offerId }),
    }),
  );
  assert.equal(accept.status, 200);

  const transit = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "start_transit", jobId }),
    }),
  );
  assert.equal(transit.status, 200);
  const transitJson = (await transit.json()) as {
    navigate: { etaBanner: { etaMinutes: number; mapSor: string }; stops: unknown[] };
  };
  assert.ok(transitJson.navigate.etaBanner.etaMinutes >= 1);
  assert.equal(transitJson.navigate.etaBanner.mapSor, "maplibre");
  assert.ok(transitJson.navigate.stops.length >= 3);

  const eta = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "get_eta_banner", jobId }),
    }),
  );
  assert.equal(eta.status, 200);
  const etaJson = (await eta.json()) as {
    etaBanner: { mapSor: string; googleMapsSor: boolean; etaMinutes: number };
  };
  assert.equal(etaJson.etaBanner.mapSor, "maplibre");
  assert.equal(etaJson.etaBanner.googleMapsSor, false);

  const stops = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "list_navigate_stops", jobId }),
    }),
  );
  assert.equal(stops.status, 200);

  const opt = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "reoptimise_stops", jobId }),
    }),
  );
  assert.equal(opt.status, 200);
  const optJson = (await opt.json()) as {
    orderChanged: boolean;
    mapSor: string;
    googleMapsSor: boolean;
    provider: string;
  };
  assert.equal(optJson.orderChanged, true);
  assert.equal(optJson.mapSor, "maplibre");
  assert.equal(optJson.googleMapsSor, false);
  assert.ok(optJson.provider === "fixture" || optJson.provider === "vroom");

  const snap = await courierGet(
    new Request("http://localhost/api/delivery/courier", {
      headers: { cookie },
    }),
  );
  assert.equal(snap.status, 200);
  const snapJson = (await snap.json()) as {
    navigate: { mapSor: string; stops: unknown[] } | null;
  };
  assert.ok(snapJson.navigate);
  assert.equal(snapJson.navigate!.mapSor, "maplibre");

  const bodyReject = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "get_eta_banner",
        jobId,
        userId: "evil",
      }),
    }),
  );
  assert.equal(bodyReject.status, 400);
});
