/**
 * Optional Paynow hosted rail probe (not G2 exit) — fixture always;
 * sandbox fails closed without PAYNOW_* (key-drop-in).
 * Usage: load .env then node --import tsx scripts/g2-paynow-hosted-probe.mts
 */
import { __resetCatalogueForTests } from "@dial/catalogue";
import { __resetPaymentsForTests, setDailyZigRate } from "@dial/payments";
import { runG2SparePaynowHosted } from "../src/lib/spare/g2Spine.ts";

__resetCatalogueForTests();
__resetPaymentsForTests();
setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "g2_paynow_probe" });

try {
  const pn = await runG2SparePaynowHosted({
    offerId: "off_filter_oil_kun26",
    buyerSegment: "b2c",
    customerId: "cust_g2_paynow_probe",
    idempotencyKey: `g2-paynow-probe-${Date.now()}`,
  });
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: pn.durable.mode,
        orderId: pn.orderId,
        intentId: pn.intentId,
        hostedUrlPresent: Boolean(pn.hostedUrl),
        durable: pn.durable,
        leaks: pn.b2bInformalLeaks,
        note: pn.note,
      },
      null,
      2,
    ),
  );
} catch (e) {
  const msg = e instanceof Error ? e.message : "paynow failed";
  console.log(
    JSON.stringify(
      {
        ok: false,
        error: msg,
        note: /PAYNOW_|fail closed/.test(msg)
          ? "Fail-closed without PAYNOW_* — expected until founder keys (not G2 blocker)"
          : "Unexpected Paynow probe error",
      },
      null,
      2,
    ),
  );
  process.exit(/PAYNOW_|fail closed/.test(msg) ? 0 : 1);
}
