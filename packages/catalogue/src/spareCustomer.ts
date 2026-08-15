/**
 * PD18 Spare-web deepen — orders / tracking / returns / garage (Pack §9.2).
 * USD currency of record on orders; agency Sold by {Supplier}; returns ERP stub (no AI money).
 * Does not import catalogue cart SoR (avoids cycle) — callers pass cart snapshot.
 */

export type SpareOrderStatus =
  | "confirmed"
  | "awaiting_supplier"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type SpareOrderLine = {
  offerId: string;
  title: string;
  qty: number;
  unitPriceUsdMinor: bigint;
  lineTotalUsdMinor: bigint;
  soldBy: string;
  supplierFormality: "formal" | "informal";
};

export type SpareOrder = {
  orderId: string;
  cartId: string;
  customerId: string | null;
  status: SpareOrderStatus;
  currency: "USD";
  totalUsdMinor: bigint;
  payChoice: "ecocash" | "cod";
  soldBySummary: string;
  lines: SpareOrderLine[];
  createdAt: string;
  cancellableUntil: string;
};

export type SpareReturnPath = "refund_or_replace" | "refund" | "replace";

export type SpareReturnClaim = {
  claimId: string;
  orderId: string;
  path: SpareReturnPath;
  status: "opened" | "resolved";
  resolution: SpareReturnPath | null;
  /** Never set by AI — human/ERP only. */
  payableFromAi: false;
  createdAt: string;
};

export type GarageVehicle = {
  vehicleId: string;
  customerId: string;
  label: string;
  chassisHint: string;
  reminderConsent: boolean;
  createdAt: string;
};

/** PD50 — consent grant/revoke audit (Vehicle Hub deepen). */
export type GarageConsentEvent = {
  eventId: string;
  vehicleId: string;
  customerId: string;
  action: "grant" | "revoke";
  at: string;
};

export type SpareCartSnapshot = {
  id: string;
  currency: "USD";
  totalUsdMinor: bigint;
  lines: Array<{
    offerId: string;
    title: string;
    qty: number;
    unitPriceUsdMinor: bigint;
    lineTotalUsdMinor: bigint;
    soldBy: string;
    supplierFormality: "formal" | "informal";
  }>;
};

type SpareCustomerStore = {
  orders: Map<string, SpareOrder>;
  returns: Map<string, SpareReturnClaim>;
  vehicles: Map<string, GarageVehicle>;
  consentAudit: GarageConsentEvent[];
};

function store(): SpareCustomerStore {
  const g = globalThis as typeof globalThis & {
    __dialSpareCustomerStore?: SpareCustomerStore;
  };
  if (!g.__dialSpareCustomerStore) {
    g.__dialSpareCustomerStore = {
      orders: new Map(),
      returns: new Map(),
      vehicles: new Map(),
      consentAudit: [],
    };
  }
  if (!g.__dialSpareCustomerStore.consentAudit) {
    g.__dialSpareCustomerStore.consentAudit = [];
  }
  return g.__dialSpareCustomerStore;
}

export function __resetSpareCustomerForTests(): void {
  const s = store();
  s.orders.clear();
  s.returns.clear();
  s.vehicles.clear();
  s.consentAudit.length = 0;
}

function cloneOrder(o: SpareOrder): SpareOrder {
  return {
    ...o,
    lines: o.lines.map((l) => ({ ...l })),
  };
}

/** Place ERP spare order from USD cart snapshot after EcoCash|COD (PD18). */
export function placeSpareOrder(input: {
  cart: SpareCartSnapshot;
  customerId?: string | null;
  payChoice: "ecocash" | "cod";
}): SpareOrder {
  const cart = input.cart;
  if (cart.currency !== "USD") {
    throw new Error("Spare cart currency must be USD (D-57)");
  }
  if (cart.lines.length === 0) throw new Error("Spare cart empty");
  for (const line of cart.lines) {
    if (!line.soldBy) {
      throw new Error("Sold by supplier required on cart lines (D-58)");
    }
  }
  const soldBySummary = [...new Set(cart.lines.map((l) => l.soldBy))].join(", ");
  const order: SpareOrder = {
    orderId: `sord_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    cartId: cart.id,
    customerId: input.customerId ?? null,
    status: "confirmed",
    currency: "USD",
    totalUsdMinor: cart.totalUsdMinor,
    payChoice: input.payChoice,
    soldBySummary,
    lines: cart.lines.map((l) => ({ ...l })),
    createdAt: new Date().toISOString(),
    cancellableUntil: new Date(Date.now() + 7 * 24 * 3600_000).toISOString(),
  };
  store().orders.set(order.orderId, order);
  return cloneOrder(order);
}

export function getSpareOrder(orderId: string): SpareOrder | undefined {
  const o = store().orders.get(orderId);
  return o ? cloneOrder(o) : undefined;
}

export function listSpareOrders(customerId?: string | null): SpareOrder[] {
  const all = [...store().orders.values()].map(cloneOrder);
  if (!customerId) return all;
  return all.filter((o) => o.customerId === customerId);
}

export function advanceSpareOrderStatus(orderId: string): SpareOrder {
  const o = store().orders.get(orderId);
  if (!o) throw new Error(`Unknown spare order ${orderId}`);
  const seq: SpareOrderStatus[] = [
    "confirmed",
    "awaiting_supplier",
    "out_for_delivery",
    "delivered",
  ];
  const i = seq.indexOf(o.status);
  if (i >= 0 && i < seq.length - 1) o.status = seq[i + 1]!;
  return cloneOrder(o);
}

export function trackSpareOrder(orderId: string): {
  order: SpareOrder;
  statusFrom: "erp";
  zigOnTrack: false;
} {
  const order = getSpareOrder(orderId);
  if (!order) throw new Error(`Unknown spare order ${orderId}`);
  return { order, statusFrom: "erp", zigOnTrack: false };
}

/** Open return claim — ERP stub; no AI payable (S113 / Pack §9.2). */
export function openSpareReturnClaim(input: {
  orderId: string;
  path?: SpareReturnPath;
}): SpareReturnClaim {
  const order = store().orders.get(input.orderId);
  if (!order) throw new Error(`Unknown spare order ${input.orderId}`);
  const claim: SpareReturnClaim = {
    claimId: `sret_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    orderId: order.orderId,
    path: input.path ?? "refund_or_replace",
    status: "opened",
    resolution: null,
    payableFromAi: false,
    createdAt: new Date().toISOString(),
  };
  store().returns.set(claim.claimId, claim);
  return { ...claim };
}

export function resolveSpareReturnClaim(input: {
  claimId: string;
  path: "refund" | "replace";
}): SpareReturnClaim {
  const claim = store().returns.get(input.claimId);
  if (!claim) throw new Error(`Unknown return claim ${input.claimId}`);
  if (claim.status === "resolved") {
    throw new Error(`Return claim already resolved`);
  }
  claim.status = "resolved";
  claim.resolution = input.path;
  return { ...claim };
}

export function getSpareReturnClaim(
  claimId: string,
): SpareReturnClaim | undefined {
  const c = store().returns.get(claimId);
  return c ? { ...c } : undefined;
}

/** Admin ops queue — all spare return claims (Pack §9.5 / PD48). */
export function listSpareReturnClaims(filter?: {
  status?: SpareReturnClaim["status"];
}): SpareReturnClaim[] {
  return [...store().returns.values()]
    .filter((c) => (filter?.status ? c.status === filter.status : true))
    .map((c) => ({ ...c }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/**
 * PD48 thin vertical: open return → admin list → resolve refund|replace;
 * payableFromAi always false (no AI money).
 */
export function runPd48AdminReturnsThinVertical(): {
  claimId: string;
  listed: true;
  resolvedPath: "refund";
  payableFromAi: false;
  openCountAfterResolve: number;
} {
  __resetSpareCustomerForTests();
  const thin = seedSpareOrderForReturns();
  const claim = openSpareReturnClaim({
    orderId: thin.orderId,
    path: "refund_or_replace",
  });
  const listed = listSpareReturnClaims({ status: "opened" });
  if (!listed.some((c) => c.claimId === claim.claimId)) {
    throw new Error("PD48 expected opened claim in admin list");
  }
  const resolved = resolveSpareReturnClaim({
    claimId: claim.claimId,
    path: "refund",
  });
  if (resolved.payableFromAi !== false) {
    throw new Error("PD48 returns must keep payableFromAi=false");
  }
  if (resolved.resolution !== "refund") {
    throw new Error("PD48 expected refund resolution");
  }
  const stillOpen = listSpareReturnClaims({ status: "opened" });
  return {
    claimId: claim.claimId,
    listed: true,
    resolvedPath: "refund",
    payableFromAi: false,
    openCountAfterResolve: stillOpen.length,
  };
}

function seedSpareOrderForReturns(): { orderId: string } {
  const orderId = `sord_pd48_${Date.now().toString(36)}`;
  const now = new Date().toISOString();
  const order: SpareOrder = {
    orderId,
    cartId: "cart_pd48",
    customerId: "cust_pd48",
    status: "confirmed",
    currency: "USD",
    totalUsdMinor: 1250n,
    payChoice: "cod",
    soldBySummary: "Bosch Agency",
    lines: [
      {
        offerId: "off_pd48",
        title: "PD48 filter",
        qty: 1,
        unitPriceUsdMinor: 1250n,
        lineTotalUsdMinor: 1250n,
        soldBy: "Bosch Agency",
        supplierFormality: "formal",
      },
    ],
    createdAt: now,
    cancellableUntil: now,
  };
  store().orders.set(orderId, order);
  return { orderId };
}

export function addGarageVehicle(input: {
  customerId: string;
  label: string;
  chassisHint: string;
  reminderConsent: boolean;
}): GarageVehicle {
  if (!input.customerId.trim()) throw new Error("customerId required");
  if (!input.label.trim()) throw new Error("label required");
  const vehicle: GarageVehicle = {
    vehicleId: `veh_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    customerId: input.customerId,
    label: input.label.trim(),
    chassisHint: input.chassisHint.trim() || "unknown",
    reminderConsent: input.reminderConsent === true,
    createdAt: new Date().toISOString(),
  };
  store().vehicles.set(vehicle.vehicleId, vehicle);
  if (vehicle.reminderConsent) {
    appendGarageConsentEvent({
      vehicleId: vehicle.vehicleId,
      customerId: vehicle.customerId,
      action: "grant",
    });
  }
  return { ...vehicle };
}

export function listGarageVehicles(customerId: string): GarageVehicle[] {
  return [...store().vehicles.values()]
    .filter((v) => v.customerId === customerId)
    .map((v) => ({ ...v }));
}

function appendGarageConsentEvent(input: {
  vehicleId: string;
  customerId: string;
  action: "grant" | "revoke";
}): GarageConsentEvent {
  const ev: GarageConsentEvent = {
    eventId: `gce_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    vehicleId: input.vehicleId,
    customerId: input.customerId,
    action: input.action,
    at: new Date().toISOString(),
  };
  store().consentAudit.push(ev);
  return { ...ev };
}

/** PD50 — grant/revoke reminder consent with audit trail. */
export function setGarageReminderConsent(input: {
  vehicleId: string;
  reminderConsent: boolean;
}): GarageVehicle {
  const v = store().vehicles.get(input.vehicleId);
  if (!v) throw new Error(`Unknown garage vehicle ${input.vehicleId}`);
  const next = input.reminderConsent === true;
  if (v.reminderConsent !== next) {
    appendGarageConsentEvent({
      vehicleId: v.vehicleId,
      customerId: v.customerId,
      action: next ? "grant" : "revoke",
    });
    v.reminderConsent = next;
  }
  return { ...v };
}

export function listGarageConsentAudit(customerId?: string): GarageConsentEvent[] {
  return store()
    .consentAudit.filter((e) =>
      customerId ? e.customerId === customerId : true,
    )
    .map((e) => ({ ...e }));
}

/** Chassis-aware Spare browse deep-link from Vehicle Hub. */
export function browsePathForGarageVehicle(vehicleId: string): string {
  const v = store().vehicles.get(vehicleId);
  if (!v) throw new Error(`Unknown garage vehicle ${vehicleId}`);
  const chassis = encodeURIComponent(v.chassisHint);
  return `/spare?chassis=${chassis}`;
}

/**
 * PD50 thin vertical: add vehicle → browse-by-chassis → revoke consent → audit.
 */
export function runPd50VehicleHubThinVertical(): {
  vehicleId: string;
  browsePath: string;
  consentRevoked: true;
  auditHasRevoke: true;
  payableFromAi: false;
} {
  __resetSpareCustomerForTests();
  const vehicle = addGarageVehicle({
    customerId: "cust_pd50",
    label: "PD50 Hilux",
    chassisHint: "KUN26",
    reminderConsent: true,
  });
  const browsePath = browsePathForGarageVehicle(vehicle.vehicleId);
  if (!browsePath.includes("chassis=KUN26")) {
    throw new Error("PD50 browse path must include chassis");
  }
  const revoked = setGarageReminderConsent({
    vehicleId: vehicle.vehicleId,
    reminderConsent: false,
  });
  if (revoked.reminderConsent !== false) {
    throw new Error("PD50 expected consent revoked");
  }
  const audit = listGarageConsentAudit("cust_pd50");
  if (!audit.some((e) => e.action === "revoke")) {
    throw new Error("PD50 expected revoke in consent audit");
  }
  if (!audit.some((e) => e.action === "grant")) {
    throw new Error("PD50 expected grant in consent audit");
  }
  return {
    vehicleId: vehicle.vehicleId,
    browsePath,
    consentRevoked: true,
    auditHasRevoke: true,
    payableFromAi: false,
  };
}

/**
 * PD18 thin vertical: USD cart → order (Sold by) → track → return open → garage.
 */
export async function runPd18SpareWebThinVertical(input?: {
  offerId?: string;
  payChoice?: "ecocash" | "cod";
  customerId?: string;
}): Promise<{
  cartId: string;
  orderId: string;
  claimId: string;
  vehicleId: string;
  currency: "USD";
  zigOnlyAtCheckout: true;
  soldBy: string;
  statusFrom: "erp";
  returnPayableFromAi: false;
  reminderConsentRequired: true;
}> {
  const catalogue = await import("./index.js");
  catalogue.__resetCatalogueForTests();
  __resetSpareCustomerForTests();

  const offerId = input?.offerId ?? "off_filter_oil_kun26";
  const customerId = input?.customerId ?? "cust_pd18";
  const payChoice = input?.payChoice ?? "ecocash";
  const offer = catalogue.getOffer(offerId);
  if (!offer) throw new Error(`PD18 unknown offer ${offerId}`);

  const cart = catalogue.createCart();
  catalogue.addToCart(cart.id, offerId, 1);
  const loaded = catalogue.getCart(cart.id);
  if (!loaded || loaded.currency !== "USD") {
    throw new Error("PD18 cart must be USD");
  }
  const line = loaded.lines[0];
  if (!line?.soldBy) throw new Error("PD18 Sold by required");

  const order = placeSpareOrder({
    cart: {
      id: loaded.id,
      currency: "USD",
      totalUsdMinor: loaded.total.amountMinor,
      lines: loaded.lines.map((l) => ({
        offerId: l.offerId,
        title: l.title,
        qty: l.qty,
        unitPriceUsdMinor: l.unitPrice.amountMinor,
        lineTotalUsdMinor: l.lineTotal.amountMinor,
        soldBy: l.soldBy,
        supplierFormality: l.supplierFormality,
      })),
    },
    customerId,
    payChoice,
  });
  advanceSpareOrderStatus(order.orderId);
  const track = trackSpareOrder(order.orderId);
  if (track.zigOnTrack !== false) throw new Error("track must not show ZiG");

  const claim = openSpareReturnClaim({ orderId: order.orderId });
  if (claim.payableFromAi !== false) {
    throw new Error("return claim must forbid AI payable");
  }

  const vehicle = addGarageVehicle({
    customerId,
    label: "Hilux garage",
    chassisHint: "KUN26",
    reminderConsent: true,
  });
  if (!vehicle.reminderConsent) {
    throw new Error("garage reminders need consent");
  }

  return {
    cartId: cart.id,
    orderId: order.orderId,
    claimId: claim.claimId,
    vehicleId: vehicle.vehicleId,
    currency: "USD",
    zigOnlyAtCheckout: true,
    soldBy: order.soldBySummary,
    statusFrom: "erp",
    returnPayableFromAi: false,
    reminderConsentRequired: true,
  };
}

/**
 * PD20 customer-mobile deepen — same ERP SoR as PD18 web (orders/track/returns/garage).
 * Native Android+iOS clients hit `/api/spare/{orders,returns,garage}` + grocery search.
 */
export async function runPd20CustomerMobileThinVertical(input?: {
  offerId?: string;
  payChoice?: "ecocash" | "cod";
  customerId?: string;
}): Promise<{
  cartId: string;
  orderId: string;
  claimId: string;
  vehicleId: string;
  currency: "USD";
  zigOnlyAtCheckout: true;
  zigOnTrack: false;
  soldBy: string;
  returnPayableFromAi: false;
  channels: ["android", "ios"];
  noExpo: true;
}> {
  const out = await runPd18SpareWebThinVertical({
    offerId: input?.offerId ?? "off_filter_oil_kun26",
    payChoice: input?.payChoice ?? "cod",
    customerId: input?.customerId ?? "cust_pd20_mobile",
  });
  const customerId = input?.customerId ?? "cust_pd20_mobile";
  const mine = listSpareOrders(customerId);
  if (!mine.some((o) => o.orderId === out.orderId)) {
    throw new Error("PD20 order must appear in customer list");
  }
  const track = trackSpareOrder(out.orderId);
  if (track.zigOnTrack !== false) throw new Error("PD20 track must not show ZiG");
  return {
    cartId: out.cartId,
    orderId: out.orderId,
    claimId: out.claimId,
    vehicleId: out.vehicleId,
    currency: "USD",
    zigOnlyAtCheckout: true,
    zigOnTrack: false,
    soldBy: out.soldBy,
    returnPayableFromAi: false,
    channels: ["android", "ios"],
    noExpo: true,
  };
}
