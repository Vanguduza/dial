/**
 * PD28 offline MapLibre tile packs (Pack §9.8 / D-44).
 * Harare / Bulawayo regions — MapLibre SoR, never Google/Mapbox.
 * Phase 5 prep: optional packUrl/styleUrl from MAP_OFFLINE_PACK_BASE_URL (key-drop-in).
 */
export type OfflinePackId = "harare_metro" | "bulawayo_metro";

export type OfflinePackDefinition = {
  packId: OfflinePackId;
  label: string;
  city: "Harare" | "Bulawayo";
  mapSor: "maplibre";
  /** Approximate WGS84 bbox for offline vector tile download. */
  bbox: { west: number; south: number; east: number; north: number };
  tileSchema: "maplibre_vector_fixture" | "maplibre_vector";
  /** Absolute pack URI when MAP_OFFLINE_PACK_BASE_URL set; else empty (fixture metadata only). */
  packUrl: string;
  /** MapLibre style JSON URL when base configured; else empty. */
  styleUrl: string;
};

export type CourierOfflinePackInstall = {
  courierId: string;
  packId: OfflinePackId;
  status: "installed" | "pending";
  installedAt: string;
  mapSor: "maplibre";
  packUrl: string;
  styleUrl: string;
};

const PACK_DEFS_BASE: Array<
  Omit<OfflinePackDefinition, "packUrl" | "styleUrl" | "tileSchema"> & {
    pathSegment: string;
  }
> = [
  {
    packId: "harare_metro",
    label: "Harare metro tiles",
    city: "Harare",
    mapSor: "maplibre",
    bbox: { west: 30.9, south: -17.95, east: 31.25, north: -17.7 },
    pathSegment: "harare_metro",
  },
  {
    packId: "bulawayo_metro",
    label: "Bulawayo metro tiles",
    city: "Bulawayo",
    mapSor: "maplibre",
    bbox: { west: 28.45, south: -20.25, east: 28.7, north: -20.05 },
    pathSegment: "bulawayo_metro",
  },
];

const installs = new Map<string, CourierOfflinePackInstall>();

function installKey(courierId: string, packId: OfflinePackId): string {
  return `${courierId}:${packId}`;
}

function offlinePackBaseUrl(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return (env.MAP_OFFLINE_PACK_BASE_URL ?? "").trim().replace(/\/$/, "");
}

function withUrls(
  base: (typeof PACK_DEFS_BASE)[number],
  env: NodeJS.ProcessEnv = process.env,
): OfflinePackDefinition {
  const root = offlinePackBaseUrl(env);
  const packUrl = root ? `${root}/${base.pathSegment}.mbtiles` : "";
  const styleUrl = root ? `${root}/${base.pathSegment}/style.json` : "";
  return {
    packId: base.packId,
    label: base.label,
    city: base.city,
    mapSor: "maplibre",
    bbox: { ...base.bbox },
    tileSchema: root ? "maplibre_vector" : "maplibre_vector_fixture",
    packUrl,
    styleUrl,
  };
}

export function listOfflinePackDefinitions(
  env: NodeJS.ProcessEnv = process.env,
): OfflinePackDefinition[] {
  return PACK_DEFS_BASE.map((p) => withUrls(p, env));
}

export function getOfflinePackDefinition(
  packId: OfflinePackId,
  env: NodeJS.ProcessEnv = process.env,
): OfflinePackDefinition | undefined {
  const row = PACK_DEFS_BASE.find((p) => p.packId === packId);
  return row ? withUrls(row, env) : undefined;
}

/** Courier activates/downloads an offline tile region (MapLibre; URLs when base set). */
export function activateOfflinePack(input: {
  courierId: string;
  packId: OfflinePackId;
  env?: NodeJS.ProcessEnv;
}): CourierOfflinePackInstall {
  const env = input.env ?? process.env;
  const def = getOfflinePackDefinition(input.packId, env);
  if (!def) throw new Error(`Unknown offline pack ${input.packId}`);
  if (def.mapSor !== "maplibre") {
    throw new Error("Offline packs must use MapLibre SoR (D-44)");
  }
  const row: CourierOfflinePackInstall = {
    courierId: input.courierId,
    packId: input.packId,
    status: "installed",
    installedAt: new Date().toISOString(),
    mapSor: "maplibre",
    packUrl: def.packUrl,
    styleUrl: def.styleUrl,
  };
  installs.set(installKey(input.courierId, input.packId), row);
  return { ...row };
}

export function listCourierOfflinePacks(
  courierId: string,
): CourierOfflinePackInstall[] {
  return [...installs.values()]
    .filter((i) => i.courierId === courierId)
    .map((i) => ({ ...i }));
}

export function courierHasOfflinePack(
  courierId: string,
  packId: OfflinePackId,
): boolean {
  return (
    installs.get(installKey(courierId, packId))?.status === "installed"
  );
}

export function __resetOfflinePacksForTests(): void {
  installs.clear();
}
