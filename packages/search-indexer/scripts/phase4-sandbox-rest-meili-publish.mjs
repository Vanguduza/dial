/**
 * Phase 4 G4 — REST-persisted Factory queue → Meili publish + search verify.
 * 1) Run phase4-sandbox-factory-dogfood (PostgREST two-supplier rows)
 * 2) Publish approved formal review from durable REST (non-fixture taskUid)
 * 3) Assert search returns offerId + B2B informal leak=0
 *
 * Usage (repo root, loads .env):
 *   node --env-file=.env --import tsx packages/search-indexer/scripts/phase4-sandbox-rest-meili-publish.mjs
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { publishRestApprovedFactoryOffersViaIndexer } from "../src/index.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const envFile = join(root, ".env");

function log(msg) {
  console.log(msg);
}

const dogfood = spawnSync(
  process.execPath,
  ["--env-file", envFile, "scripts/phase4-sandbox-factory-dogfood.mjs"],
  { cwd: root, stdio: "inherit", env: process.env },
);
if (dogfood.status !== 0) {
  log(JSON.stringify({ ok: false, step: "factory_dogfood", not_G4: true }));
  process.exit(1);
}

if (!process.env.DIAL_INTEGRATION_MODE?.trim()) {
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
}

try {
  const out = await publishRestApprovedFactoryOffersViaIndexer(process.env);
  const payload = {
    ok: out.ok,
    publishedCount: out.published.length,
    skippedQueued: out.skippedQueued,
    published: out.published.map((p) => ({
      reviewId: p.reviewId,
      offerId: p.offerId,
      publishTaskUid: p.publishTaskUid,
      searchHits: p.searchHits,
      searchSource: p.searchSource,
      b2bInformalHits: p.b2bInformalHits,
    })),
    not_G4: !out.ok,
  };
  log(JSON.stringify(payload, null, 2));
  process.exit(out.ok ? 0 : 1);
} catch (e) {
  log(
    JSON.stringify({
      ok: false,
      error: e instanceof Error ? e.message.slice(0, 200) : "unknown",
      not_G4: true,
    }),
  );
  process.exit(1);
}
