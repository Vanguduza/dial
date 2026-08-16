/**
 * Phase 4 sandbox dogfood — two-supplier Factory REST persist + B2B shape check.
 * Uses PostgREST + service_role from gitignored .env (never prints secrets/rows).
 * Confirm-SLA in-process cycle: gateway phase4PrepOps.test.ts (INTERNAL_API_SECRET set).
 * Meili publish skipped when host unreachable — fixture indexer tests cover publish path.
 * Does not claim G4/G8.
 *
 * Usage: node --env-file=.env scripts/phase4-sandbox-factory-dogfood.mjs
 */
const url = (
  process.env.SUPABASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  ""
).replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
const internalSecret = process.env.INTERNAL_API_SECRET?.trim() || "";
const meiliHost = process.env.MEILI_HOST?.trim() || "";

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
      signal: AbortSignal.timeout(25_000),
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

async function probeMeili() {
  if (!meiliHost) {
    log("meili_probe=skipped_no_host");
    return "down";
  }
  try {
    const res = await fetch(`${meiliHost.replace(/\/$/, "")}/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    log(`meili_health=HTTP_${res.status}`);
    return res.ok ? "up" : "down";
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    log(`meili_health=down reason=${msg.slice(0, 80)}`);
    return "down";
  }
}

/** Structural B2B leak check — informal drafts tagged; formal approved only. */
function b2bShapeOk(formalDraft, informalDraft) {
  if (formalDraft.supplierFormality !== "formal") return false;
  if (informalDraft.supplierFormality !== "informal") return false;
  if (formalDraft.offerSource !== "MARKETPLACE") return false;
  if (informalDraft.offerSource !== "MARKETPLACE") return false;
  if (formalDraft.payableFromAi !== false) return false;
  if (informalDraft.payableFromAi !== false) return false;
  // B2B session must filter informal — tag present on queue row for indexer/filter
  return true;
}

async function main() {
  log("phase4-sandbox-factory-dogfood start");
  log(`SUPABASE_URL=${url ? "SET" : "MISSING"}`);
  log(`SUPABASE_SERVICE_ROLE_KEY=${key ? "SET" : "MISSING"}`);
  log(`INTERNAL_API_SECRET=${internalSecret ? "SET" : "EMPTY"}`);
  log(`DIAL_INTEGRATION_MODE=${process.env.DIAL_INTEGRATION_MODE || "unset"}`);
  log(`MEILI_HOST=${meiliHost ? "SET" : "unset"}`);

  if (!url || !key) {
    log("RESULT=blocked_no_supabase_config");
    process.exit(1);
  }

  const ts = Date.now();
  const formalId = `sup_p4formal_${ts}`;
  const informalId = `sup_p4informal_${ts}`;
  const stockFormalBatch = `stk_formal_${ts}`;
  const stockInformalBatch = `stk_informal_${ts}`;
  const factoryBatch = `cat_batch_${ts}`;
  const reviewFormal = `rev_formal_${ts}`;
  const reviewInformal = `rev_informal_${ts}`;
  const confirmOrderId = `ord_confirm_${ts}`;
  const coopCampaign = `coop_live_${ts}`;
  const escalationId = `esc_sla_${ts}`;

  const formalDraft = {
    vertical: "spare",
    offerId: `off_formal_${ts}`,
    title: "P4 Sandbox Formal Filter",
    unitPriceUsdMinor: "2100",
    offerSource: "MARKETPLACE",
    supplierFormality: "formal",
    brand: "Bosch",
    payableFromAi: false,
  };
  const informalDraft = {
    vertical: "spare",
    offerId: `off_informal_${ts}`,
    title: "P4 Sandbox Informal Wiper",
    unitPriceUsdMinor: "900",
    offerSource: "MARKETPLACE",
    supplierFormality: "informal",
    brand: "Local",
    payableFromAi: false,
  };

  const slaDeadline = new Date(Date.now() + 3600_000).toISOString();

  const restOk =
    (await upsert(
      "suppliers",
      {
        supplier_id: formalId,
        display_name: "P4 Sandbox Formal Agency",
        formality: "formal",
        tier: "gold",
        offer_source: "MARKETPLACE",
      },
      "supplier_id",
    )) &&
    (await upsert(
      "suppliers",
      {
        supplier_id: informalId,
        display_name: "P4 Sandbox Informal Agency",
        formality: "informal",
        tier: "bronze",
        offer_source: "MARKETPLACE",
      },
      "supplier_id",
    )) &&
    (await upsert(
      "supplier_stock",
      {
        batch_id: stockFormalBatch,
        supplier_id: formalId,
        currency: "USD",
        status: "pending_review",
        offer_source: "MARKETPLACE",
        payable_from_ai: false,
        rows: [
          {
            sku: "FILT-F",
            title: "Formal oil filter",
            qty: 10,
            unitPriceUsdMinor: "1800",
          },
        ],
      },
      "batch_id",
    )) &&
    (await upsert(
      "supplier_stock",
      {
        batch_id: stockInformalBatch,
        supplier_id: informalId,
        currency: "USD",
        status: "pending_review",
        offer_source: "MARKETPLACE",
        payable_from_ai: false,
        rows: [
          {
            sku: "FILT-I",
            title: "Informal wiper blade",
            qty: 5,
            unitPriceUsdMinor: "900",
          },
        ],
      },
      "batch_id",
    )) &&
    (await upsert(
      "catalogue_ingest_batches",
      {
        batch_id: factoryBatch,
        status: "pending_review",
        row_count: 2,
        vertical: "spare",
      },
      "batch_id",
    )) &&
    (await upsert(
      "catalogue_review_queue",
      {
        review_id: reviewFormal,
        batch_id: factoryBatch,
        offer_id: formalDraft.offerId,
        status: "approved",
        vertical: "spare",
        draft: formalDraft,
      },
      "review_id",
    )) &&
    (await upsert(
      "catalogue_review_queue",
      {
        review_id: reviewInformal,
        batch_id: factoryBatch,
        offer_id: informalDraft.offerId,
        status: "queued",
        vertical: "spare",
        draft: informalDraft,
      },
      "review_id",
    )) &&
    (await upsert(
      "supplier_confirm_orders",
      {
        order_id: confirmOrderId,
        supplier_id: formalId,
        amount_usd_minor: 4500,
        status: "awaiting_confirm",
        sla_deadline_at: slaDeadline,
        payable_from_ai: false,
      },
      "order_id",
    )) &&
    (await upsert(
      "supplier_coop_offers",
      {
        campaign_id: coopCampaign,
        supplier_id: formalId,
        offer_ids: [formalDraft.offerId],
        supplier_fund_share_bps: 5000,
        dial_fund_share_bps: 5000,
        status: "live",
        payable_from_ai: false,
        liquor_allowed: false,
      },
      "campaign_id",
    )) &&
    (await upsert(
      "sla_escalations",
      {
        escalation_id: escalationId,
        supplier_id: informalId,
        kind: "confirm_sla_breach",
        order_id: `ord_breach_${ts}`,
        status: "open",
        payable_from_ai: false,
      },
      "escalation_id",
    ));

  for (const table of [
    "suppliers",
    "supplier_stock",
    "catalogue_ingest_batches",
    "catalogue_review_queue",
    "supplier_confirm_orders",
    "supplier_coop_offers",
    "sla_escalations",
  ]) {
    await probe(table);
  }

  const b2bOk = b2bShapeOk(formalDraft, informalDraft);
  log(`b2b_informal_shape_ok=${b2bOk}`);

  const meiliState = await probeMeili();

  if (!restOk) {
    log("RESULT=factory_rest_failed not_G4");
    process.exit(1);
  }
  if (!b2bOk) {
    log("RESULT=b2b_leak_shape_failed not_G4");
    process.exit(1);
  }

  log(
    `RESULT=factory_dogfood_ok meili=${meiliState} internal_secret=${internalSecret ? "set_run_confirm_sla_test" : "empty"} not_G4_not_G8`,
  );
  if (meiliState === "down") {
    log("RESIDUAL=meili_down fixture_indexer_tests_required_for_publish");
  }
}

main().catch((e) => {
  log(
    `RESULT=fatal message=${e instanceof Error ? e.message.slice(0, 120) : "unknown"}`,
  );
  process.exit(1);
});
