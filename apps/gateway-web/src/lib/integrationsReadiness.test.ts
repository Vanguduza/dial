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

test("S137 INTEGRATION_PROBE_KEYS match OpenAPI IntegrationsProbes required", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { INTEGRATION_PROBE_KEYS } = await import("./integrationsReadiness.js");
  const spec = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    components: {
      schemas: {
        IntegrationsProbes: {
          required: string[];
          properties: Record<string, unknown>;
        };
      };
    };
  };
  const required = [...spec.components.schemas.IntegrationsProbes.required].sort();
  const keys = [...INTEGRATION_PROBE_KEYS].sort();
  assert.deepEqual(required, keys);
  for (const k of INTEGRATION_PROBE_KEYS) {
    assert.ok(spec.components.schemas.IntegrationsProbes.properties[k]);
  }
});
