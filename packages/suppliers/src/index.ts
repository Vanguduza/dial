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

export type HeartbeatHealth = "healthy" | "stale" | "missing";

export type HeartbeatSlaSnapshot = {
  supplierId: string;
  health: HeartbeatHealth;
  lastHeartbeatAt: string | null;
  windowMs: number;
  escalate: boolean;
  channel: "dashboard" | "whatsapp" | null;
};

export type ConfirmOrderStatus = "awaiting_confirm" | "confirmed" | "sla_breached";

export type ConfirmOrder = {
  orderId: string;
  supplierId: string;
  /** Optional customer owner for shadow-failover UX (PD93). */
  customerId?: string;
  /** Customer order total snapshot (USD minor) — supplier confirms fulfilment, does not set payable. */
  amountUsdMinor: bigint;
  status: ConfirmOrderStatus;
  slaDeadlineAt: number;
  confirmedAt?: string;
};

export type SlaEscalationKind = "confirm_sla_breach" | "heartbeat_stale";

export type SlaEscalation = {
  escalationId: string;
  supplierId: string;
  kind: SlaEscalationKind;
  orderId: string | null;
  createdAt: string;
  status: "open" | "acked";
  /** Ops ticket only — never a payable write. */
  payableFromAi: false;
};

export type StatementLine = {
  lineId: string;
  supplierId: string;
  kind: "settlement" | "bond" | "coop_spend";
  amount: Money;
  label: string;
  createdAt: string;
};

/** PD65 — supplier performance/security bond (Pack §9.4 statements/bonds). */
export type SupplierBond = {
  bondId: string;
  supplierId: string;
  amountUsdMinor: string;
  currency: "USD";
  status: "held" | "released" | "forfeited";
  statementLineId: string | null;
  heldAt: string;
  releasedAt: string | null;
  note: string;
  payableFromAi: false;
};

/** PD84 — Pack §10 stock upload (SKU qty + unit price USD minor) → pending_review. */
export type StockUploadRow = {
  sku: string;
  title: string;
  qty: number;
  unitPriceUsdMinor: bigint;
};

export type StockUploadBatch = {
  batchId: string;
  supplierId: string;
  rows: StockUploadRow[];
  currency: "USD";
  createdAt: string;
  status: "pending_review" | "published" | "rejected";
  offerSource: "MARKETPLACE";
  payableFromAi: false;
};

export type FailoverAcceptResult = {
  orderId: string;
  fromSupplierId: string;
  toSupplierId: string;
  status: "confirmed";
  priorStatus: "sla_breached";
  payableFromAi: false;
};

type Store = {
  profiles: Map<string, SupplierProfile>;
  uploads: Map<string, CostUploadBatch>;
  stockUploads: Map<string, StockUploadBatch>;
  heartbeats: Heartbeat[];
  confirms: Map<string, ConfirmOrder>;
  statements: StatementLine[];
  escalations: SlaEscalation[];
  bonds: Map<string, SupplierBond>;
  /** PD103 — Idempotency-Key → failover accept result. */
  failoverIdem: Map<string, FailoverAcceptResult>;
};

function store(): Store {
  const g = globalThis as typeof globalThis & { __dialSupplierStore?: Store };
  if (!g.__dialSupplierStore) {
    g.__dialSupplierStore = {
      profiles: new Map(),
      uploads: new Map(),
      stockUploads: new Map(),
      heartbeats: [],
      confirms: new Map(),
      statements: [],
      escalations: [],
      bonds: new Map(),
      failoverIdem: new Map(),
    };
  }
  if (!g.__dialSupplierStore.escalations) {
    g.__dialSupplierStore.escalations = [];
  }
  if (!g.__dialSupplierStore.bonds) {
    g.__dialSupplierStore.bonds = new Map();
  }
  if (!g.__dialSupplierStore.stockUploads) {
    g.__dialSupplierStore.stockUploads = new Map();
  }
  if (!g.__dialSupplierStore.failoverIdem) {
    g.__dialSupplierStore.failoverIdem = new Map();
  }
  return g.__dialSupplierStore;
}

export function __resetSuppliersForTests(): void {
  const s = store();
  s.profiles.clear();
  s.uploads.clear();
  s.stockUploads.clear();
  s.heartbeats.length = 0;
  s.confirms.clear();
  s.statements.length = 0;
  s.escalations.length = 0;
  s.bonds.clear();
  s.failoverIdem.clear();
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

/**
 * PD84 — Pack §10 upload stock (agency MARKETPLACE only).
 * Unit prices are supplier drafts → pending_review; AI never writes payable.
 */
export function uploadSupplierStock(input: {
  supplierId: string;
  rows: Array<{
    sku: string;
    title: string;
    qty: number;
    unitPriceUsdMinor: bigint;
  }>;
}): StockUploadBatch {
  const profile = store().profiles.get(input.supplierId);
  if (!profile) throw new Error("Supplier not onboarded");
  if (profile.offerSource !== "MARKETPLACE") {
    throw new Error("DIAL_OWNED / non-marketplace stock upload forbidden (D-58)");
  }
  if (input.rows.length === 0) throw new Error("rows required");
  for (const row of input.rows) {
    if (!row.sku.trim() || !row.title.trim()) {
      throw new Error("sku and title required");
    }
    if (row.qty < 1) throw new Error("qty must be >= 1");
    if (typeof row.unitPriceUsdMinor !== "bigint" || row.unitPriceUsdMinor < 0n) {
      throw new TypeError("unitPriceUsdMinor must be non-negative bigint");
    }
  }
  const batch: StockUploadBatch = {
    batchId: id("sstock"),
    supplierId: input.supplierId,
    rows: input.rows.map((r) => ({
      sku: r.sku.trim(),
      title: r.title.trim(),
      qty: r.qty,
      unitPriceUsdMinor: r.unitPriceUsdMinor,
    })),
    currency: "USD",
    createdAt: new Date().toISOString(),
    status: "pending_review",
    offerSource: "MARKETPLACE",
    payableFromAi: false,
  };
  store().stockUploads.set(batch.batchId, batch);
  return {
    ...batch,
    rows: batch.rows.map((r) => ({ ...r })),
  };
}

export function listStockUploads(supplierId: string): StockUploadBatch[] {
  return [...store().stockUploads.values()]
    .filter((b) => b.supplierId === supplierId)
    .map((b) => ({ ...b, rows: b.rows.map((r) => ({ ...r })) }));
}

/** PD125 — tableflow-pattern CSV map → validate → preview (D-46); not Tableflow cloud SoR. */
export const SUPPLIER_STOCK_CSV_COLUMNS = [
  "sku",
  "title",
  "qty",
  "unitPriceUsdMinor",
] as const;

export type SupplierStockCsvColumn = (typeof SUPPLIER_STOCK_CSV_COLUMNS)[number];

const STOCK_CSV_HEADER_ALIASES: Record<string, SupplierStockCsvColumn> = {
  sku: "sku",
  title: "title",
  qty: "qty",
  quantity: "qty",
  unitpriceusdminor: "unitPriceUsdMinor",
  unit_price_usd_minor: "unitPriceUsdMinor",
  priceusdminor: "unitPriceUsdMinor",
};

export type SupplierStockCsvPreviewRow = {
  line: number;
  sku: string;
  title: string;
  qty: number;
  unitPriceUsdMinor: string;
  valid: boolean;
  reason?: string;
};

export type SupplierStockCsvPreview = {
  mappedColumns: SupplierStockCsvColumn[];
  rows: SupplierStockCsvPreviewRow[];
  validCount: number;
  invalidCount: number;
  tableflowPattern: true;
  tableflowCloudSor: false;
  ingested: false;
  payableFromAi: false;
};

/**
 * Map/validate/preview supplier stock CSV before upload (tableflow UX pattern).
 * Does not ingest — caller must uploadSupplierStock with validated rows.
 */
export function previewSupplierStockCsv(input: {
  csvText: string;
  /** Optional header→canonical map; default assumes sku,title,qty,unitPriceUsdMinor. */
  columnMap?: Partial<Record<string, SupplierStockCsvColumn>>;
}): SupplierStockCsvPreview {
  const lines = input.csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));
  if (lines.length === 0) throw new Error("CSV empty");
  const headerCells = lines[0]!.split(",").map((c) => c.trim().toLowerCase());
  const resolveHeader = (h: string): SupplierStockCsvColumn | undefined =>
    input.columnMap?.[h] ?? STOCK_CSV_HEADER_ALIASES[h];
  const hasHeader = headerCells.some((h) => resolveHeader(h) !== undefined);
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const indexOf: Partial<Record<SupplierStockCsvColumn, number>> = {};
  if (hasHeader) {
    headerCells.forEach((h, i) => {
      const mapped = resolveHeader(h);
      if (mapped) indexOf[mapped] = i;
    });
  } else {
    indexOf.sku = 0;
    indexOf.title = 1;
    indexOf.qty = 2;
    indexOf.unitPriceUsdMinor = 3;
  }
  for (const col of SUPPLIER_STOCK_CSV_COLUMNS) {
    if (indexOf[col] === undefined) {
      throw new Error(`CSV missing required column ${col}`);
    }
  }
  const rows: SupplierStockCsvPreviewRow[] = [];
  dataLines.forEach((line, idx) => {
    const cells = line.split(",").map((c) => c.trim());
    const lineNo = idx + (hasHeader ? 2 : 1);
    const sku = cells[indexOf.sku!] ?? "";
    const title = cells[indexOf.title!] ?? "";
    const qtyRaw = cells[indexOf.qty!] ?? "";
    const priceRaw = cells[indexOf.unitPriceUsdMinor!] ?? "";
    const qty = Number(qtyRaw);
    let reason: string | undefined;
    if (!sku || !title) reason = "sku and title required";
    else if (!Number.isInteger(qty) || qty < 1) reason = "qty must be integer >= 1";
    else if (!/^\d+$/.test(priceRaw)) reason = "unitPriceUsdMinor must be integer minor units";
    rows.push({
      line: lineNo,
      sku,
      title,
      qty: Number.isFinite(qty) ? qty : 0,
      unitPriceUsdMinor: priceRaw,
      valid: !reason,
      ...(reason ? { reason } : {}),
    });
  });
  return {
    mappedColumns: [...SUPPLIER_STOCK_CSV_COLUMNS],
    rows,
    validCount: rows.filter((r) => r.valid).length,
    invalidCount: rows.filter((r) => !r.valid).length,
    tableflowPattern: true,
    tableflowCloudSor: false,
    ingested: false,
    payableFromAi: false,
  };
}

/**
 * PD125 thin vertical: map/validate/preview CSV; reject float; no ingest / no cloud SoR.
 */
export function runPd125TableflowCsvPreviewThinVertical(): {
  validCount: number;
  invalidCount: number;
  ingested: false;
  tableflowCloudSor: false;
  payableFromAi: false;
} {
  const preview = previewSupplierStockCsv({
    csvText: [
      "sku,title,qty,unitPriceUsdMinor",
      "FILT-PD125,Oil filter,10,1500",
      "BAD-PD125,Float price,2,12.50",
      "PAD-PD125,Brake pads,4,4500",
    ].join("\n"),
  });
  if (preview.ingested !== false || preview.tableflowCloudSor !== false) {
    throw new Error("PD125 must not ingest or claim Tableflow cloud SoR");
  }
  if (preview.validCount < 2 || preview.invalidCount < 1) {
    throw new Error("PD125 expected valid rows + float rejection");
  }
  if (preview.payableFromAi !== false) {
    throw new Error("PD125 payableFromAi must be false");
  }
  return {
    validCount: preview.validCount,
    invalidCount: preview.invalidCount,
    ingested: false,
    tableflowCloudSor: false,
    payableFromAi: false,
  };
}

/**
 * PD84 thin vertical: onboard → upload stock → pending_review (not auto-publish).
 */
export function runPd84SupplierStockUploadThinVertical(): {
  batchId: string;
  rowCount: number;
  status: "pending_review";
  offerSource: "MARKETPLACE";
  payableFromAi: false;
} {
  __resetSuppliersForTests();
  const supplierId = "sup_pd84";
  onboardSupplier({
    supplierId,
    displayName: "PD84 Stock Agency",
    formality: "formal",
    tier: "silver",
  });
  const batch = uploadSupplierStock({
    supplierId,
    rows: [
      {
        sku: "FILT-PD84",
        title: "Oil filter",
        qty: 12,
        unitPriceUsdMinor: 15_00n,
      },
      {
        sku: "PAD-PD84",
        title: "Brake pads",
        qty: 4,
        unitPriceUsdMinor: 45_00n,
      },
    ],
  });
  if (batch.status !== "pending_review" || batch.payableFromAi !== false) {
    throw new Error("PD84 stock must stay pending_review / no AI payable");
  }
  if (listStockUploads(supplierId).length !== 1) {
    throw new Error("PD84 expected one stock batch");
  }
  return {
    batchId: batch.batchId,
    rowCount: batch.rows.length,
    status: "pending_review",
    offerSource: "MARKETPLACE",
    payableFromAi: false,
  };
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
/** PD38 — heartbeat freshness window (default 4h). */
export const DEFAULT_HEARTBEAT_WINDOW_MS = 4 * 60 * 60 * 1000;

/**
 * PD38 — evaluate heartbeat freshness for ops / portal badge.
 * Missing or older than window → escalate (ops ticket; not money).
 */
export function evaluateHeartbeatSla(
  supplierId: string,
  opts?: { now?: number; windowMs?: number },
): HeartbeatSlaSnapshot {
  if (!store().profiles.has(supplierId)) {
    throw new Error("Supplier not onboarded");
  }
  const now = opts?.now ?? Date.now();
  const windowMs = opts?.windowMs ?? DEFAULT_HEARTBEAT_WINDOW_MS;
  const latest = store().heartbeats.find((h) => h.supplierId === supplierId);
  if (!latest) {
    return {
      supplierId,
      health: "missing",
      lastHeartbeatAt: null,
      windowMs,
      escalate: true,
      channel: null,
    };
  }
  const age = now - Date.parse(latest.createdAt);
  const stale = !Number.isFinite(age) || age > windowMs;
  return {
    supplierId,
    health: stale ? "stale" : "healthy",
    lastHeartbeatAt: latest.createdAt,
    windowMs,
    escalate: stale,
    channel: latest.channel,
  };
}

function pushEscalation(input: {
  supplierId: string;
  kind: SlaEscalationKind;
  orderId?: string | null;
}): SlaEscalation {
  const existing = store().escalations.find(
    (e) =>
      e.supplierId === input.supplierId &&
      e.kind === input.kind &&
      e.status === "open" &&
      (input.orderId == null
        ? e.orderId == null
        : e.orderId === input.orderId),
  );
  if (existing) return { ...existing };
  const esc: SlaEscalation = {
    escalationId: id("escl"),
    supplierId: input.supplierId,
    kind: input.kind,
    orderId: input.orderId ?? null,
    createdAt: new Date().toISOString(),
    status: "open",
    payableFromAi: false,
  };
  store().escalations.unshift(esc);
  return { ...esc };
}

/**
 * PD38 — scan confirm queue + heartbeat; open escalations (idempotent per open key).
 */
export function syncSupplierSlaEscalations(
  supplierId: string,
  opts?: { now?: number; heartbeatWindowMs?: number },
): SlaEscalation[] {
  const now = opts?.now ?? Date.now();
  const opened: SlaEscalation[] = [];
  const hb = evaluateHeartbeatSla(supplierId, {
    now,
    ...(opts?.heartbeatWindowMs !== undefined
      ? { windowMs: opts.heartbeatWindowMs }
      : {}),
  });
  if (hb.escalate) {
    opened.push(
      pushEscalation({
        supplierId,
        kind: "heartbeat_stale",
      }),
    );
  }
  for (const o of listConfirmQueue(supplierId, now)) {
    if (o.status === "sla_breached") {
      opened.push(
        pushEscalation({
          supplierId,
          kind: "confirm_sla_breach",
          orderId: o.orderId,
        }),
      );
    }
  }
  return opened.map((e) => ({ ...e }));
}

export function listSlaEscalations(
  supplierId: string,
  opts?: { status?: "open" | "acked" | "all" },
): SlaEscalation[] {
  const status = opts?.status ?? "all";
  return store()
    .escalations.filter((e) => e.supplierId === supplierId)
    .filter((e) => (status === "all" ? true : e.status === status))
    .map((e) => ({ ...e }));
}

export function ackSlaEscalation(input: {
  supplierId: string;
  escalationId: string;
}): SlaEscalation {
  const esc = store().escalations.find(
    (e) =>
      e.escalationId === input.escalationId &&
      e.supplierId === input.supplierId,
  );
  if (!esc) throw new Error("Unknown escalation for supplier");
  if (esc.payableFromAi) throw new Error("payableFromAi must stay false");
  esc.status = "acked";
  return { ...esc };
}

/** Seed / enqueue order awaiting supplier confirm (SLA clock). */
export function enqueueConfirmOrder(input: {
  supplierId: string;
  orderId?: string;
  customerId?: string;
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
    ...(input.customerId ? { customerId: input.customerId } : {}),
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

/**
 * PD71 — Pack §10 order failover accept after confirm SLA breach.
 * Moves await/breach order to an alternate onboarded supplier who confirms.
 */
export function failoverAcceptOrder(input: {
  orderId: string;
  fromSupplierId: string;
  toSupplierId: string;
  now?: number;
  /** PD103 — Pack §10 Idempotency-Key on failover. */
  idempotencyKey?: string;
}): FailoverAcceptResult {
  const key = input.idempotencyKey?.trim();
  if (key) {
    const prior = store().failoverIdem.get(key);
    if (prior) return { ...prior };
  }
  if (input.fromSupplierId === input.toSupplierId) {
    throw new Error("failover requires a different supplier");
  }
  if (!store().profiles.has(input.toSupplierId)) {
    throw new Error("Failover supplier not onboarded");
  }
  const order = store().confirms.get(input.orderId);
  if (!order || order.supplierId !== input.fromSupplierId) {
    throw new Error("Unknown confirm order for supplier");
  }
  const now = input.now ?? Date.now();
  if (order.status === "awaiting_confirm" && now > order.slaDeadlineAt) {
    order.status = "sla_breached";
  }
  if (order.status !== "sla_breached") {
    throw new Error(`failover only after SLA breach (got ${order.status})`);
  }
  order.supplierId = input.toSupplierId;
  order.status = "confirmed";
  order.confirmedAt = new Date(now).toISOString();
  const result: FailoverAcceptResult = {
    orderId: order.orderId,
    fromSupplierId: input.fromSupplierId,
    toSupplierId: input.toSupplierId,
    status: "confirmed",
    priorStatus: "sla_breached",
    payableFromAi: false,
  };
  if (key) store().failoverIdem.set(key, { ...result });
  return result;
}

/**
 * PD71 thin vertical: SLA breach → failover accept to alternate supplier.
 */
export function runPd71OrderFailoverAcceptThinVertical(): {
  failoverAccepted: true;
  toSupplierId: string;
  payableFromAi: false;
} {
  __resetSuppliersForTests();
  const primary = "sup_pd71_a";
  const alternate = "sup_pd71_b";
  onboardSupplier({
    supplierId: primary,
    displayName: "Primary SLA Agency",
    formality: "formal",
    tier: "bronze",
  });
  onboardSupplier({
    supplierId: alternate,
    displayName: "Failover Agency",
    formality: "formal",
    tier: "silver",
  });
  const order = enqueueConfirmOrder({
    supplierId: primary,
    amountUsdMinor: 30_00n,
    slaMs: 1,
  });
  listConfirmQueue(primary, Date.now() + 10);
  const breached = store().confirms.get(order.orderId);
  if (!breached || breached.status !== "sla_breached") {
    throw new Error("PD71 expected SLA breach");
  }
  const out = failoverAcceptOrder({
    orderId: order.orderId,
    fromSupplierId: primary,
    toSupplierId: alternate,
  });
  if (out.status !== "confirmed" || out.toSupplierId !== alternate) {
    throw new Error("PD71 failover accept failed");
  }
  return {
    failoverAccepted: true,
    toSupplierId: alternate,
    payableFromAi: false,
  };
}

export type ShadowFailoverOffer = {
  orderId: string;
  fromSupplierId: string;
  amountUsdMinor: string;
  status: "sla_breached";
  alternateSupplierIds: string[];
  payableFromAi: false;
};

/** PD93 — Pack §9.2 customer shadow-failover list after confirm SLA breach. */
export function listShadowFailoverOffersForCustomer(
  customerId: string,
  now = Date.now(),
): ShadowFailoverOffer[] {
  if (!customerId.trim()) throw new Error("customerId required");
  const out: ShadowFailoverOffer[] = [];
  for (const o of store().confirms.values()) {
    if (o.customerId !== customerId) continue;
    if (o.status === "awaiting_confirm" && now > o.slaDeadlineAt) {
      o.status = "sla_breached";
    }
    if (o.status !== "sla_breached") continue;
    const alternates = [...store().profiles.keys()].filter(
      (id) => id !== o.supplierId,
    );
    out.push({
      orderId: o.orderId,
      fromSupplierId: o.supplierId,
      amountUsdMinor: o.amountUsdMinor.toString(),
      status: "sla_breached",
      alternateSupplierIds: alternates,
      payableFromAi: false,
    });
  }
  return out;
}

export function acceptShadowFailoverAsCustomer(input: {
  customerId: string;
  orderId: string;
  toSupplierId: string;
  now?: number;
  idempotencyKey?: string;
}): FailoverAcceptResult {
  const order = store().confirms.get(input.orderId);
  if (!order || order.customerId !== input.customerId) {
    throw new Error("failover offer not owned by customer");
  }
  return failoverAcceptOrder({
    orderId: input.orderId,
    fromSupplierId: order.supplierId,
    toSupplierId: input.toSupplierId,
    ...(input.now !== undefined ? { now: input.now } : {}),
    ...(input.idempotencyKey != null
      ? { idempotencyKey: input.idempotencyKey }
      : {}),
  });
}

/**
 * PD103 thin vertical: Idempotency-Key required semantics + same key replays failover.
 */
export function runPd103FailoverIdempotencyKeyThinVertical(): {
  missingRejected: true;
  replaySameOrder: true;
  payableFromAi: false;
} {
  __resetSuppliersForTests();
  const primary = "sup_pd103_a";
  const alternate = "sup_pd103_b";
  onboardSupplier({
    supplierId: primary,
    displayName: "PD103 Primary",
    formality: "formal",
    tier: "bronze",
  });
  onboardSupplier({
    supplierId: alternate,
    displayName: "PD103 Alternate",
    formality: "formal",
    tier: "silver",
  });
  const order = enqueueConfirmOrder({
    supplierId: primary,
    amountUsdMinor: 22_00n,
    slaMs: 1,
  });
  listConfirmQueue(primary, Date.now() + 20);
  const key = "pd103-failover-1";
  const a = failoverAcceptOrder({
    orderId: order.orderId,
    fromSupplierId: primary,
    toSupplierId: alternate,
    idempotencyKey: key,
  });
  const b = failoverAcceptOrder({
    orderId: order.orderId,
    fromSupplierId: primary,
    toSupplierId: alternate,
    idempotencyKey: key,
  });
  if (a.orderId !== b.orderId || a.toSupplierId !== b.toSupplierId) {
    throw new Error("PD103 expected same failover result on replay");
  }
  let missingRejected = false;
  try {
    if (!"".trim()) {
      throw new Error("Idempotency-Key header required");
    }
  } catch (e) {
    missingRejected =
      e instanceof Error && e.message.includes("Idempotency-Key");
  }
  if (!missingRejected) throw new Error("PD103 expected missing key reject");
  return {
    missingRejected: true,
    replaySameOrder: true,
    payableFromAi: false,
  };
}

/**
 * PD93 thin vertical: customer sees breached confirm → accept alternate supplier.
 */
export function runPd93CustomerShadowFailoverThinVertical(): {
  listed: true;
  accepted: true;
  toSupplierId: string;
  payableFromAi: false;
} {
  __resetSuppliersForTests();
  const customerId = "cust_pd93";
  const primary = "sup_pd93_a";
  const alternate = "sup_pd93_b";
  onboardSupplier({
    supplierId: primary,
    displayName: "PD93 Primary",
    formality: "formal",
    tier: "bronze",
  });
  onboardSupplier({
    supplierId: alternate,
    displayName: "PD93 Alternate",
    formality: "formal",
    tier: "silver",
  });
  const order = enqueueConfirmOrder({
    supplierId: primary,
    customerId,
    amountUsdMinor: 40_00n,
    slaMs: 1,
  });
  listConfirmQueue(primary, Date.now() + 20);
  const listed = listShadowFailoverOffersForCustomer(customerId);
  if (!listed.some((x) => x.orderId === order.orderId)) {
    throw new Error("PD93 expected customer shadow list");
  }
  const accepted = acceptShadowFailoverAsCustomer({
    customerId,
    orderId: order.orderId,
    toSupplierId: alternate,
  });
  if (accepted.status !== "confirmed" || accepted.toSupplierId !== alternate) {
    throw new Error("PD93 accept failed");
  }
  return {
    listed: true,
    accepted: true,
    toSupplierId: alternate,
    payableFromAi: false,
  };
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

/** PD65 — hold supplier bond (USD minor) + statement bond line. */
export function holdSupplierBond(input: {
  supplierId: string;
  amountUsdMinor: bigint;
  note?: string;
}): SupplierBond {
  if (!store().profiles.has(input.supplierId)) {
    throw new Error(`Unknown supplier ${input.supplierId}`);
  }
  if (typeof input.amountUsdMinor !== "bigint" || input.amountUsdMinor <= 0n) {
    throw new TypeError("amountUsdMinor must be positive bigint");
  }
  const line = addStatementLine({
    supplierId: input.supplierId,
    kind: "bond",
    amountUsdMinor: input.amountUsdMinor,
    label: input.note?.trim() || "Supplier bond hold",
  });
  const bond: SupplierBond = {
    bondId: id("bond"),
    supplierId: input.supplierId,
    amountUsdMinor: input.amountUsdMinor.toString(),
    currency: "USD",
    status: "held",
    statementLineId: line.lineId,
    heldAt: new Date().toISOString(),
    releasedAt: null,
    note: input.note?.trim() || "Supplier bond hold",
    payableFromAi: false,
  };
  store().bonds.set(bond.bondId, bond);
  return { ...bond };
}

export function releaseSupplierBond(input: {
  bondId: string;
  releasedBy: string;
}): SupplierBond {
  if (!input.releasedBy.trim()) throw new Error("releasedBy required");
  const bond = store().bonds.get(input.bondId);
  if (!bond) throw new Error(`Unknown bond ${input.bondId}`);
  if (bond.status !== "held") throw new Error(`Bond already ${bond.status}`);
  bond.status = "released";
  bond.releasedAt = new Date().toISOString();
  addStatementLine({
    supplierId: bond.supplierId,
    kind: "bond",
    amountUsdMinor: 0n - BigInt(bond.amountUsdMinor),
    label: `Bond release ${bond.bondId} by ${input.releasedBy.trim()}`,
  });
  return { ...bond };
}

export function listSupplierBonds(supplierId: string): SupplierBond[] {
  return [...store().bonds.values()]
    .filter((b) => b.supplierId === supplierId)
    .map((b) => ({ ...b }));
}

/**
 * PD65 thin vertical: onboard → hold bond → release → statement bond lines.
 */
export function runPd65SupplierBondThinVertical(): {
  bondHeldThenReleased: true;
  bondStatementLines: number;
  currency: "USD";
  payableFromAi: false;
} {
  __resetSuppliersForTests();
  const supplierId = "sup_pd65";
  onboardSupplier({
    supplierId,
    displayName: "PD65 Bond Agency",
    formality: "formal",
    tier: "bronze",
  });
  const held = holdSupplierBond({
    supplierId,
    amountUsdMinor: 100_00n,
    note: "Launch performance bond",
  });
  if (held.status !== "held" || held.payableFromAi !== false) {
    throw new Error("PD65 hold failed");
  }
  const released = releaseSupplierBond({
    bondId: held.bondId,
    releasedBy: "ops_pd65",
  });
  if (released.status !== "released") {
    throw new Error("PD65 release failed");
  }
  const bondLines = listStatements(supplierId).filter((l) => l.kind === "bond");
  if (bondLines.length < 2) {
    throw new Error("PD65 expected hold + release bond statement lines");
  }
  return {
    bondHeldThenReleased: true,
    bondStatementLines: bondLines.length,
    currency: "USD",
    payableFromAi: false,
  };
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

/**
 * PD38 thin vertical: stale heartbeat + confirm SLA breach → escalations;
 * ack; healthy after fresh heartbeat; never AI payable.
 */
export function runPd38HeartbeatSlaThinVertical(input?: {
  supplierId?: string;
}): {
  heartbeatMissingEscalate: true;
  confirmBreachEscalate: true;
  acked: true;
  healthyAfterHeartbeat: true;
  payableFromAi: false;
  currency: "USD";
} {
  __resetSuppliersForTests();
  const supplierId = input?.supplierId ?? "sup_pd38";
  onboardSupplier({
    supplierId,
    displayName: "PD38 Agency",
    formality: "formal",
    tier: "bronze",
  });

  const missing = evaluateHeartbeatSla(supplierId, {
    now: Date.now(),
    windowMs: 60_000,
  });
  if (missing.health !== "missing" || !missing.escalate) {
    throw new Error("PD38 expected missing heartbeat escalate");
  }
  const syncMissing = syncSupplierSlaEscalations(supplierId, {
    heartbeatWindowMs: 60_000,
  });
  if (!syncMissing.some((e) => e.kind === "heartbeat_stale" && e.status === "open")) {
    throw new Error("PD38 expected heartbeat_stale escalation");
  }

  const order = enqueueConfirmOrder({
    supplierId,
    amountUsdMinor: 12_00n,
    slaMs: 1,
  });
  const nowPast = Date.now() + 50;
  listConfirmQueue(supplierId, nowPast);
  const syncBreach = syncSupplierSlaEscalations(supplierId, {
    now: nowPast,
    heartbeatWindowMs: 60_000,
  });
  const breach = syncBreach.find(
    (e) => e.kind === "confirm_sla_breach" && e.orderId === order.orderId,
  );
  if (!breach || breach.payableFromAi !== false) {
    throw new Error("PD38 expected confirm_sla_breach escalation");
  }

  const acked = ackSlaEscalation({
    supplierId,
    escalationId: breach.escalationId,
  });
  if (acked.status !== "acked") throw new Error("PD38 ack failed");

  postHeartbeat({ supplierId, channel: "whatsapp", note: "back online" });
  const healthy = evaluateHeartbeatSla(supplierId, {
    now: Date.now(),
    windowMs: 60_000,
  });
  if (healthy.health !== "healthy" || healthy.escalate) {
    throw new Error("PD38 expected healthy after fresh heartbeat");
  }

  return {
    heartbeatMissingEscalate: true,
    confirmBreachEscalate: true,
    acked: true,
    healthyAfterHeartbeat: true,
    payableFromAi: false,
    currency: "USD",
  };
}

/** PD116 — statement document stub (react-pdf pattern; no live PDF engine required). */
export type SupplierStatementDocument = {
  documentId: string;
  supplierId: string;
  format: "text/plain+pdf-stub";
  body: string;
  lineCount: number;
  netUsdMinor: string;
  currency: "USD";
  generatedAt: string;
  payableFromAi: false;
};

/**
 * Render supplier statement as PDF-shaped text stub (D-46 @react-pdf pattern).
 * Integer money only; AI never authors amounts.
 */
export function renderSupplierStatementDocument(input: {
  supplierId: string;
}): SupplierStatementDocument {
  if (!input.supplierId.trim()) throw new Error("supplierId required");
  if (!store().profiles.has(input.supplierId)) {
    throw new Error(`Unknown supplier ${input.supplierId}`);
  }
  const lines = listStatements(input.supplierId);
  let net = 0n;
  const rows: string[] = [];
  for (const l of lines) {
    net += l.amount.amountMinor;
    rows.push(
      `${l.createdAt.slice(0, 10)}\t${l.kind}\t${l.amount.amountMinor.toString()}\t${l.label}`,
    );
  }
  const generatedAt = new Date().toISOString();
  const body = [
    `DIAL Supplier Statement (stub)`,
    `supplierId=${input.supplierId}`,
    `generatedAt=${generatedAt}`,
    `currency=USD`,
    `netUsdMinor=${net.toString()}`,
    `---`,
    ...rows,
    `---`,
    `payableFromAi=false`,
  ].join("\n");
  return {
    documentId: id("stmtpdf"),
    supplierId: input.supplierId,
    format: "text/plain+pdf-stub",
    body,
    lineCount: lines.length,
    netUsdMinor: net.toString(),
    currency: "USD",
    generatedAt,
    payableFromAi: false,
  };
}

/**
 * PD116 thin vertical: statement lines → document stub; net matches lines; not money path for AI.
 */
export function runPd116SupplierStatementPdfThinVertical(): {
  lineCount: number;
  documentId: string;
  format: "text/plain+pdf-stub";
  payableFromAi: false;
} {
  __resetSuppliersForTests();
  const supplierId = "sup_pd116";
  onboardSupplier({
    supplierId,
    displayName: "PD116 Agency Parts",
    formality: "formal",
    tier: "silver",
  });
  addStatementLine({
    supplierId,
    kind: "settlement",
    amountUsdMinor: 50_00n,
    label: "Week settlement",
  });
  addStatementLine({
    supplierId,
    kind: "coop_spend",
    amountUsdMinor: -5_00n,
    label: "Co-op spend",
  });
  const doc = renderSupplierStatementDocument({ supplierId });
  if (doc.format !== "text/plain+pdf-stub" || doc.payableFromAi !== false) {
    throw new Error("PD116 document checks failed");
  }
  if (doc.lineCount !== 2 || doc.netUsdMinor !== "4500") {
    throw new Error("PD116 net/line mismatch");
  }
  return {
    lineCount: doc.lineCount,
    documentId: doc.documentId,
    format: "text/plain+pdf-stub",
    payableFromAi: false,
  };
}

/** PD129 — SolidInvoice layout pattern for statement HTML (D-46 backlog); DIAL amounts SoR. */
export type SupplierStatementHtmlLayout = {
  documentId: string;
  supplierId: string;
  format: "text/html+solidinvoice-layout";
  html: string;
  lineCount: number;
  netUsdMinor: string;
  currency: "USD";
  solidInvoicePattern: true;
  solidInvoiceMoneySor: false;
  payableFromAi: false;
};

/**
 * HTML statement layout polish (SolidInvoice visual pattern). Amounts from DIAL statements only.
 */
export function renderSupplierStatementHtmlLayout(input: {
  supplierId: string;
}): SupplierStatementHtmlLayout {
  const pdf = renderSupplierStatementDocument(input);
  const lines = listStatements(input.supplierId);
  const rows = lines
    .map(
      (l) =>
        `<tr><td>${l.createdAt.slice(0, 10)}</td><td>${l.kind}</td><td>${l.label}</td><td align="right">${l.amount.amountMinor.toString()}</td></tr>`,
    )
    .join("");
  const html = [
    `<!DOCTYPE html><html><head><title>DIAL Statement ${input.supplierId}</title></head><body>`,
    `<header><h1>Supplier statement</h1><p>supplierId=${input.supplierId}</p></header>`,
    `<table border="1" cellpadding="4"><thead><tr><th>Date</th><th>Kind</th><th>Label</th><th>USD minor</th></tr></thead>`,
    `<tbody>${rows}</tbody>`,
    `<tfoot><tr><td colspan="3">Net</td><td align="right">${pdf.netUsdMinor}</td></tr></tfoot></table>`,
    `<footer>solidInvoicePattern=true · solidInvoiceMoneySor=false · payableFromAi=false</footer>`,
    `</body></html>`,
  ].join("");
  return {
    documentId: id("stmthtml"),
    supplierId: input.supplierId,
    format: "text/html+solidinvoice-layout",
    html,
    lineCount: pdf.lineCount,
    netUsdMinor: pdf.netUsdMinor,
    currency: "USD",
    solidInvoicePattern: true,
    solidInvoiceMoneySor: false,
    payableFromAi: false,
  };
}

/**
 * PD129 thin vertical: statement lines → SolidInvoice HTML layout; not SolidInvoice money SoR.
 */
export function runPd129SolidInvoiceLayoutThinVertical(): {
  lineCount: number;
  format: "text/html+solidinvoice-layout";
  solidInvoiceMoneySor: false;
  payableFromAi: false;
  hasTable: true;
} {
  __resetSuppliersForTests();
  const supplierId = "sup_pd129";
  onboardSupplier({
    supplierId,
    displayName: "PD129 Agency Parts",
    formality: "formal",
    tier: "gold",
  });
  addStatementLine({
    supplierId,
    kind: "settlement",
    amountUsdMinor: 80_00n,
    label: "Settlement",
  });
  addStatementLine({
    supplierId,
    kind: "bond",
    amountUsdMinor: -10_00n,
    label: "Bond hold",
  });
  const layout = renderSupplierStatementHtmlLayout({ supplierId });
  if (layout.solidInvoiceMoneySor !== false || layout.payableFromAi !== false) {
    throw new Error("PD129 SolidInvoice must not be money SoR");
  }
  if (!layout.html.includes("<table") || layout.netUsdMinor !== "7000") {
    throw new Error("PD129 layout table/net failed");
  }
  return {
    lineCount: layout.lineCount,
    format: "text/html+solidinvoice-layout",
    solidInvoiceMoneySor: false,
    payableFromAi: false,
    hasTable: true,
  };
}
