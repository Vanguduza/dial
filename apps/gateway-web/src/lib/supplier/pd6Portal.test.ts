import assert from "node:assert/strict";
import { test } from "node:test";
import { __resetSuppliersForTests, runPd6SupplierThinVertical } from "@dial/suppliers";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { GET as supplierGet, POST as supplierPost } from "../../app/api/supplier/portal/route.js";

test("PD6 supplier portal API: session SoR; onboard → heartbeat; reject body identity", async () => {
  __resetSuppliersForTests();
  __resetAuthForTests();
  const { token } = createSession({ email: "vendor@dial.test" });

  const bad = await supplierPost(
    new Request("http://localhost/api/supplier/portal", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${sessionCookieName()}=${token}`,
      },
      body: JSON.stringify({
        action: "onboard",
        displayName: "Vendor",
        tier: "gold",
        userId: "attacker",
      }),
    }),
  );
  assert.equal(bad.status, 400);

  const onboard = await supplierPost(
    new Request("http://localhost/api/supplier/portal", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${sessionCookieName()}=${token}`,
      },
      body: JSON.stringify({
        action: "onboard",
        displayName: "Vendor Counter",
        tier: "gold",
        formality: "formal",
      }),
    }),
  );
  assert.equal(onboard.status, 200);
  const onboardJson = (await onboard.json()) as {
    profile: { offerSource: string; tier: string };
  };
  assert.equal(onboardJson.profile.offerSource, "MARKETPLACE");
  assert.equal(onboardJson.profile.tier, "gold");

  const hb = await supplierPost(
    new Request("http://localhost/api/supplier/portal", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${sessionCookieName()}=${token}`,
      },
      body: JSON.stringify({ action: "heartbeat", channel: "dashboard", note: "ok" }),
    }),
  );
  assert.equal(hb.status, 200);

  const snap = await supplierGet(
    new Request("http://localhost/api/supplier/portal", {
      headers: { cookie: `${sessionCookieName()}=${token}` },
    }),
  );
  assert.equal(snap.status, 200);
  const data = (await snap.json()) as {
    profile: { displayName: string };
    heartbeats: unknown[];
  };
  assert.equal(data.profile.displayName, "Vendor Counter");
  assert.ok(data.heartbeats.length >= 1);
});

test("PD6 package thin vertical spine", () => {
  __resetSuppliersForTests();
  const result = runPd6SupplierThinVertical({ supplierId: "sup_spine" });
  assert.equal(result.confirmStatus, "confirmed");
  assert.equal(result.currency, "USD");
});
