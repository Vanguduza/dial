/**
 * Phase 12 hardening prep evidence (not G12 / not S99).
 * Records local AppSec + ops contracts. Remote staging cohort remains ENH-011.
 *
 * Usage: pnpm --filter @dial/gateway-web exec node --import tsx scripts/g12-hardening-prep.mts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const evidenceDir = join(repoRoot, "docs/ops/evidence/g12");
mkdirSync(evidenceDir, { recursive: true });

function has(rel: string): boolean {
  return existsSync(join(repoRoot, rel));
}

const ordersSrc = readFileSync(
  join(repoRoot, "apps/gateway-web/src/app/api/spare/orders/route.ts"),
  "utf8",
);
const paynowSrc = readFileSync(
  join(repoRoot, "apps/gateway-web/src/app/api/webhooks/paynow/route.ts"),
  "utf8",
);
const reconSrc = readFileSync(
  join(repoRoot, "apps/gateway-web/scripts/g5-admin-delivery-recon.mts"),
  "utf8",
);
const restore = existsSync(
  join(repoRoot, "docs/ops/evidence/restore-drill/latest.json"),
)
  ? (JSON.parse(
      readFileSync(
        join(repoRoot, "docs/ops/evidence/restore-drill/latest.json"),
        "utf8",
      ),
    ) as { executed?: boolean; reason?: string })
  : { executed: false, reason: "missing" };

const report = {
  g12Claimed: false,
  not_G12: true,
  not_S99: true,
  mode: "eng_prep",
  appsec: {
    spareOrdersSessionSoR: /requireSession/.test(ordersSrc),
    spareOrdersRejectsBodyCustomerId: /customerId from body rejected/.test(ordersSrc),
    paynowVerifyThenIdempotency:
      /verifyWebhook/.test(paynowSrc) && /claimProcessedEventDurable/.test(paynowSrc),
    idorRouteTests: has("apps/gateway-web/src/lib/auth/idor.routes.test.ts"),
    phase12PrepOps: has("apps/gateway-web/src/lib/admin/phase12PrepOps.test.ts"),
  },
  maps: {
    dialMap: has("apps/gateway-web/src/components/map/DialMap.tsx"),
    reconRequiresGlCanvas: /maplibregl-canvas/.test(reconSrc),
    g5Claimed: false,
  },
  ops: {
    incident: has("docs/ops/incident-response.md"),
    degradation: has("docs/ops/degradation.md"),
    restoreDrillDoc: has("docs/security/restore-drill.md"),
    restoreDrillExecuted: restore.executed === true,
    restoreDrillReason: restore.reason ?? null,
    s516Dormancy: has("docs/ops/phase12-s516-dormancy.md"),
    storeListingDrafts: has("docs/ops/phase3-store-listing-drafts.md"),
  },
  blocked_on_human: [
    "ENH-011 remote staging URL (G12 cohort)",
    "G3 signing / device PNGs",
    "G5 ENH-013 mbtiles + device POD",
    "G6 device PNG",
    "G9 ENH-021 WABA",
    "Appendix C / G12-H",
  ],
  ok: false,
};

report.ok =
  report.appsec.spareOrdersSessionSoR &&
  report.appsec.spareOrdersRejectsBodyCustomerId &&
  report.appsec.paynowVerifyThenIdempotency &&
  report.appsec.idorRouteTests &&
  report.appsec.phase12PrepOps &&
  report.maps.dialMap &&
  report.maps.reconRequiresGlCanvas &&
  report.ops.incident &&
  report.ops.degradation &&
  report.ops.s516Dormancy &&
  report.g12Claimed === false;

writeFileSync(
  join(evidenceDir, "g12-hardening-prep.json"),
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
