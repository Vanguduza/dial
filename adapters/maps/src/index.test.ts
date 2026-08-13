import assert from "node:assert/strict";
import { test } from "node:test";
import {
  estimateRouteOsrm,
  geocodeNominatim,
  planVroomJob,
} from "./index.js";

test("maps fixture: nominatim + osrm + vroom without keys", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const p = await geocodeNominatim("Harare");
  assert.ok(p.lat < 0);
  const route = await estimateRouteOsrm(p, { lat: -17.83, lon: 31.05 });
  assert.equal(route.provider, "fixture");
  assert.ok(route.distanceMeters > 0);
  const plan = await planVroomJob({
    vehicles: [{ id: 1, start: p }],
    jobs: [{ id: 1, location: { lat: -17.83, lon: 31.05 } }],
  });
  assert.equal(plan.provider, "fixture");
});
