/**
 * G5 maps Tier-2 probe — ping Nominatim/OSRM/VROOM when URLs set (ENH-013).
 * Does not claim G5 without live geocode + route. Never prints secrets.
 *
 * Usage: pnpm --filter @dial/gateway-web exec node --import tsx scripts/g5-maps-tier2-probe.mts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  estimateRouteOsrm,
  geocodeNominatim,
  pingMapsHealth,
  planVroomJob,
} from "@dial/adapter-maps";

const envPath = join(process.cwd(), "..", "..", ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    if (!process.env[key]) {
      process.env[key] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
}

const evidenceDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "docs",
  "ops",
  "evidence",
  "g5",
);
mkdirSync(evidenceDir, { recursive: true });

async function main() {
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  const health = await pingMapsHealth();
  const evidence: Record<string, unknown> = {
    date: new Date().toISOString().slice(0, 10),
    mode: health.mode,
    urlsConfigured: {
      nominatim: health.nominatim,
      osrm: health.osrm,
      vroom: health.vroom,
    },
    healthOk: health.ok,
    healthError: health.error,
    liveGeocode: null as unknown,
    liveRoute: null as unknown,
    liveVroom: null as unknown,
    enh013Open: true,
    g5MapsSoR: false,
  };

  if (health.ok && health.nominatim && health.osrm) {
    try {
      const point = await geocodeNominatim("Harare CBD Zimbabwe");
      evidence.liveGeocode = { lat: point.lat, lon: point.lon };
      const route = await estimateRouteOsrm(point, {
        lat: point.lat + 0.02,
        lon: point.lon + 0.02,
      });
      evidence.liveRoute = {
        provider: route.provider,
        distanceMeters: route.distanceMeters,
        durationSeconds: route.durationSeconds,
      };
      evidence.g5MapsSoR = route.provider === "osrm";
    } catch (e) {
      evidence.liveGeocode = {
        error: e instanceof Error ? e.message : "geocode failed",
      };
    }
    if (health.vroom) {
      try {
        const vroom = await planVroomJob({
          vehicles: [{ id: 1, start: { lat: -17.83, lon: 31.03 } }],
          jobs: [{ id: 1, location: { lat: -17.84, lon: 31.05 } }],
        });
        evidence.liveVroom = vroom;
      } catch (e) {
        evidence.liveVroom = {
          error: e instanceof Error ? e.message : "vroom failed",
        };
      }
    }
  } else {
    evidence.residual =
      "ENH-013 maps Tier-2 hosting not running locally — NOMINATIM_URL/OSRM_URL unset or unreachable";
  }

  evidence.enh013Open = !evidence.g5MapsSoR;
  writeFileSync(
    join(evidenceDir, "g5-maps-tier2-probe.json"),
    JSON.stringify(evidence, null, 2),
  );
  console.log(JSON.stringify(evidence, null, 2));
  process.exit(evidence.g5MapsSoR ? 0 : 1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
