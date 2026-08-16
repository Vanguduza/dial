/**
 * Durable commerce writes for G2 Spare path (offer_snapshots, orders, JR, fiscal, journals).
 * Fixture: no-op (in-memory packages remain process SoR).
 * Sandbox/live: Supabase REST via service role — fail closed without URL/key.
 * Tables: supabase/migrations/0001_core_tables.sql + 0003_phase1_priority_tables_rls.sql.
 */
import { integrationMode, type IntegrationMode } from "./processedEvents.js";

export type { IntegrationMode };

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
      "SUPABASE_URL / key unset — fail closed for durable commerce",
    );
  }
  return { url, key };
}

async function restSelect<T>(
  table: string,
  query: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<T[]> {
  const { url, key } = supabaseRestConfig(env);
  const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${table} select HTTP ${res.status}: ${text.slice(0, 240)}`);
  }
  return (await res.json()) as T[];
}

export { restSelect as durableRestSelect };

async function restInsert(
  table: string,
  row: Record<string, unknown>,
  env: NodeJS.ProcessEnv = process.env,
): Promise<"accepted" | "duplicate"> {
  const { url, key } = supabaseRestConfig(env);
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });
  if (res.status === 409) return "duplicate";
  if (!res.ok) {
    const text = await res.text();
    if (/duplicate|unique|23505/i.test(text)) return "duplicate";
    throw new Error(`${table} HTTP ${res.status}: ${text.slice(0, 240)}`);
  }
  return "accepted";
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

/** Ensure profiles row exists (orders / job_reserves FK). */
export async function ensureDurableProfile(
  input: {
    userId: string;
    email?: string;
    role?: string;
    buyerSegment?: "b2c" | "b2b";
  },
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  if (integrationMode(env) === "fixture") return;
  await restUpsert(
    "profiles",
    {
      user_id: input.userId,
      email: input.email ?? `${input.userId}@durable.dial.local`,
      role: input.role ?? "customer",
      buyer_segment: input.buyerSegment ?? "b2c",
    },
    "user_id",
    env,
  );
}

export type DurableOfferSnapshotInput = {
  snapshotId: string;
  offerId: string;
  customerId?: string | null;
  priceMinor: bigint;
  currency?: "USD";
  supplierFormality: "formal" | "informal";
  payload?: Record<string, unknown>;
};

export async function persistOfferSnapshotDurable(
  input: DurableOfferSnapshotInput,
  env: NodeJS.ProcessEnv = process.env,
): Promise<"accepted" | "duplicate" | "fixture_skip"> {
  if (integrationMode(env) === "fixture") return "fixture_skip";
  if (input.customerId) {
    await ensureDurableProfile({ userId: input.customerId }, env);
  }
  return restInsert(
    "offer_snapshots",
    {
      snapshot_id: input.snapshotId,
      offer_id: input.offerId,
      customer_id: input.customerId ?? null,
      price_minor: Number(input.priceMinor),
      currency: input.currency ?? "USD",
      offer_source: "MARKETPLACE",
      supplier_formality: input.supplierFormality,
      payload: input.payload ?? {},
    },
    env,
  );
}

export type DurableOrderLineInput = {
  lineId: string;
  offerId: string;
  title: string;
  qty: number;
  unitPriceMinor: bigint;
  currency?: "USD";
};

export type DurableOrderInput = {
  orderId: string;
  customerId: string;
  status: string;
  totalMinor: bigint;
  currency?: "USD";
  fxRateId?: string | null;
  lines: DurableOrderLineInput[];
};

export async function persistOrderDurable(
  input: DurableOrderInput,
  env: NodeJS.ProcessEnv = process.env,
): Promise<"accepted" | "duplicate" | "fixture_skip"> {
  if (integrationMode(env) === "fixture") return "fixture_skip";
  await ensureDurableProfile({ userId: input.customerId }, env);
  const orderResult = await restInsert(
    "orders",
    {
      order_id: input.orderId,
      customer_id: input.customerId,
      status: input.status,
      currency: input.currency ?? "USD",
      total_minor: Number(input.totalMinor),
      fx_rate_id: input.fxRateId ?? null,
    },
    env,
  );
  for (const line of input.lines) {
    await restInsert(
      "order_lines",
      {
        line_id: line.lineId,
        order_id: input.orderId,
        offer_id: line.offerId,
        title: line.title,
        qty: line.qty,
        unit_price_minor: Number(line.unitPriceMinor),
        currency: line.currency ?? "USD",
      },
      env,
    );
  }
  return orderResult;
}

export async function persistPaymentIntentDurable(
  input: {
    intentId: string;
    method: string;
    amountMinor: bigint;
    currency: string;
    status: string;
    orderId: string;
    idempotencyKey: string;
    fxRateId?: string | null;
  },
  env: NodeJS.ProcessEnv = process.env,
): Promise<"accepted" | "duplicate" | "fixture_skip"> {
  if (integrationMode(env) === "fixture") return "fixture_skip";
  return restInsert(
    "payment_intents",
    {
      intent_id: input.intentId,
      method: input.method,
      amount_minor: Number(input.amountMinor),
      currency: input.currency,
      status: input.status,
      order_id: input.orderId,
      idempotency_key: input.idempotencyKey,
      fx_rate_id: input.fxRateId ?? null,
    },
    env,
  );
}

export async function persistJobReserveDurable(
  input: {
    reserveId: string;
    jobOrOrderId: string;
    customerId: string;
    amountMinor: bigint;
    currency?: "USD";
    status: string;
  },
  env: NodeJS.ProcessEnv = process.env,
): Promise<"accepted" | "duplicate" | "fixture_skip"> {
  if (integrationMode(env) === "fixture") return "fixture_skip";
  await ensureDurableProfile({ userId: input.customerId }, env);
  return restInsert(
    "job_reserves",
    {
      reserve_id: input.reserveId,
      job_or_order_id: input.jobOrOrderId,
      customer_id: input.customerId,
      amount_minor: Number(input.amountMinor),
      currency: input.currency ?? "USD",
      status: input.status,
    },
    env,
  );
}

export async function persistFdmsOutboxDurable(
  input: {
    id: string;
    orderId: string;
    receiptClass: string;
    amountMinor: bigint;
    currency: string;
    channel: string;
    status: string;
    gateway?: string;
  },
  env: NodeJS.ProcessEnv = process.env,
): Promise<"accepted" | "duplicate" | "fixture_skip"> {
  if (integrationMode(env) === "fixture") return "fixture_skip";
  return restInsert(
    "fdms_outbox",
    {
      id: input.id,
      order_id: input.orderId,
      receipt_class: input.receiptClass,
      amount_minor: Number(input.amountMinor),
      currency: input.currency,
      channel: input.channel,
      status: input.status,
      gateway: input.gateway ?? "zimra_virtual_in_house",
    },
    env,
  );
}

export async function persistJournalDurable(
  input: {
    entryId: string;
    memo: string;
    lines: Array<{
      lineId: string;
      accountId: string;
      accountCode: string;
      accountName: string;
      amountMinor: bigint;
      currency: string;
    }>;
  },
  env: NodeJS.ProcessEnv = process.env,
): Promise<"accepted" | "duplicate" | "fixture_skip"> {
  if (integrationMode(env) === "fixture") return "fixture_skip";
  for (const line of input.lines) {
    await restUpsert(
      "accounts",
      {
        account_id: line.accountId,
        code: line.accountCode,
        name: line.accountName,
      },
      "account_id",
      env,
    );
  }
  const entryResult = await restInsert(
    "journal_entries",
    {
      entry_id: input.entryId,
      memo: input.memo,
    },
    env,
  );
  for (const line of input.lines) {
    await restInsert(
      "journal_lines",
      {
        line_id: line.lineId,
        entry_id: input.entryId,
        account_id: line.accountId,
        amount_minor: Number(line.amountMinor),
        currency: line.currency,
      },
      env,
    );
  }
  return entryResult;
}

export async function persistFxDailyRateDurable(
  input: {
    fxRateId: string;
    zigMinorPerUsd: bigint;
    effectiveAt: string;
    setBy: string;
  },
  env: NodeJS.ProcessEnv = process.env,
): Promise<"accepted" | "duplicate" | "fixture_skip"> {
  if (integrationMode(env) === "fixture") return "fixture_skip";
  return restInsert(
    "fx_daily_rates",
    {
      fx_rate_id: input.fxRateId,
      zig_minor_per_usd: Number(input.zigMinorPerUsd),
      effective_at: input.effectiveAt,
      set_by: input.setBy,
    },
    env,
  );
}

/**
 * Phase 8 prep (not G8) — WHT remittance batch row (migration `0006_phase8_wht_remittance.sql`).
 * Fail-closed without Supabase URL/key outside fixture.
 */
export async function persistWhtRemittanceBatchDurable(
  row: Record<string, unknown>,
  env: NodeJS.ProcessEnv = process.env,
): Promise<"accepted" | "duplicate" | "fixture_skip"> {
  if (integrationMode(env) === "fixture") return "fixture_skip";
  return restInsert("wht_remittance_batches", row, env);
}
