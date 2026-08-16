/**
 * Integration readiness report — which env groups are configured.
 * Never echoes secret values (D-47). S128/S138 probes; S139 env groups SoR;
 * S164 note via buildIntegrationsHealthNote.
 *
 * Kept out of the route so the report can be built (and asserted) without the
 * route's sandbox/live internal-secret guard.
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
import { pingInternalApiHealth, pingTemporalHealth } from "@dial/shared";
import { getFiscalDayState } from "@dial/tax";
import {
  buildIntegrationsHealthNote,
  buildIntegrationsProbes,
  integrationsReady,
  listIntegrationEnvGroupSnapshots,
} from "./integrationsReadiness.js";

export async function buildIntegrationsHealthBody(): Promise<
  Record<string, unknown>
> {
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

  return {
    ok: true,
    ready: integrationsReady(probes),
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
}

export async function integrationsHealthResponse(): Promise<NextResponse> {
  return NextResponse.json(await buildIntegrationsHealthBody());
}
