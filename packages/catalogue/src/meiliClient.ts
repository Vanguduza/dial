/**
 * Meilisearch HTTP client — Pack §6.3 / §8 settings.
 * Fixture mode skips network; sandbox/live requires MEILI_HOST + MEILI_MASTER_KEY.
 */
import {
  MEILI_SPARE_OFFERS_V1_SETTINGS,
  type SpareOfferDocument,
} from "@dial/catalogue";

export type IntegrationMode = "fixture" | "sandbox" | "live";

export function integrationMode(
  env: NodeJS.ProcessEnv = process.env,
): IntegrationMode {
  const m = (env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (m === "sandbox" || m === "live") return m;
  return "fixture";
}

function requireSecret(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} unset — fail closed`);
  return v;
}

function indexName(): string {
  return process.env.MEILI_SPARE_INDEX?.trim() || "spare_offers_v1";
}

export async function ensureSpareOffersIndex(): Promise<{
  indexUid: string;
  applied: boolean;
}> {
  const uid = indexName();
  if (integrationMode() === "fixture") {
    return { indexUid: uid, applied: true };
  }
  const host = requireSecret("MEILI_HOST").replace(/\/$/, "");
  const key = requireSecret("MEILI_MASTER_KEY");
  const headers = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  await fetch(`${host}/indexes`, {
    method: "POST",
    headers,
    body: JSON.stringify({ uid, primaryKey: "id" }),
  }).catch(() => undefined);
  const settingsRes = await fetch(`${host}/indexes/${uid}/settings`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(MEILI_SPARE_OFFERS_V1_SETTINGS),
  });
  if (!settingsRes.ok) {
    throw new Error(`Meili settings HTTP ${settingsRes.status}`);
  }
  return { indexUid: uid, applied: true };
}

export async function upsertSpareOfferDocuments(
  docs: SpareOfferDocument[],
): Promise<{ taskUid: string | "fixture" }> {
  if (integrationMode() === "fixture") {
    return { taskUid: "fixture" };
  }
  const host = requireSecret("MEILI_HOST").replace(/\/$/, "");
  const key = requireSecret("MEILI_MASTER_KEY");
  const uid = indexName();
  const res = await fetch(`${host}/indexes/${uid}/documents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(docs),
  });
  if (!res.ok) throw new Error(`Meili documents HTTP ${res.status}`);
  const data = (await res.json()) as { taskUid?: number };
  return { taskUid: String(data.taskUid ?? "unknown") };
}
