/**
 * PD83–PD86 dogfood — addresses, stock upload, referral status, managers choice.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runPd83CustomerAddressesThinVertical } from "@dial/identity";
import { runPd86ManagersChoiceThinVertical } from "@dial/jobs";
import { runPd85ReferralStatusThinVertical } from "@dial/promotions";
import { runPd84SupplierStockUploadThinVertical } from "@dial/suppliers";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import {
  GET as addressesGet,
  POST as addressesPost,
} from "../../app/api/account/addresses/route.js";
import { POST as supplierPost } from "../../app/api/supplier/portal/route.js";
import { GET as promoGet } from "../../app/api/promo/route.js";
import { POST as tradesPost } from "../../app/api/admin/trades/route.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("PD83 customer addresses", async () => {
  const page = readFileSync(
    join(root, "app/account/addresses/page.tsx"),
    "utf8",
  );
  assert.match(page, /account-addresses/);
  const thin = runPd83CustomerAddressesThinVertical();
  assert.equal(thin.mapSor, "maplibre");

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd83@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const add = await addressesPost(
    new Request("http://localhost/api/account/addresses", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        label: "Home",
        lat: -17.82,
        lng: 31.05,
        landmark: "Avondale",
        phoneE164: "+263771000083",
      }),
    }),
  );
  assert.equal(add.status, 200);
  const list = await addressesGet(
    new Request("http://localhost/api/account/addresses", {
      headers: { cookie },
    }),
  );
  assert.equal(list.status, 200);
  const body = (await list.json()) as { addresses?: unknown[] };
  assert.ok((body.addresses?.length ?? 0) >= 1);
});

test("PD84 supplier stock upload", async () => {
  const thin = runPd84SupplierStockUploadThinVertical();
  assert.equal(thin.status, "pending_review");

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd84sup@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const onboard = await supplierPost(
    new Request("http://localhost/api/supplier/portal", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "onboard",
        displayName: "PD84 Portal Agency",
        formality: "formal",
        tier: "silver",
      }),
    }),
  );
  assert.equal(onboard.status, 200);
  const stock = await supplierPost(
    new Request("http://localhost/api/supplier/portal", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "upload_stock",
        rows: [
          {
            sku: "S1",
            title: "Filter",
            qty: 2,
            unitPriceUsdMinor: "1200",
          },
        ],
      }),
    }),
  );
  assert.equal(stock.status, 200);
  const body = (await stock.json()) as { status?: string };
  assert.equal(body.status, "pending_review");
});

test("PD85 referral status", async () => {
  const thin = runPd85ReferralStatusThinVertical();
  assert.ok(thin.asReferrerCount >= 1);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd85_ref@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  // Seed edges via thin vertical already used admin store; customer id differs.
  // API smoke: empty status still 200 with cashOutAllowed false.
  const res = await promoGet(
    new Request("http://localhost/api/promo?view=referral_status", {
      headers: { cookie },
    }),
  );
  assert.equal(res.status, 200);
  const body = (await res.json()) as { cashOutAllowed?: boolean };
  assert.equal(body.cashOutAllowed, false);
});

test("PD86 managers choice", async () => {
  const thin = runPd86ManagersChoiceThinVertical();
  assert.equal(thin.flagged, true);

  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "pd86_secret";
  try {
    const res = await tradesPost(
      new Request("http://localhost/api/admin/trades", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd86_secret",
        },
        body: JSON.stringify({
          action: "set_managers_choice",
          technicianId: "tech_pd86_api",
          managersChoice: true,
          setBy: "ops_pd86",
        }),
      }),
    );
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      valueScore?: { managersChoice?: boolean };
    };
    assert.equal(body.valueScore?.managersChoice, true);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});
