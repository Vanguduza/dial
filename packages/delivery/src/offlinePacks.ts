/**
 * PD28 offline MapLibre tile packs (Pack §9.8 / D-44).
 * Harare / Bulawayo regions — MapLibre SoR, never Google/Mapbox.
 */
export type OfflinePackId = "harare_metro" | "bulawayo_metro";

export type OfflinePackDefinition = {
  packId: OfflinePackId;
  label: string;
  city: "Harare" | "Bulawayo";
  mapSor: "maplibre";
  /** Approximate WGS84 bbox for offline vector tile download. */
  bbox: { west: number; south: number; east: number; north: number };
  tileSchema: "maplibre_vector_fixture";
};

export type CourierOfflinePackInstall = {
  courierId: string;
  packId: OfflinePackId;
  status: "installed" | "pending";
  installedAt: string;
  mapSor: "maplibre";
};

const PACK_DEFS: OfflinePackDefinition[] = [
  {
    packId: "harare_metro",
    label: "Harare metro tiles",
    city: "Harare",
    mapSor: "maplibre",
    bbox: { west: 30.9, south: -17.95, east: 31.25, north: -17.7 },
    tileSchema: "maplibre_vector_fixture",
  },
  {
    packId: "bulawayo_metro",
    label: "Bulawayo metro tiles",
    city: "Bulawayo",
    mapSor: "maplibre",
    bbox: { west: 28.45, south: -20.25, east: 28.7, north: -20.05 },
    tileSchema: "maplibre_vector_fixture",
  },
];

const installs = new Map<string, CourierOfflinePackInstall>();

function installKey(courierId: string, packId: OfflinePackId): string {
  return `${courierId}:${packId}`;
}

export function listOfflinePackDefinitions(): OfflinePackDefinition[] {
  return PACK_DEFS.map((p) => ({ ...p, bbox: { ...p.bbox } }));
}

export function getOfflinePackDefinition(
  packId: OfflinePackId,
): OfflinePackDefinition | undefined {
  const row = PACK_DEFS.find((p) => p.packId === packId);
  return row ? { ...row, bbox: { ...row.bbox } } : undefined;
}

/** Courier activates/downloads an offline tile region (MapLibre fixture). */
export function activateOfflinePack(input: {
  courierId: string;
  packId: OfflinePackId;
}): CourierOfflinePackInstall {
  const def = getOfflinePackDefinition(input.packId);
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
