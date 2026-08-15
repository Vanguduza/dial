/**
 * Meilisearch HTTP client — Pack §6.3 / §8 / PD2 + PD15 grocery.
 * Fixture mode skips network; sandbox/live requires MEILI_HOST + MEILI_MASTER_KEY.
 */
import {
  MEILI_SPARE_INDEX_DEFAULT,
  MEILI_SPARE_OFFERS_V1_SETTINGS,
  type SpareOfferDocument,
} from "./meiliSettings.js";
import {
  MEILI_GROCERY_INDEX_DEFAULT,
  MEILI_GROCERY_OFFERS_V1_SETTINGS,
  type GroceryOfferDocument,
} from "./grocery.js";

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

export function spareOffersIndexName(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return env.MEILI_SPARE_INDEX?.trim() || MEILI_SPARE_INDEX_DEFAULT;
}

export async function ensureSpareOffersIndex(): Promise<{
  indexUid: string;
  applied: boolean;
}> {
  const uid = spareOffersIndexName();
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
): Promise<{ taskUid: string | "fixture"; indexUid: string }> {
  const uid = spareOffersIndexName();
  if (integrationMode() === "fixture") {
    return { taskUid: "fixture", indexUid: uid };
  }
  const host = requireSecret("MEILI_HOST").replace(/\/$/, "");
  const key = requireSecret("MEILI_MASTER_KEY");
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
  return { taskUid: String(data.taskUid ?? "unknown"), indexUid: uid };
}

export function groceryOffersIndexName(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return env.MEILI_GROCERY_INDEX?.trim() || MEILI_GROCERY_INDEX_DEFAULT;
}

export async function ensureGroceryOffersIndex(): Promise<{
  indexUid: string;
  applied: boolean;
}> {
  const uid = groceryOffersIndexName();
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
    body: JSON.stringify(MEILI_GROCERY_OFFERS_V1_SETTINGS),
  });
  if (!settingsRes.ok) {
    throw new Error(`Meili grocery settings HTTP ${settingsRes.status}`);
  }
  return { indexUid: uid, applied: true };
}

export async function upsertGroceryOfferDocuments(
  docs: GroceryOfferDocument[],
): Promise<{ taskUid: string | "fixture"; indexUid: string }> {
  const uid = groceryOffersIndexName();
  if (integrationMode() === "fixture") {
    return { taskUid: "fixture", indexUid: uid };
  }
  const host = requireSecret("MEILI_HOST").replace(/\/$/, "");
  const key = requireSecret("MEILI_MASTER_KEY");
  const res = await fetch(`${host}/indexes/${uid}/documents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(docs),
  });
  if (!res.ok) throw new Error(`Meili grocery documents HTTP ${res.status}`);
  const data = (await res.json()) as { taskUid?: number };
  return { taskUid: String(data.taskUid ?? "unknown"), indexUid: uid };
}

/**
 * Live Meili search (PD2). Sandbox/live POST /indexes/{uid}/search with D-49 filter.
 * Fixture: caller should use in-memory searchOffers — this throws if invoked outside fixture
 * only when env missing; when fixture returns empty to force catalogue path.
 */
export async function searchSpareOfferDocuments(input: {
  q: string;
  filter: string;
  limit?: number;
}): Promise<{
  indexUid: string;
  hits: SpareOfferDocument[];
  source: "meili" | "fixture_skip";
}> {
  const uid = spareOffersIndexName();
  if (integrationMode() === "fixture") {
    return { indexUid: uid, hits: [], source: "fixture_skip" };
  }
  const host = requireSecret("MEILI_HOST").replace(/\/$/, "");
  const key = requireSecret("MEILI_MASTER_KEY");
  const res = await fetch(`${host}/indexes/${uid}/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: input.q,
      filter: input.filter,
      limit: input.limit ?? 20,
    }),
  });
  if (!res.ok) throw new Error(`Meili search HTTP ${res.status}`);
  const data = (await res.json()) as { hits?: SpareOfferDocument[] };
  return {
    indexUid: uid,
    hits: Array.isArray(data.hits) ? data.hits : [],
    source: "meili",
  };
}

/**
 * Search host reachability health (S124 / PD2).
 * Fixture: ensureSpareOffersIndex stub. Sandbox/live: fail closed without MEILI_*
 * and GET {MEILI_HOST}/health when configured. Never echoes master key.
 */
export async function pingMeiliHealth(
  env: NodeJS.ProcessEnv = process.env,
): Promise<{
  ok: boolean;
  mode: IntegrationMode;
  hostConfigured: boolean;
  keyConfigured: boolean;
  indexUid: string;
  ensureApplied?: boolean;
  healthHttp?: number;
  error?: string;
}> {
  const mode = integrationMode(env);
  const hostConfigured = Boolean(env.MEILI_HOST?.trim());
  const keyConfigured = Boolean(env.MEILI_MASTER_KEY?.trim());
  const uid = spareOffersIndexName(env);
  if (mode === "fixture") {
    const ensured = await ensureSpareOffersIndex();
    return {
      ok: true,
      mode,
      hostConfigured,
      keyConfigured,
      indexUid: ensured.indexUid,
      ensureApplied: ensured.applied,
    };
  }
  if (!hostConfigured || !keyConfigured) {
    return {
      ok: false,
      mode,
      hostConfigured,
      keyConfigured,
      indexUid: uid,
      error: "MEILI_HOST / MEILI_MASTER_KEY unset — fail closed",
    };
  }
  try {
    const host = env.MEILI_HOST!.replace(/\/$/, "");
    const key = env.MEILI_MASTER_KEY!;
    const res = await fetch(`${host}/health`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      return {
        ok: false,
        mode,
        hostConfigured,
        keyConfigured,
        indexUid: uid,
        healthHttp: res.status,
        error: `Meili /health HTTP ${res.status}`,
      };
    }
    return {
      ok: true,
      mode,
      hostConfigured,
      keyConfigured,
      indexUid: uid,
      healthHttp: res.status,
    };
  } catch (e) {
    return {
      ok: false,
      mode,
      hostConfigured,
      keyConfigured,
      indexUid: uid,
      error: e instanceof Error ? e.message : "Meili health unreachable",
    };
  }
}
