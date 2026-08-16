/**
 * PD12 — Meta WA Flows sandbox admin + webhook interactive pay.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  bindWaSessionPhone,
  flowSpareCartAdd,
  flowSpareCheckoutReview,
  flowSpareSearch,
  startFlow,
  __resetWhatsappForTests,
} from "@dial/adapter-whatsapp";
import { __resetCatalogueForTests } from "@dial/catalogue";
import { __resetPaymentsForTests, setDailyZigRate } from "@dial/payments";

const here = dirname(fileURLToPath(import.meta.url));
const SECRET = "pd12_internal_secret";
const APP_SECRET = "pd12_wa_app_secret";

test("PD12 admin WA Flows UI exists (Cloud API, no Baileys/liquor)", () => {
  const page = readFileSync(
    join(here, "../../app/admin/wa/page.tsx"),
    "utf8",
  );
  assert.match(page, /Cloud API/);
  assert.match(page, /No Baileys/);
  assert.match(page, /No liquor/);
  assert.match(page, /FLOW_SPARE_/);
  assert.match(page, /FLOW_GROCERY_/);
});

/**
 * Settlement writes through to the durable store in sandbox and fails closed
 * without it (D-47), which CI has no target for. The flow wiring therefore runs
 * in fixture here, and the same routine is exercised against real Postgres by
 * the compose integration job and docs/ops/phase9-wa-sandbox-dogfood.md.
 */
test("PD12 package thin vertical Spare+grocery Cloud API", async () => {
  const prev = {
    mode: process.env.DIAL_INTEGRATION_MODE,
    token: process.env.WHATSAPP_TOKEN,
    phone: process.env.WHATSAPP_PHONE_NUMBER_ID,
  };
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  process.env.WHATSAPP_TOKEN = "wa_token_pd12_gw";
  process.env.WHATSAPP_PHONE_NUMBER_ID = "phone_pd12_gw";
  process.env.ECOCASH_API_KEY = "eco_key_pd12_gw";
  process.env.ECOCASH_MERCHANT_CODE = "eco_merch_pd12_gw";
  try {
    const { runPd12WaFlowsSandboxThinVertical } = await import(
      "@dial/adapter-whatsapp"
    );
    const result = await runPd12WaFlowsSandboxThinVertical();
    assert.equal(result.spare.intentMethod, "ecocash_direct");
    assert.equal(result.grocery.codCurrency, "USD");

    // Sandbox without a durable store must refuse rather than settle in memory.
    process.env.DIAL_INTEGRATION_MODE = "sandbox";
    const savedUrl = process.env.SUPABASE_URL;
    const savedPublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    try {
      await assert.rejects(
        () => runPd12WaFlowsSandboxThinVertical(),
        /fail closed/i,
      );
    } finally {
      if (savedUrl !== undefined) process.env.SUPABASE_URL = savedUrl;
      if (savedPublicUrl !== undefined) {
        process.env.NEXT_PUBLIC_SUPABASE_URL = savedPublicUrl;
      }
    }
  } finally {
    if (prev.mode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prev.mode;
    if (prev.token === undefined) delete process.env.WHATSAPP_TOKEN;
    else process.env.WHATSAPP_TOKEN = prev.token;
    if (prev.phone === undefined) delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    else process.env.WHATSAPP_PHONE_NUMBER_ID = prev.phone;
    delete process.env.ECOCASH_API_KEY;
    delete process.env.ECOCASH_MERCHANT_CODE;
  }
});

test("PD12 admin API thin_vertical + webhook button_reply → EcoCash intent", async () => {
  const prev = {
    mode: process.env.DIAL_INTEGRATION_MODE,
    token: process.env.WHATSAPP_TOKEN,
    phone: process.env.WHATSAPP_PHONE_NUMBER_ID,
    internal: process.env.INTERNAL_API_SECRET,
    appSecret: process.env.WHATSAPP_APP_SECRET,
    ecoKey: process.env.ECOCASH_API_KEY,
    ecoMerch: process.env.ECOCASH_MERCHANT_CODE,
  };
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  process.env.WHATSAPP_TOKEN = "wa_token_pd12_api";
  process.env.WHATSAPP_PHONE_NUMBER_ID = "phone_pd12_api";
  process.env.INTERNAL_API_SECRET = SECRET;
  process.env.WHATSAPP_APP_SECRET = APP_SECRET;
  process.env.ECOCASH_API_KEY = "eco_key_pd12_api";
  process.env.ECOCASH_MERCHANT_CODE = "eco_merch_pd12_api";

  try {
    const { POST: adminPost, GET: adminGet } = await import(
      "../../app/api/admin/wa/flows/route.js"
    );
    const statusRes = await adminGet(
      new Request("http://localhost/api/admin/wa/flows", {
        headers: { "x-internal-secret": SECRET },
      }),
    );
    assert.equal(statusRes.status, 200);
    const status = (await statusRes.json()) as {
      liquorFlows: boolean;
      flows: unknown[];
    };
    assert.equal(status.liquorFlows, false);
    assert.ok(status.flows.length >= 8);

    // No durable store configured in CI: the sandbox rail must refuse rather
    // than report a green settlement it only made in memory.
    const savedUrl = process.env.SUPABASE_URL;
    const savedPublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    try {
      const thinRes = await adminPost(
        new Request("http://localhost/api/admin/wa/flows", {
          method: "POST",
          headers: {
            "x-internal-secret": SECRET,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "thin_vertical" }),
        }),
      );
      assert.equal(thinRes.status, 503);
      const thin = (await thinRes.json()) as { error?: string };
      assert.match(String(thin.error), /durable/i);
    } finally {
      if (savedUrl !== undefined) process.env.SUPABASE_URL = savedUrl;
      if (savedPublicUrl !== undefined) {
        process.env.NEXT_PUBLIC_SUPABASE_URL = savedPublicUrl;
      }
    }

    // Webhook interactive button path — fixture mode for durable processed_events (S102)
    process.env.DIAL_INTEGRATION_MODE = "fixture";
    __resetWhatsappForTests();
    __resetCatalogueForTests();
    __resetPaymentsForTests();
    setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "ops_pd12_wh" });
    const session = startFlow("FLOW_SPARE_SEARCH", "cust_wh");
    const search = flowSpareSearch(session.sessionId, "oil");
    flowSpareCartAdd(session.sessionId, search.offers[0]!.offerId, 1);
    flowSpareCheckoutReview(session.sessionId);
    bindWaSessionPhone("263779990012", session.sessionId);

    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    from: "263779990012",
                    type: "interactive",
                    interactive: {
                      type: "button_reply",
                      button_reply: { id: "ecocash", title: "EcoCash" },
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    const rawBody = JSON.stringify(payload);
    const sig =
      "sha256=" +
      createHmac("sha256", APP_SECRET).update(rawBody).digest("hex");
    const { POST: webhookPost } = await import(
      "../../app/api/webhooks/whatsapp/route.js"
    );
    const whRes = await webhookPost(
      new Request("http://localhost/api/webhooks/whatsapp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-hub-signature-256": sig,
          "x-hub-delivery-id": `pd12_wh_${Date.now()}`,
        },
        body: rawBody,
      }),
    );
    assert.equal(whRes.status, 200);
    const wh = (await whRes.json()) as {
      handled?: string;
      intentMethod?: string;
    };
    assert.equal(wh.handled, "button_reply");
    assert.equal(wh.intentMethod, "ecocash_direct");
  } finally {
    if (prev.mode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prev.mode;
    if (prev.token === undefined) delete process.env.WHATSAPP_TOKEN;
    else process.env.WHATSAPP_TOKEN = prev.token;
    if (prev.phone === undefined) delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    else process.env.WHATSAPP_PHONE_NUMBER_ID = prev.phone;
    if (prev.internal === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev.internal;
    if (prev.appSecret === undefined) delete process.env.WHATSAPP_APP_SECRET;
    else process.env.WHATSAPP_APP_SECRET = prev.appSecret;
    if (prev.ecoKey === undefined) delete process.env.ECOCASH_API_KEY;
    else process.env.ECOCASH_API_KEY = prev.ecoKey;
    if (prev.ecoMerch === undefined) delete process.env.ECOCASH_MERCHANT_CODE;
    else process.env.ECOCASH_MERCHANT_CODE = prev.ecoMerch;
  }
});
