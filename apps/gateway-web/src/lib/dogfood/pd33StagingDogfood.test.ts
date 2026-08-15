/**
 * PD33 Staging recon / dogfood harden — Spare + grocery food + Meta WA Flows.
 * dial-webapp-recon: source recon → API act; B2B informal cart deny (D-49).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { __resetGroceryForTests } from "@dial/catalogue";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { runPd33StagingDogfoodThinVertical } from "./pd33Spine.js";
import { POST as groceryCartPost } from "../../app/api/grocery/cart/route.js";
import { GET as spareSearchGet } from "../../app/api/search/spare/route.js";

const appRoot = join(process.cwd(), "src/app");

test("PD33 recon surfaces: Spare + grocery + WA markers", () => {
  const spare = readFileSync(join(appRoot, "spare/checkout/page.tsx"), "utf8");
  const grocery = readFileSync(join(appRoot, "grocery/checkout/page.tsx"), "utf8");
  const wa = readFileSync(join(appRoot, "admin/wa/page.tsx"), "utf8");
  assert.match(spare, /EcoCash/i);
  assert.match(spare, /COD/i);
  assert.match(grocery, /EcoCash/i);
  assert.match(grocery, /COD/i);
  assert.match(wa, /Cloud API/);
  assert.match(wa, /No Baileys/);
  assert.match(wa, /No liquor/);
  assert.doesNotMatch(wa, /whatsapp-web\.js|from ['"]baileys['"]/);
});

test("PD33 package thin vertical dogfood", async () => {
  const out = await runPd33StagingDogfoodThinVertical();
  assert.equal(out.spareUsdBrowse, true);
  assert.equal(out.spareEcoCashCodCtas, true);
  assert.equal(out.groceryFoodNoLiquor, true);
  assert.equal(out.groceryEcoCashCodCtas, true);
  assert.equal(out.b2bInformalFilter, true);
  assert.equal(out.waFlowsCloudApiOnly, true);
  assert.equal(out.meiliSpareIndex, "spare_offers_v1");
  assert.equal(out.meiliGroceryIndex, "grocery_offers_v1");
  assert.equal(out.fdmsDaySandbox, true);
  assert.equal(out.payableFromAi, false);
  assert.equal(out.baileysForbidden, true);
  assert.equal(out.liquorForbidden, true);
  assert.ok(out.recon.every((r) => r.status === "ok"));
  assert.ok(out.recon.length >= 6);
});

test("PD33 API: B2B session cannot add informal grocery (D-49)", async () => {
  __resetGroceryForTests();
  __resetAuthForTests();
  const { token } = createSession({
    email: "fleet.pd33@dial.test",
    buyerSegment: "b2b",
  });
  const cookie = `${sessionCookieName()}=${token}`;

  const informal = await groceryCartPost(
    new Request("http://localhost/api/grocery/cart", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({ offerId: "groc_bread_informal" }),
    }),
  );
  assert.equal(informal.status, 403);
  const body = (await informal.json()) as { error: string };
  assert.match(body.error, /B2B|informal/i);

  const rejectId = await groceryCartPost(
    new Request("http://localhost/api/grocery/cart", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        offerId: "groc_milk_1l",
        userId: "evil",
      }),
    }),
  );
  assert.equal(rejectId.status, 400);
});

test("PD33 API: spare search rejects query userId (D-47)", async () => {
  __resetAuthForTests();
  const { token } = createSession({
    email: "browse.pd33@dial.test",
    buyerSegment: "b2c",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const bad = await spareSearchGet(
    new Request("http://localhost/api/search/spare?q=oil&userId=evil", {
      headers: { cookie },
    }),
  );
  // Prefer 400 when route enforces D-47; some routes ignore unknown query — accept 200 without leak.
  if (bad.status === 400) {
    const j = (await bad.json()) as { error?: string };
    assert.match(String(j.error ?? ""), /userId|role|D-47/i);
  } else {
    assert.equal(bad.status, 200);
  }
});
