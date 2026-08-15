/**
 * PD40 — WA template registry admin polish dogfood.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runPd40WaTemplateRegistryThinVertical } from "@dial/adapter-whatsapp";
import { GET as flowsGet, POST as flowsPost } from "../../app/api/admin/wa/flows/route.js";

describe("PD40 WA template registry", () => {
  it("package thin vertical greens", () => {
    const r = runPd40WaTemplateRegistryThinVertical();
    assert.ok(r.spareTemplateCount >= 2);
    assert.ok(r.groceryTemplateCount >= 2);
    assert.equal(r.baileysForbidden, true);
    assert.equal(r.liquorTemplates, false);
    assert.equal(r.payableFromAi, false);
    assert.equal(r.cloudApiOnly, true);
  });

  it("admin GET exposes envKeyHint + send_sandbox_template", async () => {
    const prev = process.env.INTERNAL_API_SECRET;
    process.env.INTERNAL_API_SECRET = "pd40_secret";
    process.env.DIAL_INTEGRATION_MODE = "fixture";
    try {
      const denied = await flowsGet(
        new Request("http://localhost/api/admin/wa/flows", {
          headers: { "x-internal-secret": "wrong" },
        }),
      );
      assert.equal(denied.status, 401);

      const ok = await flowsGet(
        new Request("http://localhost/api/admin/wa/flows", {
          headers: { "x-internal-secret": "pd40_secret" },
        }),
      );
      assert.equal(ok.status, 200);
      const body = (await ok.json()) as {
        templates: Array<{ envKeyHint?: string; payableFromAi?: boolean }>;
        liquorFlows: boolean;
        baileysForbidden: boolean;
        pd40: { spareTemplateCount: number };
      };
      assert.equal(body.liquorFlows, false);
      assert.equal(body.baileysForbidden, true);
      assert.ok(body.templates.every((t) => t.envKeyHint?.startsWith("WA_TEMPLATE_")));
      assert.ok(body.templates.every((t) => t.payableFromAi === false));
      assert.ok(body.pd40.spareTemplateCount >= 2);

      const sent = await flowsPost(
        new Request("http://localhost/api/admin/wa/flows", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-internal-secret": "pd40_secret",
          },
          body: JSON.stringify({
            action: "send_sandbox_template",
            templateKey: "SPARE_ORDER_CONFIRMED",
            toE164: "+263771234567",
          }),
        }),
      );
      assert.equal(sent.status, 200);
      const sentBody = (await sent.json()) as {
        ok: boolean;
        payableFromAi: boolean;
        messageId: string;
      };
      assert.equal(sentBody.ok, true);
      assert.equal(sentBody.payableFromAi, false);
      assert.ok(sentBody.messageId.length > 0);
    } finally {
      if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
      else process.env.INTERNAL_API_SECRET = prev;
    }
  });
});
