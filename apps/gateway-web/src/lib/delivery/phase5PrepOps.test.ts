/**
 * Phase 5 prep dogfood — maps adapter health, offline pack URLs, dispatch fail-closed.
 * Does not claim G5 (needs Temporal UI history + courier Android POD evidence).
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { pingMapsHealth, planVroomJob } from "@dial/adapter-maps";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import {
  GET as dispatchGet,
  POST as dispatchPost,
} from "../../app/api/admin/delivery/dispatch/route.js";
import { POST as courierPost } from "../../app/api/delivery/courier/route.js";

test("Phase5-prep maps adapter fixture + sandbox fail-closed", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const fx = await pingMapsHealth();
  assert.equal(fx.ok, true);
  assert.equal(fx.mode, "fixture");
  assert.equal(fx.nominatim, true);
  assert.equal(fx.osrm, true);
  assert.equal(fx.vroom, true);

  const plan = await planVroomJob({
    vehicles: [{ id: 1, start: { lat: -17.8252, lon: 31.0335 } }],
    jobs: [{ id: 1, location: { lat: -17.83, lon: 31.05 } }],
  });
  assert.equal(plan.provider, "fixture");

  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.NOMINATIM_URL;
  delete process.env.OSRM_URL;
  delete process.env.VROOM_URL;
  const closed = await pingMapsHealth();
  assert.equal(closed.ok, false);
  assert.match(closed.error ?? "", /fail closed/);

  process.env.NOMINATIM_URL = "http://127.0.0.1:8080";
  process.env.OSRM_URL = "http://127.0.0.1:5000";
  const partial = await pingMapsHealth();
  assert.equal(partial.ok, true);
  assert.equal(partial.vroom, false);

  process.env.DIAL_INTEGRATION_MODE = "fixture";
  delete process.env.NOMINATIM_URL;
  delete process.env.OSRM_URL;
  delete process.env.VROOM_URL;
});

test("Phase5-prep courier offline packs expose packUrl when MAP_OFFLINE_PACK_BASE_URL set", async () => {
  __resetAuthForTests();
  const { token } = createSession({
    email: "rider.p5prep@dial.test",
    buyerSegment: "b2c",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const prevBase = process.env.MAP_OFFLINE_PACK_BASE_URL;
  process.env.MAP_OFFLINE_PACK_BASE_URL = "https://tiles.p5prep.local/packs";
  try {
    const res = await courierPost(
      new Request("http://localhost/api/delivery/courier", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({ action: "list_offline_packs" }),
      }),
    );
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      mapSor: string;
      packs: Array<{ packId: string; packUrl?: string; styleUrl?: string }>;
    };
    assert.equal(body.mapSor, "maplibre");
    const harare = body.packs.find((p) => p.packId === "harare_metro");
    assert.ok(harare);
    assert.equal(
      harare.packUrl,
      "https://tiles.p5prep.local/packs/harare_metro.mbtiles",
    );
    assert.equal(
      harare.styleUrl,
      "https://tiles.p5prep.local/packs/harare_metro/style.json",
    );
  } finally {
    if (prevBase === undefined) delete process.env.MAP_OFFLINE_PACK_BASE_URL;
    else process.env.MAP_OFFLINE_PACK_BASE_URL = prevBase;
  }
});

test("Phase5-prep admin dispatch fail-closed without INTERNAL_API_SECRET", async () => {
  const prev = process.env.INTERNAL_API_SECRET;
  delete process.env.INTERNAL_API_SECRET;
  try {
    const closed = await dispatchGet(
      new Request("http://localhost/api/admin/delivery/dispatch"),
    );
    assert.equal(closed.status, 503);
    const body = (await closed.json()) as { error: string };
    assert.match(body.error, /INTERNAL_API_SECRET/);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }

  process.env.INTERNAL_API_SECRET = "p5_dispatch_secret";
  try {
    const board = await dispatchGet(
      new Request("http://localhost/api/admin/delivery/dispatch", {
        headers: { "x-internal-secret": "p5_dispatch_secret" },
      }),
    );
    assert.equal(board.status, 200);
    const body = (await board.json()) as {
      board: { mapSor: string; jobEngine: string };
    };
    assert.equal(body.board.mapSor, "maplibre");
    assert.equal(body.board.jobEngine, "packages/delivery");

    const reject = await dispatchPost(
      new Request("http://localhost/api/admin/delivery/dispatch", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "p5_dispatch_secret",
        },
        body: JSON.stringify({ action: "create_job", userId: "evil" }),
      }),
    );
    assert.equal(reject.status, 400);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});
