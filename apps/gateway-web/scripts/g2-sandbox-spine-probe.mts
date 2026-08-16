/**
 * One-shot G2 sandbox probe — COD durable spine (+ EcoCash when ECOCASH_* set).
 * Usage: load .env then node --import tsx scripts/g2-sandbox-spine-probe.mts
 */
import { __resetCatalogueForTests } from "@dial/catalogue";
import { __resetPaymentsForTests, setDailyZigRate } from "@dial/payments";
import { __resetLedgerForTests } from "@dial/ledger";
import { __resetTaxForTests } from "@dial/tax";
import { runG2SpareThinVertical } from "../src/lib/spare/g2Spine.ts";

__resetCatalogueForTests();
__resetPaymentsForTests();
__resetLedgerForTests();
__resetTaxForTests();
setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "g2_sandbox_probe" });

const stamp = Date.now();
const cod = await runG2SpareThinVertical({
  offerId: "off_filter_oil_kun26",
  payChoice: "cod",
  buyerSegment: "b2c",
  customerId: "cust_g2_sandbox_probe",
  idempotencyKey: `g2-sandbox-cod-${stamp}`,
});

let eco: Awaited<ReturnType<typeof runG2SpareThinVertical>> | null = null;
let ecoError: string | null = null;
try {
  eco = await runG2SpareThinVertical({
    offerId: "off_filter_oil_kun26",
    payChoice: "ecocash",
    buyerSegment: "b2c",
    customerId: "cust_g2_sandbox_probe",
    idempotencyKey: `g2-sandbox-eco-${stamp}`,
  });
} catch (e) {
  ecoError = e instanceof Error ? e.message : "ecocash failed";
}

console.log(
  JSON.stringify(
    {
      mode: cod.durable.mode,
      cod: {
        orderId: cod.orderId,
        snapshot: cod.durable.snapshot,
        order: cod.durable.order,
        jr: cod.durable.jobReserve,
        webhook: cod.webhook,
        journal: Boolean(cod.journalId),
        fiscal: cod.fiscalIds?.length ?? 0,
        leaks: cod.b2bInformalLeaks,
      },
      eco: eco
        ? {
            orderId: eco.orderId,
            snapshot: eco.durable.snapshot,
            order: eco.durable.order,
            jr: eco.durable.jobReserve,
            webhook: eco.webhook,
            journal: Boolean(eco.journalId),
            fiscal: eco.fiscalIds?.length ?? 0,
            providerRefPrefix: (eco.providerRef ?? "").slice(0, 8),
            leaks: eco.b2bInformalLeaks,
          }
        : { error: ecoError },
    },
    null,
    2,
  ),
);
