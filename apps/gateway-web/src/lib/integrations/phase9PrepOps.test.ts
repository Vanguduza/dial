/**
 * Phase 9 prep dogfood — WA Flow registry EcoCash|COD contracts + WA_FLOW_* override.
 * Does not claim G9 (needs ENH-021 approved template IDs + test MSISDN evidence).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  CHECKOUT_PAY_BUTTONS,
  assertNoUnofficialWhatsAppDeps,
  listWaFlowRegistry,
  pingWhatsAppHealth,
  resolveWaFlow,
  runG9WaFlowsSandboxEvidence,
  __resetWhatsappForTests,
} from "@dial/adapter-whatsapp";
import { __resetLedgerForTests } from "@dial/ledger";
import { __resetPaymentsForTests, setDailyZigRate } from "@dial/payments";
import { __resetTaxForTests, listFdmsOutbox } from "@dial/tax";

const gatewayRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const monorepoRoot = join(gatewayRoot, "../..");

test("Phase9-prep Flow registry completeness + checkout EcoCash|COD buttons", () => {
  const listed = listWaFlowRegistry({});
  assert.equal(listed.length, 11);
  const checkoutFlows = listed.filter((f) => f.requiresEcoCashCodButtons);
  assert.equal(checkoutFlows.length, 2);
  assert.ok(
    checkoutFlows.every(
      (f) =>
        f.key === "FLOW_SPARE_CHECKOUT" || f.key === "FLOW_GROCERY_CHECKOUT",
    ),
  );
  assert.ok(listed.some((f) => f.key === "FLOW_SPARE_TRACK"));
  assert.ok(listed.some((f) => f.key === "FLOW_SPARE_RETURNS"));
  assert.ok(listed.every((f) => f.vertical === "spare" || f.vertical === "grocery"));
  assert.deepEqual(
    CHECKOUT_PAY_BUTTONS.map((b) => b.id).sort(),
    ["cod", "ecocash", "paynow"].sort(),
  );

  const approved = resolveWaFlow("FLOW_GROCERY_CHECKOUT", {
    WA_FLOW_FLOW_GROCERY_CHECKOUT: "meta_grocery_checkout_v1",
  });
  assert.equal(approved.status, "approved");
  assert.equal(approved.flowId, "meta_grocery_checkout_v1");
  assert.equal(approved.requiresEcoCashCodButtons, true);
});

test("Phase9-prep WA webhook route uses durable idempotency import", () => {
  const route = readFileSync(
    join(gatewayRoot, "src/app/api/webhooks/whatsapp/route.ts"),
    "utf8",
  );
  assert.match(route, /claimProcessedEventDurable/);
  assert.match(route, /verifyMetaSignature|Meta/);
  assert.doesNotMatch(route, /baileys|whatsapp-web\.js/i);
});

test("Phase9-prep no unofficial WhatsApp deps in package.json tree", () => {
  const pkgPaths: string[] = [];
  for (const rel of ["package.json", "adapters/whatsapp/package.json"]) {
    pkgPaths.push(readFileSync(join(monorepoRoot, rel), "utf8"));
  }
  assert.doesNotThrow(() => assertNoUnofficialWhatsAppDeps(pkgPaths));
});

test("Phase9-prep pingWhatsAppHealth fail-closed without WHATSAPP_*", async () => {
  const prev = { ...process.env };
  delete process.env.WHATSAPP_TOKEN;
  delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  delete process.env.WHATSAPP_APP_SECRET;
  delete process.env.WHATSAPP_VERIFY_TOKEN;
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  try {
    const health = await pingWhatsAppHealth(process.env);
    assert.equal(health.ok, false);
    assert.match(health.error ?? "", /WHATSAPP_/);
  } finally {
    process.env = prev;
  }
});

test("Phase9-prep G9 sandbox Flow pay EcoCash+COD fiscal channel=wa", async () => {
  const prev = {
    mode: process.env.DIAL_INTEGRATION_MODE,
    token: process.env.WHATSAPP_TOKEN,
    phone: process.env.WHATSAPP_PHONE_NUMBER_ID,
    ecoKey: process.env.ECOCASH_API_KEY,
    ecoMerch: process.env.ECOCASH_MERCHANT_CODE,
  };
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  process.env.WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN ?? "wa_sb_token_fixture";
  process.env.WHATSAPP_PHONE_NUMBER_ID =
    process.env.WHATSAPP_PHONE_NUMBER_ID ?? "wa_sb_phone_fixture";
  process.env.ECOCASH_API_KEY = process.env.ECOCASH_API_KEY ?? "eco_sb_key";
  process.env.ECOCASH_MERCHANT_CODE =
    process.env.ECOCASH_MERCHANT_CODE ?? "eco_sb_merchant";
  __resetWhatsappForTests();
  __resetPaymentsForTests();
  __resetLedgerForTests();
  __resetTaxForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "phase9_prep" });
  try {
    const out = await runG9WaFlowsSandboxEvidence();
    assert.equal(out.g9Claimed, false);
    assert.equal(out.not_G9_live, true);
    assert.equal(out.enh021BlockingLive, true);
    assert.equal(out.spare.fiscalChannel, "wa");
    assert.equal(out.grocery.fiscalChannel, "wa");
    assert.ok(out.fiscalOutboxWaCount >= 4);
    assert.ok(listFdmsOutbox().every((r) => r.channel === "wa"));
    if (process.env.DIAL_INTEGRATION_MODE === "sandbox") {
      assert.ok(out.outboundKinds.includes("flow"));
      assert.ok(out.outboundKinds.includes("buttons"));
    }
  } finally {
    if (prev.mode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prev.mode;
    if (prev.token === undefined) delete process.env.WHATSAPP_TOKEN;
    else process.env.WHATSAPP_TOKEN = prev.token;
    if (prev.phone === undefined) delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    else process.env.WHATSAPP_PHONE_NUMBER_ID = prev.phone;
    if (prev.ecoKey === undefined) delete process.env.ECOCASH_API_KEY;
    else process.env.ECOCASH_API_KEY = prev.ecoKey;
    if (prev.ecoMerch === undefined) delete process.env.ECOCASH_MERCHANT_CODE;
    else process.env.ECOCASH_MERCHANT_CODE = prev.ecoMerch;
  }
});

test("Phase9-prep admin WA route exposes registry without inventing template IDs", () => {
  const route = readFileSync(
    join(gatewayRoot, "src/app/api/admin/wa/flows/route.ts"),
    "utf8",
  );
  assert.match(route, /listWaFlowRegistry|listWaTemplateRegistry/);
  assert.match(route, /runG9WaFlowsSandboxEvidence/);
  assert.doesNotMatch(route, /\bbaileys\b|\bwhatsapp-web\.js\b/i);
});
