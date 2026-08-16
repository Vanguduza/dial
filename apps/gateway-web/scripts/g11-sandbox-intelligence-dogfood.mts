/**
 * G11 sandbox Intelligence / Command Centre evidence (D-54).
 * Promptfoo fail→no promote; Actual KPI recommended action cannot pay;
 * Simulated payout forbidden. Does NOT claim live Langfuse/Promptfoo CLI keys.
 *
 * Usage: pnpm --filter @dial/gateway-web exec node --import tsx scripts/g11-sandbox-intelligence-dogfood.mts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  guidedIntake,
  runG11IntelligenceCommandCentreSandboxEvidence,
} from "@dial/ai";

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
  "g11",
);
mkdirSync(evidenceDir, { recursive: true });

const promptfooSmokeCases = [
  "Car won't start, maybe battery",
  "Need a diagnostic for rough idle",
  "Emergency tow after accident",
];

const report: Record<string, unknown> = {
  g11Claimed: false,
  not_G11: true,
  mode: "sandbox",
  promptfoo: {
    smokeCases: promptfooSmokeCases.length,
    smokeOk: false,
    failBlocksPromote: false,
    passThenHumanPromotes: false,
  },
  commandCentre: {
    actualKpiRecommendedActionId: null as string | null,
    recommendedActionCannotPay: false,
    simulatedPayoutForbidden: false,
    autoPublishForbidden: false,
    g7SimulatedReconRef:
      "docs/ops/evidence/g7/g7-admin-ops-recon.json ccPayoutBlocked=true",
  },
  aiCapabilityReview: "docs/agent-audits/ai-capability-G11-2026-08-16.md",
  ok: false,
};

try {
  for (const customerText of promptfooSmokeCases) {
    const out = JSON.stringify(guidedIntake({ customerText }));
    if (/amountMinor|"price"/i.test(out)) {
      throw new Error("Promptfoo smoke: payable keys forbidden in guidedIntake");
    }
    if (!/"needsHumanQuote":true/.test(out)) {
      throw new Error("Promptfoo smoke: needsHumanQuote required");
    }
  }
  (report.promptfoo as Record<string, unknown>).smokeOk = true;

  const g11 = runG11IntelligenceCommandCentreSandboxEvidence();
  (report.promptfoo as Record<string, unknown>).failBlocksPromote =
    g11.promptfooFailBlocksPromote;
  (report.promptfoo as Record<string, unknown>).passThenHumanPromotes =
    g11.promptfooPassThenHumanPromotes;
  (report.commandCentre as Record<string, unknown>).actualKpiRecommendedActionId =
    g11.actualKpiRecommendedActionId;
  (report.commandCentre as Record<string, unknown>).recommendedActionCannotPay =
    g11.actualKpiRecommendedActionCannotPay;
  (report.commandCentre as Record<string, unknown>).simulatedPayoutForbidden =
    g11.simulatedPayoutForbidden;
  (report.commandCentre as Record<string, unknown>).autoPublishForbidden =
    g11.autoPublishForbidden;

  report.ok =
    g11.promptfooFailBlocksPromote &&
    g11.promptfooPassThenHumanPromotes &&
    g11.actualKpiRecommendedActionCannotPay &&
    g11.simulatedPayoutForbidden &&
    g11.autoPublishForbidden &&
    (report.promptfoo as Record<string, unknown>).smokeOk === true;

  if (report.ok) {
    report.g11Claimed = true;
    report.not_G11 = false;
  }
} catch (e) {
  report.error = e instanceof Error ? e.message : String(e);
  report.ok = false;
}

writeFileSync(
  join(evidenceDir, "g11-sandbox-intelligence-dogfood.json"),
  JSON.stringify(report, null, 2) + "\n",
);

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
