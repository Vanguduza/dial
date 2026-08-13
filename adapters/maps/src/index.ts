/**
 * Maps adapters — Nominatim + OSRM + VROOM (D-44). Never Google/Mapbox as SoR.
 */
export type IntegrationMode = "fixture" | "sandbox" | "live";

export function integrationMode(
  env: NodeJS.ProcessEnv = process.env,
): IntegrationMode {
  const m = (env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (m === "sandbox" || m === "live") return m;
  return "fixture";
}

export type GeoPoint = { lat: number; lon: number };

export type RouteEstimate = {
  distanceMeters: number;
  durationSeconds: number;
  provider: "osrm" | "vroom" | "fixture";
};

function requireUrl(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} unset — fail closed`);
  return v.replace(/\/$/, "");
}

/** Nominatim geocode — self-hosted preferred. */
export async function geocodeNominatim(query: string): Promise<GeoPoint> {
  if (integrationMode() === "fixture") {
    return { lat: -17.8252, lon: 31.0335 }; // Harare CBD fixture
  }
  const base = requireUrl("NOMINATIM_URL");
  const url = `${base}/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "DIAL-maps-adapter/0.1" },
  });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
  if (!data[0]?.lat || !data[0]?.lon) throw new Error("Nominatim no result");
  return { lat: Number(data[0].lat), lon: Number(data[0].lon) };
}

/** OSRM route between two points. */
export async function estimateRouteOsrm(
  from: GeoPoint,
  to: GeoPoint,
): Promise<RouteEstimate> {
  if (integrationMode() === "fixture") {
    return {
      distanceMeters: 4200,
      durationSeconds: 720,
      provider: "fixture",
    };
  }
  const base = requireUrl("OSRM_URL");
  const coords = `${from.lon},${from.lat};${to.lon},${to.lat}`;
  const res = await fetch(`${base}/route/v1/driving/${coords}?overview=false`);
  if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
  const data = (await res.json()) as {
    routes?: Array<{ distance?: number; duration?: number }>;
  };
  const route = data.routes?.[0];
  if (!route?.distance || route.duration == null) {
    throw new Error("OSRM missing route");
  }
  return {
    distanceMeters: Math.round(route.distance),
    durationSeconds: Math.round(route.duration),
    provider: "osrm",
  };
}

/** VROOM multi-stop assignment (optional). */
export async function planVroomJob(input: {
  vehicles: Array<{ id: number; start: GeoPoint }>;
  jobs: Array<{ id: number; location: GeoPoint }>;
}): Promise<{ provider: "vroom" | "fixture"; summary: string }> {
  if (integrationMode() === "fixture") {
    return {
      provider: "fixture",
      summary: `fixture plan vehicles=${input.vehicles.length} jobs=${input.jobs.length}`,
    };
  }
  const base = requireUrl("VROOM_URL");
  const res = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicles: input.vehicles.map((v) => ({
        id: v.id,
        start: [v.start.lon, v.start.lat],
      })),
      jobs: input.jobs.map((j) => ({
        id: j.id,
        location: [j.location.lon, j.location.lat],
      })),
    }),
  });
  if (!res.ok) throw new Error(`VROOM HTTP ${res.status}`);
  return { provider: "vroom", summary: "ok" };
}
