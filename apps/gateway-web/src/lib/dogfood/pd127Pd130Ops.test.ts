/**
 * PD127–PD130 dogfood — PicPeak gallery, Plane triage, SolidInvoice layout, Langfuse stub.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { runPd127PicPeakEvidenceGalleryThinVertical } from "@dial/jobs";
import {
  runPd128PlaneOpsTriageThinVertical,
  runPd130LangfuseTraceStubThinVertical,
} from "@dial/shared";
import {
  runPd129SolidInvoiceLayoutThinVertical,
  addStatementLine,
  __resetSuppliersForTests,
} from "@dial/suppliers";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { GET as galleryGet, POST as galleryPost } from "../../app/api/admin/evidence/gallery/route.js";
import { GET as triageGet, POST as triagePost } from "../../app/api/admin/ops/triage/route.js";
import { GET as experienceGet, POST as experiencePost } from "../../app/api/experience/route.js";
import { POST as supplierPost } from "../../app/api/supplier/portal/route.js";

const root = join(process.cwd(), "src");

test("PD127 PicPeak evidence gallery API + UI", async () => {
  const thin = await runPd127PicPeakEvidenceGalleryThinVertical();
  assert.equal(thin.nearDupeDetected, true);

  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "pd127_secret";
  try {
    const missing = await galleryGet(
      new Request("http://localhost/api/admin/evidence/gallery"),
    );
    assert.equal(missing.status, 401);

    const ok = await galleryGet(
      new Request("http://localhost/api/admin/evidence/gallery", {
        headers: { "x-internal-secret": "pd127_secret" },
      }),
    );
    assert.equal(ok.status, 200);
    const json = (await ok.json()) as {
      gallery: { picPeakPattern: boolean; customerPhotoShare: boolean };
    };
    assert.equal(json.gallery.picPeakPattern, true);
    assert.equal(json.gallery.customerPhotoShare, false);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }

  const page = readFileSync(
    join(root, "app/admin/evidence/gallery/page.tsx"),
    "utf8",
  );
  assert.match(page, /pd127-picpeak-gallery/);
});

test("PD128 Plane ops triage API + UI", async () => {
  const thin = runPd128PlaneOpsTriageThinVertical();
  assert.equal(thin.claimedThenResolved, true);

  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "pd128_secret";
  try {
    const enq = await triagePost(
      new Request("http://localhost/api/admin/ops/triage", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd128_secret",
        },
        body: JSON.stringify({
          action: "enqueue",
          kind: "support",
          title: "Dogfood triage",
          correlationRef: "ord_pd128",
          slaDueAt: new Date(Date.now() + 3_600_000).toISOString(),
        }),
      }),
    );
    assert.equal(enq.status, 200);
    const enqJson = (await enq.json()) as { item: { ticketId: string } };
    const claim = await triagePost(
      new Request("http://localhost/api/admin/ops/triage", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd128_secret",
        },
        body: JSON.stringify({
          action: "claim",
          ticketId: enqJson.item.ticketId,
          claimedBy: "ops_dog",
        }),
      }),
    );
    assert.equal(claim.status, 200);
    const list = await triageGet(
      new Request("http://localhost/api/admin/ops/triage", {
        headers: { "x-internal-secret": "pd128_secret" },
      }),
    );
    assert.equal(list.status, 200);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }

  const page = readFileSync(join(root, "app/admin/ops/triage/page.tsx"), "utf8");
  assert.match(page, /pd128-plane-triage/);
});

test("PD129 SolidInvoice HTML layout via supplier portal", async () => {
  const thin = runPd129SolidInvoiceLayoutThinVertical();
  assert.equal(thin.solidInvoiceMoneySor, false);

  __resetSuppliersForTests();
  __resetAuthForTests();
  const { token } = createSession({
    email: "pd129@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const sid = "sup_pd129";
  await supplierPost(
    new Request("http://localhost/api/supplier/portal", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "onboard",
        displayName: "PD129 Portal Agency",
        formality: "formal",
        tier: "silver",
      }),
    }),
  );
  addStatementLine({
    supplierId: sid,
    kind: "settlement",
    amountUsdMinor: 12_00n,
    label: "Portal settlement",
  });

  const res = await supplierPost(
    new Request("http://localhost/api/supplier/portal", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ action: "export_statement_html" }),
    }),
  );
  assert.equal(res.status, 200);
  const json = (await res.json()) as {
    layout: {
      format: string;
      solidInvoiceMoneySor: boolean;
      html: string;
    };
  };
  assert.equal(json.layout.format, "text/html+solidinvoice-layout");
  assert.equal(json.layout.solidInvoiceMoneySor, false);
  assert.match(json.layout.html, /<table/);
});

test("PD130 Langfuse stub via experience API", async () => {
  const thin = runPd130LangfuseTraceStubThinVertical();
  assert.equal(thin.skippedWithoutKey, true);

  const get = await experienceGet(
    new Request("http://localhost/api/experience?view=pd130"),
  );
  assert.equal(get.status, 200);

  __resetAuthForTests();
  const { token } = createSession({
    email: "pd130@dial.test",
    role: "customer",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const prevPub = process.env.LANGFUSE_PUBLIC_KEY;
  const prevSec = process.env.LANGFUSE_SECRET_KEY;
  delete process.env.LANGFUSE_PUBLIC_KEY;
  delete process.env.LANGFUSE_SECRET_KEY;
  try {
    const res = await experiencePost(
      new Request("http://localhost/api/experience", {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({
          action: "queue_langfuse_trace",
          flagKey: "guidedIntake.shadow",
        }),
      }),
    );
    assert.equal(res.status, 200);
    const json = (await res.json()) as {
      trace: { status: string; moneyAuthority: boolean };
    };
    assert.equal(json.trace.status, "skipped_no_key");
    assert.equal(json.trace.moneyAuthority, false);
  } finally {
    if (prevPub !== undefined) process.env.LANGFUSE_PUBLIC_KEY = prevPub;
    else delete process.env.LANGFUSE_PUBLIC_KEY;
    if (prevSec !== undefined) process.env.LANGFUSE_SECRET_KEY = prevSec;
    else delete process.env.LANGFUSE_SECRET_KEY;
  }
});
