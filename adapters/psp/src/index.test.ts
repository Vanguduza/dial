import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createPspRegistry,
  listCanonicalPspMethods,
  paynowHash,
  type CreatePaymentInput,
} from "./index.js";

const baseInput = (method: CreatePaymentInput["method"]): CreatePaymentInput => ({
  reference: "ord_test_1",
  money: {
    amountMinor: method === "ecocash_direct" ? 2500_00n : 10_00n,
    currency: method === "ecocash_direct" ? "ZWG" : "USD",
  },
  method,
  customer: { msisdnE164: "+263771234567", email: "buyer@dial.test" },
  returnUrl: "https://dialaspare.co.zw/checkout/return",
  resultUrl: "https://api.example/webhooks/paynow",
  metadata: { fx_rate_id: "fx_1" },
  escrowPreferred: method === "psp_escrow" || method === "paypal",
});

test("D-43 registry lists all Stitch rails", () => {
  const methods = listCanonicalPspMethods();
  for (const m of [
    "paynow",
    "contipay",
    "ecocash_direct",
    "paypal",
    "cod_collection",
    "cod_delivery",
    "psp_escrow",
  ] as const) {
    assert.ok(methods.includes(m), `missing ${m}`);
  }
});

test("fixture mode: createPayment + verifyWebhook without live keys", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const registry = createPspRegistry();
  for (const code of listCanonicalPspMethods()) {
    const adapter = registry[code];
    const caps = adapter.capabilities();
    assert.ok(caps.currencies.length > 0);
    const session = await adapter.createPayment(baseInput(code));
    assert.ok(session.providerRef);
    const admission = await adapter.verifyWebhook(
      {},
      JSON.stringify({
        reference: "ord_test_1",
        status: code === "cod_delivery" ? undefined : "paid",
        confirmed: true,
        eventId: `evt_${code}`,
        paymentId: session.providerRef,
        transactionId: session.providerRef,
        holdId: session.providerRef,
        id: session.providerRef,
        resource: { id: session.providerRef },
      }),
    );
    assert.ok(admission.eventId);
  }
});

test("Paynow SHA512 hash is uppercase hex", () => {
  const h = paynowHash(["1", "ref", "10.00", "a", "b", "Message"], "key");
  assert.equal(h, h.toUpperCase());
  assert.match(h, /^[0-9A-F]+$/);
  assert.equal(h.length, 128);
});

test("S104 ContiPay/EcoCash live-shape fixtures + COD settle USD", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const registry = createPspRegistry();

  const conti = await registry.contipay.createPayment(baseInput("contipay"));
  assert.ok(conti.redirectUrl?.includes("/pay/fixture/"));
  assert.equal(conti.customerAction, "open_redirect");
  assert.deepEqual(registry.contipay.capabilities().currencies.sort(), [
    "USD",
    "ZWG",
  ]);

  const eco = await registry.ecocash_direct.createPayment(
    baseInput("ecocash_direct"),
  );
  assert.ok(eco.providerRef.startsWith("eco_fx_"));
  assert.equal(eco.customerAction, "approve_on_handset");
  await assert.rejects(
    () =>
      registry.ecocash_direct.createPayment({
        ...baseInput("ecocash_direct"),
        money: { amountMinor: 10_00n, currency: "USD" },
      }),
    /ZWG/,
  );

  const cod = await registry.cod_delivery.createPayment(
    baseInput("cod_delivery"),
  );
  assert.equal(cod.customerAction, "pay_courier");
  await assert.rejects(
    () =>
      registry.cod_delivery.createPayment({
        ...baseInput("cod_delivery"),
        money: { amountMinor: 10_00n, currency: "ZWG" },
      }),
    /COD settle USD/,
  );
});

test("S105 Paynow redirect fixture + escrow hold/release stub", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const registry = createPspRegistry();
  const paynow = await registry.paynow.createPayment(baseInput("paynow"));
  assert.equal(paynow.status, "redirect_required");
  assert.ok(paynow.redirectUrl?.includes("ConfirmPayment"));
  assert.ok(paynow.pollUrl?.includes("pollfixture"));
  assert.equal(paynow.customerAction, "open_redirect");
  const h = paynowHash(
    ["1", "ord_test_1", "10.00", "https://a", "https://b", "Message"],
    "key",
  );
  assert.equal(h.length, 128);

  const escrow = await registry.psp_escrow.createPayment(
    baseInput("psp_escrow"),
  );
  assert.ok(escrow.providerRef.startsWith("escrow_fx_"));
  assert.equal(escrow.customerAction, "wait_for_hold");
  assert.equal(escrow.metadata?.hold, "authorized_stub");
  assert.equal(registry.psp_escrow.capabilities().supportsHold, true);
  assert.ok(registry.psp_escrow.instructRelease);
  const rel = await registry.psp_escrow.instructRelease!({
    holdRef: escrow.providerRef,
    allocations: [{ partyId: "supplier_1", amountMinor: 10_00n }],
  });
  assert.ok(rel.instructionId.startsWith("escrow_rel_"));
});

test("S108 PayPal Orders fixture + escrow capture webhook", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const registry = createPspRegistry();
  const pp = await registry.paypal.createPayment({
    ...baseInput("paypal"),
    escrowPreferred: true,
  });
  assert.equal(pp.status, "redirect_required");
  assert.ok(pp.redirectUrl?.includes("checkoutnow"));
  assert.equal(registry.paypal.capabilities().supportsHold, true);
  const admission = await registry.paypal.verifyWebhook(
    {},
    JSON.stringify({
      eventId: "pp_evt_1",
      id: pp.providerRef,
      status: "paid",
      resource: { id: pp.providerRef },
    }),
  );
  assert.ok(admission.eventId);

  const escrowCap = await registry.psp_escrow.verifyWebhook(
    {},
    JSON.stringify({
      eventId: "escrow_cap_1",
      type: "escrow.capture",
      holdId: "escrow_fx_ord_test_1",
      status: "captured",
    }),
  );
  assert.equal(escrowCap.status, "paid");
  assert.equal(escrowCap.type, "escrow.capture");
});

test("S130 pingPspHealth fixture ok + sandbox fail-closed without paid rails", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const { pingPspHealth } = await import("./index.js");
  const fx = await pingPspHealth();
  assert.equal(fx.ok, true);
  assert.equal(fx.rails.paynow, true);
  assert.equal(fx.rails.cod_collection, true);

  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  for (const k of [
    "PAYNOW_INTEGRATION_ID",
    "PAYNOW_INTEGRATION_KEY",
    "CONTIPAY_API_KEY",
    "CONTIPAY_API_SECRET",
    "CONTIPAY_MERCHANT_ID",
    "ECOCASH_API_KEY",
    "ECOCASH_MERCHANT_CODE",
    "ECOCASH_WEBHOOK_SECRET",
    "PAYPAL_CLIENT_ID",
    "PAYPAL_CLIENT_SECRET",
    "PAYPAL_WEBHOOK_ID",
    "PSP_ESCROW_BASE_URL",
    "PSP_ESCROW_API_KEY",
    "PSP_WEBHOOK_SECRET",
  ]) {
    delete process.env[k];
  }
  const closed = await pingPspHealth();
  assert.equal(closed.ok, false);
  assert.ok(closed.error?.includes("fail closed"));
  process.env.DIAL_INTEGRATION_MODE = "fixture";
});

test("PD4 Paynow/EcoCash sandbox createPayment + verifyWebhook fail-closed without keys", async () => {
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  for (const k of [
    "PAYNOW_INTEGRATION_ID",
    "PAYNOW_INTEGRATION_KEY",
    "ECOCASH_API_KEY",
    "ECOCASH_MERCHANT_CODE",
    "ECOCASH_WEBHOOK_SECRET",
  ]) {
    delete process.env[k];
  }
  const registry = createPspRegistry();
  await assert.rejects(
    () => registry.paynow.createPayment(baseInput("paynow")),
    /PAYNOW_|fail closed/,
  );
  await assert.rejects(
    () => registry.ecocash_direct.createPayment(baseInput("ecocash_direct")),
    /ECOCASH_|fail closed/,
  );
  await assert.rejects(
    () =>
      registry.paynow.verifyWebhook(
        {},
        "reference=ord&status=Paid&hash=deadbeef",
      ),
    /PAYNOW_|fail closed/,
  );
  await assert.rejects(
    () =>
      registry.ecocash_direct.verifyWebhook(
        { "x-ecocash-signature": "x" },
        JSON.stringify({ eventId: "e1", status: "SUCCESS" }),
      ),
    /ECOCASH_|fail closed/,
  );
  process.env.DIAL_INTEGRATION_MODE = "fixture";
});

test("PD39 ContiPay/PayPal sandbox createPayment + verifyWebhook fail-closed without keys", async () => {
  const { runPd39ContiPayPaypalSandboxThinVertical } = await import(
    "./pd39Sandbox.js"
  );
  const out = await runPd39ContiPayPaypalSandboxThinVertical();
  assert.equal(out.sandboxFailClosed, true);
  assert.equal(out.fixtureOk, true);
  assert.equal(out.payableFromAi, false);

  // Explicit fixture redirect still sandbox.paypal.com shape
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const fxRegistry = createPspRegistry();
  const pp = await fxRegistry.paypal.createPayment(baseInput("paypal"));
  assert.equal(pp.redirectUrl?.includes("sandbox.paypal.com"), true);
});

test("PD49 escrow sandbox fail-closed + fixture hold/release", async () => {
  const { runPd49EscrowSandboxThinVertical } = await import(
    "./pd49EscrowSandbox.js"
  );
  const out = await runPd49EscrowSandboxThinVertical();
  assert.equal(out.sandboxFailClosed, true);
  assert.equal(out.fixtureHoldRelease, true);
  assert.equal(out.liveContractRequired, false);
  assert.equal(out.payableFromAi, false);
});
