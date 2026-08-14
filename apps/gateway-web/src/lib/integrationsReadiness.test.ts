import assert from "node:assert/strict";
import { test } from "node:test";
import {
  INTEGRATIONS_HEALTH_NOTE_UI_MAX,
  parseIntegrationsHealth,
  probeEntries,
  truncateIntegrationsHealthNote,
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
  assert.equal(ok.note, undefined);
  assert.deepEqual(probeEntries(ok.probes), [
    { name: "maps", ok: true },
    { name: "psp", ok: false },
  ]);
});

test("S154 parseIntegrationsHealth note + truncateIntegrationsHealthNote", () => {
  const withNote = parseIntegrationsHealth({
    ready: false,
    mode: "fixture",
    probes: {},
    groups: [],
    note: "Fixture mode — groups labels=whatsapp,paynow",
  });
  assert.ok(!("error" in withNote));
  assert.equal(withNote.note, "Fixture mode — groups labels=whatsapp,paynow");

  const short = "short note";
  assert.equal(truncateIntegrationsHealthNote(short), short);
  const long = "x".repeat(INTEGRATIONS_HEALTH_NOTE_UI_MAX + 40);
  const truncated = truncateIntegrationsHealthNote(long);
  assert.equal(truncated.length, INTEGRATIONS_HEALTH_NOTE_UI_MAX);
  assert.ok(truncated.endsWith("…"));
  assert.equal(
    truncated,
    `${"x".repeat(INTEGRATIONS_HEALTH_NOTE_UI_MAX - 1)}…`,
  );
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

test("S138 buildIntegrationsProbes + integrationsReady SoR", async () => {
  const {
    buildIntegrationsProbes,
    integrationsReady,
    INTEGRATION_PROBE_KEYS,
  } = await import("./integrationsReadiness.js");
  const partial = buildIntegrationsProbes({ maps: true, psp: true });
  assert.equal(Object.keys(partial).sort().join(","), [...INTEGRATION_PROBE_KEYS].sort().join(","));
  assert.equal(partial.maps, true);
  assert.equal(partial.temporal, false);
  assert.equal(integrationsReady(partial), false);
  const allTrue = buildIntegrationsProbes(
    Object.fromEntries(INTEGRATION_PROBE_KEYS.map((k) => [k, true])),
  );
  assert.equal(integrationsReady(allTrue), true);
});

test("S146 INTEGRATION_ENV_GROUP_LABELS tracks INTEGRATION_ENV_GROUPS order", async () => {
  const {
    INTEGRATION_ENV_GROUPS,
    INTEGRATION_ENV_GROUP_LABELS,
  } = await import("./integrationsReadiness.js");
  assert.deepEqual(
    [...INTEGRATION_ENV_GROUP_LABELS],
    INTEGRATION_ENV_GROUPS.map((g) => g.label),
  );
  assert.equal(
    INTEGRATION_ENV_GROUP_LABELS.length,
    INTEGRATION_ENV_GROUPS.length,
  );
});

test("S139 INTEGRATION_ENV_GROUPS match OpenAPI label enum + .env.example keys", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const {
    INTEGRATION_ENV_GROUPS,
    listIntegrationEnvGroupSnapshots,
  } = await import("./integrationsReadiness.js");
  const spec = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    components: {
      schemas: {
        IntegrationsHealth: {
          properties: {
            groups: {
              items: { properties: { label: { enum: string[] } } };
            };
          };
        };
      };
    };
  };
  const openapiLabels = [
    ...spec.components.schemas.IntegrationsHealth.properties.groups.items
      .properties.label.enum,
  ].sort();
  const labels = INTEGRATION_ENV_GROUPS.map((g) => g.label).sort();
  assert.deepEqual(labels, openapiLabels);

  const envExample = readFileSync(
    join(process.cwd(), "../../.env.example"),
    "utf8",
  );
  for (const g of INTEGRATION_ENV_GROUPS) {
    for (const key of g.keys) {
      assert.ok(envExample.includes(`${key}=`), `.env.example missing ${key}`);
    }
  }

  const snaps = listIntegrationEnvGroupSnapshots({
    MEILI_HOST: "http://127.0.0.1:7700",
  });
  const meili = snaps.find((s) => s.label === "meili");
  assert.ok(meili);
  assert.equal(meili.presentCount, 1);
  assert.equal(meili.configured, false);
});
