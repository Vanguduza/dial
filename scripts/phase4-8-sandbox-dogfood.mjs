/**
 * Phase 4/8 sandbox durable dogfood — REST persist smoke after migrations.
 * Never prints secret values or row payloads. Does not claim G4/G8.
 * Usage: node --env-file=.env scripts/phase4-8-sandbox-dogfood.mjs
 */
const url = (
  process.env.SUPABASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  ""
).replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

function log(msg) {
  console.log(msg);
}

async function upsert(table, row, onConflict) {
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
      signal: AbortSignal.timeout(20_000),
    },
  );
  log(`persist_${table}=HTTP_${res.status}`);
  if (!res.ok) {
    const t = await res.text();
    log(`persist_${table}_error=${t.slice(0, 120)}`);
    return false;
  }
  return true;
}

async function probe(table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=0`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(12_000),
  });
  log(`probe_${table}=HTTP_${res.status}`);
  return res.ok;
}

async function main() {
  log("phase4-8-sandbox-dogfood start");
  log(`SUPABASE_URL=${url ? "SET" : "MISSING"}`);
  log(`SUPABASE_SERVICE_ROLE_KEY=${key ? "SET" : "MISSING"}`);
  log(`DIAL_INTEGRATION_MODE=${process.env.DIAL_INTEGRATION_MODE || "unset"}`);

  if (!url || !key) {
    log("RESULT=blocked_no_supabase_config");
    process.exit(1);
  }

  const ts = Date.now();
  const supplierId = `sup_dogfood_${ts}`;
  const orderId = `ord_dogfood_${ts}`;
  const campaignId = `coop_dogfood_${ts}`;
  const batchId = `wht_dogfood_${ts}`;

  const ok =
    (await upsert(
      "suppliers",
      {
        supplier_id: supplierId,
        display_name: "Dogfood Formal Agency",
        formality: "formal",
        tier: "gold",
        offer_source: "MARKETPLACE",
      },
      "supplier_id",
    )) &&
    (await upsert(
      "supplier_confirm_orders",
      {
        order_id: orderId,
        supplier_id: supplierId,
        amount_usd_minor: 4500,
        status: "awaiting_confirm",
        sla_deadline_at: new Date(Date.now() + 3600_000).toISOString(),
        payable_from_ai: false,
      },
      "order_id",
    )) &&
    (await upsert(
      "supplier_coop_offers",
      {
        campaign_id: campaignId,
        supplier_id: supplierId,
        offer_ids: ["off_dogfood_1"],
        supplier_fund_share_bps: 5000,
        dial_fund_share_bps: 5000,
        status: "proposed",
        payable_from_ai: false,
        liquor_allowed: false,
      },
      "campaign_id",
    )) &&
    (await upsert(
      "wht_remittance_batches",
      {
        batch_id: batchId,
        year_of_assessment: new Date().getFullYear(),
        status: "draft",
        total_withheld_minor: 0,
        currency: "USD",
        payable_from_ai: false,
        lines_json: [],
      },
      "batch_id",
    ));

  for (const table of [
    "suppliers",
    "supplier_confirm_orders",
    "supplier_coop_offers",
    "wht_remittance_batches",
    "catalogue_ingest_batches",
    "sla_escalations",
  ]) {
    await probe(table);
  }

  if (ok) {
    log("RESULT=dogfood_ok not_G4_not_G8");
  } else {
    log("RESULT=dogfood_failed");
    process.exit(1);
  }
}

main().catch((e) => {
  log(`RESULT=fatal message=${e instanceof Error ? e.message.slice(0, 120) : "unknown"}`);
  process.exit(1);
});
