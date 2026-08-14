/**
 * Integration readiness health — reports which env groups are configured.
 * Never echoes secret values (D-47). S128/S138 probes; S139 env groups SoR;
 * S164 note via buildIntegrationsHealthNote.
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
import {
  buildIntegrationsHealthNote,
  buildIntegrationsProbes,
  integrationsReady,
  listIntegrationEnvGroupSnapshots,
} from "../../../../lib/integrationsReadiness.js";

export const runtime = "nodejs";

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

  const probes = buildIntegrationsProbes({
    temporal: temporal.ok,
    litellm: litellm.ok,
    maps: maps.ok,
    fdms: fdms.ok,
    meili: meili.ok,
    queues: queuesHealth.ok,
    whatsapp: whatsapp.ok,
    psp: psp.ok,
    internal: internal.ok,
  });
  const ready = integrationsReady(probes);

  const body = {
    ok: true,
    ready,
    mode,
    probes,
    pspMethods: listCanonicalPspMethods(),
    groups: listIntegrationEnvGroupSnapshots(),
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
    note: buildIntegrationsHealthNote(mode),
  };

  return NextResponse.json(body);
}
