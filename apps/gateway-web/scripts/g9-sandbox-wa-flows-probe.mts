/**
 * G9 sandbox WA Flows evidence — FLOW_SPARE/GROCERY EcoCash|COD + fiscal channel=wa.
 * Key-drop-in complete; does NOT claim G9 live (ENH-021 WABA + approved template IDs).
 *
 * Usage: pnpm --filter @dial/gateway-web exec node --import tsx scripts/g9-sandbox-wa-flows-probe.mts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertNoUnofficialWhatsAppDeps,
  pingWhatsAppHealth,
  runG9WaFlowsSandboxEvidence,
} from "@dial/adapter-whatsapp";

const envPath = join(process.cwd(), "..", "..", ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    if (!process.env[key]) {
      process.env[key] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
}

const evidenceDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "docs",
  "ops",
  "evidence",
  "g9",
);
mkdirSync(evidenceDir, { recursive: true });

process.env.DIAL_INTEGRATION_MODE = "sandbox";
process.env.DIAL_G2_ALLOW_FX_SEED = "1";

const rootPkgPaths = [
  join(process.cwd(), "..", "..", "package.json"),
  join(process.cwd(), "..", "..", "adapters", "whatsapp", "package.json"),
];

const report: Record<string, unknown> = {
  g9Claimed: false,
  not_G9_live: true,
  enh021BlockingLive: true,
  mode: "sandbox",
  health: null as unknown,
  flows: null as unknown,
  baileysForbidden: true,
  ok: false,
};

try {
  assertNoUnofficialWhatsAppDeps(
    rootPkgPaths.filter((p) => existsSync(p)).map((p) => readFileSync(p, "utf8")),
  );
  report.health = await pingWhatsAppHealth();
  if (
    !process.env.WHATSAPP_TOKEN?.trim() ||
    !process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
  ) {
    report.ok = false;
    report.error = "WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID unset — fail closed";
  } else if (
    !process.env.ECOCASH_API_KEY?.trim() ||
    !process.env.ECOCASH_MERCHANT_CODE?.trim()
  ) {
    report.ok = false;
    report.error =
      "ECOCASH_API_KEY + ECOCASH_MERCHANT_CODE required for EcoCash Flow pay path";
  } else {
    const flows = await runG9WaFlowsSandboxEvidence();
    report.flows = flows;
    report.ok =
      flows.spare.fiscalChannel === "wa" &&
      flows.grocery.fiscalChannel === "wa" &&
      (flows.fiscalOutboxWaCount as number) >= 4 &&
      flows.spare.intentMethod === "ecocash_direct" &&
      flows.grocery.codCurrency === "USD";
  }
} catch (e) {
  report.error = e instanceof Error ? e.message : String(e);
  report.ok = false;
}

writeFileSync(
  join(evidenceDir, "g9-sandbox-wa-flows-probe.json"),
  JSON.stringify(report, null, 2) + "\n",
);

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
