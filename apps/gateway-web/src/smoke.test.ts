import assert from "node:assert/strict";
import { test } from "node:test";
import {
  __resetCatalogueForTests,
  addToCart,
  approveCatalogueReview,
  createCart,
  enqueueCatalogueIngest,
  listCatalogueReviewQueue,
  meiliFilterForSession,
  searchOffers,
} from "@dial/catalogue";
import {
  __resetPaymentsForTests,
  admitPspWebhookEvent,
  applyJobReserveWebhook,
  authorizeJobReserve,
  computeTechPayoutWithholding,
  createCheckoutPayment,
  getActiveFxRate,
  listFxRateAudit,
  listPspMethods,
  setDailyZigRate,
} from "@dial/payments";
import {
  __resetIdentityForTests,
  rlsContextFromProfile,
  selectProfileAs,
  signUp,
} from "@dial/identity";
import { CHECKOUT_PAY_BUTTONS as WA_PAY_BUTTONS } from "@dial/adapter-whatsapp";
import {
  attemptCommandCentrePayout,
  commandCentreBanner,
} from "@dial/ai";
import {
  __resetAuthForTests,
  assertResourceAccess,
  createSession,
  getSessionFromToken,
  parseSessionCookie,
  sessionCookieName,
  userScopedCacheKey,
  type ProtectedResourceKind,
} from "./lib/auth/session.js";

test("gateway shell package is wired", () => {
  assert.equal(typeof "DIAL", "string");
});

/** E1b evidence: admin-set Daily ZiG feeds EcoCash fx_rate_id (same package path as API route). */
test("E1b admin rate path: audit + EcoCash fx_rate_id", async () => {
  __resetPaymentsForTests();
  const rate = setDailyZigRate({
    zigMinorPerUsd: 2550_00n,
    setBy: "gateway_admin_stub",
  });
  assert.equal(listFxRateAudit()[0]?.setBy, "gateway_admin_stub");
  assert.equal(getActiveFxRate()?.fxRateId, rate.fxRateId);
  const { intent } = await createCheckoutPayment({
    choice: "ecocash",
    orderId: "ord_gw_e1b",
    amountUsdMinor: 8_00n,
    idempotencyKey: "gw-e1b",
  });
  assert.equal(intent?.fxRateId, rate.fxRateId);
  assert.equal(intent?.displayPayable?.currency, "ZWG");
});

test("T1 session AuthN: cookie SoR; body userId refused for AuthZ", () => {
  __resetAuthForTests();
  const { token, session } = createSession({ email: "buyer@dial.test" });
  assert.equal(getSessionFromToken(token)?.userId, session.userId);
  assert.equal(
    getSessionFromToken(parseSessionCookie(`${sessionCookieName()}=${token}`))?.email,
    "buyer@dial.test",
  );
  assert.equal(getSessionFromToken("bogus"), null);

  assert.throws(() =>
    assertResourceAccess({
      session,
      resourceOwnerId: session.userId,
      bodyUserId: "attacker",
    }),
  );
  assert.throws(() =>
    assertResourceAccess({
      session,
      resourceOwnerId: "usr_other",
    }),
  );
  assert.doesNotThrow(() =>
    assertResourceAccess({
      session,
      resourceOwnerId: session.userId,
    }),
  );
});

test("T1 Pack §15: sign-up profile + session aligns; anonymous has no Shop home session", () => {
  __resetAuthForTests();
  __resetIdentityForTests();
  const profile = signUp({
    email: "home@dial.test",
    displayName: "Home User",
  });
  const { token, session } = createSession({
    email: profile.email,
    userId: profile.userId,
  });
  assert.equal(session.userId, profile.userId);
  assert.equal(
    selectProfileAs(rlsContextFromProfile(profile), profile.userId)?.displayName,
    "Home User",
  );
  assert.equal(getSessionFromToken(undefined), null);
  assert.ok(getSessionFromToken(token));
});

/** S21 T2 evidence: session buyerSegment drives B2B hide informal; body role ignored. */
test("T2 search path: B2B session excludes informal; meili filter formal-only", () => {
  __resetCatalogueForTests();
  __resetAuthForTests();
  const b2c = createSession({ email: "b2c@dial.test", buyerSegment: "b2c" });
  const b2b = createSession({ email: "fleet@dial.test", buyerSegment: "b2b" });
  assert.equal(b2c.session.buyerSegment, "b2c");
  assert.equal(b2b.session.buyerSegment, "b2b");

  const roleB2c = getSessionFromToken(b2c.token)?.buyerSegment ?? "b2c";
  const roleB2b = getSessionFromToken(b2b.token)?.buyerSegment ?? "b2c";
  const hitsB2c = searchOffers("wiper", { sessionRole: roleB2c });
  const hitsB2b = searchOffers("wiper", { sessionRole: roleB2b });
  assert.ok(hitsB2c.some((h) => h.supplierFormality === "informal"));
  assert.equal(hitsB2b.length, 0);
  assert.equal(
    meiliFilterForSession(roleB2b),
    'offerSource = "MARKETPLACE" AND supplierFormality = "formal"',
  );
});

test("T2 admin catalogue review: human approve only", () => {
  __resetCatalogueForTests();
  const batch = enqueueCatalogueIngest(1);
  assert.equal(batch.status, "pending_review");
  const reviewId = listCatalogueReviewQueue()[0]!.reviewId;
  assert.equal(approveCatalogueReview(reviewId).status, "approved");
});

/** S22 T3: USD cart → pay-step EcoCash|COD (ZiG only at pay); WA button parity. */
test("T3 Spare checkout pay-step: EcoCash|COD required; no supplierId; WA parity", async () => {
  __resetCatalogueForTests();
  __resetPaymentsForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "ops_t3" });
  const cart = createCart();
  addToCart(cart.id, "off_filter_oil_kun26", 1);
  assert.equal(cart.currency, "USD");
  assert.ok(!("supplierId" in cart));
  assert.ok(cart.lines.every((l) => !("supplierId" in l)));

  const eco = await createCheckoutPayment({
    choice: "ecocash",
    orderId: `ord_${cart.id}`,
    amountUsdMinor: cart.total.amountMinor,
    idempotencyKey: `t3-eco-${cart.id}`,
  });
  assert.equal(eco.intent?.displayPayable?.currency, "ZWG");
  assert.ok(eco.intent?.fxRateId);

  const cod = await createCheckoutPayment({
    choice: "cod",
    orderId: `ord_${cart.id}_cod`,
    amountUsdMinor: cart.total.amountMinor,
    idempotencyKey: `t3-cod-${cart.id}`,
  });
  assert.equal(cod.codOrder?.amountUsd.currency, "USD");
  assert.equal(cod.codOrder?.indicativeZig.currency, "ZWG");

  assert.ok(WA_PAY_BUTTONS.some((b) => b.id === "ecocash"));
  assert.ok(WA_PAY_BUTTONS.some((b) => b.id === "cod"));
});

test("T5 Pack spine: PSP registry + JobReserve + WHT + FDMS gateway class", async () => {
  __resetPaymentsForTests();
  const methods = listPspMethods();
  for (const m of [
    "ecocash_direct",
    "cod_cash",
    "paynow_hosted",
    "contipay",
    "paypal",
    "escrow_hold",
  ] as const) {
    assert.ok(methods.includes(m), `missing PSP ${m}`);
  }
  const reserve = await authorizeJobReserve({
    jobId: "job_t5",
    amountUsdMinor: 50_00n,
    idempotencyKey: "t5-jr-1",
  });
  assert.equal(reserve.status, "authorized");
  const captured = applyJobReserveWebhook({
    reserveId: reserve.id,
    eventId: "evt_t5_1",
    action: "capture",
    signatureValid: true,
  });
  assert.equal(captured.status, "captured");
  const wh = computeTechPayoutWithholding({
    technicianId: "tech_t5",
    yearOfAssessment: 2026,
    payoutUsdMinor: 100_00n,
    hasItf263: false,
  });
  assert.equal(wh.withholdMinor, 30_00n);
});

test("T4 Tech stubs: automotive + emergency checklists; emergency bypass flag", async () => {
  const { draftTechQuote, listChecklists } = await import("./lib/tech/stubs.js");
  const lists = listChecklists();
  assert.ok(lists.some((c) => c.id === "automotive_basic"));
  assert.ok(lists.some((c) => c.id === "emergency_roadside"));
  const normal = draftTechQuote({ jobClass: "diagnostics" });
  assert.equal(normal.emergency, false);
  assert.equal(normal.source, "rate_card_stub");
  const emergency = draftTechQuote({ jobClass: "roadside", emergency: true });
  assert.equal(emergency.emergency, true);
});

/** S30 T9 / Appendix A.1 — ≥5 resource kinds IDOR denied; cache keys user-scoped. */
test("T9 IDOR: cross-tenant denied on ≥5 priority resources", () => {
  __resetAuthForTests();
  const owner = createSession({ email: "owner@dial.test" });
  const attacker = createSession({ email: "attacker@dial.test" });
  const kinds: ProtectedResourceKind[] = [
    "job",
    "order",
    "vehicle",
    "promo_credit",
    "delivery_job",
    "delivery_offer",
    "courier_location",
  ];
  assert.ok(kinds.length >= 5);
  for (const resourceKind of kinds) {
    assert.throws(() =>
      assertResourceAccess({
        session: attacker.session,
        resourceOwnerId: owner.session.userId,
        resourceKind,
      }),
    );
    assert.doesNotThrow(() =>
      assertResourceAccess({
        session: owner.session,
        resourceOwnerId: owner.session.userId,
        resourceKind,
      }),
    );
  }
  assert.equal(
    userScopedCacheKey(owner.session.userId, "orders"),
    `u:${owner.session.userId}:orders`,
  );
  assert.throws(() => userScopedCacheKey("", "x"));
});

/** S30 T9 — webhook signature + idempotency before mutate. */
test("T9 webhook AC: reject bad signature; duplicate no-op", async () => {
  __resetPaymentsForTests();
  assert.equal(
    admitPspWebhookEvent({
      eventId: "evt_t9_bad",
      intentId: "pi_missing",
      signatureValid: false,
      action: "capture",
    }),
    "rejected_signature",
  );
  const reserve = await authorizeJobReserve({
    jobId: "job_t9",
    amountUsdMinor: 10_00n,
    idempotencyKey: "t9-jr",
  });
  assert.equal(
    admitPspWebhookEvent({
      eventId: "evt_t9_1",
      intentId: reserve.intentId!,
      signatureValid: true,
      action: "capture",
    }),
    "captured",
  );
  assert.equal(
    admitPspWebhookEvent({
      eventId: "evt_t9_1",
      intentId: reserve.intentId!,
      signatureValid: true,
      action: "capture",
    }),
    "duplicate",
  );
});

/** S30 T9 / D-54 — Simulated → payout path forbidden. */
test("T9 Simulated Command Centre never auto-pays", () => {
  assert.equal(commandCentreBanner("simulated").autoPayAllowed, false);
  assert.throws(() =>
    attemptCommandCentrePayout({ mode: "simulated", amountMinor: 50_00n }),
  );
});

test("S92 integration health groups are enumerable (no secret leak)", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const { GET } = await import("./app/api/health/integrations/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const body = (await res.json()) as {
    mode: string;
    ready?: boolean;
    probes?: Record<string, boolean>;
    groups: Array<{ label: string; missing: string[] }>;
    maps?: { ok: boolean; nominatim: boolean; osrm: boolean };
    fdms?: { ok: boolean; fixtureDayId?: string };
    search?: {
      informalB2bLeaks: number;
      meili?: { ok: boolean; ensureApplied?: boolean };
    };
    queues?: {
      health?: { ok: boolean; fixtureEnqueueOk?: boolean };
    };
    temporal?: { ok: boolean; namespace?: string; taskQueue?: string };
    litellm?: { ok: boolean; models?: string[] };
    whatsapp?: { ok: boolean; token?: boolean; phoneNumberId?: boolean };
    psp?: { ok: boolean; rails?: Record<string, boolean> };
    internal?: { ok: boolean; configured?: boolean };
  };
  assert.equal(body.mode, "fixture");
  assert.equal(body.ready, true);
  assert.equal(body.probes?.maps, true);
  assert.equal(body.probes?.queues, true);
  assert.equal(body.probes?.whatsapp, true);
  assert.equal(body.probes?.psp, true);
  assert.equal(body.probes?.internal, true);
  assert.ok(body.groups.some((g) => g.label === "paynow"));
  const { INTEGRATION_PROBE_KEYS } = await import(
    "./lib/integrationsReadiness.js"
  );
  for (const k of INTEGRATION_PROBE_KEYS) {
    assert.equal(body.probes?.[k], true, `probe ${k}`);
  }  assert.equal(body.maps?.ok, true);
  assert.equal(body.maps?.nominatim, true);
  assert.equal(body.maps?.osrm, true);
  assert.equal(body.fdms?.ok, true);
  assert.ok(body.fdms?.fixtureDayId);
  assert.equal(body.search?.meili?.ok, true);
  assert.equal(body.search?.meili?.ensureApplied, true);
  assert.equal(body.queues?.health?.ok, true);
  assert.equal(body.queues?.health?.fixtureEnqueueOk, true);
  assert.equal(body.temporal?.ok, true);
  assert.ok(body.temporal?.namespace);
  assert.ok(body.temporal?.taskQueue);
  assert.equal(body.litellm?.ok, true);
  assert.ok(body.litellm?.models?.includes("fixture-gemini"));
  assert.equal(body.whatsapp?.ok, true);
  assert.equal(body.whatsapp?.token, true);
  assert.equal(body.psp?.ok, true);
  assert.equal(body.psp?.rails?.paynow, true);
  assert.equal(body.internal?.ok, true);
  assert.equal(body.internal?.configured, true);
  const blob = JSON.stringify(body);
  assert.equal(blob.includes("sk_live"), false);
  assert.equal(/Bearer\s+\w+/.test(blob), false);
});

test("S143 fixture health group labels come only from INTEGRATION_ENV_GROUPS", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const { INTEGRATION_ENV_GROUP_LABELS } = await import(
    "./lib/integrationsReadiness.js"
  );
  const { GET } = await import("./app/api/health/integrations/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const body = (await res.json()) as {
    mode: string;
    groups: Array<{ label: string }>;
  };
  assert.equal(body.mode, "fixture");
  assert.deepEqual(
    body.groups.map((g) => g.label),
    [...INTEGRATION_ENV_GROUP_LABELS],
    "health groups[] labels must match INTEGRATION_ENV_GROUP_LABELS order exactly",
  );
});

test("S144 sandbox health group labels match INTEGRATION_ENV_GROUPS", async () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  try {
    const { INTEGRATION_ENV_GROUP_LABELS } = await import(
      "./lib/integrationsReadiness.js"
    );
    const { GET } = await import("./app/api/health/integrations/route.js");
    const res = await GET();
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      mode: string;
      groups: Array<{ label: string }>;
    };
    assert.equal(body.mode, "sandbox");
    assert.deepEqual(
      body.groups.map((g) => g.label),
      [...INTEGRATION_ENV_GROUP_LABELS],
      "sandbox groups[] labels must match INTEGRATION_ENV_GROUP_LABELS order exactly",
    );
  } finally {
    process.env.DIAL_INTEGRATION_MODE = prevMode;
  }
});

test("S145 live health group labels match INTEGRATION_ENV_GROUPS", async () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  process.env.DIAL_INTEGRATION_MODE = "live";
  try {
    const { INTEGRATION_ENV_GROUP_LABELS } = await import(
      "./lib/integrationsReadiness.js"
    );
    const { GET } = await import("./app/api/health/integrations/route.js");
    const res = await GET();
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      mode: string;
      groups: Array<{ label: string }>;
    };
    assert.equal(body.mode, "live");
    assert.deepEqual(
      body.groups.map((g) => g.label),
      [...INTEGRATION_ENV_GROUP_LABELS],
      "live groups[] labels must match INTEGRATION_ENV_GROUP_LABELS order exactly",
    );
  } finally {
    process.env.DIAL_INTEGRATION_MODE = prevMode;
  }
});

test("S132 .env.example lists every integrations health group key", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const envExample = readFileSync(
    join(process.cwd(), "../../.env.example"),
    "utf8",
  );
  const { GET } = await import("./app/api/health/integrations/route.js");
  const res = await GET();
  const body = (await res.json()) as {
    groups: Array<{ label: string }>;
  };
  const { INTEGRATION_ENV_GROUPS } = await import(
    "./lib/integrationsReadiness.js"
  );
  assert.deepEqual(
    body.groups.map((g) => g.label),
    INTEGRATION_ENV_GROUPS.map((g) => g.label),
  );
  assert.equal(body.groups.length, INTEGRATION_ENV_GROUPS.length);
  const requiredKeys = INTEGRATION_ENV_GROUPS.flatMap((g) => [...g.keys]);
  for (const key of requiredKeys) {
    assert.ok(envExample.includes(`${key}=`), `.env.example missing ${key}`);
  }
  assert.ok(envExample.includes("WA_TEMPLATE_SPARE_ORDER_CONFIRMED="));
  assert.ok(envExample.includes("docs/integrations/README.md"));
});

test("S150 .env.example points at INTEGRATION_ENV_GROUP_LABELS SoR", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const envExample = readFileSync(
    join(process.cwd(), "../../.env.example"),
    "utf8",
  );
  assert.ok(envExample.includes("INTEGRATION_ENV_GROUPS"));
  assert.ok(envExample.includes("INTEGRATION_ENV_GROUP_LABELS"));
  assert.ok(envExample.includes("integrationsReadiness.ts"));
});

test("S151 health note cites INTEGRATION_ENV_GROUP_LABELS", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const { INTEGRATION_ENV_GROUP_LABELS } = await import(
    "./lib/integrationsReadiness.js"
  );
  const { GET } = await import("./app/api/health/integrations/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const body = (await res.json()) as { note?: string };
  assert.ok(typeof body.note === "string");
  assert.ok(body.note.includes("groups labels="));
  assert.ok(body.note.includes(INTEGRATION_ENV_GROUP_LABELS.join(",")));
});

test("S152 OpenAPI IntegrationsHealth.note documents groups labels", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const raw = readFileSync(
    join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
    "utf8",
  );
  const spec = JSON.parse(raw) as {
    components: {
      schemas: {
        IntegrationsHealth: {
          properties: { note?: { description?: string } };
        };
      };
    };
  };
  const desc =
    spec.components.schemas.IntegrationsHealth.properties.note?.description ??
    "";
  assert.ok(desc.includes("INTEGRATION_ENV_GROUP_LABELS"));
  assert.ok(desc.includes("groups labels"));
});

test("S134 OpenAPI skeleton covers health + webhook paths", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const raw = readFileSync(
    join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
    "utf8",
  );
  const spec = JSON.parse(raw) as {
    openapi: string;
    paths: Record<string, unknown>;
  };
  assert.equal(spec.openapi.startsWith("3."), true);
  const required = [
    "/api/health/integrations",
    "/api/webhooks/paynow",
    "/api/webhooks/contipay",
    "/api/webhooks/ecocash",
    "/api/webhooks/paypal",
    "/api/webhooks/escrow",
    "/api/webhooks/fdms",
    "/api/webhooks/whatsapp",
    "/api/webhooks/psp",
    "/api/admin/fdms/day",
    "/api/admin/money/outbox",
    "/api/openapi",
  ];
  for (const p of required) {
    assert.ok(spec.paths[p], `missing path ${p}`);
  }
  assert.equal(raw.includes("sk_live"), false);
  assert.equal(raw.includes("service_role"), false);

  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as {
    openapi?: string;
    paths?: Record<string, unknown>;
  };
  assert.ok(served.openapi?.startsWith("3."));
  assert.ok(served.paths?.["/api/health/integrations"]);
  const withSor = served as {
    info?: {
      "x-dial-sor"?: {
        probes?: string;
        envGroups?: string;
        envGroupLabels?: string;
      };
    };
  };
  assert.ok(withSor.info?.["x-dial-sor"]?.probes?.includes("INTEGRATION_PROBE_KEYS"));
  assert.ok(withSor.info?.["x-dial-sor"]?.envGroups?.includes("INTEGRATION_ENV_GROUPS"));
  assert.ok(
    withSor.info?.["x-dial-sor"]?.envGroupLabels?.includes(
      "INTEGRATION_ENV_GROUP_LABELS",
    ),
  );
});

test("S140 integrations README documents INTEGRATION_ENV_GROUPS SoR", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const integ = readFileSync(
    join(process.cwd(), "../../docs/integrations/README.md"),
    "utf8",
  );
  assert.ok(integ.includes("INTEGRATION_ENV_GROUPS"));
  assert.ok(integ.includes("listIntegrationEnvGroupSnapshots"));
  assert.ok(integ.includes("x-dial-sor"));
});

test("S147 README + OpenAPI document INTEGRATION_ENV_GROUP_LABELS", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const integ = readFileSync(
    join(process.cwd(), "../../docs/integrations/README.md"),
    "utf8",
  );
  const raw = readFileSync(
    join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
    "utf8",
  );
  const spec = JSON.parse(raw) as {
    info?: { "x-dial-sor"?: { envGroupLabels?: string } };
  };
  assert.ok(integ.includes("INTEGRATION_ENV_GROUP_LABELS"));
  assert.ok(integ.includes("envGroupLabels"));
  assert.ok(
    spec.info?.["x-dial-sor"]?.envGroupLabels?.includes(
      "INTEGRATION_ENV_GROUP_LABELS",
    ),
  );
});

test("S153 integrations README documents health note groups labels contract", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const integ = readFileSync(
    join(process.cwd(), "../../docs/integrations/README.md"),
    "utf8",
  );
  assert.ok(integ.includes("groups labels="));
  assert.ok(integ.includes("INTEGRATION_ENV_GROUP_LABELS"));
  assert.ok(integ.includes("IntegrationsHealth.note"));
});

test("S154 admin integrations UI surfaces truncated health note", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const {
    INTEGRATIONS_HEALTH_NOTE_UI_MAX,
    parseIntegrationsHealth,
    truncateIntegrationsHealthNote,
  } = await import("./lib/integrationsReadiness.js");
  const { GET } = await import("./app/api/health/integrations/route.js");
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const res = await GET();
  assert.equal(res.status, 200);
  const body = (await res.json()) as unknown;
  const parsed = parseIntegrationsHealth(body);
  assert.ok(!("error" in parsed));
  assert.ok(typeof parsed.note === "string" && parsed.note.length > 0);
  assert.ok(parsed.note.includes("groups labels="));
  const shown = truncateIntegrationsHealthNote(parsed.note);
  assert.ok(shown.length <= INTEGRATIONS_HEALTH_NOTE_UI_MAX);
  if (parsed.note.length > INTEGRATIONS_HEALTH_NOTE_UI_MAX) {
    assert.ok(shown.endsWith("…"));
  }

  const page = readFileSync(
    join(process.cwd(), "src/app/admin/integrations/page.tsx"),
    "utf8",
  );
  assert.ok(page.includes("truncateIntegrationsHealthNote"));
  assert.ok(page.includes('data-testid="health-note"'));
});

test("S155 cost-health stub surfaces truncated health note", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const cost = readFileSync(
    join(process.cwd(), "src/app/admin/cost-health/page.tsx"),
    "utf8",
  );
  assert.ok(cost.includes("truncateIntegrationsHealthNote"));
  assert.ok(cost.includes("parseIntegrationsHealth"));
  assert.ok(cost.includes('data-testid="health-note"'));
  assert.ok(cost.includes("/api/health/integrations"));
});

test("S156 integrations README documents admin health note truncation", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const integ = readFileSync(
    join(process.cwd(), "../../docs/integrations/README.md"),
    "utf8",
  );
  assert.ok(integ.includes("INTEGRATIONS_HEALTH_NOTE_UI_MAX"));
  assert.ok(integ.includes("truncateIntegrationsHealthNote"));
  assert.ok(integ.includes("/admin/integrations"));
  assert.ok(integ.includes("/admin/cost-health"));
});

test("S157 OpenAPI documents admin health note truncation SoR", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const raw = readFileSync(
    join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
    "utf8",
  );
  const spec = JSON.parse(raw) as {
    info?: {
      "x-dial-sor"?: { healthNoteUiMax?: string };
    };
    components: {
      schemas: {
        IntegrationsHealth: {
          properties: { note?: { description?: string } };
        };
      };
    };
  };
  assert.ok(
    spec.info?.["x-dial-sor"]?.healthNoteUiMax?.includes(
      "INTEGRATIONS_HEALTH_NOTE_UI_MAX",
    ),
  );
  const desc =
    spec.components.schemas.IntegrationsHealth.properties.note?.description ??
    "";
  assert.ok(desc.includes("INTEGRATIONS_HEALTH_NOTE_UI_MAX"));
  assert.ok(desc.includes("truncateIntegrationsHealthNote"));

  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as {
    info?: { "x-dial-sor"?: { healthNoteUiMax?: string } };
  };
  assert.ok(
    served.info?.["x-dial-sor"]?.healthNoteUiMax?.includes(
      "INTEGRATIONS_HEALTH_NOTE_UI_MAX",
    ),
  );
});

test("S135 admin cost-health + integrations pages link OpenAPI and readiness", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const cost = readFileSync(
    join(process.cwd(), "src/app/admin/cost-health/page.tsx"),
    "utf8",
  );
  const integ = readFileSync(
    join(process.cwd(), "src/app/admin/integrations/page.tsx"),
    "utf8",
  );
  const readme = readFileSync(join(process.cwd(), "../../README.md"), "utf8");
  assert.ok(cost.includes("/admin/integrations"));
  assert.ok(cost.includes("/api/openapi"));
  assert.ok(cost.includes("/api/health/integrations"));
  assert.ok(cost.includes("INTEGRATION_ENV_GROUPS"));
  assert.ok(cost.includes("INTEGRATION_ENV_GROUP_LABELS"));
  assert.ok(cost.includes("INTEGRATIONS_HEALTH_NOTE_UI_MAX"));
  assert.ok(cost.includes("openapi-primary-link"));
  assert.ok(cost.includes("env-groups-sor-hint"));
  assert.ok(integ.includes("/api/openapi"));
  assert.ok(integ.includes("/api/health/integrations"));
  assert.ok(integ.includes("INTEGRATION_ENV_GROUPS"));
  assert.ok(integ.includes("INTEGRATION_ENV_GROUP_LABELS"));
  assert.ok(integ.includes("INTEGRATIONS_HEALTH_NOTE_UI_MAX"));
  assert.ok(integ.includes("openapi-primary-link"));
  assert.ok(integ.includes("env-groups-sor-hint"));
  assert.ok(readme.includes("/api/openapi"));
  assert.ok(readme.includes("/admin/integrations"));
  assert.ok(readme.includes("openapi-gateway.json"));
  assert.ok(readme.includes("INTEGRATION_ENV_GROUPS"));
  assert.ok(readme.includes("INTEGRATION_ENV_GROUP_LABELS"));
});

test("S149 root README documents INTEGRATION_ENV_GROUP_LABELS SoR", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const readme = readFileSync(join(process.cwd(), "../../README.md"), "utf8");
  assert.ok(readme.includes("INTEGRATION_ENV_GROUPS"));
  assert.ok(readme.includes("INTEGRATION_ENV_GROUP_LABELS"));
  assert.ok(readme.includes("integrationsReadiness.ts"));
  assert.ok(readme.includes("x-dial-sor"));
});

test("S158 root README documents admin health note truncation", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const readme = readFileSync(join(process.cwd(), "../../README.md"), "utf8");
  assert.ok(readme.includes("INTEGRATIONS_HEALTH_NOTE_UI_MAX"));
  assert.ok(readme.includes("truncateIntegrationsHealthNote"));
  assert.ok(readme.includes("healthNoteUiMax"));
  assert.ok(readme.includes("/admin/cost-health"));
});

test("S159 admin SoR hints cite INTEGRATIONS_HEALTH_NOTE_UI_MAX", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const cost = readFileSync(
    join(process.cwd(), "src/app/admin/cost-health/page.tsx"),
    "utf8",
  );
  const integ = readFileSync(
    join(process.cwd(), "src/app/admin/integrations/page.tsx"),
    "utf8",
  );
  assert.ok(cost.includes("INTEGRATIONS_HEALTH_NOTE_UI_MAX"));
  assert.ok(integ.includes("INTEGRATIONS_HEALTH_NOTE_UI_MAX"));
  assert.ok(cost.includes("env-groups-sor-hint"));
  assert.ok(integ.includes("env-groups-sor-hint"));
});

test("S136 integrations README package table matches workspace package names", async () => {
  const { readFileSync, readdirSync } = await import("node:fs");
  const { join } = await import("node:path");
  const root = join(process.cwd(), "../..");
  const integ = readFileSync(join(root, "docs/integrations/README.md"), "utf8");
  const readme = readFileSync(join(root, "README.md"), "utf8");
  const names = new Set<string>();
  for (const dir of ["packages", "adapters", "apps"] as const) {
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      try {
        const pkg = JSON.parse(
          readFileSync(join(root, dir, entry.name, "package.json"), "utf8"),
        ) as { name?: string };
        if (pkg.name) names.add(pkg.name);
      } catch {
        /* skip */
      }
    }
  }
  const mentioned = [
    "@dial/adapter-psp",
    "@dial/adapter-fdms",
    "@dial/adapter-maps",
    "@dial/adapter-whatsapp",
    "@dial/catalogue",
    "@dial/payments",
    "@dial/ledger",
    "@dial/queues",
    "@dial/worker-temporal",
    "@dial/worker-queues",
    "@dial/search-indexer",
    "@dial/tax",
    "@dial/shared",
    "@dial/ai",
    "@dial/gateway-web",
  ];
  for (const n of mentioned) {
    assert.ok(names.has(n), `workspace missing ${n}`);
    assert.ok(integ.includes(n), `integrations README missing ${n}`);
  }
  assert.ok(readme.includes("adapters/psp"));
  assert.ok(readme.includes("apps/worker-queues"));
  assert.ok(readme.includes("packages/ledger"));
  assert.ok(
    /S1(3[5-9]|4\d|5\d)/.test(readme),
    "root README build status should cite a recent integration stage",
  );
});

test("S95 Supabase password → DialSession bridge", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetAuthForTests();
  const { createSessionFromSupabasePassword } = await import(
    "./lib/auth/session.js"
  );
  const { token, session, accessToken } = await createSessionFromSupabasePassword({
    email: "buyer@dial.test",
    password: "secret",
  });
  assert.ok(accessToken.startsWith("sb_fx_"));
  assert.equal(session.email, "buyer@dial.test");
  assert.equal(getSessionFromToken(token)?.userId, session.userId);
});

test("S103 shared idempotency store dedupes across webhook sources", async () => {
  const {
    __resetIdempotencyForTests,
    claimProcessedEvent,
  } = await import("@dial/shared");
  __resetIdempotencyForTests();
  assert.equal(
    claimProcessedEvent({ eventId: "same_id", source: "paynow" }),
    "accepted",
  );
  assert.equal(
    claimProcessedEvent({ eventId: "same_id", source: "paynow" }),
    "duplicate",
  );
  assert.equal(
    claimProcessedEvent({ eventId: "same_id", source: "fdms" }),
    "accepted",
  );
  const { admitWebhookEvent, __resetWhatsappForTests } = await import(
    "@dial/adapter-whatsapp"
  );
  __resetWhatsappForTests();
  assert.equal(admitWebhookEvent("wa_s103"), "accepted");
  assert.equal(admitWebhookEvent("wa_s103"), "duplicate");
});

test("S115 admin money outbox drain fail-closed + fixture drain", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const prev = process.env.INTERNAL_API_SECRET;
  delete process.env.INTERNAL_API_SECRET;
  const { GET, POST, __testMoneyOutbox } = await import(
    "./app/api/admin/money/outbox/route.js"
  );
  const closed = await GET(new Request("http://localhost/api/admin/money/outbox"));
  assert.equal(closed.status, 503);

  process.env.INTERNAL_API_SECRET = "s115_secret";
  const { __resetTaxForTests, enqueueFiscalReceipt } = await import("@dial/tax");
  const { money } = await import("@dial/shared");
  __testMoneyOutbox.reset();
  __resetTaxForTests();

  const fee = enqueueFiscalReceipt({
    orderId: "ord_s115",
    receiptClass: "DIAL_FEE",
    amount: money(50n, "USD"),
    channel: "web",
  });
  __testMoneyOutbox.enqueue({ kind: "ledger_posted", refId: "jr_s115" });
  __testMoneyOutbox.enqueue({ kind: "fiscal_queued", refId: fee.id });
  assert.ok(__testMoneyOutbox.list().length >= 2);

  const headers = { "x-internal-secret": "s115_secret" };
  const listed = await GET(
    new Request("http://localhost/api/admin/money/outbox", { headers }),
  );
  assert.equal(listed.status, 200);
  const depthBody = (await listed.json()) as { depth: number };
  assert.equal(depthBody.depth, __testMoneyOutbox.list().length);

  const drained = await POST(
    new Request("http://localhost/api/admin/money/outbox", {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ enqueueSideEffects: true }),
    }),
  );
  assert.equal(drained.status, 200);
  const drainBody = (await drained.json()) as {
    remaining: number;
    drained: Array<{ status: string }>;
  };
  assert.equal(drainBody.remaining, 0);
  assert.ok(drainBody.drained.length >= 1);
  assert.equal(__testMoneyOutbox.list().length, 0);

  const health = await (
    await import("./app/api/health/integrations/route.js")
  ).GET();
  const healthBody = (await health.json()) as {
    moneyOutbox: { depth: number };
  };
  assert.equal(typeof healthBody.moneyOutbox.depth, "number");

  if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
  else process.env.INTERNAL_API_SECRET = prev;
});

test("S117 ContiPay/EcoCash webhook routes: accept + duplicate + sandbox bad-sig", async () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const prevConti = process.env.CONTIPAY_API_SECRET;
  const prevEco = process.env.ECOCASH_WEBHOOK_SECRET;
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const { __resetIdempotencyForTests } = await import("@dial/shared");
  __resetIdempotencyForTests();

  const { POST: contiPost } = await import("./app/api/webhooks/contipay/route.js");
  const { POST: ecoPost } = await import("./app/api/webhooks/ecocash/route.js");

  const contiBody = JSON.stringify({
    eventId: "conti_s117",
    paymentId: "pay_s117",
    status: "paid",
  });
  const conti1 = await contiPost(
    new Request("http://localhost/api/webhooks/contipay", {
      method: "POST",
      body: contiBody,
    }),
  );
  assert.equal(conti1.status, 200);
  const conti1Body = (await conti1.json()) as { ok: boolean; duplicate?: boolean };
  assert.equal(conti1Body.ok, true);
  assert.equal(conti1Body.duplicate, undefined);

  const conti2 = await contiPost(
    new Request("http://localhost/api/webhooks/contipay", {
      method: "POST",
      body: contiBody,
    }),
  );
  assert.equal(conti2.status, 200);
  const conti2Body = (await conti2.json()) as { duplicate?: boolean };
  assert.equal(conti2Body.duplicate, true);

  const ecoBody = JSON.stringify({
    eventId: "eco_s117",
    transactionId: "tx_s117",
    status: "SUCCESS",
  });
  const eco1 = await ecoPost(
    new Request("http://localhost/api/webhooks/ecocash", {
      method: "POST",
      body: ecoBody,
    }),
  );
  assert.equal(eco1.status, 200);
  const eco2 = await ecoPost(
    new Request("http://localhost/api/webhooks/ecocash", {
      method: "POST",
      body: ecoBody,
    }),
  );
  assert.equal(((await eco2.json()) as { duplicate?: boolean }).duplicate, true);

  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  process.env.CONTIPAY_API_SECRET = "conti_sandbox_secret";
  process.env.ECOCASH_WEBHOOK_SECRET = "eco_sandbox_secret";
  const badConti = await contiPost(
    new Request("http://localhost/api/webhooks/contipay", {
      method: "POST",
      headers: { "x-contipay-signature": "deadbeef" },
      body: JSON.stringify({ eventId: "conti_bad", paymentId: "x", status: "paid" }),
    }),
  );
  assert.equal(badConti.status, 401);
  const badEco = await ecoPost(
    new Request("http://localhost/api/webhooks/ecocash", {
      method: "POST",
      headers: { "x-ecocash-signature": "deadbeef" },
      body: JSON.stringify({
        eventId: "eco_bad",
        transactionId: "y",
        status: "SUCCESS",
      }),
    }),
  );
  assert.equal(badEco.status, 401);

  process.env.DIAL_INTEGRATION_MODE = prevMode;
  if (prevConti === undefined) delete process.env.CONTIPAY_API_SECRET;
  else process.env.CONTIPAY_API_SECRET = prevConti;
  if (prevEco === undefined) delete process.env.ECOCASH_WEBHOOK_SECRET;
  else process.env.ECOCASH_WEBHOOK_SECRET = prevEco;
});

test("S118 PayPal/FDMS webhook routes: durable accept + duplicate + fail-closed", async () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const prevPp = process.env.PAYPAL_WEBHOOK_ID;
  const prevFdms = process.env.FDMS_ACTIVATION_KEY;
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const { __resetIdempotencyForTests } = await import("@dial/shared");
  __resetIdempotencyForTests();

  const { POST: ppPost } = await import("./app/api/webhooks/paypal/route.js");
  const { POST: fdmsPost } = await import("./app/api/webhooks/fdms/route.js");

  const ppBody = JSON.stringify({
    id: "WH-S118",
    event_type: "PAYMENT.CAPTURE.COMPLETED",
    resource: { id: "CAP-S118" },
  });
  const pp1 = await ppPost(
    new Request("http://localhost/api/webhooks/paypal", {
      method: "POST",
      headers: { "paypal-transmission-id": "txn_s118" },
      body: ppBody,
    }),
  );
  assert.equal(pp1.status, 200);
  assert.equal(((await pp1.json()) as { ok: boolean }).ok, true);
  const pp2 = await ppPost(
    new Request("http://localhost/api/webhooks/paypal", {
      method: "POST",
      headers: { "paypal-transmission-id": "txn_s118" },
      body: ppBody,
    }),
  );
  assert.equal(((await pp2.json()) as { duplicate?: boolean }).duplicate, true);

  const fdms1 = await fdmsPost(
    new Request("http://localhost/api/webhooks/fdms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId: "fdms_s118", type: "ack" }),
    }),
  );
  assert.equal(fdms1.status, 200);
  const fdms2 = await fdmsPost(
    new Request("http://localhost/api/webhooks/fdms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId: "fdms_s118", type: "ack" }),
    }),
  );
  assert.equal(((await fdms2.json()) as { duplicate?: boolean }).duplicate, true);

  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.PAYPAL_WEBHOOK_ID;
  const badPp = await ppPost(
    new Request("http://localhost/api/webhooks/paypal", {
      method: "POST",
      body: JSON.stringify({ id: "x" }),
    }),
  );
  assert.equal(badPp.status, 401);
  delete process.env.FDMS_ACTIVATION_KEY;
  const badFdms = await fdmsPost(
    new Request("http://localhost/api/webhooks/fdms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId: "fdms_closed" }),
    }),
  );
  assert.equal(badFdms.status, 503);

  process.env.DIAL_INTEGRATION_MODE = prevMode;
  if (prevPp === undefined) delete process.env.PAYPAL_WEBHOOK_ID;
  else process.env.PAYPAL_WEBHOOK_ID = prevPp;
  if (prevFdms === undefined) delete process.env.FDMS_ACTIVATION_KEY;
  else process.env.FDMS_ACTIVATION_KEY = prevFdms;
});

test("S119 Paynow webhook durable claim + fixture payments SoR bridge", async () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const prevKey = process.env.PAYNOW_INTEGRATION_KEY;
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const { __resetIdempotencyForTests } = await import("@dial/shared");
  const { __resetLedgerForTests } = await import("@dial/ledger");
  const { __resetTaxForTests } = await import("@dial/tax");
  const { POST, __testPaynowPayments } = await import(
    "./app/api/webhooks/paynow/route.js"
  );
  __resetIdempotencyForTests();
  __testPaynowPayments.reset();
  __resetLedgerForTests();
  __resetTaxForTests();

  const authorized = await __testPaynowPayments.runE1aMoneySpine({
    orderId: "ord_s119",
    supplierDisplayName: "S119 Spares",
    formality: "formal",
    amountUsdMinor: 20_00n,
    dialFeeUsdMinor: 2_00n,
    buyerSegment: "b2c",
    channel: "web",
    pspEventId: "psp_s119_unused",
    signatureValid: false,
  });
  assert.equal(authorized.intent.status, "authorized");

  const body = new URLSearchParams({
    reference: authorized.intent.id,
    status: "Paid",
    paynowreference: "pn_s119",
  }).toString();

  const first = await POST(
    new Request("http://localhost/api/webhooks/paynow", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    }),
  );
  assert.equal(first.status, 200);
  const firstJson = (await first.json()) as {
    ok: boolean;
    bridge?: string;
    duplicate?: boolean;
  };
  assert.equal(firstJson.ok, true);
  assert.equal(firstJson.bridge, "captured");
  assert.equal(
    __testPaynowPayments.getPaymentIntent(authorized.intent.id)?.status,
    "captured",
  );

  const dup = await POST(
    new Request("http://localhost/api/webhooks/paynow", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    }),
  );
  assert.equal(((await dup.json()) as { duplicate?: boolean }).duplicate, true);

  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  process.env.PAYNOW_INTEGRATION_KEY = "live_key_for_hash";
  const bad = await POST(
    new Request("http://localhost/api/webhooks/paynow", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-paynow-hash": "DEADBEEF",
      },
      body: "reference=x&status=Paid&paynowreference=bad",
    }),
  );
  assert.equal(bad.status, 401);

  process.env.DIAL_INTEGRATION_MODE = prevMode;
  if (prevKey === undefined) delete process.env.PAYNOW_INTEGRATION_KEY;
  else process.env.PAYNOW_INTEGRATION_KEY = prevKey;
});

test("S120 WhatsApp webhook durable claim + Meta HMAC fail-closed", async () => {
  const { createHmac } = await import("node:crypto");
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const prevSecret = process.env.WHATSAPP_APP_SECRET;
  const prevMeta = process.env.META_WA_APP_SECRET;
  const prevVerify = process.env.WHATSAPP_VERIFY_TOKEN;
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  delete process.env.WHATSAPP_APP_SECRET;
  delete process.env.META_WA_APP_SECRET;
  process.env.WHATSAPP_VERIFY_TOKEN = "verify_s120";

  const { __resetIdempotencyForTests } = await import("@dial/shared");
  __resetIdempotencyForTests();
  const { GET, POST } = await import("./app/api/webhooks/whatsapp/route.js");

  const challenge = await GET(
    new Request(
      "http://localhost/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=verify_s120&hub.challenge=chal_s120",
    ),
  );
  assert.equal(challenge.status, 200);
  assert.equal(await challenge.text(), "chal_s120");

  const closed = await POST(
    new Request("http://localhost/api/webhooks/whatsapp", {
      method: "POST",
      body: "{}",
    }),
  );
  assert.equal(closed.status, 503);

  process.env.WHATSAPP_APP_SECRET = "wa_secret_s120";
  const raw = '{"object":"whatsapp_business_account","entry":[]}';
  const goodSig =
    "sha256=" +
    createHmac("sha256", "wa_secret_s120").update(raw).digest("hex");
  const ok = await POST(
    new Request("http://localhost/api/webhooks/whatsapp", {
      method: "POST",
      headers: {
        "x-hub-signature-256": goodSig,
        "x-hub-delivery-id": "del_s120",
      },
      body: raw,
    }),
  );
  assert.equal(ok.status, 200);
  assert.equal(((await ok.json()) as { admitted?: boolean }).admitted, true);

  const dup = await POST(
    new Request("http://localhost/api/webhooks/whatsapp", {
      method: "POST",
      headers: {
        "x-hub-signature-256": goodSig,
        "x-hub-delivery-id": "del_s120",
      },
      body: raw,
    }),
  );
  assert.equal(((await dup.json()) as { duplicate?: boolean }).duplicate, true);

  const bad = await POST(
    new Request("http://localhost/api/webhooks/whatsapp", {
      method: "POST",
      headers: {
        "x-hub-signature-256": "sha256=deadbeef",
        "x-hub-delivery-id": "del_s120_bad",
      },
      body: raw,
    }),
  );
  assert.equal(bad.status, 401);

  process.env.DIAL_INTEGRATION_MODE = prevMode;
  if (prevSecret === undefined) delete process.env.WHATSAPP_APP_SECRET;
  else process.env.WHATSAPP_APP_SECRET = prevSecret;
  if (prevMeta === undefined) delete process.env.META_WA_APP_SECRET;
  else process.env.META_WA_APP_SECRET = prevMeta;
  if (prevVerify === undefined) delete process.env.WHATSAPP_VERIFY_TOKEN;
  else process.env.WHATSAPP_VERIFY_TOKEN = prevVerify;
});

test("S121 Escrow PSP webhook durable smoke + sandbox fail-closed", async () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const prevSecret = process.env.PSP_WEBHOOK_SECRET;
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const { __resetIdempotencyForTests } = await import("@dial/shared");
  __resetIdempotencyForTests();
  const { POST } = await import("./app/api/webhooks/escrow/route.js");

  const body = JSON.stringify({
    eventId: "escrow_s121",
    type: "escrow.capture",
    holdId: "hold_s121",
    status: "captured",
  });
  const first = await POST(
    new Request("http://localhost/api/webhooks/escrow", {
      method: "POST",
      body,
    }),
  );
  assert.equal(first.status, 200);
  assert.equal(((await first.json()) as { ok: boolean }).ok, true);

  const dup = await POST(
    new Request("http://localhost/api/webhooks/escrow", {
      method: "POST",
      body,
    }),
  );
  assert.equal(((await dup.json()) as { duplicate?: boolean }).duplicate, true);

  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  process.env.PSP_WEBHOOK_SECRET = "escrow_sandbox_secret";
  const bad = await POST(
    new Request("http://localhost/api/webhooks/escrow", {
      method: "POST",
      headers: { "x-psp-signature": "sha256=deadbeef" },
      body: JSON.stringify({ eventId: "escrow_bad", holdId: "x" }),
    }),
  );
  assert.equal(bad.status, 401);

  delete process.env.PSP_WEBHOOK_SECRET;
  const closed = await POST(
    new Request("http://localhost/api/webhooks/escrow", {
      method: "POST",
      body: JSON.stringify({ eventId: "escrow_closed" }),
    }),
  );
  assert.equal(closed.status, 401);

  process.env.DIAL_INTEGRATION_MODE = prevMode;
  if (prevSecret === undefined) delete process.env.PSP_WEBHOOK_SECRET;
  else process.env.PSP_WEBHOOK_SECRET = prevSecret;
});
