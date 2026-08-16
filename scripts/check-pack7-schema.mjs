/**
 * Assert Pack §7 canonical tables exist after `pnpm db:migrate`.
 * Names only — never prints row data.
 */
import pg from "pg";

const REQUIRED = [
  "profiles", "roles", "sessions_meta", "devices",
  "customers", "addresses", "consents",
  "vehicles", "vehicle_events", "expiry_reminders",
  "master_products", "part_numbers", "cross_refs", "quality_tier_rules",
  "fitment_claims", "vehicle_master", "catalog_nodes", "restricted_sku_rules",
  "catalogue_ingest_batches", "catalogue_ingest_rows", "catalogue_review_queue",
  "search_no_result_events", "demand_gap_aggregates", "catalogue_ai_candidates",
  "suppliers", "supplier_costs", "stock_signals", "heartbeats",
  "offers", "offer_snapshots",
  "technicians", "credentials", "availability", "managers_choice",
  "score_profiles", "technician_score_snapshots", "technician_score_events",
  "job_class_definitions", "trade_definitions", "trade_lifecycle_events",
  "jobs", "job_media", "job_assessments", "quotes", "variations",
  "assignments", "evidence",
  "projects", "milestones", "project_team", "project_budgets",
  "orders", "order_lines", "returns",
  "rate_cards", "rate_card_versions", "delivery_bands", "price_quotes",
  "promo_campaigns", "promo_campaign_budgets", "promo_budget_usages",
  "promo_promotions", "promo_application_methods", "promo_rules",
  "promo_rule_values", "promo_segments", "promo_buyget_rules",
  "promo_redemptions", "promo_credits", "promo_credit_ledger",
  "promo_validation_traces", "referral_programs", "referral_codes",
  "referral_edges", "supplier_coop_agreements",
  "payment_intents", "psp_events", "cod_attempts",
  "accounts", "journal_entries", "journal_lines", "job_reserves", "payouts",
  "fx_rate_versions", "fx_conversions", "fx_daily_rates",
  "tax_treatments", "fdms_outbox", "fiscal_days", "withholding_balances",
  "itf263_records",
  "zones", "shipments", "pod_media", "delivery_jobs", "delivery_offers",
  "delivery_assignment_events", "delivery_runs", "delivery_stops",
  "courier_locations",
  "guarantee_claims", "guarantee_provisions",
  "disputes", "dispute_evidence",
  "terms_versions", "terms_acceptances", "compliance_checklist_runs",
  "media_fingerprints", "fraud_signals",
  "ai_invocations", "intelligence_datasets", "intelligence_shadow_runs",
  "intelligence_promotions",
  "diagnostic_checklists", "checklist_step_outcomes",
  "simulation_scenarios", "simulation_runs", "simulation_sensitivity_reports",
  "outbox", "processed_events", "audit_events", "feature_flags",
  "domain_module_registry", "metric_contracts", "operational_alerts",
];

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL unset");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const { rows } = await client.query(
    `select table_name from information_schema.tables
     where table_schema = 'public' and table_type in ('BASE TABLE', 'VIEW')`,
  );
  const have = new Set(rows.map((r) => r.table_name));
  const missing = REQUIRED.filter((t) => !have.has(t));
  if (missing.length) {
    console.error(`missing Pack §7 tables: ${missing.join(", ")}`);
    process.exit(1);
  }
  console.log(`Pack §7 inventory ok (${REQUIRED.length} names)`);
} finally {
  await client.end();
}
