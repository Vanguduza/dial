/**
 * PD43–PD45 Pack §9 gap fold — CPA disclosure + support/consent admin.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  EIGHTEEN_ITEM_DISCLOSURES,
  runPd43CpaDisclosureThinVertical,
  runPd44GroceryCpaDisclosureThinVertical,
  runPd45SupportConsentAdminThinVertical,
} from "@dial/adapter-whatsapp";
import { GET as supportGet } from "../../app/api/admin/support/route.js";

const here = dirname(fileURLToPath(import.meta.url));

describe("PD43 CPA spare disclosure", () => {
  it("thin vertical + web checkout gates pay behind review", () => {
    const r = runPd43CpaDisclosureThinVertical();
    assert.equal(r.disclosureCount, 18);
    assert.equal(EIGHTEEN_ITEM_DISCLOSURES.length, 18);
    const page = readFileSync(
      join(here, "../../app/spare/checkout/page.tsx"),
      "utf8",
    );
    assert.match(page, /DisclosureReviewGate/);
    assert.match(page, /EIGHTEEN_ITEM_DISCLOSURES/);
    const gate = readFileSync(
      join(here, "../../components/DisclosureReviewGate.tsx"),
      "utf8",
    );
    assert.match(gate, /cpa-review-ack/);
    assert.match(gate, /cpa-pay-locked/);
  });
});

describe("PD44 grocery CPA disclosure", () => {
  it("thin vertical + grocery form uses same gate; no liquor", () => {
    const r = runPd44GroceryCpaDisclosureThinVertical();
    assert.equal(r.liquorSkus, false);
    const form = readFileSync(
      join(here, "../../app/grocery/checkout/GroceryCheckoutForm.tsx"),
      "utf8",
    );
    assert.match(form, /DisclosureReviewGate/);
    assert.match(form, /grocery-cpa-disclosure-review/);
  });
});

describe("PD45 support + consent admin", () => {
  it("thin vertical + admin GET lists tickets/consents", async () => {
    const r = runPd45SupportConsentAdminThinVertical();
    assert.ok(r.consentAuditLen >= 1);
    assert.ok(r.supportTicketCount >= 1);
    assert.equal(r.chatwootIsStatusSor, false);

    const prev = process.env.INTERNAL_API_SECRET;
    process.env.INTERNAL_API_SECRET = "pd45_secret";
    try {
      const denied = await supportGet(
        new Request("http://localhost/api/admin/support", {
          headers: { "x-internal-secret": "wrong" },
        }),
      );
      assert.equal(denied.status, 401);

      const ok = await supportGet(
        new Request("http://localhost/api/admin/support", {
          headers: { "x-internal-secret": "pd45_secret" },
        }),
      );
      assert.equal(ok.status, 200);
      const body = (await ok.json()) as {
        tickets: unknown[];
        consents: unknown[];
        chatwootIsStatusSor: boolean;
        payableFromAi: boolean;
      };
      assert.equal(body.chatwootIsStatusSor, false);
      assert.equal(body.payableFromAi, false);
      assert.ok(Array.isArray(body.tickets));
      assert.ok(Array.isArray(body.consents));
      assert.ok(body.tickets.length >= 1);
      assert.ok(body.consents.length >= 1);
    } finally {
      if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
      else process.env.INTERNAL_API_SECRET = prev;
    }
  });
});
