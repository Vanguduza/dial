/**
 * PD115–PD118 dogfood — spare track timeline, statement PDF, Realtime, CSAT.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  advanceSpareOrderStatus,
  placeSpareOrder,
  runPd115SpareOrderTrackTimelineThinVertical,
  __resetSpareCustomerForTests,
} from "@dial/catalogue";
import { runPd116SupplierStatementPdfThinVertical } from "@dial/suppliers";
import {
  runPd117RealtimeStatusStubThinVertical,
  runPd118CsatFlowThinVertical,
} from "@dial/shared";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { GET as ordersGet } from "../../app/api/spare/orders/route.js";
import { POST as portalPost } from "../../app/api/supplier/portal/route.js";
import {
  GET as experienceGet,
  POST as experiencePost,
} from "../../app/api/experience/route.js";

const root = join(process.cwd(), "src");

test("PD115 spare order track timeline API + UI", async () => {
  const thin = runPd115SpareOrderTrackTimelineThinVertical();
  assert.ok(thin.timelineLen >= 3);

  __resetSpareCustomerForTests();
  __resetAuthForTests();
  const order = placeSpareOrder({
    cart: {
      id: "cart_pd115_api",
      currency: "USD",
      totalUsdMinor: 10_00n,
      lines: [
        {
          offerId: "off_filter_oil_kun26",
          title: "Filter",
          qty: 1,
          unitPriceUsdMinor: 10_00n,
          lineTotalUsdMinor: 10_00n,
          soldBy: "Agency",
          supplierFormality: "formal",
        },
      ],
    },
    customerId: "cust_pd115",
    payChoice: "cod",
  });
  advanceSpareOrderStatus(order.orderId);

  const { token } = createSession({
    email: "pd115@dial.test",
    userId: "cust_pd115",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const res = await ordersGet(
    new Request(
      `http://localhost/api/spare/orders?orderId=${encodeURIComponent(order.orderId)}`,
      { headers: { cookie } },
    ),
  );
  assert.equal(res.status, 200);
  const json = (await res.json()) as {
    timeline: unknown[];
    statusLabel: string;
    zigOnTrack: boolean;
    statusFrom: string;
  };
  assert.ok(json.timeline.length >= 2);
  assert.ok(json.statusLabel);
  assert.equal(json.zigOnTrack, false);
  assert.equal(json.statusFrom, "erp");

  const page = readFileSync(
    join(root, "app/spare/orders/[orderId]/page.tsx"),
    "utf8",
  );
  assert.match(page, /pd115-order-timeline|Timeline/);
});

test("PD116 supplier statement export API", async () => {
  const thin = runPd116SupplierStatementPdfThinVertical();
  assert.equal(thin.format, "text/plain+pdf-stub");

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd116@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  await portalPost(
    new Request("http://localhost/api/supplier/portal", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "onboard",
        displayName: "PD116 Shop",
        formality: "formal",
      }),
    }),
  );
  await portalPost(
    new Request("http://localhost/api/supplier/portal", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "add_statement",
        kind: "settlement",
        amountUsdMinor: "2500",
        label: "PD116 settle",
      }),
    }),
  );
  const exp = await portalPost(
    new Request("http://localhost/api/supplier/portal", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ action: "export_statement" }),
    }),
  );
  assert.equal(exp.status, 200);
  const json = (await exp.json()) as {
    document: { format: string; lineCount: number; payableFromAi: boolean };
  };
  assert.equal(json.document.format, "text/plain+pdf-stub");
  assert.ok(json.document.lineCount >= 1);
  assert.equal(json.document.payableFromAi, false);
});

test("PD117 Realtime subscribe API", async () => {
  const thin = runPd117RealtimeStatusStubThinVertical();
  assert.equal(thin.skippedWithoutKeys, true);

  const get = await experienceGet(
    new Request("http://localhost/api/experience?view=pd117"),
  );
  assert.equal(get.status, 200);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd117@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const res = await experiencePost(
    new Request("http://localhost/api/experience", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "subscribe_realtime",
        channel: "run:ord_pd117",
      }),
    }),
  );
  assert.equal(res.status, 200);
  const json = (await res.json()) as {
    subscription: {
      status: string;
      readOnly: boolean;
      mapSor: string;
      payableFromAi: boolean;
    };
  };
  assert.equal(json.subscription.status, "skipped_no_realtime");
  assert.equal(json.subscription.readOnly, true);
  assert.equal(json.subscription.mapSor, "maplibre");
  assert.equal(json.subscription.payableFromAi, false);
});

test("PD118 FLOW_CSAT record API", async () => {
  const thin = runPd118CsatFlowThinVertical();
  assert.equal(thin.surveyId, "FLOW_CSAT");

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd118@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const res = await experiencePost(
    new Request("http://localhost/api/experience", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "record_csat",
        score: 4,
        orderId: "ord_pd118_api",
        comment: "good",
      }),
    }),
  );
  assert.equal(res.status, 200);
  const json = (await res.json()) as {
    csat: {
      score: number;
      statusFrom: string;
      survey: { surveyId: string };
      payableFromAi: boolean;
    };
  };
  assert.equal(json.csat.score, 4);
  assert.equal(json.csat.statusFrom, "erp");
  assert.equal(json.csat.survey.surveyId, "FLOW_CSAT");
  assert.equal(json.csat.payableFromAi, false);
});
