/**
 * Phase 4 prep — durable supplier_costs / stock / heartbeats / escalations /
 * confirm-SLA orders / co-op live offers.
 * Fixture: no-op. Sandbox/live: Supabase REST — fail closed without URL/key.
 * Tables: 0004_phase4_supplier_factory.sql + 0005_phase4_confirm_sla_coop.sql.
 * Does not claim G4 green.
 */
import { integrationMode, type IntegrationMode } from "@dial/shared/processed-events";

export type { IntegrationMode };

/** Minimal shapes — avoid circular import with index.ts */
type SupplierProfile = {
  supplierId: string;
  displayName: string;
  formality: "formal" | "informal";
  tier: string;
  offerSource: "MARKETPLACE";
  onboardedAt: string;
};

type CostUploadBatch = {
  batchId: string;
  supplierId: string;
  currency: "USD";
  status: string;
  createdAt: string;
  rows: Array<{
    sku: string;
    title: string;
    costUsdMinor: bigint;
    qty: number;
  }>;
};

type StockUploadBatch = {
  batchId: string;
  supplierId: string;
  currency: "USD";
  status: string;
  offerSource: "MARKETPLACE";
  payableFromAi: false;
  createdAt: string;
  rows: Array<{
    sku: string;
    title: string;
    qty: number;
    unitPriceUsdMinor: bigint;
  }>;
};

type Heartbeat = {
  heartbeatId: string;
  supplierId: string;
  channel: "dashboard" | "whatsapp";
  note: string;
  createdAt: string;
};

type SlaEscalation = {
  escalationId: string;
  supplierId: string;
  kind: "confirm_sla_breach" | "heartbeat_stale";
  orderId: string | null;
  status: "open" | "acked";
  payableFromAi: false;
  createdAt: string;
};

type ConfirmOrderDurable = {
  orderId: string;
  supplierId: string;
  customerId?: string;
  amountUsdMinor: bigint;
  status: "awaiting_confirm" | "confirmed" | "sla_breached";
  slaDeadlineAt: number;
  confirmedAt?: string;
};

type CoopOfferDurable = {
  campaignId: string;
  supplierId: string;
  offerIds: string[];
  supplierFundShareBps: number;
  dialFundShareBps: number;
  floorNetMinor?: bigint;
  status:
    | "proposed"
    | "supplier_accepted"
    | "ops_approved"
    | "live"
    | "ended"
    | "rejected";
};

function supabaseRestConfig(env: NodeJS.ProcessEnv = process.env): {
  url: string;
  key: string;
} {
  const url = (
    env.SUPABASE_URL?.trim() ||
    env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    ""
  ).replace(/\/$/, "");
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY?.trim() || env.SUPABASE_ANON_KEY?.trim() || "";
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / key unset — fail closed for durable suppliers",
    );
  }
  return { url, key };
}

async function restUpsert(
  table: string,
  row: Record<string, unknown>,
  onConflict: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  const { url, key } = supabaseRestConfig(env);
  const res = await fetch(
    `${url}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(row),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${table} upsert HTTP ${res.status}: ${text.slice(0, 240)}`);
  }
}

export async function persistSupplierProfileDurable(
  profile: SupplierProfile,
  env: NodeJS.ProcessEnv = process.env,
): Promise<"accepted" | "fixture_skip"> {
  if (integrationMode(env) === "fixture") return "fixture_skip";
  if (profile.offerSource !== "MARKETPLACE") {
    throw new Error("DIAL_OWNED / non-marketplace supplier persist forbidden (D-58)");
  }
  await restUpsert(
    "suppliers",
    {
      supplier_id: profile.supplierId,
      display_name: profile.displayName,
      formality: profile.formality,
      tier: profile.tier,
      offer_source: "MARKETPLACE",
      onboarded_at: profile.onboardedAt,
    },
    "supplier_id",
    env,
  );
  return "accepted";
}

export async function persistCostUploadDurable(
  batch: CostUploadBatch,
  env: NodeJS.ProcessEnv = process.env,
): Promise<"accepted" | "fixture_skip"> {
  if (integrationMode(env) === "fixture") return "fixture_skip";
  await restUpsert(
    "supplier_costs",
    {
      batch_id: batch.batchId,
      supplier_id: batch.supplierId,
      currency: "USD",
      status: batch.status,
      rows: batch.rows.map((r) => ({
        sku: r.sku,
        title: r.title,
        costUsdMinor: r.costUsdMinor.toString(),
        qty: r.qty,
      })),
      created_at: batch.createdAt,
    },
    "batch_id",
    env,
  );
  return "accepted";
}

export async function persistStockUploadDurable(
  batch: StockUploadBatch,
  env: NodeJS.ProcessEnv = process.env,
): Promise<"accepted" | "fixture_skip"> {
  if (integrationMode(env) === "fixture") return "fixture_skip";
  if (batch.offerSource !== "MARKETPLACE") {
    throw new Error("DIAL_OWNED stock persist forbidden (D-58)");
  }
  if (batch.payableFromAi !== false) {
    throw new Error("payableFromAi must stay false on durable stock");
  }
  await restUpsert(
    "stock_signals",
    {
      batch_id: batch.batchId,
      supplier_id: batch.supplierId,
      currency: "USD",
      status: batch.status,
      offer_source: "MARKETPLACE",
      payable_from_ai: false,
      rows: batch.rows.map((r) => ({
        sku: r.sku,
        title: r.title,
        qty: r.qty,
        unitPriceUsdMinor: r.unitPriceUsdMinor.toString(),
      })),
      created_at: batch.createdAt,
    },
    "batch_id",
    env,
  );
  return "accepted";
}

export async function persistHeartbeatDurable(
  hb: Heartbeat,
  env: NodeJS.ProcessEnv = process.env,
): Promise<"accepted" | "fixture_skip"> {
  if (integrationMode(env) === "fixture") return "fixture_skip";
  await restUpsert(
    "heartbeats",
    {
      heartbeat_id: hb.heartbeatId,
      supplier_id: hb.supplierId,
      channel: hb.channel,
      note: hb.note,
      created_at: hb.createdAt,
    },
    "heartbeat_id",
    env,
  );
  return "accepted";
}

export async function persistSlaEscalationDurable(
  esc: SlaEscalation,
  env: NodeJS.ProcessEnv = process.env,
): Promise<"accepted" | "fixture_skip"> {
  if (integrationMode(env) === "fixture") return "fixture_skip";
  if (esc.payableFromAi !== false) {
    throw new Error("payableFromAi must stay false on escalations");
  }
  await restUpsert(
    "sla_escalations",
    {
      escalation_id: esc.escalationId,
      supplier_id: esc.supplierId,
      kind: esc.kind,
      order_id: esc.orderId,
      status: esc.status,
      payable_from_ai: false,
      created_at: esc.createdAt,
    },
    "escalation_id",
    env,
  );
  return "accepted";
}

/**
 * PD38 sandbox path — persist open heartbeat escalations + require INTERNAL_API_SECRET
 * for ops notify side-effect. Fail closed without secrets (key-drop-in).
 */
export async function escalateHeartbeatStaleDurable(
  input: {
    supplierId: string;
    escalations: SlaEscalation[];
  },
  env: NodeJS.ProcessEnv = process.env,
): Promise<{
  mode: IntegrationMode;
  persisted: number;
  notifyReady: boolean;
}> {
  const mode = integrationMode(env);
  if (mode === "fixture") {
    return { mode, persisted: 0, notifyReady: true };
  }
  if (!env.INTERNAL_API_SECRET?.trim()) {
    throw new Error(
      "INTERNAL_API_SECRET unset — fail closed for heartbeat escalation notify",
    );
  }
  const stale = input.escalations.filter(
    (e) =>
      e.supplierId === input.supplierId &&
      e.kind === "heartbeat_stale" &&
      e.status === "open" &&
      e.payableFromAi === false,
  );
  for (const esc of stale) {
    await persistSlaEscalationDurable(esc, env);
  }
  return { mode, persisted: stale.length, notifyReady: true };
}

export async function persistConfirmOrderDurable(
  order: ConfirmOrderDurable,
  env: NodeJS.ProcessEnv = process.env,
): Promise<"accepted" | "fixture_skip"> {
  if (integrationMode(env) === "fixture") return "fixture_skip";
  if (typeof order.amountUsdMinor !== "bigint" || order.amountUsdMinor <= 0n) {
    throw new TypeError("amountUsdMinor must be positive bigint");
  }
  await restUpsert(
    "supplier_confirm_orders",
    {
      order_id: order.orderId,
      supplier_id: order.supplierId,
      customer_id: order.customerId ?? null,
      amount_usd_minor: Number(order.amountUsdMinor),
      status: order.status,
      sla_deadline_at: new Date(order.slaDeadlineAt).toISOString(),
      confirmed_at: order.confirmedAt ?? null,
      payable_from_ai: false,
    },
    "order_id",
    env,
  );
  return "accepted";
}

/**
 * SUPPLIER_COOP live offer shape — integer bps only; no AI payable; no liquor.
 */
export async function persistCoopOfferDurable(
  offer: CoopOfferDurable,
  env: NodeJS.ProcessEnv = process.env,
): Promise<"accepted" | "fixture_skip"> {
  if (integrationMode(env) === "fixture") return "fixture_skip";
  if (offer.supplierFundShareBps + offer.dialFundShareBps !== 10000) {
    throw new Error("coop shares must sum to 10000 bps");
  }
  await restUpsert(
    "supplier_coop_offers",
    {
      campaign_id: offer.campaignId,
      supplier_id: offer.supplierId,
      offer_ids: offer.offerIds,
      supplier_fund_share_bps: offer.supplierFundShareBps,
      dial_fund_share_bps: offer.dialFundShareBps,
      floor_net_minor:
        offer.floorNetMinor !== undefined
          ? Number(offer.floorNetMinor)
          : null,
      status: offer.status,
      payable_from_ai: false,
      liquor_allowed: false,
      updated_at: new Date().toISOString(),
    },
    "campaign_id",
    env,
  );
  return "accepted";
}
