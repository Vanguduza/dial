/**
 * Phase 8 prep dogfood — WHT remittance admin API + webhook duplicate no-op.
 * Does not claim G8 (needs sandbox money matrix + live keys or Appendix C block).
 */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  __resetPaymentsForTests,
  __resetWhtRemittanceForTests,
  runPd4MoneySpine,
  setDailyZigRate,
} from "@dial/payments";
import { POST as ecocashWebhookPost } from "../../app/api/webhooks/ecocash/route.js";
import { POST as paynowWebhookPost } from "../../app/api/webhooks/paynow/route.js";
import {
  GET as whtGet,
  POST as whtPost,
} from "../../app/api/admin/compliance/wht/route.js";
import { __resetCatalogueForTests } from "@dial/catalogue";
import { __resetLedgerForTests, runPd11FdmsSandboxThinVertical } from "@dial/ledger";
import { __resetTaxForTests } from "@dial/tax";
import { runG2SpareThinVertical } from "../spare/g2Spine.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("Phase8-prep admin WHT page + API fail-closed + remittance draft lifecycle", async () => {
  const page = readFileSync(
    join(root, "app/admin/compliance/wht/page.tsx"),
    "utf8",
  );
  assert.match(page, /WHT|remittance|ITF263/i);
  assert.match(page, /no AI payable|payableFromAi/i);

  __resetPaymentsForTests();
  __resetWhtRemittanceForTests();

  const prev = process.env.INTERNAL_API_SECRET;
  delete process.env.INTERNAL_API_SECRET;
  try {
    const closed = await whtGet(
      new Request("http://localhost/api/admin/compliance/wht"),
    );
    assert.equal(closed.status, 503);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }

  process.env.INTERNAL_API_SECRET = "p8_wht_secret";
  try {
    const bodyReject = await whtPost(
      new Request("http://localhost/api/admin/compliance/wht", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "p8_wht_secret",
        },
        body: JSON.stringify({
          action: "record_payout",
          userId: "evil",
          technicianId: "tech_p8",
          payoutUsdMinor: "10000",
        }),
      }),
    );
    assert.equal(bodyReject.status, 400);

    const pay = await whtPost(
      new Request("http://localhost/api/admin/compliance/wht", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "p8_wht_secret",
          "Idempotency-Key": "p8-wht-payout-1",
        },
        body: JSON.stringify({
          action: "record_payout",
          technicianId: "tech_p8",
          payoutUsdMinor: "10000",
          hasItf263: false,
        }),
      }),
    );
    assert.equal(pay.status, 200);
    const payJson = (await pay.json()) as { withholdMinor: string; rateBps: number };
    assert.equal(payJson.rateBps, 3000);
    assert.equal(payJson.withholdMinor, "3000");

    const draft = await whtPost(
      new Request("http://localhost/api/admin/compliance/wht", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "p8_wht_secret",
        },
        body: JSON.stringify({
          action: "create_remittance_draft",
          yearOfAssessment: new Date().getFullYear(),
        }),
      }),
    );
    assert.equal(draft.status, 200);
    const draftJson = (await draft.json()) as {
      batch: { batchId: string; status: string; payableFromAi: false };
    };
    assert.equal(draftJson.batch.status, "draft");
    assert.equal(draftJson.batch.payableFromAi, false);

    const submit = await whtPost(
      new Request("http://localhost/api/admin/compliance/wht", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "p8_wht_secret",
        },
        body: JSON.stringify({
          action: "submit_remittance",
          batchId: draftJson.batch.batchId,
          submittedBy: "ops_p8",
        }),
      }),
    );
    assert.equal(submit.status, 200);
    const submitJson = (await submit.json()) as { batch: { status: string } };
    assert.equal(submitJson.batch.status, "submitted");

    const ack = await whtPost(
      new Request("http://localhost/api/admin/compliance/wht", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "p8_wht_secret",
        },
        body: JSON.stringify({
          action: "acknowledge_remittance",
          batchId: draftJson.batch.batchId,
        }),
      }),
    );
    assert.equal(ack.status, 200);
    const ackJson = (await ack.json()) as { batch: { status: string } };
    assert.equal(ackJson.batch.status, "acknowledged");
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("Phase8-prep EcoCash webhook duplicate event is no-op", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const raw = JSON.stringify({
    eventId: "eco_p8_dup_evt",
    transactionId: "eco_txn_p8_dup",
    status: "paid",
    reference: "ord_p8_fixture",
  });
  const secret = process.env.ECOCASH_WEBHOOK_SECRET ?? "fixture_secret";
  const sig =
    "sha256=" + createHmac("sha256", secret).update(raw).digest("hex");
  const req = () =>
    new Request("http://localhost/api/webhooks/ecocash", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ecocash-signature": sig,
      },
      body: raw,
    });

  const first = await ecocashWebhookPost(req());
  assert.equal(first.status, 200);
  const firstJson = (await first.json()) as { ok: boolean; duplicate?: boolean };
  assert.equal(firstJson.ok, true);
  assert.notEqual(firstJson.duplicate, true);

  const second = await ecocashWebhookPost(req());
  assert.equal(second.status, 200);
  const secondJson = (await second.json()) as { ok: boolean; duplicate?: boolean };
  assert.equal(secondJson.ok, true);
  assert.equal(secondJson.duplicate, true);
});

test("Phase8-prep Paynow webhook duplicate event is no-op", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetPaymentsForTests();
  __resetLedgerForTests();
  __resetTaxForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "p8_paynow" });

  const spine = await runPd4MoneySpine({
    rail: "paynow_hosted",
    orderId: "ord_p8_paynow_dup",
    supplierDisplayName: "Acme Spares",
    formality: "formal",
    amountUsdMinor: 15_00n,
    dialFeeUsdMinor: 100n,
    buyerSegment: "b2c",
    channel: "web",
    pspEventId: "p8_paynow_evt_first",
  });
  assert.equal(spine.webhook, "captured");

  const raw = new URLSearchParams({
    reference: spine.intent.id,
    status: "Paid",
    paynowreference: "pn_p8_dup_evt",
  }).toString();
  const req = () =>
    new Request("http://localhost/api/webhooks/paynow", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: raw,
    });

  const first = await paynowWebhookPost(req());
  assert.equal(first.status, 200);
  const firstJson = (await first.json()) as { ok: boolean; duplicate?: boolean };
  assert.equal(firstJson.ok, true);
  assert.notEqual(firstJson.duplicate, true);

  const second = await paynowWebhookPost(req());
  assert.equal(second.status, 200);
  const secondJson = (await second.json()) as { ok: boolean; duplicate?: boolean };
  assert.equal(secondJson.ok, true);
  assert.equal(secondJson.duplicate, true);
});

test("Phase8-prep FDMS day open→submit→close sandbox thin vertical", async () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  process.env.FDMS_BASE_URL = "https://fdms.sandbox.dial.local";
  process.env.FDMS_DEVICE_ID = "dev_p8_matrix";
  process.env.FDMS_ACTIVATION_KEY = "act_p8_matrix";
  delete process.env.FDMS_SANDBOX_HTTP;
  __resetTaxForTests();
  __resetLedgerForTests();
  try {
    const out = await runPd11FdmsSandboxThinVertical({ orderId: "ord_p8_fdms" });
    assert.equal(out.mode, "sandbox");
    assert.ok(out.dayOpened.fiscalDayId);
    assert.equal(out.fiscalCodes.length, 3);
    assert.ok(out.dayClosed.closedAt);
    assert.ok(out.moneyDrain.every((d) => d.status === "fiscal_submitted"));
  } finally {
    if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prevMode;
  }
});

test("Phase8 sandbox money matrix — EcoCash + COD + Paynow + WHT (fixture CI; sandbox evidence via g8 script)", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  process.env.DIAL_G2_ALLOW_FX_SEED = "1";
  __resetCatalogueForTests();
  __resetPaymentsForTests();
  __resetLedgerForTests();
  __resetTaxForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "p8_matrix" });

  const stamp = Date.now();
  const cod = await runG2SpareThinVertical({
    offerId: "off_filter_oil_kun26",
    payChoice: "cod",
    buyerSegment: "b2c",
    customerId: "cust_p8_matrix",
    idempotencyKey: `p8-cod-${stamp}`,
  });
  assert.equal(cod.webhook, "skipped_cod");
  assert.ok(cod.journalId);
  assert.equal(cod.b2bInformalLeaks, 0);

  const eco = await runG2SpareThinVertical({
    offerId: "off_filter_oil_kun26",
    payChoice: "ecocash",
    buyerSegment: "b2c",
    customerId: "cust_p8_matrix",
    idempotencyKey: `p8-eco-${stamp}`,
    simulateEcoCashWebhook: true,
  });
  assert.equal(eco.webhook, "captured");
  assert.ok(eco.providerRef?.startsWith("eco_sb_") || eco.providerRef?.startsWith("eco_fx_"));
  assert.ok(eco.journalId);

  const paynow = await runPd4MoneySpine({
    rail: "paynow_hosted",
    orderId: `ord_p8_pn_${stamp}`,
    supplierDisplayName: "Acme Spares",
    formality: "formal",
    amountUsdMinor: 20_00n,
    dialFeeUsdMinor: 120n,
    buyerSegment: "b2c",
    channel: "web",
    pspEventId: `p8_pn_evt_${stamp}`,
  });
  assert.equal(paynow.webhook, "captured");
  assert.ok(paynow.journalId);
  assert.ok(paynow.fiscalIds.length >= 1);

  process.env.INTERNAL_API_SECRET = "p8_matrix_wht";
  __resetWhtRemittanceForTests();
  const pay = await whtPost(
    new Request("http://localhost/api/admin/compliance/wht", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": "p8_matrix_wht",
        "Idempotency-Key": `p8-wht-${stamp}`,
      },
      body: JSON.stringify({
        action: "record_payout",
        technicianId: "tech_p8_matrix",
        payoutUsdMinor: "10000",
        hasItf263: false,
      }),
    }),
  );
  assert.equal(pay.status, 200);
  const payJson = (await pay.json()) as { withholdMinor: string; rateBps: number };
  assert.equal(payJson.rateBps, 3000);
  assert.equal(payJson.withholdMinor, "3000");
});
