/**
 * PD28 Delivery availability + offline packs (Pack §9.8 / D-44 / D-45).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  __resetDeliveryForTests,
  runPd28AvailabilityOfflinePacksThinVertical,
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

test("PD28 Android Compose: availability + offline packs MapLibre", () => {
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
  assert.match(client, /activateOfflinePack|activate_offline_pack/);
  assert.match(client, /harare_metro|bulawayo_metro/);
  assert.match(client, /available.*busy.*offline|setAvailability/);
  assert.match(client, /identity fields forbidden|never send userId/);
  assert.match(app, /Go offline|Set busy|offline packs|MapLibre/);
  assert.match(app, /@Composable/);
});

test("PD28 package thin vertical", () => {
  const out = runPd28AvailabilityOfflinePacksThinVertical();
  assert.equal(out.mapSor, "maplibre");
  assert.equal(out.googleMapsSor, false);
  assert.equal(out.offlineIneligible, true);
  assert.equal(out.hararePackInstalled, true);
  assert.equal(out.payableFromAi, false);
});

test("PD28 API: availability eligibility + offline packs", async () => {
  __resetDeliveryForTests();
  __resetAuthForTests();
  const { token } = createSession({
    email: "rider.pd28@dial.test",
    buyerSegment: "b2c",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const headers = {
    "content-type": "application/json",
    cookie,
  };

  const offline = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "set_availability", status: "offline" }),
    }),
  );
  assert.equal(offline.status, 200);
  const offlineJson = (await offline.json()) as {
    eligibleForOffers: boolean;
    availability: string;
  };
  assert.equal(offlineJson.availability, "offline");
  assert.equal(offlineJson.eligibleForOffers, false);

  const packs = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "list_offline_packs" }),
    }),
  );
  assert.equal(packs.status, 200);
  const packsJson = (await packs.json()) as {
    mapSor: string;
    packs: Array<{ packId: string }>;
  };
  assert.equal(packsJson.mapSor, "maplibre");
  assert.ok(packsJson.packs.some((p) => p.packId === "harare_metro"));
  assert.ok(packsJson.packs.some((p) => p.packId === "bulawayo_metro"));

  const install = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "activate_offline_pack",
        packId: "harare_metro",
      }),
    }),
  );
  assert.equal(install.status, 200);

  const snap = await courierGet(
    new Request("http://localhost/api/delivery/courier", {
      headers: { cookie },
    }),
  );
  assert.equal(snap.status, 200);
  const snapJson = (await snap.json()) as {
    offlinePacks: { mapSor: string; installed: unknown[] };
  };
  assert.equal(snapJson.offlinePacks.mapSor, "maplibre");
  assert.ok(snapJson.offlinePacks.installed.length >= 1);

  const bodyReject = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "set_availability",
        status: "available",
        userId: "evil",
      }),
    }),
  );
  assert.equal(bodyReject.status, 400);
});
