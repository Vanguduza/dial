/**
 * Supplier domain (PD6 / Pack §9.4) — Mercur vendor-panel = UI patterns only.
 * SoR for supplier onboarding, costs, heartbeat, confirm-SLA, statements.
 * Agency MARKETPLACE only (D-58). Costs = amountMinor USD (D-57 browse currency).
 * Never trust body userId/role — caller passes session supplierId (D-47).
 */
import { type Money, money } from "@dial/shared";

export type SupplierTier = "bronze" | "silver" | "gold" | "platinum";
export type SupplierFormality = "formal" | "informal";

export type SupplierProfile = {
  supplierId: string;
  displayName: string;
  formality: SupplierFormality;
  tier: SupplierTier;
  offerSource: "MARKETPLACE";
  onboardedAt: string;
};

export type CostUploadRow = {
  sku: string;
  title: string;
  /** USD minor — never float. */
  costUsdMinor: bigint;
  qty: number;
};

export type CostUploadBatch = {
  batchId: string;
  supplierId: string;
  rows: CostUploadRow[];
  currency: "USD";
  createdAt: string;
  status: "received" | "pending_review";
};

export type Heartbeat = {
  heartbeatId: string;
  supplierId: string;
  channel: "dashboard" | "whatsapp";
  note: string;
  createdAt: string;
};

export type ConfirmOrderStatus = "awaiting_confirm" | "confirmed" | "sla_breached";

export type ConfirmOrder = {
  orderId: string;
  supplierId: string;
  /** Customer order total snapshot (USD minor) — supplier confirms fulfilment, does not set payable. */
  amountUsdMinor: bigint;
  status: ConfirmOrderStatus;
  slaDeadlineAt: number;
  confirmedAt?: string;
};

export type StatementLine = {
  lineId: string;
  supplierId: string;
  kind: "settlement" | "bond" | "coop_spend";
  amount: Money;
  label: string;
  createdAt: string;
};

type Store = {
  profiles: Map<string, SupplierProfile>;
  uploads: Map<string, CostUploadBatch>;
  heartbeats: Heartbeat[];
  confirms: Map<string, ConfirmOrder>;
  statements: StatementLine[];
};

function store(): Store {
  const g = globalThis as typeof globalThis & { __dialSupplierStore?: Store };
  if (!g.__dialSupplierStore) {
    g.__dialSupplierStore = {
      profiles: new Map(),
      uploads: new Map(),
      heartbeats: [],
      confirms: new Map(),
      statements: [],
    };
  }
  return g.__dialSupplierStore;
}

export function __resetSuppliersForTests(): void {
  const s = store();
  s.profiles.clear();
  s.uploads.clear();
  s.heartbeats.length = 0;
  s.confirms.clear();
  s.statements.length = 0;
}

function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Pack §9.4 onboarding — tier ladder; agency only. */
export function onboardSupplier(input: {
  supplierId: string;
  displayName: string;
  formality: SupplierFormality;
  tier: SupplierTier;
}): SupplierProfile {
  if (!input.supplierId.trim()) throw new Error("supplierId required");
  if (!input.displayName.trim()) throw new Error("displayName required");
  const profile: SupplierProfile = {
    supplierId: input.supplierId,
    displayName: input.displayName.trim(),
    formality: input.formality,
    tier: input.tier,
    offerSource: "MARKETPLACE",
    onboardedAt: new Date().toISOString(),
  };
  store().profiles.set(profile.supplierId, profile);
  return { ...profile };
}

export function getSupplier(supplierId: string): SupplierProfile | undefined {
  const p = store().profiles.get(supplierId);
  return p ? { ...p } : undefined;
}

/**
 * Catalogue / costs upload — Appendix A style rows; USD minor only.
 * Rejects float and non-MARKETPLACE paths.
 */
export function uploadSupplierCosts(input: {
  supplierId: string;
  rows: Array<{
    sku: string;
    title: string;
    costUsdMinor: bigint;
    qty: number;
  }>;
}): CostUploadBatch {
  const profile = store().profiles.get(input.supplierId);
  if (!profile) throw new Error("Supplier not onboarded");
  if (profile.offerSource !== "MARKETPLACE") {
    throw new Error("DIAL_OWNED / non-marketplace supplier upload forbidden (D-58)");
  }
  if (input.rows.length === 0) throw new Error("rows required");
  for (const row of input.rows) {
    if (typeof row.costUsdMinor !== "bigint" || row.costUsdMinor < 0n) {
      throw new TypeError("costUsdMinor must be non-negative bigint");
    }
    if (row.qty < 1) throw new Error("qty must be >= 1");
  }
  const batch: CostUploadBatch = {
    batchId: id("scost"),
    supplierId: input.supplierId,
    rows: input.rows.map((r) => ({ ...r })),
    currency: "USD",
    createdAt: new Date().toISOString(),
    status: "pending_review",
  };
  store().uploads.set(batch.batchId, batch);
  return {
    ...batch,
    rows: batch.rows.map((r) => ({ ...r })),
  };
}

export function listCostUploads(supplierId: string): CostUploadBatch[] {
  return [...store().uploads.values()]
    .filter((b) => b.supplierId === supplierId)
    .map((b) => ({ ...b, rows: b.rows.map((r) => ({ ...r })) }));
}

/** Heartbeat inbox — dashboard or WhatsApp channel flag (Cloud API only at edge). */
export function postHeartbeat(input: {
  supplierId: string;
  channel: "dashboard" | "whatsapp";
  note?: string;
}): Heartbeat {
  if (!store().profiles.has(input.supplierId)) {
    throw new Error("Supplier not onboarded");
  }
  const hb: Heartbeat = {
    heartbeatId: id("hb"),
    supplierId: input.supplierId,
    channel: input.channel,
    note: (input.note ?? "ok").slice(0, 280),
    createdAt: new Date().toISOString(),
  };
  store().heartbeats.unshift(hb);
  return { ...hb };
}

export function listHeartbeats(supplierId: string): Heartbeat[] {
  return store()
    .heartbeats.filter((h) => h.supplierId === supplierId)
    .map((h) => ({ ...h }));
}

const DEFAULT_SLA_MS = 2 * 60 * 60 * 1000; // 2h confirm SLA

/** Seed / enqueue order awaiting supplier confirm (SLA clock). */
export function enqueueConfirmOrder(input: {
  supplierId: string;
  orderId?: string;
  amountUsdMinor: bigint;
  slaMs?: number;
}): ConfirmOrder {
  if (!store().profiles.has(input.supplierId)) {
    throw new Error("Supplier not onboarded");
  }
  if (typeof input.amountUsdMinor !== "bigint" || input.amountUsdMinor <= 0n) {
    throw new TypeError("amountUsdMinor must be positive bigint");
  }
  const order: ConfirmOrder = {
    orderId: input.orderId ?? id("sord"),
    supplierId: input.supplierId,
    amountUsdMinor: input.amountUsdMinor,
    status: "awaiting_confirm",
    slaDeadlineAt: Date.now() + (input.slaMs ?? DEFAULT_SLA_MS),
  };
  store().confirms.set(order.orderId, order);
  return { ...order };
}

export function listConfirmQueue(supplierId: string, now = Date.now()): ConfirmOrder[] {
  const out: ConfirmOrder[] = [];
  for (const o of store().confirms.values()) {
    if (o.supplierId !== supplierId) continue;
    if (o.status === "awaiting_confirm" && now > o.slaDeadlineAt) {
      o.status = "sla_breached";
    }
    out.push({ ...o });
  }
  return out.sort((a, b) => a.slaDeadlineAt - b.slaDeadlineAt);
}

export function confirmOrder(input: {
  supplierId: string;
  orderId: string;
  now?: number;
}): ConfirmOrder {
  const order = store().confirms.get(input.orderId);
  if (!order || order.supplierId !== input.supplierId) {
    throw new Error("Unknown confirm order for supplier");
  }
  const now = input.now ?? Date.now();
  if (order.status === "awaiting_confirm" && now > order.slaDeadlineAt) {
    order.status = "sla_breached";
  }
  if (order.status === "sla_breached") {
    throw new Error("SLA breached — escalate to ops");
  }
  if (order.status === "confirmed") return { ...order };
  order.status = "confirmed";
  order.confirmedAt = new Date(now).toISOString();
  return { ...order };
}

export function addStatementLine(input: {
  supplierId: string;
  kind: StatementLine["kind"];
  amountUsdMinor: bigint;
  label: string;
}): StatementLine {
  if (typeof input.amountUsdMinor !== "bigint") {
    throw new TypeError("amountUsdMinor must be bigint");
  }
  const line: StatementLine = {
    lineId: id("stmt"),
    supplierId: input.supplierId,
    kind: input.kind,
    amount: money(input.amountUsdMinor, "USD"),
    label: input.label,
    createdAt: new Date().toISOString(),
  };
  store().statements.push(line);
  return {
    ...line,
    amount: { ...line.amount },
  };
}

export function listStatements(supplierId: string): StatementLine[] {
  return store()
    .statements.filter((l) => l.supplierId === supplierId)
    .map((l) => ({ ...l, amount: { ...l.amount } }));
}

export type Pd6ThinResult = {
  profile: SupplierProfile;
  uploadBatchId: string;
  heartbeatId: string;
  confirmOrderId: string;
  confirmStatus: ConfirmOrderStatus;
  statementLineIds: string[];
  currency: "USD";
};

/**
 * PD6 thin vertical: onboard → cost upload → heartbeat → confirm queue → statements.
 */
export function runPd6SupplierThinVertical(input?: {
  supplierId?: string;
  displayName?: string;
}): Pd6ThinResult {
  const supplierId = input?.supplierId ?? "sup_ok_express";
  const profile = onboardSupplier({
    supplierId,
    displayName: input?.displayName ?? "OK Express Agency",
    formality: "formal",
    tier: "silver",
  });
  const upload = uploadSupplierCosts({
    supplierId,
    rows: [
      {
        sku: "FILTER-KUN26",
        title: "Oil filter cost sheet",
        costUsdMinor: 9_50n,
        qty: 20,
      },
    ],
  });
  const hb = postHeartbeat({
    supplierId,
    channel: "dashboard",
    note: "stock ok",
  });
  const order = enqueueConfirmOrder({
    supplierId,
    amountUsdMinor: 45_00n,
    slaMs: 60_000,
  });
  const confirmed = confirmOrder({ supplierId, orderId: order.orderId });
  const settlement = addStatementLine({
    supplierId,
    kind: "settlement",
    amountUsdMinor: 40_00n,
    label: "Weekly settlement",
  });
  const coop = addStatementLine({
    supplierId,
    kind: "coop_spend",
    amountUsdMinor: 5_00n,
    label: "SUPPLIER_COOP funded SKU spend",
  });
  return {
    profile,
    uploadBatchId: upload.batchId,
    heartbeatId: hb.heartbeatId,
    confirmOrderId: confirmed.orderId,
    confirmStatus: confirmed.status,
    statementLineIds: [settlement.lineId, coop.lineId],
    currency: "USD",
  };
}
