/**
 * PD27 dual-entry catalogue (Pack §9.2 / C-6 / §3.2).
 * Select Vehicle (`vehicle_master`) vs Browse EPC (`catalog_*`); join on chassis_code.
 * OpenCatalog/ACES-style fixtures only — no reverse-engineered TecDoc/OEM scrape.
 * USD display (D-57); B2B informal hide applied at offer join (D-49).
 */

export type SearchSessionRole = "b2c" | "b2b";

export type OfferLike = {
  offerId: string;
  title: string;
  unitPriceUsdMinor: bigint;
  qualityTier: "OEM" | "OES" | "Aftermarket";
  offerSource: "MARKETPLACE";
  supplierFormality: "formal" | "informal";
  oem: string;
  brand: string;
};
export type VehicleMasterRow = {
  vehicleId: string;
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  chassisCode: string;
  engineCode: string;
};

export type CatalogGroup = {
  groupId: string;
  title: string;
  /** Diagram path stub — licensed/brand-feed shape, not scraped EPC. */
  diagramPath: string;
};

export type CatalogAssembly = {
  assemblyId: string;
  groupId: string;
  title: string;
  chassisCodes: string[];
};

export type CatalogPart = {
  partId: string;
  assemblyId: string;
  oem: string;
  title: string;
  chassisCodes: string[];
  pnc: string;
};

const VEHICLE_MASTER: VehicleMasterRow[] = [
  {
    vehicleId: "vm_toyota_hilux_kun26",
    make: "Toyota",
    model: "Hilux",
    yearFrom: 2005,
    yearTo: 2015,
    chassisCode: "KUN26",
    engineCode: "1KD-FTV",
  },
  {
    vehicleId: "vm_toyota_corolla_zre152",
    make: "Toyota",
    model: "Corolla",
    yearFrom: 2007,
    yearTo: 2013,
    chassisCode: "ZRE152",
    engineCode: "2ZR-FE",
  },
  {
    vehicleId: "vm_nissan_np300_d22",
    make: "Nissan",
    model: "NP300",
    yearFrom: 2008,
    yearTo: 2015,
    chassisCode: "D22",
    engineCode: "YD25",
  },
];

const CATALOG_GROUPS: CatalogGroup[] = [
  {
    groupId: "cg_engine",
    title: "Engine",
    diagramPath: "brand-feed://aces/engine",
  },
  {
    groupId: "cg_brakes",
    title: "Brakes",
    diagramPath: "brand-feed://aces/brakes",
  },
];

const CATALOG_ASSEMBLIES: CatalogAssembly[] = [
  {
    assemblyId: "ca_oil_filter",
    groupId: "cg_engine",
    title: "Oil filter",
    chassisCodes: ["KUN26", "ZRE152"],
  },
  {
    assemblyId: "ca_front_pads",
    groupId: "cg_brakes",
    title: "Front brake pads",
    chassisCodes: ["ZRE152", "D22"],
  },
];

const CATALOG_PARTS: CatalogPart[] = [
  {
    partId: "cp_kun26_oil",
    assemblyId: "ca_oil_filter",
    oem: "KUN26-FILTER",
    title: "Oil filter (KUN26)",
    chassisCodes: ["KUN26"],
    pnc: "15601",
  },
  {
    partId: "cp_zre152_pads",
    assemblyId: "ca_front_pads",
    oem: "ZRE152-PAD-F",
    title: "Front brake pads (ZRE152)",
    chassisCodes: ["ZRE152"],
    pnc: "04465",
  },
];

/** Infer chassis from seeded offer titles/OEM for Meili chassis_codes join. */
export function chassisCodesForOffer(offer: {
  title: string;
  oem: string;
}): string[] {
  const codes = new Set<string>();
  for (const v of VEHICLE_MASTER) {
    if (
      offer.title.toUpperCase().includes(v.chassisCode) ||
      offer.oem.toUpperCase().includes(v.chassisCode)
    ) {
      codes.add(v.chassisCode);
    }
  }
  for (const p of CATALOG_PARTS) {
    if (p.oem === offer.oem) {
      for (const c of p.chassisCodes) codes.add(c);
    }
  }
  return [...codes];
}

export function listVehicleMakes(): string[] {
  return [...new Set(VEHICLE_MASTER.map((v) => v.make))].sort();
}

export function listVehicleModels(make: string): string[] {
  return [
    ...new Set(
      VEHICLE_MASTER.filter(
        (v) => v.make.toLowerCase() === make.trim().toLowerCase(),
      ).map((v) => v.model),
    ),
  ].sort();
}

export function selectVehicles(input: {
  make: string;
  model?: string;
  year?: number;
}): VehicleMasterRow[] {
  const make = input.make.trim().toLowerCase();
  return VEHICLE_MASTER.filter((v) => {
    if (v.make.toLowerCase() !== make) return false;
    if (input.model && v.model.toLowerCase() !== input.model.trim().toLowerCase()) {
      return false;
    }
    if (
      input.year !== undefined &&
      (input.year < v.yearFrom || input.year > v.yearTo)
    ) {
      return false;
    }
    return true;
  }).map((v) => ({ ...v }));
}

export function getVehicleByChassis(chassisCode: string): VehicleMasterRow | undefined {
  const row = VEHICLE_MASTER.find(
    (v) => v.chassisCode.toUpperCase() === chassisCode.trim().toUpperCase(),
  );
  return row ? { ...row } : undefined;
}

export function listCatalogGroups(): CatalogGroup[] {
  return CATALOG_GROUPS.map((g) => ({ ...g }));
}

export function listCatalogAssemblies(input?: {
  groupId?: string;
  chassisCode?: string;
}): CatalogAssembly[] {
  return CATALOG_ASSEMBLIES.filter((a) => {
    if (input?.groupId && a.groupId !== input.groupId) return false;
    if (
      input?.chassisCode &&
      !a.chassisCodes
        .map((c) => c.toUpperCase())
        .includes(input.chassisCode.trim().toUpperCase())
    ) {
      return false;
    }
    return true;
  }).map((a) => ({ ...a, chassisCodes: [...a.chassisCodes] }));
}

export function listCatalogParts(input?: {
  assemblyId?: string;
  chassisCode?: string;
}): CatalogPart[] {
  return CATALOG_PARTS.filter((p) => {
    if (input?.assemblyId && p.assemblyId !== input.assemblyId) return false;
    if (
      input?.chassisCode &&
      !p.chassisCodes
        .map((c) => c.toUpperCase())
        .includes(input.chassisCode.trim().toUpperCase())
    ) {
      return false;
    }
    return true;
  }).map((p) => ({ ...p, chassisCodes: [...p.chassisCodes] }));
}

export type DualEntryOfferHit = OfferLike & {
  chassis_codes: string[];
  displayCurrency: "USD";
  entryPath: "select_vehicle" | "browse_epc";
};

/**
 * Join offers on chassis_code after Select Vehicle or Browse EPC.
 * B2B informal filtered here (D-49); currency locked USD (D-57).
 */
export function offersForChassis(input: {
  chassisCode: string;
  sessionRole: SearchSessionRole;
  entryPath: "select_vehicle" | "browse_epc";
  offers: OfferLike[];
}): DualEntryOfferHit[] {
  const chassis = input.chassisCode.trim().toUpperCase();
  if (!chassis) return [];
  return input.offers
    .filter((o) => {
      if (o.offerSource !== "MARKETPLACE") return false;
      if (input.sessionRole === "b2b" && o.supplierFormality === "informal") {
        return false;
      }
      const codes = chassisCodesForOffer(o).map((c) => c.toUpperCase());
      return codes.includes(chassis);
    })
    .map((o) => ({
      ...o,
      chassis_codes: chassisCodesForOffer(o),
      displayCurrency: "USD" as const,
      entryPath: input.entryPath,
    }));
}

export function dualEntrySnapshot() {
  return {
    entryModes: ["select_vehicle", "browse_epc"] as const,
    joinKey: "chassis_code" as const,
    dataSource: "opencatalog_aces_brand_feed_fixture" as const,
    reverseEngineeredEpc: false as const,
    displayCurrency: "USD" as const,
    vehicleCount: VEHICLE_MASTER.length,
    catalogGroupCount: CATALOG_GROUPS.length,
  };
}

/**
 * PD27 thin vertical: Select Vehicle → chassis → offers;
 * Browse EPC → same chassis join; B2B hides informal; USD only.
 */
export function runPd27SpareDualEntryThinVertical(input?: {
  sessionRole?: SearchSessionRole;
  offers?: OfferLike[];
}): {
  selectVehicleChassis: string;
  browseEpcChassis: string;
  joinKey: "chassis_code";
  selectHits: number;
  epcHits: number;
  sameJoin: true;
  b2bInformalHidden: true;
  displayCurrencyUsd: true;
  reverseEngineeredEpc: false;
  payableFromAi: false;
} {
  const role = input?.sessionRole ?? "b2c";
  const offers =
    input?.offers ??
    ([
      {
        offerId: "off_filter_oil_kun26",
        title: "Oil filter (KUN26)",
        unitPriceUsdMinor: 12_00n,
        qualityTier: "OES" as const,
        offerSource: "MARKETPLACE" as const,
        supplierFormality: "formal" as const,
        oem: "KUN26-FILTER",
        brand: "Toyota",
      },
      {
        offerId: "off_pad_front_zre152",
        title: "Front brake pads (ZRE152)",
        unitPriceUsdMinor: 45_00n,
        qualityTier: "Aftermarket" as const,
        offerSource: "MARKETPLACE" as const,
        supplierFormality: "formal" as const,
        oem: "ZRE152-PAD-F",
        brand: "Akebono",
      },
      {
        offerId: "off_wiper_informal_01",
        title: "Wiper blade (informal stock)",
        unitPriceUsdMinor: 8_00n,
        qualityTier: "Aftermarket" as const,
        offerSource: "MARKETPLACE" as const,
        supplierFormality: "informal" as const,
        oem: "WIPER-UNI",
        brand: "Local",
      },
    ] satisfies OfferLike[]);

  const vehicles = selectVehicles({ make: "Toyota", model: "Hilux", year: 2010 });
  if (vehicles.length < 1 || vehicles[0]!.chassisCode !== "KUN26") {
    throw new Error("PD27 Select Vehicle cascade must resolve KUN26");
  }
  const chassis = vehicles[0]!.chassisCode;
  const selectHits = offersForChassis({
    chassisCode: chassis,
    sessionRole: role,
    entryPath: "select_vehicle",
    offers,
  });
  if (selectHits.length < 1) {
    throw new Error("PD27 Select Vehicle join must return offers");
  }
  if (!selectHits.every((h) => h.displayCurrency === "USD")) {
    throw new Error("PD27 displayCurrency must be USD (D-57)");
  }

  const assemblies = listCatalogAssemblies({
    groupId: "cg_engine",
    chassisCode: chassis,
  });
  if (assemblies.length < 1) {
    throw new Error("PD27 Browse EPC must list assemblies for chassis");
  }
  const parts = listCatalogParts({
    assemblyId: assemblies[0]!.assemblyId,
    chassisCode: chassis,
  });
  if (parts.length < 1) {
    throw new Error("PD27 Browse EPC must list parts for chassis");
  }
  const epcHits = offersForChassis({
    chassisCode: chassis,
    sessionRole: role,
    entryPath: "browse_epc",
    offers,
  });
  const selectIds = new Set(selectHits.map((h) => h.offerId));
  const epcIds = new Set(epcHits.map((h) => h.offerId));
  if (![...selectIds].every((id) => epcIds.has(id))) {
    throw new Error("PD27 both entry paths must join on same chassis_code offers");
  }

  const b2b = offersForChassis({
    chassisCode: chassis,
    sessionRole: "b2b",
    entryPath: "select_vehicle",
    offers,
  });
  if (b2b.some((h) => h.supplierFormality === "informal")) {
    throw new Error("PD27 B2B must hide informal (D-49)");
  }

  const snap = dualEntrySnapshot();
  if (snap.reverseEngineeredEpc) {
    throw new Error("PD27 forbids reverse-engineered EPC (C-6)");
  }

  return {
    selectVehicleChassis: chassis,
    browseEpcChassis: chassis,
    joinKey: "chassis_code",
    selectHits: selectHits.length,
    epcHits: epcHits.length,
    sameJoin: true,
    b2bInformalHidden: true,
    displayCurrencyUsd: true,
    reverseEngineeredEpc: false,
    payableFromAi: false,
  };
}
