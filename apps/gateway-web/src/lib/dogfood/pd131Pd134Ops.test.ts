/**
 * PD131–PD134 dogfood — notification prefs, funded co-op SKUs, checklist tranche 2, grocery collections.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { runPd131NotificationPrefsThinVertical } from "@dial/identity";
import { runPd132FundedCoopSkusThinVertical } from "@dial/promotions";
import { runPd133ChecklistLibraryTranche2ThinVertical } from "@dial/jobs";
import { runPd134GroceryCollectionsThinVertical } from "@dial/catalogue";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { GET as notifGet, POST as notifPost } from "../../app/api/account/notifications/route.js";
import { GET as supplierGet } from "../../app/api/supplier/portal/route.js";
import { GET as groceryCollectionsGet } from "../../app/api/grocery/collections/route.js";

const root = join(process.cwd(), "src");

test("PD131 notification prefs API + UI", async () => {
  const thin = runPd131NotificationPrefsThinVertical();
  assert.equal(thin.marketingOptIn, true);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd131@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const get = await notifGet(
    new Request("http://localhost/api/account/notifications", {
      headers: { cookie },
    }),
  );
  assert.equal(get.status, 200);
  const json = (await get.json()) as {
    matrix: { cells: Array<{ topic: string; enabled: boolean }> };
  };
  assert.ok(json.matrix.cells.length >= 15);
  const post = await notifPost(
    new Request("http://localhost/api/account/notifications", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        channel: "whatsapp",
        topic: "marketing_promos",
        enabled: true,
      }),
    }),
  );
  assert.equal(post.status, 200);

  const page = readFileSync(
    join(root, "app/account/notifications/page.tsx"),
    "utf8",
  );
  assert.match(page, /pd131-notification-prefs/);
});

test("PD132 funded co-op SKUs on supplier portal", async () => {
  const thin = runPd132FundedCoopSkusThinVertical();
  assert.equal(thin.fundedCount, 2);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd132@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  // Portal GET returns fundedSkus for session supplier (empty until live coop for that id)
  const res = await supplierGet(
    new Request("http://localhost/api/supplier/portal", {
      headers: { cookie },
    }),
  );
  assert.equal(res.status, 200);
  const json = (await res.json()) as { fundedSkus: unknown[] };
  assert.ok(Array.isArray(json.fundedSkus));
});

test("PD133 checklist library tranche 2", () => {
  const thin = runPd133ChecklistLibraryTranche2ThinVertical();
  assert.ok(thin.catalogSeedCount >= 16);
  assert.equal(thin.trancheNotFullLibrary, true);
});

test("PD134 grocery collections API + UI", async () => {
  const thin = runPd134GroceryCollectionsThinVertical();
  assert.ok(thin.collectionCount >= 1);

  const res = await groceryCollectionsGet(
    new Request("http://localhost/api/grocery/collections"),
  );
  assert.equal(res.status, 200);
  const json = (await res.json()) as {
    collections: unknown[];
    liquorAllowed: boolean;
  };
  assert.ok(json.collections.length >= 1);
  assert.equal(json.liquorAllowed, false);

  const page = readFileSync(
    join(root, "app/grocery/collections/page.tsx"),
    "utf8",
  );
  assert.match(page, /pd134-grocery-collections/);
});
