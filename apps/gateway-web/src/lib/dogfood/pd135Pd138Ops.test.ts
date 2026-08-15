/**
 * PD135–PD138 dogfood — grocery facets, checklist tranche 3, tech guide, referral share.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { runPd135GroceryFacetsThinVertical } from "@dial/catalogue";
import { runPd136ChecklistLibraryTranche3ThinVertical } from "@dial/jobs";
import {
  activatePromoCampaign,
  createPromoCampaign,
  runPd138ReferralShareThinVertical,
  __resetPromoCustomerForTests,
} from "@dial/promotions";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { GET as grocerySearchGet } from "../../app/api/search/grocery/route.js";
import { POST as techPost } from "../../app/api/tech/technician/route.js";
import { GET as promoGet, POST as promoPost } from "../../app/api/promo/route.js";

const root = join(process.cwd(), "src");

test("PD135 grocery facets API + UI", async () => {
  const thin = runPd135GroceryFacetsThinVertical();
  assert.equal(thin.facetsApplied, true);
  assert.equal(thin.liquorAllowed, false);

  const res = await grocerySearchGet(
    new Request("http://localhost/api/search/grocery?coldChain=chilled"),
  );
  assert.equal(res.status, 200);
  const json = (await res.json()) as {
    liquorAllowed: boolean;
    facetsApplied: { coldChain?: string };
    hits: unknown[];
  };
  assert.equal(json.liquorAllowed, false);
  assert.equal(json.facetsApplied.coldChain, "chilled");
  assert.ok(Array.isArray(json.hits));

  const page = readFileSync(join(root, "app/grocery/search/page.tsx"), "utf8");
  assert.match(page, /pd135-grocery-search/);
});

test("PD136 checklist library tranche 3", () => {
  const thin = runPd136ChecklistLibraryTranche3ThinVertical();
  assert.ok(thin.catalogSeedCount >= 24);
  assert.equal(thin.trancheNotFullLibrary, true);
});

test("PD137 tech guide resolve + UI", async () => {
  __resetAuthForTests();
  const { token } = createSession({
    email: "pd137@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const res = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "resolve_checklist_by_symptom",
        symptom: "clutch slipping under load",
      }),
    }),
  );
  assert.equal(res.status, 200);
  const json = (await res.json()) as {
    checklist?: { catalogId?: string };
    payableFromAi?: boolean;
  };
  assert.equal(json.checklist?.catalogId, "auto.clutch_slip.v1");
  assert.equal(json.payableFromAi, false);

  const page = readFileSync(join(root, "app/tech/guide/page.tsx"), "utf8");
  assert.match(page, /pd137-tech-guide/);
  assert.match(page, /resolve_checklist_by_symptom/);
});

test("PD138 referral share API + UI", async () => {
  const thin = runPd138ReferralShareThinVertical();
  assert.equal(thin.hasShareCode, true);
  assert.equal(thin.cashOutAllowed, false);

  __resetPromoCustomerForTests();
  const referral = createPromoCampaign({
    type: "REFERRAL",
    name: "PD138 Dogfood",
    budgetSpendLimitMinor: 40_00n,
    verticals: ["spare"],
    referral: {
      codePrefix: "PD138D",
      attributionWindowDays: 14,
      referrerReward: {
        kind: "promo_credit",
        amountMinor: 2_00n,
        currency: "USD",
      },
      refereeReward: {
        kind: "promo_credit",
        amountMinor: 2_00n,
        currency: "USD",
      },
      maxReferralsPerReferrerMonth: 5,
    },
  });
  activatePromoCampaign(referral.id);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd138@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;

  const programs = await promoGet(
    new Request("http://localhost/api/promo?view=referral_programs", {
      headers: { cookie },
    }),
  );
  assert.equal(programs.status, 200);

  const share = await promoPost(
    new Request("http://localhost/api/promo", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "share_referral",
        campaignId: referral.id,
      }),
    }),
  );
  assert.equal(share.status, 200);
  const body = (await share.json()) as {
    share?: { shareCode?: string; shareUrl?: string; cashOutAllowed?: boolean };
  };
  assert.ok(body.share?.shareCode?.startsWith("PD138D"));
  assert.ok(body.share?.shareUrl);
  assert.equal(body.share?.cashOutAllowed, false);

  const page = readFileSync(join(root, "app/account/promo/page.tsx"), "utf8");
  assert.match(page, /pd138-referral-share/);
  assert.match(page, /share_referral/);
});
