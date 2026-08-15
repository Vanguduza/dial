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

/** PD115 — ERP status timeline events (Pack §9.2 track). */
export type SpareOrderTimelineEvent = {
  at: string;
  event: string;
  status: SpareOrderStatus;
};

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
  /** PD115 — status timeline (ERP SoR). */
  timeline: SpareOrderTimelineEvent[];
};

export type SpareReturnPath = "refund_or_replace" | "refund" | "replace";

export type SpareReturnClaim = {
  claimId: string;
  orderId: string;
  path: SpareReturnPath;
  status: "opened" | "resolved";
  resolution: SpareReturnPath | null;
  /** PD110 — evidence refs (photo/note); never payable. */
  evidence: Array<{ kind: "photo" | "note"; payloadRef: string; at: string }>;
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
  /** Pack §10 Vehicles — at most one active per customer. */
  isActive: boolean;
  createdAt: string;
};

/** PD108 — Pack vehicles.expiry_reminders (consent required). */
export type VehicleReminder = {
  reminderId: string;
  vehicleId: string;
  customerId: string;
  kind: "service_due" | "licence_expiry" | "insurance_expiry" | "other";
  dueAt: string;
  createdAt: string;
  status: "scheduled" | "due" | "cancelled";
  payableFromAi: false;
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
  /** PD108 — Pack vehicles.expiry_reminders (consent-gated). */
  reminders: Map<string, VehicleReminder>;
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
      reminders: new Map(),
    };
  }
  if (!g.__dialSpareCustomerStore.consentAudit) {
    g.__dialSpareCustomerStore.consentAudit = [];
  }
  if (!g.__dialSpareCustomerStore.reminders) {
    g.__dialSpareCustomerStore.reminders = new Map();
  }
  return g.__dialSpareCustomerStore;
}

export function __resetSpareCustomerForTests(): void {
  const s = store();
  s.orders.clear();
  s.returns.clear();
  s.vehicles.clear();
  s.consentAudit.length = 0;
  s.reminders.clear();
}

function cloneOrder(o: SpareOrder): SpareOrder {
  return {
    ...o,
    lines: o.lines.map((l) => ({ ...l })),
    timeline: (o.timeline ?? []).map((t) => ({ ...t })),
  };
}

function pushTimeline(
  o: SpareOrder,
  event: string,
  status: SpareOrderStatus,
): void {
  if (!o.timeline) o.timeline = [];
  o.timeline.push({
    at: new Date().toISOString(),
    event,
    status,
  });
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
  const createdAt = new Date().toISOString();
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
    createdAt,
    cancellableUntil: new Date(Date.now() + 7 * 24 * 3600_000).toISOString(),
    timeline: [
      { at: createdAt, event: "order_placed", status: "confirmed" },
    ],
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
  if (!o.timeline) o.timeline = [];
  const seq: SpareOrderStatus[] = [
    "confirmed",
    "awaiting_supplier",
    "out_for_delivery",
    "delivered",
  ];
  const i = seq.indexOf(o.status);
  if (i >= 0 && i < seq.length - 1) {
    o.status = seq[i + 1]!;
    pushTimeline(o, `status_${o.status}`, o.status);
  }
  return cloneOrder(o);
}

/**
 * PD92 — Pack §9.2 / §10: cancel within 7-day `cancellableUntil` window.
 */
export function cancelSpareOrder(input: {
  orderId: string;
  customerId?: string | null;
  now?: number;
}): SpareOrder {
  const o = store().orders.get(input.orderId);
  if (!o) throw new Error(`Unknown spare order ${input.orderId}`);
  if (
    input.customerId != null &&
    o.customerId != null &&
    o.customerId !== input.customerId
  ) {
    throw new Error("order not owned by customer");
  }
  if (o.status === "cancelled") return cloneOrder(o);
  if (o.status === "delivered" || o.status === "out_for_delivery") {
    throw new Error(`cannot cancel order in status ${o.status}`);
  }
  const now = input.now ?? Date.now();
  if (now > Date.parse(o.cancellableUntil)) {
    throw new Error("cancellation window closed");
  }
  o.status = "cancelled";
  pushTimeline(o, "order_cancelled", "cancelled");
  return cloneOrder(o);
}

/**
 * PD92 thin vertical: place → cancel in window; deny after window.
 */
export function runPd92SevenDayCancelThinVertical(): {
  cancelledInWindow: true;
  deniedAfterWindow: true;
  payableFromAi: false;
} {
  __resetSpareCustomerForTests();
  const order = placeSpareOrder({
    cart: {
      id: "cart_pd92",
      currency: "USD",
      totalUsdMinor: 12_00n,
      lines: [
        {
          offerId: "off_pd92",
          title: "PD92 filter",
          qty: 1,
          unitPriceUsdMinor: 12_00n,
          lineTotalUsdMinor: 12_00n,
          soldBy: "Toyota Agency",
          supplierFormality: "formal",
        },
      ],
    },
    customerId: "cust_pd92",
    payChoice: "ecocash",
  });
  const cancelled = cancelSpareOrder({
    orderId: order.orderId,
    customerId: "cust_pd92",
  });
  if (cancelled.status !== "cancelled") {
    throw new Error("PD92 expected cancelled in window");
  }
  const late = placeSpareOrder({
    cart: {
      id: "cart_pd92_late",
      currency: "USD",
      totalUsdMinor: 12_00n,
      lines: [
        {
          offerId: "off_pd92b",
          title: "PD92 late",
          qty: 1,
          unitPriceUsdMinor: 12_00n,
          lineTotalUsdMinor: 12_00n,
          soldBy: "Toyota Agency",
          supplierFormality: "formal",
        },
      ],
    },
    customerId: "cust_pd92",
    payChoice: "cod",
  });
  const stored = store().orders.get(late.orderId)!;
  stored.cancellableUntil = new Date(Date.now() - 60_000).toISOString();
  let denied = false;
  try {
    cancelSpareOrder({ orderId: late.orderId, customerId: "cust_pd92" });
  } catch (e) {
    denied = e instanceof Error && e.message.includes("window closed");
  }
  if (!denied) throw new Error("PD92 expected deny after window");
  return {
    cancelledInWindow: true,
    deniedAfterWindow: true,
    payableFromAi: false,
  };
}

export function trackSpareOrder(orderId: string): {
  order: SpareOrder;
  statusFrom: "erp";
  zigOnTrack: false;
  timeline: SpareOrderTimelineEvent[];
  statusLabel: string;
} {
  const order = getSpareOrder(orderId);
  if (!order) throw new Error(`Unknown spare order ${orderId}`);
  const timeline = order.timeline ?? [];
  const statusLabel =
    order.status === "confirmed"
      ? "Confirmed"
      : order.status === "awaiting_supplier"
        ? "Awaiting supplier"
        : order.status === "out_for_delivery"
          ? "Out for delivery"
          : order.status === "delivered"
            ? "Delivered"
            : "Cancelled";
  return {
    order,
    statusFrom: "erp",
    zigOnTrack: false,
    timeline,
    statusLabel,
  };
}

/**
 * PD115 thin vertical: place → advance → timeline ≥2; ERP SoR; no ZiG on track.
 */
export function runPd115SpareOrderTrackTimelineThinVertical(): {
  timelineLen: number;
  statusLabel: string;
  statusFrom: "erp";
  zigOnTrack: false;
  payableFromAi: false;
  orderId: string;
} {
  __resetSpareCustomerForTests();
  const order = placeSpareOrder({
    cart: {
      id: "cart_pd115",
      currency: "USD",
      totalUsdMinor: 18_00n,
      lines: [
        {
          offerId: "off_filter_oil_kun26",
          title: "Oil filter",
          qty: 1,
          unitPriceUsdMinor: 18_00n,
          lineTotalUsdMinor: 18_00n,
          soldBy: "Agency Autoparts",
          supplierFormality: "formal",
        },
      ],
    },
    customerId: "cust_pd115",
    payChoice: "cod",
  });
  advanceSpareOrderStatus(order.orderId);
  advanceSpareOrderStatus(order.orderId);
  const track = trackSpareOrder(order.orderId);
  if (track.timeline.length < 3) {
    throw new Error("PD115 expected timeline with place + advances");
  }
  if (track.statusFrom !== "erp" || track.zigOnTrack !== false) {
    throw new Error("PD115 ERP SoR / no ZiG on track");
  }
  if (track.order.status !== "out_for_delivery") {
    throw new Error("PD115 expected out_for_delivery after two advances");
  }
  return {
    timelineLen: track.timeline.length,
    statusLabel: track.statusLabel,
    statusFrom: "erp",
    zigOnTrack: false,
    payableFromAi: false,
    orderId: order.orderId,
  };
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
    evidence: [],
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
  return {
    ...claim,
    evidence: (claim.evidence ?? []).map((e) => ({ ...e })),
  };
}

export function getSpareReturnClaim(
  claimId: string,
): SpareReturnClaim | undefined {
  const c = store().returns.get(claimId);
  return c
    ? { ...c, evidence: (c.evidence ?? []).map((e) => ({ ...e })) }
    : undefined;
}

/**
 * PD110 — attach photo/note evidence to open return claim (Pack §9.2); not money.
 */
export function attachSpareReturnEvidence(input: {
  claimId: string;
  kind: "photo" | "note";
  payloadRef: string;
}): SpareReturnClaim {
  const claim = store().returns.get(input.claimId);
  if (!claim) throw new Error(`Unknown return claim ${input.claimId}`);
  if (claim.status === "resolved") {
    throw new Error("Cannot attach evidence to resolved claim");
  }
  const ref = input.payloadRef.trim();
  if (!ref) throw new Error("payloadRef required");
  if (input.kind !== "photo" && input.kind !== "note") {
    throw new Error("kind must be photo|note");
  }
  if (!claim.evidence) claim.evidence = [];
  claim.evidence.push({
    kind: input.kind,
    payloadRef: ref.slice(0, 2048),
    at: new Date().toISOString(),
  });
  return {
    ...claim,
    evidence: claim.evidence.map((e) => ({ ...e })),
  };
}

/**
 * PD110 thin vertical: open return → attach evidence → still not payable.
 */
export function runPd110ReturnClaimEvidenceThinVertical(): {
  evidenceCount: number;
  payableFromAi: false;
  claimId: string;
} {
  __resetSpareCustomerForTests();
  const thin = seedSpareOrderForReturns();
  const claim = openSpareReturnClaim({ orderId: thin.orderId });
  attachSpareReturnEvidence({
    claimId: claim.claimId,
    kind: "photo",
    payloadRef: "fixture://pd110-return.jpg",
  });
  const note = attachSpareReturnEvidence({
    claimId: claim.claimId,
    kind: "note",
    payloadRef: "wrong part delivered",
  });
  if (note.evidence.length < 2) throw new Error("PD110 expected evidence");
  if (note.payableFromAi !== false) {
    throw new Error("PD110 must keep payableFromAi false");
  }
  return {
    evidenceCount: note.evidence.length,
    payableFromAi: false,
    claimId: note.claimId,
  };
}

/** Admin ops queue — all spare return claims (Pack §9.5 / PD48). */
export function listSpareReturnClaims(filter?: {
  status?: SpareReturnClaim["status"];
}): SpareReturnClaim[] {
  return [...store().returns.values()]
    .filter((c) => (filter?.status ? c.status === filter.status : true))
    .map((c) => ({
      ...c,
      evidence: (c.evidence ?? []).map((e) => ({ ...e })),
    }))
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
    timeline: [{ at: now, event: "order_placed", status: "confirmed" }],
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
  const existing = listGarageVehicles(input.customerId);
  const vehicle: GarageVehicle = {
    vehicleId: `veh_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    customerId: input.customerId,
    label: input.label.trim(),
    chassisHint: input.chassisHint.trim() || "unknown",
    reminderConsent: input.reminderConsent === true,
    isActive: existing.length === 0,
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

export function getActiveGarageVehicle(
  customerId: string,
): GarageVehicle | undefined {
  return listGarageVehicles(customerId).find((v) => v.isActive);
}

/** PD75 — Pack §10 set active vehicle (one active per customer). */
export function setActiveGarageVehicle(vehicleId: string): GarageVehicle {
  const v = store().vehicles.get(vehicleId);
  if (!v) throw new Error(`Unknown garage vehicle ${vehicleId}`);
  for (const other of store().vehicles.values()) {
    if (other.customerId === v.customerId) {
      other.isActive = other.vehicleId === vehicleId;
    }
  }
  return { ...v, isActive: true };
}

/** PD79 — Pack §10 Vehicles update (label / chassis). */
export function updateGarageVehicle(input: {
  vehicleId: string;
  label?: string;
  chassisHint?: string;
}): GarageVehicle {
  const v = store().vehicles.get(input.vehicleId);
  if (!v) throw new Error(`Unknown garage vehicle ${input.vehicleId}`);
  if (input.label !== undefined) {
    const label = input.label.trim();
    if (!label) throw new Error("label required");
    v.label = label;
  }
  if (input.chassisHint !== undefined) {
    v.chassisHint = input.chassisHint.trim() || "unknown";
  }
  return { ...v };
}

/**
 * PD79 — Pack §10 Vehicles delete. If active deleted, promote another (if any).
 */
export function deleteGarageVehicle(vehicleId: string): {
  deleted: true;
  vehicleId: string;
  promotedActiveId: string | null;
} {
  const v = store().vehicles.get(vehicleId);
  if (!v) throw new Error(`Unknown garage vehicle ${vehicleId}`);
  const customerId = v.customerId;
  const wasActive = v.isActive;
  store().vehicles.delete(vehicleId);
  let promotedActiveId: string | null = null;
  if (wasActive) {
    const remaining = listGarageVehicles(customerId);
    if (remaining.length > 0) {
      const next = remaining[0]!;
      setActiveGarageVehicle(next.vehicleId);
      promotedActiveId = next.vehicleId;
    }
  }
  return { deleted: true, vehicleId, promotedActiveId };
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

/**
 * PD108 — schedule Vehicle Hub reminder; Pack: reminders need consent.
 */
export function scheduleVehicleReminder(input: {
  vehicleId: string;
  kind?: VehicleReminder["kind"];
  dueAt: string;
}): VehicleReminder {
  const v = store().vehicles.get(input.vehicleId);
  if (!v) throw new Error(`Unknown garage vehicle ${input.vehicleId}`);
  if (!v.reminderConsent) {
    throw new Error("reminderConsent required to schedule Vehicle Hub reminder");
  }
  if (!Date.parse(input.dueAt)) throw new Error("dueAt must be ISO date");
  const row: VehicleReminder = {
    reminderId: `vrem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    vehicleId: v.vehicleId,
    customerId: v.customerId,
    kind: input.kind ?? "service_due",
    dueAt: input.dueAt,
    createdAt: new Date().toISOString(),
    status: "scheduled",
    payableFromAi: false,
  };
  store().reminders.set(row.reminderId, row);
  return { ...row };
}

/** List reminders for customer; marks past-due as due. */
export function listVehicleReminders(
  customerId: string,
  now = Date.now(),
): VehicleReminder[] {
  const out: VehicleReminder[] = [];
  for (const r of store().reminders.values()) {
    if (r.customerId !== customerId) continue;
    if (r.status === "scheduled" && Date.parse(r.dueAt) <= now) {
      r.status = "due";
    }
    out.push({ ...r });
  }
  return out.sort((a, b) => (a.dueAt < b.dueAt ? -1 : 1));
}

export function listDueVehicleReminders(
  customerId: string,
  now = Date.now(),
): VehicleReminder[] {
  return listVehicleReminders(customerId, now).filter((r) => r.status === "due");
}

/** PD124 — Tracktor fleet expiry / maintenance board (D-46); not courier GPS SoR. */
export type FleetExpirySeverity = "ok" | "approaching" | "overdue";

export type FleetExpiryBoardRow = {
  vehicleId: string;
  customerId: string;
  label: string;
  chassisHint: string;
  reminderId: string;
  kind: VehicleReminder["kind"];
  dueAt: string;
  severity: FleetExpirySeverity;
  tracktorPattern: true;
  payableFromAi: false;
};

export type FleetExpiryBoard = {
  asOf: string;
  rows: FleetExpiryBoardRow[];
  tracktorPattern: true;
  courierDispatchSor: false;
  moneyAuthority: false;
};

/**
 * Admin Care/Fleet compliance board from consent-gated reminders (Tracktor UX).
 */
export function getFleetExpiryBoard(input?: {
  now?: number;
  approachingWindowMs?: number;
}): FleetExpiryBoard {
  const now = input?.now ?? Date.now();
  const windowMs = input?.approachingWindowMs ?? 7 * 86_400_000;
  const s = store();
  const rows: FleetExpiryBoardRow[] = [];
  for (const rem of s.reminders.values()) {
    if (rem.status === "cancelled") continue;
    const vehicle = s.vehicles.get(rem.vehicleId);
    if (!vehicle || !vehicle.reminderConsent) continue;
    const dueMs = Date.parse(rem.dueAt);
    let severity: FleetExpirySeverity = "ok";
    if (dueMs <= now) severity = "overdue";
    else if (dueMs - now <= windowMs) severity = "approaching";
    rows.push({
      vehicleId: vehicle.vehicleId,
      customerId: vehicle.customerId,
      label: vehicle.label,
      chassisHint: vehicle.chassisHint,
      reminderId: rem.reminderId,
      kind: rem.kind,
      dueAt: rem.dueAt,
      severity,
      tracktorPattern: true,
      payableFromAi: false,
    });
  }
  rows.sort((a, b) => {
    const rank = { overdue: 0, approaching: 1, ok: 2 } as const;
    const d = rank[a.severity] - rank[b.severity];
    if (d !== 0) return d;
    return a.dueAt.localeCompare(b.dueAt);
  });
  return {
    asOf: new Date(now).toISOString(),
    rows,
    tracktorPattern: true,
    courierDispatchSor: false,
    moneyAuthority: false,
  };
}

/**
 * PD124 thin vertical: consent + reminders → Tracktor board with overdue + approaching.
 */
export function runPd124TracktorFleetExpiryThinVertical(): {
  overdue: number;
  approaching: number;
  tracktorPattern: true;
  courierDispatchSor: false;
  moneyAuthority: false;
  payableFromAi: false;
} {
  __resetSpareCustomerForTests();
  const now = Date.parse("2026-08-16T12:00:00.000Z");
  const vehicle = addGarageVehicle({
    customerId: "cust_pd124",
    label: "PD124 Fleet Prado",
    chassisHint: "GRJ150",
    reminderConsent: true,
  });
  scheduleVehicleReminder({
    vehicleId: vehicle.vehicleId,
    kind: "insurance_expiry",
    dueAt: new Date(now - 86_400_000).toISOString(),
  });
  scheduleVehicleReminder({
    vehicleId: vehicle.vehicleId,
    kind: "service_due",
    dueAt: new Date(now + 2 * 86_400_000).toISOString(),
  });
  const board = getFleetExpiryBoard({ now, approachingWindowMs: 7 * 86_400_000 });
  if (board.courierDispatchSor !== false || board.moneyAuthority !== false) {
    throw new Error("PD124 must not claim dispatch/money SoR");
  }
  const overdue = board.rows.filter((r) => r.severity === "overdue").length;
  const approaching = board.rows.filter((r) => r.severity === "approaching").length;
  if (overdue < 1 || approaching < 1) {
    throw new Error("PD124 expected overdue + approaching rows");
  }
  return {
    overdue,
    approaching,
    tracktorPattern: true,
    courierDispatchSor: false,
    moneyAuthority: false,
    payableFromAi: false,
  };
}

/**
 * PD108 thin vertical: deny without consent → grant → schedule → due list.
 */
export function runPd108VehicleRemindersThinVertical(): {
  deniedWithoutConsent: true;
  scheduled: true;
  dueCount: number;
  payableFromAi: false;
} {
  __resetSpareCustomerForTests();
  const vehicle = addGarageVehicle({
    customerId: "cust_pd108",
    label: "PD108 Prado",
    chassisHint: "GRJ150",
    reminderConsent: false,
  });
  let deniedWithoutConsent = false;
  try {
    scheduleVehicleReminder({
      vehicleId: vehicle.vehicleId,
      dueAt: new Date(Date.now() + 86_400_000).toISOString(),
    });
  } catch (e) {
    deniedWithoutConsent =
      e instanceof Error && e.message.includes("reminderConsent");
  }
  if (!deniedWithoutConsent) {
    throw new Error("PD108 expected schedule deny without consent");
  }
  setGarageReminderConsent({
    vehicleId: vehicle.vehicleId,
    reminderConsent: true,
  });
  const scheduled = scheduleVehicleReminder({
    vehicleId: vehicle.vehicleId,
    kind: "licence_expiry",
    dueAt: new Date(Date.now() - 60_000).toISOString(),
  });
  if (scheduled.payableFromAi !== false) {
    throw new Error("PD108 reminders must keep payableFromAi false");
  }
  const due = listDueVehicleReminders("cust_pd108");
  if (due.length < 1) throw new Error("PD108 expected due reminder");
  return {
    deniedWithoutConsent: true,
    scheduled: true,
    dueCount: due.length,
    payableFromAi: false,
  };
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
 * PD75 thin vertical: add two vehicles → set second active → only one active (Pack §10).
 */
export function runPd75SetActiveGarageVehicleThinVertical(): {
  activeVehicleId: string;
  activeCount: 1;
  switched: true;
  payableFromAi: false;
} {
  __resetSpareCustomerForTests();
  const first = addGarageVehicle({
    customerId: "cust_pd75",
    label: "PD75 Hilux",
    chassisHint: "KUN26",
    reminderConsent: false,
  });
  if (!first.isActive) throw new Error("PD75 first vehicle must be active");
  const second = addGarageVehicle({
    customerId: "cust_pd75",
    label: "PD75 Prado",
    chassisHint: "KDJ150",
    reminderConsent: false,
  });
  if (second.isActive) throw new Error("PD75 second vehicle must start inactive");
  const active = setActiveGarageVehicle(second.vehicleId);
  if (!active.isActive || active.vehicleId !== second.vehicleId) {
    throw new Error("PD75 setActive must activate second");
  }
  const list = listGarageVehicles("cust_pd75");
  const activeCount = list.filter((v) => v.isActive).length;
  if (activeCount !== 1) throw new Error("PD75 expected exactly one active");
  const got = getActiveGarageVehicle("cust_pd75");
  if (!got || got.vehicleId !== second.vehicleId) {
    throw new Error("PD75 getActive mismatch");
  }
  return {
    activeVehicleId: second.vehicleId,
    activeCount: 1,
    switched: true,
    payableFromAi: false,
  };
}

/**
 * PD79 thin vertical: update label/chassis → delete active → promote remaining (Pack §10 CRUD).
 */
export function runPd79GarageCrudThinVertical(): {
  updatedLabel: string;
  deleted: true;
  promotedActive: true;
  remainingCount: 1;
  payableFromAi: false;
} {
  __resetSpareCustomerForTests();
  const a = addGarageVehicle({
    customerId: "cust_pd79",
    label: "Old Hilux",
    chassisHint: "KUN25",
    reminderConsent: false,
  });
  const b = addGarageVehicle({
    customerId: "cust_pd79",
    label: "Spare Prado",
    chassisHint: "KDJ150",
    reminderConsent: false,
  });
  const updated = updateGarageVehicle({
    vehicleId: a.vehicleId,
    label: "Updated Hilux",
    chassisHint: "KUN26",
  });
  if (updated.label !== "Updated Hilux" || updated.chassisHint !== "KUN26") {
    throw new Error("PD79 update failed");
  }
  if (!a.isActive) throw new Error("PD79 first vehicle should be active");
  const del = deleteGarageVehicle(a.vehicleId);
  if (!del.deleted || del.promotedActiveId !== b.vehicleId) {
    throw new Error("PD79 delete must promote remaining active");
  }
  const list = listGarageVehicles("cust_pd79");
  if (list.length !== 1 || !list[0]!.isActive) {
    throw new Error("PD79 expected one active remaining");
  }
  return {
    updatedLabel: updated.label,
    deleted: true,
    promotedActive: true,
    remainingCount: 1,
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
