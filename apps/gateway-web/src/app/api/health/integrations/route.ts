/**
 * Integration readiness health — reports which env groups are configured.
 * Never echoes secret values (D-47).
 */
import { NextResponse } from "next/server";
import { listCanonicalPspMethods } from "@dial/adapter-psp";
import { createTemporalWorkerOptions } from "@dial/worker-temporal";

export const runtime = "nodejs";

function present(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function group(label: string, keys: string[]) {
  const missing = keys.filter((k) => !present(k));
  return {
    label,
    configured: missing.length === 0,
    missing,
    presentCount: keys.length - missing.length,
    requiredCount: keys.length,
  };
}

export async function GET() {
  const mode = (process.env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  let temporal: { ok: boolean; error?: string } = { ok: true };
  try {
    createTemporalWorkerOptions();
  } catch (e) {
    temporal = {
      ok: false,
      error: e instanceof Error ? e.message : "temporal config error",
    };
  }

  const body = {
    ok: true,
    mode,
    pspMethods: listCanonicalPspMethods(),
    groups: [
      group("whatsapp", [
        "WHATSAPP_TOKEN",
        "WHATSAPP_PHONE_NUMBER_ID",
        "WHATSAPP_APP_SECRET",
        "WHATSAPP_VERIFY_TOKEN",
      ]),
      group("paynow", ["PAYNOW_INTEGRATION_ID", "PAYNOW_INTEGRATION_KEY"]),
      group("contipay", [
        "CONTIPAY_API_KEY",
        "CONTIPAY_API_SECRET",
        "CONTIPAY_MERCHANT_ID",
      ]),
      group("ecocash", ["ECOCASH_API_KEY", "ECOCASH_MERCHANT_CODE", "ECOCASH_WEBHOOK_SECRET"]),
      group("paypal", ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_WEBHOOK_ID"]),
      group("escrow", ["PSP_ESCROW_BASE_URL", "PSP_ESCROW_API_KEY", "PSP_WEBHOOK_SECRET"]),
      group("fdms", ["FDMS_BASE_URL", "FDMS_DEVICE_ID", "FDMS_ACTIVATION_KEY"]),
      group("meili", ["MEILI_HOST", "MEILI_MASTER_KEY"]),
      group("litellm", ["LITELLM_BASE_URL", "LITELLM_API_KEY"]),
      group("maps", ["NOMINATIM_URL", "OSRM_URL"]),
      group("temporal", ["TEMPORAL_ADDRESS", "TEMPORAL_NAMESPACE"]),
      group("redis", ["REDIS_URL"]),
      group("internal", ["INTERNAL_API_SECRET"]),
    ],
    temporal,
    note:
      mode === "fixture"
        ? "Fixture mode — missing keys OK for CI"
        : "Sandbox/live — missing groups will fail closed on use",
  };

  return NextResponse.json(body);
}
