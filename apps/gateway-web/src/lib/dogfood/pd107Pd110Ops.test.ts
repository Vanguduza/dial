/**
 * PD107–PD110 dogfood — credential expiry, vehicle reminders, Chatwoot handoff, return evidence.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { runPd107CredentialExpiryThinVertical } from "@dial/jobs";
import {
  runPd108VehicleRemindersThinVertical,
  runPd110ReturnClaimEvidenceThinVertical,
  __resetSpareCustomerForTests,
  addGarageVehicle,
  openSpareReturnClaim,
  placeSpareOrder,
} from "@dial/catalogue";
import { runPd109WebChatwootHandoffThinVertical } from "@dial/adapter-whatsapp";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
  testAuthCookie,
} from "../auth/session.js";
import {
  GET as techGet,
  POST as techPost,
} from "../../app/api/tech/technician/route.js";
import {
  GET as garageGet,
  POST as garagePost,
} from "../../app/api/spare/garage/route.js";
import { POST as returnsPost } from "../../app/api/spare/returns/route.js";
import { POST as handoffPost } from "../../app/api/support/handoff/route.js";

const root = join(process.cwd(), "src");

test("PD107 credential expiry API", async () => {
  const thin = runPd107CredentialExpiryThinVertical();
  assert.equal(thin.blockedWhenExpired, true);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd107@dial.test",
    role: "technician",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const set = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "set_credential",
        kind: "trade_licence",
        status: "verified",
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      }),
    }),
  );
  assert.equal(set.status, 200);
  const exp = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "expire_credential",
        kind: "trade_licence",
      }),
    }),
  );
  assert.equal(exp.status, 200);
  const json = (await exp.json()) as {
    credential: { status: string };
    payableFromAi: boolean;
  };
  assert.equal(json.credential.status, "expired");
  assert.equal(json.payableFromAi, false);
  void techGet;
});

test("PD108 vehicle reminders API + garage UI", async () => {
  const thin = runPd108VehicleRemindersThinVertical();
  assert.equal(thin.deniedWithoutConsent, true);

  const page = readFileSync(join(root, "app/spare/garage/page.tsx"), "utf8");
  assert.match(page, /Schedule service reminder|scheduleReminder/);

  __resetSpareCustomerForTests();
  const cookie = testAuthCookie({ userId: "cust_pd108_api" });
  const vehicle = addGarageVehicle({
    customerId: "cust_pd108_api",
    label: "PD108 API",
    chassisHint: "N70",
    reminderConsent: false,
  });
  const denied = await garagePost(
    new Request("http://localhost/api/spare/garage", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "schedule_reminder",
        vehicleId: vehicle.vehicleId,
        dueAt: new Date(Date.now() + 1000).toISOString(),
      }),
    }),
  );
  assert.equal(denied.status, 400);

  const { setGarageReminderConsent } = await import("@dial/catalogue");
  setGarageReminderConsent({
    vehicleId: vehicle.vehicleId,
    reminderConsent: true,
  });
  const ok = await garagePost(
    new Request("http://localhost/api/spare/garage", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "schedule_reminder",
        vehicleId: vehicle.vehicleId,
        kind: "service_due",
        dueAt: new Date(Date.now() - 1000).toISOString(),
      }),
    }),
  );
  assert.equal(ok.status, 200);
  const list = await garageGet(
    new Request("http://localhost/api/spare/garage?view=reminders", {
      headers: { cookie },
    }),
  );
  assert.equal(list.status, 200);
  const body = (await list.json()) as { due: unknown[] };
  assert.ok(body.due.length >= 1);
});

test("PD109 web Chatwoot handoff API", async () => {
  const thin = runPd109WebChatwootHandoffThinVertical();
  assert.equal(thin.chatwootIsStatusSor, false);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd109@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const res = await handoffPost(
    new Request("http://localhost/api/support/handoff", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ topic: "spare_order", orderId: "ord_pd109_web" }),
    }),
  );
  assert.equal(res.status, 200);
  const json = (await res.json()) as {
    handoff: { conversationKey: string; erpTicketId: string };
    ticket: { statusFrom: string };
    chatwootIsStatusSor: boolean;
    payableFromAi: boolean;
  };
  assert.ok(json.handoff.conversationKey);
  assert.ok(json.handoff.erpTicketId);
  assert.equal(json.ticket.statusFrom, "erp");
  assert.equal(json.chatwootIsStatusSor, false);
  assert.equal(json.payableFromAi, false);
});

test("PD110 return claim evidence API", async () => {
  const thin = runPd110ReturnClaimEvidenceThinVertical();
  assert.ok(thin.evidenceCount >= 2);

  __resetSpareCustomerForTests();
  const order = placeSpareOrder({
    cart: {
      id: "cart_pd110",
      currency: "USD",
      totalUsdMinor: 2000n,
      lines: [
        {
          offerId: "off_pd110",
          title: "Filter",
          qty: 1,
          unitPriceUsdMinor: 2000n,
          lineTotalUsdMinor: 2000n,
          soldBy: "Agency",
          supplierFormality: "formal",
        },
      ],
    },
    customerId: "cust_pd110",
    payChoice: "cod",
  });
  const opened = openSpareReturnClaim({ orderId: order.orderId });
  const cookie = testAuthCookie({ userId: "cust_pd110" });
  const attach = await returnsPost(
    new Request("http://localhost/api/spare/returns", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "attach_evidence",
        claimId: opened.claimId,
        kind: "photo",
        payloadRef: "fixture://pd110-api.jpg",
      }),
    }),
  );
  assert.equal(attach.status, 200);
  const json = (await attach.json()) as {
    claim: { evidence: unknown[] };
    payableFromAi: boolean;
  };
  assert.ok(json.claim.evidence.length >= 1);
  assert.equal(json.payableFromAi, false);
});
