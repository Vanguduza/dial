/**
 * Pack §8 Meili spare_offers_v1 settings + document shape (customer-facing; no supplierId).
 * Kept separate so meiliClient does not circular-import @dial/catalogue.
 */

export type OfferSource = "MARKETPLACE";
export type SupplierFormality = "formal" | "informal";

export type SpareOfferDocument = {
  id: string;
  masterProductId: string;
  oem: string;
  normalisedOem: string;
  description: string;
  brand: string;
  qualityTier: string;
  availability: "available" | "confirm_required" | "sourcing";
  chassis_codes: string[];
  engine_codes: string[];
  categoryPath: string[];
  priceMinor: number;
  currency: "USD";
  warrantyDays: number;
  deliveryBandId: string;
  fitmentConfidence: number;
  stockValidUntil: number;
  hasRestrictedSku: boolean;
  offerSource: OfferSource;
  supplierFormality: SupplierFormality;
};

/** Pack §8.2 settings — filterable includes offerSource + supplierFormality. */
export const MEILI_SPARE_OFFERS_V1_SETTINGS = {
  searchableAttributes: [
    "oem",
    "normalisedOem",
    "description",
    "brand",
    "pnc",
    "chassis_codes",
    "engine_codes",
  ],
  filterableAttributes: [
    "brand",
    "qualityTier",
    "availability",
    "chassis_codes",
    "engine_codes",
    "currency",
    "deliveryBandId",
    "hasRestrictedSku",
    "priceMinor",
    "fitmentConfidence",
    "stockValidUntil",
    "offerSource",
    "supplierFormality",
  ],
  sortableAttributes: ["priceMinor", "fitmentConfidence", "stockValidUntil"],
  displayedAttributes: [
    "id",
    "masterProductId",
    "oem",
    "description",
    "brand",
    "qualityTier",
    "availability",
    "priceMinor",
    "currency",
    "warrantyDays",
    "deliveryBandId",
    "fitmentConfidence",
    "hasRestrictedSku",
    "categoryPath",
    "offerSource",
    "supplierFormality",
  ],
} as const;

/** Default index uid — Pack §8 / .env.example `MEILI_SPARE_INDEX`. */
export const MEILI_SPARE_INDEX_DEFAULT = "spare_offers_v1";
