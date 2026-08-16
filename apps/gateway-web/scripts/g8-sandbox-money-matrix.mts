/**
 * G8 sandbox money matrix evidence — EcoCash pretend + COD + Paynow + FDMS day + WHT.
 * Does not claim live/production rails; live keys remain blocked_on_human (ENH-020/022).
 *
 * Usage: pnpm --filter @dial/gateway-web exec node --import tsx scripts/g8-sandbox-money-matrix.mts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { __resetCatalogueForTests } from "@dial/catalogue";
import { __resetLedgerForTests, runPd11FdmsSandboxThinVertical } from "@dial/ledger";
import {
  __resetPaymentsForTests,
  __resetWhtRemittanceForTests,
  runPd4MoneySpine,
  setDailyZigRate,
} from "@dial/payments";
import { __resetTaxForTests } from "@dial/tax";
import { runG2SpareThinVertical } from "../src/lib/spare/g2Spine.ts";

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
  "g8",
);
mkdirSync(evidenceDir, { recursive: true });

process.env.DIAL_INTEGRATION_MODE = "sandbox";
process.env.DIAL_G2_ALLOW_FX_SEED = "1";
process.env.FDMS_BASE_URL = process.env.FDMS_BASE_URL?.trim() || "https://fdms.sandbox.dial.local";
process.env.FDMS_DEVICE_ID = process.env.FDMS_DEVICE_ID?.trim() || "dev_g8_matrix";
process.env.FDMS_ACTIVATION_KEY = process.env.FDMS_ACTIVATION_KEY?.trim() || "act_g8_matrix";
delete process.env.FDMS_SANDBOX_HTTP;

__resetCatalogueForTests();
__resetPaymentsForTests();
__resetLedgerForTests();
__resetTaxForTests();
__resetWhtRemittanceForTests();
setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "g8_matrix_probe" });

const stamp = Date.now();
const matrix: Record<string, unknown> = {
  g8Claimed: false,
  not_G8_live: true,
  mode: "sandbox",
  liveBlockedOnHuman: [
    "ENH-020 escrow partner (PSP_ESCROW_*)",
    "ENH-022 ZIMRA Virtual FDMS live submit",
    "EcoCash portal keys (live/production-intent)",
  ],
  rails: {} as Record<string, unknown>,
  fdms: null as unknown,
  wht: null as unknown,
  ok: false,
};

try {
  const cod = await runG2SpareThinVertical({
    offerId: "off_filter_oil_kun26",
    payChoice: "cod",
    buyerSegment: "b2c",
    customerId: "cust_g8_matrix",
    idempotencyKey: `g8-cod-${stamp}`,
  });
  (matrix.rails as Record<string, unknown>).cod = {
    orderId: cod.orderId,
    journal: Boolean(cod.journalId),
    webhook: cod.webhook,
    b2bLeaks: cod.b2bInformalLeaks,
  };

  const eco = await runG2SpareThinVertical({
    offerId: "off_filter_oil_kun26",
    payChoice: "ecocash",
    buyerSegment: "b2c",
    customerId: "cust_g8_matrix",
    idempotencyKey: `g8-eco-${stamp}`,
    simulateEcoCashWebhook: true,
  });
  (matrix.rails as Record<string, unknown>).ecocash = {
    orderId: eco.orderId,
    providerRefPrefix: (eco.providerRef ?? "").slice(0, 8),
    journal: Boolean(eco.journalId),
    webhook: eco.webhook,
    b2bLeaks: eco.b2bInformalLeaks,
  };

  (matrix.rails as Record<string, unknown>).paynow = await (async () => {
    const prevMode = process.env.DIAL_INTEGRATION_MODE;
    process.env.DIAL_INTEGRATION_MODE = "fixture";
    __resetPaymentsForTests();
    __resetLedgerForTests();
    __resetTaxForTests();
    try {
      const paynow = await runPd4MoneySpine({
        rail: "paynow_hosted",
        orderId: `ord_g8_pn_${stamp}`,
        supplierDisplayName: "Acme Spares",
        formality: "formal",
        amountUsdMinor: 22_00n,
        dialFeeUsdMinor: 130n,
        buyerSegment: "b2c",
        channel: "web",
        pspEventId: `g8_pn_evt_${stamp}`,
      });
      return {
        mode: "fixture",
        orderId: paynow.intent.orderId,
        providerRefPrefix: (paynow.intent.providerRef ?? "").slice(0, 10),
        journal: Boolean(paynow.journalId),
        webhook: paynow.webhook,
        fiscalCount: paynow.fiscalIds.length,
        note: "Paynow fixture rail — live PAYNOW_* keys remain blocked_on_human",
      };
    } finally {
      if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
      else process.env.DIAL_INTEGRATION_MODE = prevMode;
      __resetPaymentsForTests();
      __resetLedgerForTests();
      __resetTaxForTests();
    }
  })();

  const fdms = await runPd11FdmsSandboxThinVertical({
    orderId: `ord_g8_fdms_${stamp}`,
  });
  matrix.fdms = {
    fiscalDayId: fdms.dayOpened.fiscalDayId,
    fiscalCodes: fdms.fiscalCodes.length,
    dayClosed: Boolean(fdms.dayClosed.closedAt),
    moneyDrain: fdms.moneyDrain.length,
  };

  process.env.INTERNAL_API_SECRET =
    process.env.INTERNAL_API_SECRET?.trim() || "g8_matrix_wht_fixture";
  const { POST: whtPost } = await import("../src/app/api/admin/compliance/wht/route.js");
  const pay = await whtPost(
    new Request("http://localhost/api/admin/compliance/wht", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": process.env.INTERNAL_API_SECRET,
        "Idempotency-Key": `g8-wht-${stamp}`,
      },
      body: JSON.stringify({
        action: "record_payout",
        technicianId: "tech_g8_matrix",
        payoutUsdMinor: "10000",
        hasItf263: false,
      }),
    }),
  );
  const payJson = (await pay.json()) as {
    withholdMinor?: string;
    rateBps?: number;
  };
  matrix.wht = {
    status: pay.status,
    rateBps: payJson.rateBps,
    withholdMinor: payJson.withholdMinor,
  };

  const rails = matrix.rails as Record<
    string,
    { journal?: boolean; webhook?: string; mode?: string }
  >;
  matrix.ok =
    Boolean(rails.cod?.journal) &&
    Boolean(rails.ecocash?.journal) &&
    rails.ecocash?.webhook === "captured" &&
    Boolean(rails.paynow?.journal) &&
    rails.paynow?.webhook === "captured" &&
    Boolean((matrix.fdms as { dayClosed?: boolean }).dayClosed) &&
    pay.status === 200 &&
    payJson.rateBps === 3000;

  if (matrix.ok) {
    matrix.g8Claimed = true;
    matrix.not_G8_live = true;
    matrix.note =
      "G8 sandbox matrix green; live Paynow/ZIMRA/EcoCash/escrow remain blocked_on_human (Appendix §5)";
  }
} catch (e) {
  matrix.error = e instanceof Error ? e.message : String(e);
  matrix.ok = false;
}

writeFileSync(
  join(evidenceDir, "g8-sandbox-money-matrix.json"),
  JSON.stringify(matrix, null, 2) + "\n",
);
console.log(JSON.stringify(matrix, null, 2));
process.exit(matrix.ok ? 0 : 1);
