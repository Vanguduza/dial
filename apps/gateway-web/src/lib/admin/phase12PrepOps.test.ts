/**
 * Phase 12 hardening prep — AppSec + ops contracts (not G12 / not S99).
 * G12 exit still needs remote staging cohort (ENH-011) + G3/G5/G6/G9/G10 residuals.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { GET as liveGet } from "../../app/api/health/live/route.js";
import { GET as metricsGet } from "../../app/api/metrics/route.js";
import { GET as experienceGet, POST as experiencePost } from "../../app/api/experience/route.js";
import { GET as ordersGet } from "../../app/api/spare/orders/route.js";

const gwSrc = join(dirname(fileURLToPath(import.meta.url)), "../..");
const gwRoot = join(gwSrc, "..");
const repoRoot = join(gwRoot, "../..");

test("Phase12-prep: DialMap is the admin delivery SoR (no stub CSS map)", () => {
  const track = readFileSync(
    join(gwSrc, "app/admin/delivery/track/page.tsx"),
    "utf8",
  );
  const dispatch = readFileSync(
    join(gwSrc, "app/admin/delivery/dispatch/page.tsx"),
    "utf8",
  );
  const recon = readFileSync(
    join(gwRoot, "scripts/g5-admin-delivery-recon.mts"),
    "utf8",
  );
  const map = readFileSync(join(gwSrc, "components/map/DialMap.tsx"), "utf8");
  assert.match(track, /DialMap/);
  assert.match(dispatch, /DialMap/);
  assert.match(map, /data-testid="dial-map"/);
  assert.match(map, /maplibre-gl/);
  assert.doesNotMatch(track, /linear-gradient.*pin/i);
  assert.match(recon, /data-testid="dial-map"/);
  assert.match(recon, /maplibregl-canvas/);
});

test("Phase12-prep: liveness + metrics disclose no secrets", async () => {
  const live = await liveGet();
  assert.equal(live.status, 200);
  const liveJson = (await live.json()) as { ok: boolean; status: string };
  assert.equal(liveJson.ok, true);
  assert.equal(liveJson.status, "live");
  const liveText = JSON.stringify(liveJson);
  assert.doesNotMatch(liveText, /service_role|sk_live|ECOCASH_|PAYNOW_/i);

  const metrics = await metricsGet();
  assert.equal(metrics.status, 200);
  const body = await metrics.text();
  assert.match(body, /dial_up 1/);
  assert.doesNotMatch(body, /service_role|sk_live/i);
});

test("Phase12-prep: experience enhancers fail-closed; never money; session SoR", async () => {
  const get = await experienceGet(new Request("http://localhost/api/experience"));
  assert.equal(get.status, 200);
  const thin = (await get.json()) as { thin?: { payableFromAi?: boolean } };
  assert.notEqual(thin.thin?.payableFromAi, true);

  const anon = await experiencePost(
    new Request("http://localhost/api/experience", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "evaluate_flag", flagKey: "staff_dogfood" }),
    }),
  );
  assert.equal(anon.status, 401);

  const src = readFileSync(join(gwSrc, "app/api/experience/route.ts"), "utf8");
  assert.match(src, /userId\/role from body rejected/);
});

test("Phase12-prep: Paynow webhook verifies before mutate", () => {
  const src = readFileSync(join(gwSrc, "app/api/webhooks/paynow/route.ts"), "utf8");
  assert.match(src, /verifyWebhook/);
  assert.match(src, /claimProcessedEventDurable/);
});

test("Phase12-prep: spare orders require session (Appendix A.1)", async () => {
  const anon = await ordersGet(new Request("http://localhost/api/spare/orders"));
  assert.equal(anon.status, 401);
});

test("Phase12-prep: ops runbooks + store drafts exist; G12-H stays human", () => {
  const files = [
    "docs/ops/incident-response.md",
    "docs/ops/degradation.md",
    "docs/security/restore-drill.md",
    "docs/ops/phase12-hardening-dogfood-checklist.md",
    "docs/ops/phase3-store-listing-drafts.md",
    "docs/ops/phase12-s516-dormancy.md",
  ];
  for (const f of files) {
    assert.ok(existsSync(join(repoRoot, f)), f);
  }
  const checklist = readFileSync(
    join(repoRoot, "docs/ops/phase12-hardening-dogfood-checklist.md"),
    "utf8",
  );
  assert.match(checklist, /never eng auto/i);
  assert.match(checklist, /G12-H/);
  assert.doesNotMatch(checklist, /g12Claimed=true/);

  const restore = JSON.parse(
    readFileSync(join(repoRoot, "docs/ops/evidence/restore-drill/latest.json"), "utf8"),
  ) as { executed?: boolean };
  if (restore.executed === true) {
    assert.notEqual(
      (restore as { reason?: string }).reason,
      "docker_engine_unavailable",
    );
  }
});
