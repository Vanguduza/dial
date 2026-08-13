/**
 * Integration readiness health — reports which env groups are configured.
 * Never echoes secret values (D-47). S128: aggregate `ready` flag.
 */
import { NextResponse } from "next/server";
import { pingFdmsHealth } from "@dial/adapter-fdms";
import { pingMapsHealth } from "@dial/adapter-maps";
import { listCanonicalPspMethods, pingPspHealth } from "@dial/adapter-psp";
import { pingWhatsAppHealth } from "@dial/adapter-whatsapp";
import { pingLiteLlm } from "@dial/ai";
import { searchHealthSnapshot, pingMeiliHealth } from "@dial/catalogue";
import { listMoneyOutbox } from "@dial/ledger";
import {
  QUEUE_FDMS_DAY,
  QUEUE_OUTBOX_SIDE_EFFECTS,
  QUEUE_SEARCH_INDEXER,
  pingQueuesHealth,
} from "@dial/queues";
import { pingInternalApiHealth } from "@dial/shared";
import { getFiscalDayState } from "@dial/tax";
import { pingTemporalHealth } from "@dial/worker-temporal";

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

export async function GET(): Promise<NextResponse> {
  const mode = (process.env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  const temporal = pingTemporalHealth();
  const litellm = await pingLiteLlm();
  const maps = await pingMapsHealth();
  const fdms = await pingFdmsHealth();
  const meili = await pingMeiliHealth();
  const queuesHealth = await pingQueuesHealth();
  const whatsapp = await pingWhatsAppHealth();
  const psp = await pingPspHealth();
  const internal = await pingInternalApiHealth();

  const probes = {
    temporal: temporal.ok,
    litellm: litellm.ok,
    maps: maps.ok,
    fdms: fdms.ok,
    meili: meili.ok,
    queues: queuesHealth.ok,
    whatsapp: whatsapp.ok,
    psp: psp.ok,
    internal: internal.ok,
  };
  const ready = Object.values(probes).every(Boolean);

  const body = {
    ok: true,
    ready,
    mode,
    probes,
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
    litellm,
    maps,
    fdms,
    whatsapp,
    psp,
    internal,
    queues: {
      searchIndexer: QUEUE_SEARCH_INDEXER,
      outboxSideEffects: QUEUE_OUTBOX_SIDE_EFFECTS,
      fdmsDay: QUEUE_FDMS_DAY,
      health: queuesHealth,
    },
    fiscalDay: getFiscalDayState(),
    moneyOutbox: { depth: listMoneyOutbox().length },
    search: {
      ...searchHealthSnapshot(),
      meili,
    },
    note:
      mode === "fixture"
        ? "Fixture mode — missing keys OK for CI; ready=all probes ok"
        : "Sandbox/live — missing groups will fail closed on use; ready=all probes ok",
  };

  return NextResponse.json(body);
}
