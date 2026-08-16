import assert from "node:assert/strict";
import { test } from "node:test";
import {
  estimateRouteOsrm,
  geocodeNominatim,
  planVroomJob,
  reverseGeocodeNominatim,
} from "./index.js";

test("maps fixture: nominatim + osrm + vroom without keys", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const p = await geocodeNominatim("Harare");
  assert.ok(p.lat < 0);
  const rev = await reverseGeocodeNominatim(p);
  assert.ok(rev.displayName.includes("Harare"));
  const route = await estimateRouteOsrm(p, { lat: -17.83, lon: 31.05 });
  assert.equal(route.provider, "fixture");
  assert.ok(route.distanceMeters > 0);
  const plan = await planVroomJob({
    vehicles: [{ id: 1, start: p }],
    jobs: [{ id: 1, location: { lat: -17.83, lon: 31.05 } }],
  });
  assert.equal(plan.provider, "fixture");
});

test("S122 pingMapsHealth fixture ok + sandbox fail-closed without URLs", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const { pingMapsHealth } = await import("./index.js");
  const fx = await pingMapsHealth();
  assert.equal(fx.ok, true);
  assert.equal(fx.mode, "fixture");
  assert.equal(fx.nominatim, true);
  assert.equal(fx.osrm, true);

  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.NOMINATIM_URL;
  delete process.env.OSRM_URL;
  const closed = await pingMapsHealth();
  assert.equal(closed.ok, false);
  assert.ok(closed.error?.includes("fail closed"));
  process.env.DIAL_INTEGRATION_MODE = "fixture";
});
