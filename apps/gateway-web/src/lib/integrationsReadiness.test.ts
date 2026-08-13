import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseIntegrationsHealth,
  probeEntries,
} from "./integrationsReadiness.js";

test("S133 parseIntegrationsHealth + probeEntries", () => {
  const bad = parseIntegrationsHealth(null);
  assert.ok("error" in bad);

  const ok = parseIntegrationsHealth({
    ready: true,
    mode: "fixture",
    probes: { maps: true, psp: false },
    groups: [
      {
        label: "maps",
        configured: false,
        missing: ["NOMINATIM_URL"],
        presentCount: 0,
        requiredCount: 2,
      },
    ],
  });
  assert.ok(!("error" in ok));
  assert.equal(ok.ready, true);
  assert.equal(ok.mode, "fixture");
  assert.equal(ok.groups[0]?.label, "maps");
  assert.deepEqual(probeEntries(ok.probes), [
    { name: "maps", ok: true },
    { name: "psp", ok: false },
  ]);
});
