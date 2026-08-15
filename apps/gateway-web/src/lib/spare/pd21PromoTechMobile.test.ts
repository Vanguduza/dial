/**
 * PD21 customer-mobile promo/referral + tech deep-link (Pack §9.6 / D-42).
 * Windows CI without mobile SDKs — source contracts + API thin vertical.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  __resetPromoCustomerForTests,
  registerPromoCode,
  runPd21CustomerMobilePromoThinVertical,
} from "@dial/promotions";
import { activatePromoCampaign, createPromoCampaign } from "@dial/promotions";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { POST as promoPost, GET as promoGet } from "../../app/api/promo/route.js";
import {
  GET as techGet,
  POST as techPost,
} from "../../app/api/tech/services/route.js";
import { __resetJobsForTests } from "@dial/jobs";

const androidRoot = join(process.cwd(), "../customer-android");
const iosRoot = join(process.cwd(), "../customer-ios");

test("PD21 Android + iOS sources: promo + tech deep-link; no Expo; no cash-out", () => {
  const androidClient = readFileSync(
    join(
      androidRoot,
      "core/network/src/main/kotlin/zw/co/dial/customer/network/DialGatewayClient.kt",
    ),
    "utf8",
  );
  const androidApp = readFileSync(
    join(androidRoot, "app/src/main/java/zw/co/dial/customer/ui/DialApp.kt"),
    "utf8",
  );
  const androidTest = readFileSync(
    join(
      androidRoot,
      "core/network/src/test/kotlin/zw/co/dial/customer/network/DialGatewayClientTest.kt",
    ),
    "utf8",
  );
  const iosClient = readFileSync(
    join(iosRoot, "Sources/DialCustomerCore/DialGatewayClient.swift"),
    "utf8",
  );
  const iosApp = readFileSync(join(iosRoot, "App/DialCustomerApp.swift"), "utf8");
  const iosTest = readFileSync(
    join(iosRoot, "Tests/DialCustomerCoreTests/DialGatewayClientTests.swift"),
    "utf8",
  );

  for (const src of [androidClient, iosClient]) {
    assert.match(src, /api\/promo/);
    assert.match(src, /api\/tech\/services/);
    assert.match(src, /attemptPromoCashOut|attempt_cash_out/);
    assert.match(src, /payableFromAi/);
    assert.ok(!src.includes("Expo"));
  }
  assert.match(androidApp, /PromoScreen|Promo/);
  assert.match(androidApp, /TechDeepLinkScreen|Dial a Tech/);
  assert.match(iosApp, /promoView|Promo/);
  assert.match(iosApp, /techView|Dial a Tech/);
  assert.match(androidTest, /pd21_promo_referral_and_tech/);
  assert.match(iosTest, /testPd21PromoReferralAndTechDeepLink/);
});

test("PD21 package + promo API + tech rate_card deep-link", async () => {
  const out = runPd21CustomerMobilePromoThinVertical();
  assert.equal(out.code, "SPARE10");
  assert.equal(out.cashOutForbidden, true);
  assert.equal(out.payableFromAi, false);

  __resetPromoCustomerForTests();
  __resetAuthForTests();
  __resetJobsForTests();

  const platform = createPromoCampaign({
    type: "PLATFORM",
    name: "PD21 API Spare",
    budgetSpendLimitMinor: 50_00n,
    verticals: ["spare"],
  });
  activatePromoCampaign(platform.id);
  registerPromoCode({
    code: "SPARE10",
    campaignId: platform.id,
    draftDiscountPercent: 10,
  });

  const referral = createPromoCampaign({
    type: "REFERRAL",
    name: "PD21 API Ref",
    budgetSpendLimitMinor: 50_00n,
    referral: {
      codePrefix: "PD21",
      referrerReward: {
        kind: "promo_credit",
        amountMinor: 5_00n,
        currency: "USD",
      },
      refereeReward: {
        kind: "promo_credit",
        amountMinor: 3_00n,
        currency: "USD",
      },
    },
  });
  activatePromoCampaign(referral.id);

  const { token } = createSession({
    email: "pd21@dial.test",
    buyerSegment: "b2c",
  });
  const cookie = `${sessionCookieName()}=${token}`;

  const validate = await promoPost(
    new Request("http://localhost/api/promo", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "validate_code",
        code: "SPARE10",
        vertical: "spare",
      }),
    }),
  );
  assert.equal(validate.status, 200);
  const vJson = (await validate.json()) as {
    ok: boolean;
    payableFromAi: boolean;
    cashOutAllowed: boolean;
  };
  assert.equal(vJson.ok, true);
  assert.equal(vJson.payableFromAi, false);
  assert.equal(vJson.cashOutAllowed, false);

  const share = await promoPost(
    new Request("http://localhost/api/promo", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "share_referral",
        campaignId: referral.id,
        codeSuffix: "alice",
      }),
    }),
  );
  assert.equal(share.status, 200);
  const shareJson = (await share.json()) as {
    share: { cashOutAllowed: boolean; shareCode: string };
  };
  assert.equal(shareJson.share.cashOutAllowed, false);
  assert.ok(shareJson.share.shareCode.startsWith("PD21-"));

  const cash = await promoPost(
    new Request("http://localhost/api/promo", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ action: "attempt_cash_out", amountMinor: "100" }),
    }),
  );
  assert.equal(cash.status, 403);

  const identityReject = await promoPost(
    new Request("http://localhost/api/promo", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "validate_code",
        code: "SPARE10",
        userId: "evil",
      }),
    }),
  );
  assert.equal(identityReject.status, 400);

  const slots = await techGet(
    new Request("http://localhost/api/tech/services?view=slots", {
      headers: { cookie },
    }),
  );
  assert.equal(slots.status, 200);
  const slotsJson = (await slots.json()) as {
    quote: { source: string; payableFromAi: boolean };
    slots: Array<{ id?: string; slotId?: string }>;
  };
  assert.equal(slotsJson.quote.source, "rate_card");
  assert.equal(slotsJson.quote.payableFromAi, false);

  const slotId =
    slotsJson.slots[0]?.id ?? slotsJson.slots[0]?.slotId ?? "slot_fixture";
  const book = await techPost(
    new Request("http://localhost/api/tech/services", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "book",
        slotId,
        jobClass: "diagnostics",
        emergency: false,
      }),
    }),
  );
  assert.equal(book.status, 200);
  const bookJson = (await book.json()) as {
    job: { payableFromAi: boolean; draftOnly: boolean };
    quote: { payableFromAi: boolean };
  };
  assert.equal(bookJson.job.payableFromAi, false);
  assert.equal(bookJson.job.draftOnly, true);
  assert.equal(bookJson.quote.payableFromAi, false);

  const bal = await promoGet(
    new Request("http://localhost/api/promo?view=balance", {
      headers: { cookie },
    }),
  );
  assert.equal(bal.status, 200);
});
