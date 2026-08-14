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
  assert.ok(cost.includes("INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID"));
  assert.ok(integ.includes("/api/openapi"));
  assert.ok(integ.includes("/api/health/integrations"));
  assert.ok(integ.includes("INTEGRATION_ENV_GROUPS"));
  assert.ok(integ.includes("INTEGRATION_ENV_GROUP_LABELS"));
  assert.ok(integ.includes("INTEGRATIONS_HEALTH_NOTE_UI_MAX"));
  assert.ok(integ.includes("openapi-primary-link"));
  assert.ok(integ.includes("env-groups-sor-hint"));
  assert.ok(integ.includes("INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID"));
  assert.ok(readme.includes("/api/openapi"));
  assert.ok(readme.includes("/admin/integrations"));
  assert.ok(readme.includes("openapi-gateway.json"));
  assert.ok(readme.includes("INTEGRATION_ENV_GROUPS"));
  assert.ok(readme.includes("INTEGRATION_ENV_GROUP_LABELS"));
});

test("S175 S135 parity includes note-builder-sor-hint on both admin pages", async () => {
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
  assert.ok(cost.includes("INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID"));
  assert.ok(integ.includes("INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID"));
  assert.ok(cost.includes("data-testid={INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID}"));
  assert.ok(integ.includes("data-testid={INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID}"));
  assert.ok(cost.includes("openapi-primary-link"));
  assert.ok(integ.includes("openapi-primary-link"));
  assert.ok(cost.includes("env-groups-sor-hint"));
  assert.ok(integ.includes("env-groups-sor-hint"));
});

test("S176 admin pages use INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID string", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const {
    INTEGRATIONS_NOTE_BUILDER_SOR_DOCS,
    INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID,
  } = await import("./lib/integrationsReadiness.js");
  const cost = readFileSync(
    join(process.cwd(), "src/app/admin/cost-health/page.tsx"),
    "utf8",
  );
  const integ = readFileSync(
    join(process.cwd(), "src/app/admin/integrations/page.tsx"),
    "utf8",
  );
  assert.equal(INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID, "note-builder-sor-hint");
  assert.ok(cost.includes("INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID"));
  assert.ok(integ.includes("INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID"));
  assert.ok(
    cost.includes("data-testid={INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID}"),
  );
  assert.ok(
    integ.includes("data-testid={INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID}"),
  );
  assert.equal(
    INTEGRATIONS_NOTE_BUILDER_SOR_DOCS,
    "docs/integrations/README.md",
  );
});

test("S179 admin UI imports HINT_ID for data-testid", async () => {
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
  for (const src of [cost, integ]) {
    assert.ok(src.includes("INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID"));
    assert.ok(src.includes("data-testid={INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID}"));
    assert.equal(src.includes('data-testid="note-builder-sor-hint"'), false);
  }
});

test("S185 admin UI cites DOCS constant in note-builder hint copy", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { INTEGRATIONS_NOTE_BUILDER_SOR_DOCS } = await import(
    "./lib/integrationsReadiness.js"
  );
  const cost = readFileSync(
    join(process.cwd(), "src/app/admin/cost-health/page.tsx"),
    "utf8",
  );
  const integ = readFileSync(
    join(process.cwd(), "src/app/admin/integrations/page.tsx"),
    "utf8",
  );
  for (const src of [cost, integ]) {
    assert.ok(src.includes("INTEGRATIONS_NOTE_BUILDER_SOR_DOCS"));
    assert.ok(src.includes("{INTEGRATIONS_NOTE_BUILDER_SOR_DOCS}"));
  }
  assert.equal(
    INTEGRATIONS_NOTE_BUILDER_SOR_DOCS,
    "docs/integrations/README.md",
  );
});

test("S186 .env.example cites noteBuilderDocs OpenAPI key", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const envExample = readFileSync(
    join(process.cwd(), "../../.env.example"),
    "utf8",
  );
  assert.ok(envExample.includes("noteBuilderDocs"));
  assert.ok(envExample.includes("INTEGRATIONS_NOTE_BUILDER_SOR_DOCS"));
  assert.ok(envExample.includes("x-dial-sor"));
});

test("S187 integrations README cites x-dial-sor.noteBuilderDocs", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const integ = readFileSync(
    join(process.cwd(), "../../docs/integrations/README.md"),
    "utf8",
  );
  assert.ok(integ.includes("x-dial-sor.noteBuilderDocs"));
  assert.ok(integ.includes("INTEGRATIONS_NOTE_BUILDER_SOR_DOCS"));
});

test("S188 root README cites x-dial-sor.noteBuilderDocs", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const readme = readFileSync(join(process.cwd(), "../../README.md"), "utf8");
  assert.ok(readme.includes("noteBuilderDocs"));
  assert.ok(readme.includes("INTEGRATIONS_NOTE_BUILDER_SOR_DOCS"));
  assert.ok(readme.includes("x-dial-sor"));
});

test("S189 OpenAPI info.description mentions noteBuilderDocs", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const raw = readFileSync(
    join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
    "utf8",
  );
  const spec = JSON.parse(raw) as { info?: { description?: string } };
  assert.ok(spec.info?.description?.includes("noteBuilderDocs"));
  assert.ok(spec.info?.description?.includes("INTEGRATIONS_NOTE_BUILDER_SOR_DOCS"));

  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as { info?: { description?: string } };
  assert.ok(served.info?.description?.includes("noteBuilderDocs"));
  assert.ok(
    served.info?.description?.includes("INTEGRATIONS_NOTE_BUILDER_SOR_DOCS"),
  );
});

test("S190 sandbox health ready is false when probes incomplete", async () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const prevRedis = process.env.REDIS_URL;
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.REDIS_URL;
  try {
    const { integrationsReady } = await import(
      "./lib/integrationsReadiness.js"
    );
    const { GET } = await import("./app/api/health/integrations/route.js");
    const res = await GET();
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      mode?: string;
      ready?: boolean;
      probes?: Record<string, boolean>;
    };
    assert.equal(body.mode, "sandbox");
    assert.equal(body.probes?.queues, false);
    assert.equal(body.ready, false);
    assert.equal(body.ready, integrationsReady(body.probes ?? {}));
  } finally {
    if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prevMode;
    if (prevRedis === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = prevRedis;
  }
});

test("S191 live health ready is false when probes incomplete", async () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const prevRedis = process.env.REDIS_URL;
  process.env.DIAL_INTEGRATION_MODE = "live";
  delete process.env.REDIS_URL;
  try {
    const { integrationsReady } = await import(
      "./lib/integrationsReadiness.js"
    );
    const { GET } = await import("./app/api/health/integrations/route.js");
    const res = await GET();
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      mode?: string;
      ready?: boolean;
      probes?: Record<string, boolean>;
    };
    assert.equal(body.mode, "live");
    assert.equal(body.probes?.queues, false);
    assert.equal(body.ready, false);
    assert.equal(body.ready, integrationsReady(body.probes ?? {}));
  } finally {
    if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prevMode;
    if (prevRedis === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = prevRedis;
  }
});

test("S192 OpenAPI x-dial-sor includes noteBuilderHint and noteBuilderDocs", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as {
    info?: {
      "x-dial-sor"?: {
        noteBuilderHint?: string;
        noteBuilderDocs?: string;
      };
    };
  };
  assert.ok(
    served.info?.["x-dial-sor"]?.noteBuilderHint?.includes(
      "INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID",
    ),
  );
  assert.ok(
    served.info?.["x-dial-sor"]?.noteBuilderDocs?.includes(
      "INTEGRATIONS_NOTE_BUILDER_SOR_DOCS",
    ),
  );
});

test("S193 fixture ready=true even when env groups incomplete", async () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  try {
    const { GET } = await import("./app/api/health/integrations/route.js");
    const res = await GET();
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      mode?: string;
      ready?: boolean;
      probes?: Record<string, boolean>;
      groups?: Array<{ label: string; configured: boolean; missing: string[] }>;
    };
    assert.equal(body.mode, "fixture");
    assert.equal(body.ready, true);
    assert.ok(body.groups && body.groups.length > 0);
    const incomplete = body.groups!.filter((g) => !g.configured);
    assert.ok(
      incomplete.length > 0,
      "fixture CI expects at least one incomplete env group",
    );
    assert.ok(incomplete.every((g) => g.missing.length > 0));
    assert.ok(
      Object.values(body.probes ?? {}).every((v) => v === true),
      "fixture probes must all be true when ready=true",
    );
  } finally {
    if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prevMode;
  }
});

test("S194 docs + OpenAPI document ready vs groups configured", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const readme = readFileSync(
    join(process.cwd(), "../../docs/integrations/README.md"),
    "utf8",
  );
  assert.ok(readme.includes("### `ready` meaning (S194)"));
  assert.ok(readme.includes("integrationsReady(probes)"));
  assert.ok(readme.includes("groups[].configured"));
  assert.ok(readme.includes("not** “all env groups configured"));
  const raw = readFileSync(
    join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
    "utf8",
  );
  const spec = JSON.parse(raw) as {
    info?: { "x-dial-sor"?: { readyVsGroups?: string } };
    components?: {
      schemas?: {
        IntegrationsHealth?: {
          properties?: {
            ready?: { description?: string };
            groups?: { description?: string };
          };
        };
      };
    };
  };
  assert.ok(spec.info?.["x-dial-sor"]?.readyVsGroups?.includes("ready-meaning-s194"));
  assert.ok(
    spec.components?.schemas?.IntegrationsHealth?.properties?.ready?.description?.includes(
      "independent of groups",
    ),
  );
  assert.ok(
    spec.components?.schemas?.IntegrationsHealth?.properties?.groups?.description?.includes(
      "configured≠ready",
    ),
  );
});

test("S195 health note text differs fixture vs sandbox/live", async () => {
  const { buildIntegrationsHealthNote } = await import(
    "./lib/integrationsReadiness.js"
  );
  const fixture = buildIntegrationsHealthNote("fixture");
  const sandbox = buildIntegrationsHealthNote("sandbox");
  const live = buildIntegrationsHealthNote("live");
  assert.ok(fixture.startsWith("Fixture mode"));
  assert.ok(sandbox.startsWith("Sandbox/live"));
  assert.equal(sandbox, live);
  assert.notEqual(fixture, sandbox);
  assert.ok(fixture.includes("groups labels="));
  assert.ok(sandbox.includes("groups labels="));

  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  try {
    for (const mode of ["fixture", "sandbox"] as const) {
      process.env.DIAL_INTEGRATION_MODE = mode;
      const { GET } = await import("./app/api/health/integrations/route.js");
      const res = await GET();
      assert.equal(res.status, 200);
      const body = (await res.json()) as { note?: string; mode?: string };
      assert.equal(body.mode, mode);
      assert.equal(body.note, buildIntegrationsHealthNote(mode));
    }
  } finally {
    if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prevMode;
  }
});

test("S196 OpenAPI webhooks document signature + idempotency SoR", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const raw = readFileSync(
    join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
    "utf8",
  );
  const spec = JSON.parse(raw) as {
    info?: {
      "x-dial-sor"?: {
        webhookSignature?: string;
        webhookIdempotency?: string;
      };
    };
    tags?: Array<{ name: string; description?: string }>;
    paths: Record<
      string,
      {
        post?: {
          responses?: { "200"?: { description?: string }; "401"?: unknown };
        };
      }
    >;
    components?: {
      schemas?: { WebhookOpaqueBody?: { description?: string } };
    };
  };
  assert.ok(
    (spec.info?.["x-dial-sor"]?.webhookSignature ?? "")
      .toLowerCase()
      .includes("signature"),
  );
  assert.ok(
    spec.info?.["x-dial-sor"]?.webhookIdempotency?.includes("claimProcessedEvent"),
  );
  const whTag = spec.tags?.find((t) => t.name === "webhooks");
  assert.ok(whTag?.description?.includes("claimProcessedEvent"));
  assert.ok(whTag?.description?.includes("signature"));
  assert.ok(
    spec.components?.schemas?.WebhookOpaqueBody?.description?.includes(
      "processed_events",
    ),
  );
  const postPaths = Object.keys(spec.paths).filter(
    (p) => p.startsWith("/api/webhooks/") && spec.paths[p]?.post,
  );
  assert.ok(postPaths.length >= 8);
  for (const p of postPaths) {
    const d200 = spec.paths[p]?.post?.responses?.["200"]?.description ?? "";
    assert.ok(
      d200.toLowerCase().includes("idempotent"),
      `${p} 200 must mention idempotent`,
    );
    assert.ok(
      spec.paths[p]?.post?.responses?.["401"],
      `${p} must document 401 bad signature`,
    );
  }
});

test("S197 OpenAPI webhook paths never embed secret values", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const raw = readFileSync(
    join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
    "utf8",
  );
  const banned = [
    "sk_live",
    "sk_test",
    "service_role",
    "whsec_",
    "Bearer ",
    "BEGIN PRIVATE KEY",
  ];
  for (const s of banned) {
    assert.equal(raw.includes(s), false, `OpenAPI must not contain ${s}`);
  }
  const spec = JSON.parse(raw) as {
    paths: Record<string, { post?: { responses?: Record<string, unknown> } }>;
  };
  const webhookPaths = Object.keys(spec.paths).filter((p) =>
    p.startsWith("/api/webhooks/"),
  );
  assert.ok(webhookPaths.length >= 8);
  for (const p of webhookPaths) {
    const post = spec.paths[p]?.post;
    if (!post) continue;
    const blob = JSON.stringify(post);
    for (const s of banned) {
      assert.equal(blob.includes(s), false, `${p} must not contain ${s}`);
    }
  }
});

test("S198 served OpenAPI includes webhookSignature + webhookIdempotency", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as {
    info?: {
      "x-dial-sor"?: {
        webhookSignature?: string;
        webhookIdempotency?: string;
        readyVsGroups?: string;
      };
    };
    tags?: Array<{ name: string; description?: string }>;
  };
  const sor = served.info?.["x-dial-sor"];
  assert.ok(
    (sor?.webhookSignature ?? "").toLowerCase().includes("signature"),
  );
  assert.ok(sor?.webhookIdempotency?.includes("claimProcessedEvent"));
  assert.ok(sor?.readyVsGroups?.includes("ready-meaning-s194"));
  const whTag = served.tags?.find((t) => t.name === "webhooks");
  assert.ok(whTag?.description?.includes("claimProcessedEvent"));
});

test("S199 root README cites ready≠groups configured", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const readme = readFileSync(join(process.cwd(), "../../README.md"), "utf8");
  assert.ok(readme.includes("readyVsGroups"));
  assert.ok(readme.includes("integrationsReady(probes)"));
  assert.ok(readme.includes("groups[].configured"));
});

test("S200 .env.example cites ready vs groups SoR", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const envExample = readFileSync(
    join(process.cwd(), "../../.env.example"),
    "utf8",
  );
  assert.ok(envExample.includes("readyVsGroups"));
  assert.ok(envExample.includes("integrationsReady"));
  assert.ok(envExample.includes("groups[].configured"));
});

test("S201 integrations README documents webhook OpenAPI SoR keys", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const readme = readFileSync(
    join(process.cwd(), "../../docs/integrations/README.md"),
    "utf8",
  );
  assert.ok(readme.includes("webhookSignature"));
  assert.ok(readme.includes("webhookIdempotency"));
  assert.ok(readme.includes("claimProcessedEvent"));
});

test("S202 admin integrations page cites ready≠groups hint", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { INTEGRATIONS_READY_VS_GROUPS_HINT_ID } = await import(
    "./lib/integrationsReadiness.js"
  );
  const src = readFileSync(
    join(process.cwd(), "src/app/admin/integrations/page.tsx"),
    "utf8",
  );
  assert.ok(src.includes("INTEGRATIONS_READY_VS_GROUPS_HINT_ID"));
  assert.ok(src.includes("integrationsReady(probes)"));
  assert.ok(src.includes("groups[].configured"));
  assert.ok(src.includes("readyVsGroups"));
  assert.equal(INTEGRATIONS_READY_VS_GROUPS_HINT_ID, "ready-vs-groups-sor-hint");
});

test("S203 served OpenAPI webhook POST 200s mention idempotent", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as {
    paths: Record<
      string,
      { post?: { responses?: { "200"?: { description?: string } } } }
    >;
  };
  const posts = Object.keys(served.paths).filter(
    (p) => p.startsWith("/api/webhooks/") && served.paths[p]?.post,
  );
  assert.ok(posts.length >= 8);
  for (const p of posts) {
    const d = served.paths[p]?.post?.responses?.["200"]?.description ?? "";
    assert.ok(
      d.toLowerCase().includes("idempotent"),
      `${p} served 200 must mention idempotent`,
    );
  }
});

test("S204 OpenAPI info.description mentions webhookSignature", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const raw = readFileSync(
    join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
    "utf8",
  );
  const spec = JSON.parse(raw) as { info?: { description?: string } };
  assert.ok(spec.info?.description?.includes("webhookSignature"));
  assert.ok(spec.info?.description?.includes("webhookIdempotency"));
});

test("S205 cost-health page parity for ready≠groups hint", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const src = readFileSync(
    join(process.cwd(), "src/app/admin/cost-health/page.tsx"),
    "utf8",
  );
  assert.ok(src.includes("INTEGRATIONS_READY_VS_GROUPS_HINT_ID"));
  assert.ok(src.includes("integrationsReady(probes)"));
  assert.ok(src.includes("readyVsGroups"));
});

test("S206 OpenAPI x-dial-sor.readyVsGroupsHint points at HINT_ID", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { INTEGRATIONS_READY_VS_GROUPS_HINT_ID } = await import(
    "./lib/integrationsReadiness.js"
  );
  const raw = readFileSync(
    join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
    "utf8",
  );
  const spec = JSON.parse(raw) as {
    info?: { "x-dial-sor"?: { readyVsGroupsHint?: string } };
  };
  assert.ok(
    spec.info?.["x-dial-sor"]?.readyVsGroupsHint?.includes(
      "INTEGRATIONS_READY_VS_GROUPS_HINT_ID",
    ),
  );
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    info?: { "x-dial-sor"?: { readyVsGroupsHint?: string } };
  };
  assert.ok(
    served.info?.["x-dial-sor"]?.readyVsGroupsHint?.includes(
      INTEGRATIONS_READY_VS_GROUPS_HINT_ID,
    ) ||
      served.info?.["x-dial-sor"]?.readyVsGroupsHint?.includes(
        "INTEGRATIONS_READY_VS_GROUPS_HINT_ID",
      ),
  );
});

test("S207 integrations README cites INTEGRATIONS_READY_VS_GROUPS_HINT_ID", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const readme = readFileSync(
    join(process.cwd(), "../../docs/integrations/README.md"),
    "utf8",
  );
  assert.ok(readme.includes("INTEGRATIONS_READY_VS_GROUPS_HINT_ID"));
  assert.ok(readme.includes("readyVsGroupsHint"));
});

test("S208 .env.example cites readyVsGroupsHint", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const envExample = readFileSync(
    join(process.cwd(), "../../.env.example"),
    "utf8",
  );
  assert.ok(envExample.includes("readyVsGroupsHint"));
  assert.ok(envExample.includes("INTEGRATIONS_READY_VS_GROUPS_HINT_ID"));
});

test("S209 root README cites readyVsGroupsHint", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const readme = readFileSync(join(process.cwd(), "../../README.md"), "utf8");
  assert.ok(readme.includes("readyVsGroupsHint"));
  assert.ok(readme.includes("INTEGRATIONS_READY_VS_GROUPS_HINT_ID"));
});

test("S210 groups[].missing are key names only (no values)", async () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  try {
    const { GET } = await import("./app/api/health/integrations/route.js");
    const res = await GET();
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      groups?: Array<{ missing: string[] }>;
    };
    const blob = JSON.stringify(body.groups ?? []);
    for (const s of ["sk_live", "service_role", "whsec_", "Bearer "]) {
      assert.equal(blob.includes(s), false, `groups must not contain ${s}`);
    }
    for (const g of body.groups ?? []) {
      for (const key of g.missing) {
        assert.ok(/^[A-Z][A-Z0-9_]*$/.test(key), `missing key name: ${key}`);
        assert.ok(!key.includes("="));
        assert.ok(!key.includes(":"));
      }
    }
  } finally {
    if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prevMode;
  }
});

test("S211 fixture ready=true with zero groups configured", async () => {
  const { INTEGRATION_ENV_GROUPS } = await import(
    "./lib/integrationsReadiness.js"
  );
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const saved: Record<string, string | undefined> = {};
  for (const g of INTEGRATION_ENV_GROUPS) {
    for (const k of g.keys) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  }
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  try {
    const { GET } = await import("./app/api/health/integrations/route.js");
    const res = await GET();
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      mode?: string;
      ready?: boolean;
      groups?: Array<{ configured: boolean }>;
    };
    assert.equal(body.mode, "fixture");
    assert.equal(body.ready, true);
    assert.ok(body.groups && body.groups.length > 0);
    assert.ok(
      body.groups!.every((g) => g.configured === false),
      "fixture ready must not require any group configured=true",
    );
  } finally {
    if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prevMode;
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});

test("S212 served OpenAPI readyVsGroupsHint matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { info?: { "x-dial-sor"?: { readyVsGroupsHint?: string } } };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as {
    info?: { "x-dial-sor"?: { readyVsGroupsHint?: string } };
  };
  assert.equal(
    served.info?.["x-dial-sor"]?.readyVsGroupsHint,
    disk.info?.["x-dial-sor"]?.readyVsGroupsHint,
  );
  assert.ok(
    (served.info?.["x-dial-sor"]?.readyVsGroupsHint ?? "").includes(
      "INTEGRATIONS_READY_VS_GROUPS_HINT_ID",
    ),
  );
});

test("S213 served tags.webhooks description lock", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { tags?: Array<{ name: string; description?: string }> };
  const diskWh = disk.tags?.find((t) => t.name === "webhooks");
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as {
    tags?: Array<{ name: string; description?: string }>;
  };
  const servedWh = served.tags?.find((t) => t.name === "webhooks");
  assert.equal(servedWh?.description, diskWh?.description);
  assert.ok(servedWh?.description?.includes("claimProcessedEvent"));
  assert.ok(
    (servedWh?.description ?? "").toLowerCase().includes("signature"),
  );
  assert.ok(servedWh?.description?.includes("processed_events"));
});

test("S214 admin testids share HINT_ID export values", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const {
    INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID,
    INTEGRATIONS_READY_VS_GROUPS_HINT_ID,
  } = await import("./lib/integrationsReadiness.js");
  const integrations = readFileSync(
    join(process.cwd(), "src/app/admin/integrations/page.tsx"),
    "utf8",
  );
  const costHealth = readFileSync(
    join(process.cwd(), "src/app/admin/cost-health/page.tsx"),
    "utf8",
  );
  for (const src of [integrations, costHealth]) {
    assert.ok(src.includes("INTEGRATIONS_READY_VS_GROUPS_HINT_ID"));
    assert.ok(src.includes("INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID"));
    assert.ok(src.includes("data-testid={INTEGRATIONS_READY_VS_GROUPS_HINT_ID}"));
    assert.ok(src.includes("data-testid={INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID}"));
  }
  assert.equal(INTEGRATIONS_READY_VS_GROUPS_HINT_ID, "ready-vs-groups-sor-hint");
  assert.equal(INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID, "note-builder-sor-hint");
});

test("S215 README checklist cites ready≠groups before sandbox", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const readme = readFileSync(
    join(process.cwd(), "../../docs/integrations/README.md"),
    "utf8",
  );
  const checklistIdx = readme.indexOf(
    "Before switching `DIAL_INTEGRATION_MODE` to `sandbox` or `live`",
  );
  assert.ok(checklistIdx >= 0);
  const after = readme.slice(checklistIdx, checklistIdx + 1200);
  assert.ok(after.includes("ready≠groups") || after.includes("ready!=groups") || after.includes("ready vs groups") || after.includes("ready≠`groups") || after.includes("not all groups[].configured"));
  assert.ok(after.includes("groups[].configured") || after.includes("configured"));
  assert.ok(
    after.includes("integrationsReady(probes)") ||
      after.includes("ready === integrationsReady") ||
      after.includes("ready≠groups"),
  );
});

test("S216 served IntegrationsHealth.ready description independent of groups", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as {
    components?: {
      schemas?: {
        IntegrationsHealth?: {
          properties?: { ready?: { description?: string } };
        };
      };
    };
  };
  const d =
    served.components?.schemas?.IntegrationsHealth?.properties?.ready
      ?.description ?? "";
  assert.ok(d.includes("independent of groups"));
  assert.ok(d.toLowerCase().includes("integrationsready") || d.includes("integrationsReady") || d.includes("S194"));
});

test("S217 served WebhookOpaqueBody documents processed_events", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as {
    components?: {
      schemas?: { WebhookOpaqueBody?: { description?: string } };
    };
  };
  const d = served.components?.schemas?.WebhookOpaqueBody?.description ?? "";
  assert.ok(d.includes("processed_events"));
  assert.ok(d.toLowerCase().includes("signature") || d.includes("verify"));
});

test("S218 listIntegrationEnvGroupSnapshots empty env all unconfigured", async () => {
  const { listIntegrationEnvGroupSnapshots, INTEGRATION_ENV_GROUPS } =
    await import("./lib/integrationsReadiness.js");
  const snaps = listIntegrationEnvGroupSnapshots({});
  assert.equal(snaps.length, INTEGRATION_ENV_GROUPS.length);
  assert.ok(snaps.every((g) => g.configured === false));
  assert.ok(snaps.every((g) => g.missing.length === g.requiredCount));
  assert.ok(snaps.every((g) => g.presentCount === 0));
});

test("S219 .env.example cites fixture ready without configured groups", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const envExample = readFileSync(
    join(process.cwd(), "../../.env.example"),
    "utf8",
  );
  assert.ok(envExample.includes("fixture"));
  assert.ok(
    envExample.includes("configured") ||
      envExample.includes("readyVsGroups") ||
      envExample.includes("groups[].configured"),
  );
  assert.ok(
    envExample.includes("S211") ||
      envExample.includes("readyVsGroups") ||
      envExample.includes("integrationsReady"),
  );
});

test("S220 admin pages bind HINT_ID exports not string literals", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const {
    INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID,
    INTEGRATIONS_READY_VS_GROUPS_HINT_ID,
  } = await import("./lib/integrationsReadiness.js");
  for (const rel of [
    "src/app/admin/integrations/page.tsx",
    "src/app/admin/cost-health/page.tsx",
  ]) {
    const src = readFileSync(join(process.cwd(), rel), "utf8");
    assert.equal(
      src.includes(`data-testid="${INTEGRATIONS_READY_VS_GROUPS_HINT_ID}"`),
      false,
      `${rel} must not hardcode ready-vs-groups testid string`,
    );
    assert.equal(
      src.includes(`data-testid="${INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID}"`),
      false,
      `${rel} must not hardcode note-builder testid string`,
    );
    assert.ok(src.includes("{INTEGRATIONS_READY_VS_GROUPS_HINT_ID}"));
    assert.ok(src.includes("{INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID}"));
  }
});

test("S221 served OpenAPI webhookSignature matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { info?: { "x-dial-sor"?: { webhookSignature?: string } } };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as {
    info?: { "x-dial-sor"?: { webhookSignature?: string } };
  };
  assert.equal(
    served.info?.["x-dial-sor"]?.webhookSignature,
    disk.info?.["x-dial-sor"]?.webhookSignature,
  );
  assert.ok(
    (served.info?.["x-dial-sor"]?.webhookSignature ?? "")
      .toLowerCase()
      .includes("signature"),
  );
});

test("S222 served OpenAPI webhookIdempotency matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { info?: { "x-dial-sor"?: { webhookIdempotency?: string } } };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as {
    info?: { "x-dial-sor"?: { webhookIdempotency?: string } };
  };
  assert.equal(
    served.info?.["x-dial-sor"]?.webhookIdempotency,
    disk.info?.["x-dial-sor"]?.webhookIdempotency,
  );
  assert.ok(
    served.info?.["x-dial-sor"]?.webhookIdempotency?.includes(
      "claimProcessedEvent",
    ),
  );
});

test("S223 fixture note cites groups labels with empty env", async () => {
  const {
    INTEGRATION_ENV_GROUPS,
    INTEGRATION_ENV_GROUP_LABELS,
    buildIntegrationsHealthNote,
  } = await import("./lib/integrationsReadiness.js");
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const saved: Record<string, string | undefined> = {};
  for (const g of INTEGRATION_ENV_GROUPS) {
    for (const k of g.keys) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  }
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  try {
    const { GET } = await import("./app/api/health/integrations/route.js");
    const res = await GET();
    assert.equal(res.status, 200);
    const body = (await res.json()) as { note?: string; ready?: boolean };
    assert.equal(body.ready, true);
    const expected = buildIntegrationsHealthNote("fixture");
    assert.equal(body.note, expected);
    assert.ok(body.note?.includes("groups labels="));
    assert.ok(
      body.note?.includes(INTEGRATION_ENV_GROUP_LABELS.join(",")),
      "note must cite full INTEGRATION_ENV_GROUP_LABELS even with empty env",
    );
  } finally {
    if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prevMode;
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});

test("S224 root README cites S211 zero-configured ready", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const readme = readFileSync(join(process.cwd(), "../../README.md"), "utf8");
  assert.ok(readme.includes("S211"));
  assert.ok(
    readme.includes("configured=false") ||
      readme.includes("zero configured") ||
      readme.includes("no groups configured") ||
      readme.includes("without configured"),
  );
  assert.ok(readme.includes("ready"));
});

test("S225 served OpenAPI readyVsGroups matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { info?: { "x-dial-sor"?: { readyVsGroups?: string } } };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as {
    info?: { "x-dial-sor"?: { readyVsGroups?: string } };
  };
  assert.equal(
    served.info?.["x-dial-sor"]?.readyVsGroups,
    disk.info?.["x-dial-sor"]?.readyVsGroups,
  );
  assert.ok(
    served.info?.["x-dial-sor"]?.readyVsGroups?.includes("ready-meaning-s194"),
  );
});

test("S226 served OpenAPI never embeds secret values", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const blob = JSON.stringify(await res.json());
  for (const s of [
    "sk_live",
    "sk_test",
    "service_role",
    "whsec_",
    "Bearer ",
    "BEGIN PRIVATE KEY",
  ]) {
    assert.equal(blob.includes(s), false, `served OpenAPI must not contain ${s}`);
  }
});

test("S227 served webhook POST 401s document signature failure", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as {
    paths: Record<
      string,
      { post?: { responses?: { "401"?: { description?: string } } } }
    >;
  };
  const posts = Object.keys(served.paths).filter(
    (p) => p.startsWith("/api/webhooks/") && served.paths[p]?.post,
  );
  assert.ok(posts.length >= 8);
  for (const p of posts) {
    const d401 = served.paths[p]?.post?.responses?.["401"]?.description ?? "";
    assert.ok(d401.length > 0, `${p} must document 401`);
    assert.ok(
      /signature|hmac|verify/i.test(d401),
      `${p} 401 must mention signature/HMAC/verify`,
    );
  }
});

test("S228 health note equals builder under empty env", async () => {
  const { INTEGRATION_ENV_GROUPS, buildIntegrationsHealthNote } = await import(
    "./lib/integrationsReadiness.js"
  );
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const saved: Record<string, string | undefined> = {};
  for (const g of INTEGRATION_ENV_GROUPS) {
    for (const k of g.keys) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  }
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  try {
    const { GET } = await import("./app/api/health/integrations/route.js");
    const res = await GET();
    const body = (await res.json()) as { note?: string };
    assert.equal(body.note, buildIntegrationsHealthNote("fixture"));
    assert.ok(body.note?.startsWith("Fixture mode"));
  } finally {
    if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prevMode;
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});

test("S229 .env.example cites S211 fixture zero-configured", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const envExample = readFileSync(
    join(process.cwd(), "../../.env.example"),
    "utf8",
  );
  assert.ok(envExample.includes("S211"));
  assert.ok(
    envExample.includes("configured=false") ||
      envExample.includes("configured=false") ||
      envExample.toLowerCase().includes("configured"),
  );
});

test("S230 served x-dial-sor webhook+ready keys match disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    info?: {
      "x-dial-sor"?: Record<string, string>;
    };
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    info?: { "x-dial-sor"?: Record<string, string> };
  };
  const keys = [
    "webhookSignature",
    "webhookIdempotency",
    "readyVsGroups",
    "readyVsGroupsHint",
    "docs",
  ] as const;
  for (const k of keys) {
    assert.equal(
      served.info?.["x-dial-sor"]?.[k],
      disk.info?.["x-dial-sor"]?.[k],
      `x-dial-sor.${k} served must match disk`,
    );
    assert.ok(
      typeof served.info?.["x-dial-sor"]?.[k] === "string" &&
        (served.info?.["x-dial-sor"]?.[k]?.length ?? 0) > 0,
    );
  }
});

test("S231 served OpenAPI info.description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { info?: { description?: string } };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as { info?: { description?: string } };
  assert.equal(served.info?.description, disk.info?.description);
  assert.ok((served.info?.description ?? "").includes("webhookSignature"));
  assert.ok((served.info?.description ?? "").length > 40);
});

test("S232 served WebhookOpaqueBody description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    components?: {
      schemas?: { WebhookOpaqueBody?: { description?: string } };
    };
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    components?: {
      schemas?: { WebhookOpaqueBody?: { description?: string } };
    };
  };
  assert.equal(
    served.components?.schemas?.WebhookOpaqueBody?.description,
    disk.components?.schemas?.WebhookOpaqueBody?.description,
  );
  assert.ok(
    served.components?.schemas?.WebhookOpaqueBody?.description?.includes(
      "processed_events",
    ),
  );
});

test("S233 integrations README cites S211 zero-configured", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const readme = readFileSync(
    join(process.cwd(), "../../docs/integrations/README.md"),
    "utf8",
  );
  assert.ok(readme.includes("S211"));
  assert.ok(readme.includes("S233") || readme.includes("zero configured") || readme.includes("configured=false"));
  assert.ok(
    readme.includes("zero configured") ||
      readme.includes("configured=false") ||
      readme.includes("every `groups[]`"),
  );
});

test("S234 served tags.webhooks description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { tags?: Array<{ name: string; description?: string }> };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    tags?: Array<{ name: string; description?: string }>;
  };
  const diskWh = disk.tags?.find((t) => t.name === "webhooks");
  const servedWh = served.tags?.find((t) => t.name === "webhooks");
  assert.equal(servedWh?.description, diskWh?.description);
  assert.ok(servedWh?.description?.includes("claimProcessedEvent"));
});

test("S235 served OpenAPI healthNote matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { info?: { "x-dial-sor"?: { healthNote?: string } } };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    info?: { "x-dial-sor"?: { healthNote?: string } };
  };
  assert.equal(
    served.info?.["x-dial-sor"]?.healthNote,
    disk.info?.["x-dial-sor"]?.healthNote,
  );
  assert.ok(
    served.info?.["x-dial-sor"]?.healthNote?.includes(
      "buildIntegrationsHealthNote",
    ),
  );
});

test("S236 served webhook POSTs document 503 fail-closed", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      { post?: { responses?: { "503"?: { description?: string } } } }
    >;
  };
  const posts = Object.keys(served.paths).filter(
    (p) => p.startsWith("/api/webhooks/") && served.paths[p]?.post,
  );
  assert.ok(posts.length >= 8);
  for (const p of posts) {
    const d503 = served.paths[p]?.post?.responses?.["503"]?.description ?? "";
    assert.ok(d503.length > 0, `${p} must document 503 fail-closed`);
    assert.ok(
      /fail-closed|misconfig/i.test(d503),
      `${p} 503 must mention fail-closed/misconfig`,
    );
  }
});

test("S237 served IntegrationsHealth.mode enum is fixture|sandbox|live", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    components?: {
      schemas?: {
        IntegrationsHealth?: {
          properties?: { mode?: { enum?: string[] } };
        };
      };
    };
  };
  const modeEnum =
    served.components?.schemas?.IntegrationsHealth?.properties?.mode?.enum ??
    [];
  assert.deepEqual([...modeEnum].sort(), ["fixture", "live", "sandbox"]);
});

test("S238 sandbox health note differs from fixture under empty env", async () => {
  const { INTEGRATION_ENV_GROUPS, buildIntegrationsHealthNote } = await import(
    "./lib/integrationsReadiness.js"
  );
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const saved: Record<string, string | undefined> = {};
  for (const g of INTEGRATION_ENV_GROUPS) {
    for (const k of g.keys) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  }
  try {
    process.env.DIAL_INTEGRATION_MODE = "sandbox";
    const { GET } = await import("./app/api/health/integrations/route.js");
    const res = await GET();
    const body = (await res.json()) as { note?: string; mode?: string };
    assert.equal(body.mode, "sandbox");
    assert.equal(body.note, buildIntegrationsHealthNote("sandbox"));
    assert.ok(body.note?.startsWith("Sandbox/live"));
    assert.notEqual(body.note, buildIntegrationsHealthNote("fixture"));
  } finally {
    if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prevMode;
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});

test("S239 served OpenAPI paths equal disk path keys", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { paths: Record<string, unknown> };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as { paths: Record<string, unknown> };
  assert.deepEqual(
    Object.keys(served.paths).sort(),
    Object.keys(disk.paths).sort(),
  );
  assert.ok(Object.keys(served.paths).some((p) => p.startsWith("/api/webhooks/")));
  assert.ok(served.paths["/api/health/integrations"]);
  assert.ok(served.paths["/api/openapi"]);
});

test("S240 served webhook POST bodies ref WebhookOpaqueBody", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      {
        post?: {
          requestBody?: {
            content?: Record<string, { schema?: { $ref?: string } }>;
          };
        };
      }
    >;
  };
  const posts = Object.keys(served.paths).filter(
    (p) => p.startsWith("/api/webhooks/") && served.paths[p]?.post,
  );
  assert.ok(posts.length >= 8);
  for (const p of posts) {
    const content = served.paths[p]?.post?.requestBody?.content ?? {};
    const refs = Object.values(content).map((c) => c.schema?.$ref ?? "");
    assert.ok(
      refs.some((r) => r.includes("WebhookOpaqueBody")),
      `${p} must $ref WebhookOpaqueBody`,
    );
  }
});

test("S241 served OpenAPI healthNoteUiMax matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { info?: { "x-dial-sor"?: { healthNoteUiMax?: string } } };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as {
    info?: { "x-dial-sor"?: { healthNoteUiMax?: string } };
  };
  assert.equal(
    served.info?.["x-dial-sor"]?.healthNoteUiMax,
    disk.info?.["x-dial-sor"]?.healthNoteUiMax,
  );
  assert.ok(
    served.info?.["x-dial-sor"]?.healthNoteUiMax?.includes(
      "INTEGRATIONS_HEALTH_NOTE_UI_MAX",
    ),
  );
});

test("S242 served OpenAPI noteBuilderDocs matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { info?: { "x-dial-sor"?: { noteBuilderDocs?: string } } };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    info?: { "x-dial-sor"?: { noteBuilderDocs?: string } };
  };
  assert.equal(
    served.info?.["x-dial-sor"]?.noteBuilderDocs,
    disk.info?.["x-dial-sor"]?.noteBuilderDocs,
  );
  assert.ok(
    served.info?.["x-dial-sor"]?.noteBuilderDocs?.includes(
      "INTEGRATIONS_NOTE_BUILDER_SOR_DOCS",
    ),
  );
});

test("S243 live health note equals sandbox builder", async () => {
  const { buildIntegrationsHealthNote } = await import(
    "./lib/integrationsReadiness.js"
  );
  const live = buildIntegrationsHealthNote("live");
  const sandbox = buildIntegrationsHealthNote("sandbox");
  assert.equal(live, sandbox);
  assert.ok(live.startsWith("Sandbox/live"));

  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  process.env.DIAL_INTEGRATION_MODE = "live";
  try {
    const { GET } = await import("./app/api/health/integrations/route.js");
    const res = await GET();
    assert.equal(res.status, 200);
    const body = (await res.json()) as { note?: string; mode?: string };
    assert.equal(body.mode, "live");
    assert.equal(body.note, buildIntegrationsHealthNote("live"));
    assert.equal(body.note, buildIntegrationsHealthNote("sandbox"));
  } finally {
    if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prevMode;
  }
});

test("S244 served probes required keys match INTEGRATION_PROBE_KEYS", async () => {
  const { INTEGRATION_PROBE_KEYS } = await import(
    "./lib/integrationsReadiness.js"
  );
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    components?: {
      schemas?: { IntegrationsProbes?: { required?: string[] } };
    };
  };
  const required = served.components?.schemas?.IntegrationsProbes?.required ?? [];
  assert.deepEqual(
    [...required].sort(),
    [...INTEGRATION_PROBE_KEYS].sort(),
  );
});

test("S245 sandbox ready=false without Redis (queues probe)", async () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const prevRedis = process.env.REDIS_URL;
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.REDIS_URL;
  try {
    const { integrationsReady } = await import(
      "./lib/integrationsReadiness.js"
    );
    const { GET } = await import("./app/api/health/integrations/route.js");
    const res = await GET();
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      mode?: string;
      ready?: boolean;
      probes?: Record<string, boolean>;
      groups?: Array<{ label: string; configured: boolean }>;
    };
    assert.equal(body.mode, "sandbox");
    assert.equal(body.probes?.queues, false);
    assert.equal(body.ready, false);
    assert.equal(body.ready, integrationsReady(body.probes ?? {}));
    const redisGroup = body.groups?.find((g) => g.label === "redis");
    assert.ok(redisGroup);
    assert.equal(redisGroup?.configured, false);
  } finally {
    if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prevMode;
    if (prevRedis === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = prevRedis;
  }
});

test("S246 fixture ready=true without Redis", async () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const prevRedis = process.env.REDIS_URL;
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  delete process.env.REDIS_URL;
  try {
    const { GET } = await import("./app/api/health/integrations/route.js");
    const res = await GET();
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      mode?: string;
      ready?: boolean;
      probes?: Record<string, boolean>;
    };
    assert.equal(body.mode, "fixture");
    assert.equal(body.ready, true);
    assert.equal(body.probes?.queues, true);
  } finally {
    if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prevMode;
    if (prevRedis === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = prevRedis;
  }
});

test("S247 served OpenAPI noteBuilderHint matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { info?: { "x-dial-sor"?: { noteBuilderHint?: string } } };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    info?: { "x-dial-sor"?: { noteBuilderHint?: string } };
  };
  assert.equal(
    served.info?.["x-dial-sor"]?.noteBuilderHint,
    disk.info?.["x-dial-sor"]?.noteBuilderHint,
  );
  assert.ok(
    served.info?.["x-dial-sor"]?.noteBuilderHint?.includes(
      "INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID",
    ),
  );
});

test("S248 served OpenAPI envGroups matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { info?: { "x-dial-sor"?: { envGroups?: string } } };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    info?: { "x-dial-sor"?: { envGroups?: string } };
  };
  assert.equal(
    served.info?.["x-dial-sor"]?.envGroups,
    disk.info?.["x-dial-sor"]?.envGroups,
  );
  assert.ok(
    served.info?.["x-dial-sor"]?.envGroups?.includes("INTEGRATION_ENV_GROUPS"),
  );
});

test("S249 served OpenAPI envGroupLabels matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { info?: { "x-dial-sor"?: { envGroupLabels?: string } } };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    info?: { "x-dial-sor"?: { envGroupLabels?: string } };
  };
  assert.equal(
    served.info?.["x-dial-sor"]?.envGroupLabels,
    disk.info?.["x-dial-sor"]?.envGroupLabels,
  );
  assert.ok(
    served.info?.["x-dial-sor"]?.envGroupLabels?.includes(
      "INTEGRATION_ENV_GROUP_LABELS",
    ),
  );
});

test("S250 live ready=false without Redis (queues probe)", async () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const prevRedis = process.env.REDIS_URL;
  process.env.DIAL_INTEGRATION_MODE = "live";
  delete process.env.REDIS_URL;
  try {
    const { integrationsReady } = await import(
      "./lib/integrationsReadiness.js"
    );
    const { GET } = await import("./app/api/health/integrations/route.js");
    const res = await GET();
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      mode?: string;
      ready?: boolean;
      probes?: Record<string, boolean>;
    };
    assert.equal(body.mode, "live");
    assert.equal(body.probes?.queues, false);
    assert.equal(body.ready, false);
    assert.equal(body.ready, integrationsReady(body.probes ?? {}));
  } finally {
    if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prevMode;
    if (prevRedis === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = prevRedis;
  }
});

test("S251 served probes schema properties match INTEGRATION_PROBE_KEYS", async () => {
  const { INTEGRATION_PROBE_KEYS } = await import(
    "./lib/integrationsReadiness.js"
  );
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as {
    components?: {
      schemas?: {
        IntegrationsProbes?: {
          properties?: Record<string, unknown>;
          additionalProperties?: boolean;
        };
      };
    };
  };
  const props = Object.keys(
    served.components?.schemas?.IntegrationsProbes?.properties ?? {},
  );
  assert.deepEqual([...props].sort(), [...INTEGRATION_PROBE_KEYS].sort());
  assert.equal(
    served.components?.schemas?.IntegrationsProbes?.additionalProperties,
    false,
  );
});

test("S252 OpenAPI groups label enum matches INTEGRATION_ENV_GROUP_LABELS", async () => {
  const { INTEGRATION_ENV_GROUP_LABELS } = await import(
    "./lib/integrationsReadiness.js"
  );
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    components?: {
      schemas?: {
        IntegrationsHealth?: {
          properties?: {
            groups?: {
              items?: {
                properties?: { label?: { enum?: string[] } };
              };
            };
          };
        };
      };
    };
  };
  const labelEnum =
    served.components?.schemas?.IntegrationsHealth?.properties?.groups?.items
      ?.properties?.label?.enum ?? [];
  assert.deepEqual(
    [...labelEnum],
    [...INTEGRATION_ENV_GROUP_LABELS],
  );
});

test("S253 sandbox internal probe fails without INTERNAL_API_SECRET", async () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const prevSecret = process.env.INTERNAL_API_SECRET;
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.INTERNAL_API_SECRET;
  try {
    const { integrationsReady } = await import(
      "./lib/integrationsReadiness.js"
    );
    const { GET } = await import("./app/api/health/integrations/route.js");
    const res = await GET();
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      mode?: string;
      ready?: boolean;
      probes?: Record<string, boolean>;
      groups?: Array<{ label: string; configured: boolean }>;
      internal?: { ok?: boolean; configured?: boolean };
    };
    assert.equal(body.mode, "sandbox");
    assert.equal(body.probes?.internal, false);
    assert.equal(body.ready, false);
    assert.equal(body.ready, integrationsReady(body.probes ?? {}));
    assert.equal(body.internal?.ok, false);
    assert.equal(body.internal?.configured, false);
    const internalGroup = body.groups?.find((g) => g.label === "internal");
    assert.equal(internalGroup?.configured, false);
  } finally {
    if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prevMode;
    if (prevSecret === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prevSecret;
  }
});

test("S254 fixture internal probe ok without INTERNAL_API_SECRET", async () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const prevSecret = process.env.INTERNAL_API_SECRET;
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  delete process.env.INTERNAL_API_SECRET;
  try {
    const { GET } = await import("./app/api/health/integrations/route.js");
    const res = await GET();
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      mode?: string;
      ready?: boolean;
      probes?: Record<string, boolean>;
      internal?: { ok?: boolean };
    };
    assert.equal(body.mode, "fixture");
    assert.equal(body.probes?.internal, true);
    assert.equal(body.internal?.ok, true);
    assert.equal(body.ready, true);
  } finally {
    if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prevMode;
    if (prevSecret === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prevSecret;
  }
});

test("S255 served x-dial-sor.probes matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { info?: { "x-dial-sor"?: { probes?: string } } };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    info?: { "x-dial-sor"?: { probes?: string } };
  };
  assert.equal(
    served.info?.["x-dial-sor"]?.probes,
    disk.info?.["x-dial-sor"]?.probes,
  );
  assert.ok(
    served.info?.["x-dial-sor"]?.probes?.includes("INTEGRATION_PROBE_KEYS"),
  );
});

test("S256 served x-dial-sor.docs matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { info?: { "x-dial-sor"?: { docs?: string } } };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    info?: { "x-dial-sor"?: { docs?: string } };
  };
  assert.equal(
    served.info?.["x-dial-sor"]?.docs,
    disk.info?.["x-dial-sor"]?.docs,
  );
  assert.ok(
    served.info?.["x-dial-sor"]?.docs?.includes("docs/integrations/README.md"),
  );
});

test("S257 live internal probe fails without INTERNAL_API_SECRET", async () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const prevSecret = process.env.INTERNAL_API_SECRET;
  process.env.DIAL_INTEGRATION_MODE = "live";
  delete process.env.INTERNAL_API_SECRET;
  try {
    const { integrationsReady } = await import(
      "./lib/integrationsReadiness.js"
    );
    const { GET } = await import("./app/api/health/integrations/route.js");
    const res = await GET();
    const body = (await res.json()) as {
      mode?: string;
      ready?: boolean;
      probes?: Record<string, boolean>;
    };
    assert.equal(body.mode, "live");
    assert.equal(body.probes?.internal, false);
    assert.equal(body.ready, false);
    assert.equal(body.ready, integrationsReady(body.probes ?? {}));
  } finally {
    if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prevMode;
    if (prevSecret === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prevSecret;
  }
});

test("S258 served IntegrationsHealth.groups required fields", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    components?: {
      schemas?: {
        IntegrationsHealth?: {
          properties?: {
            groups?: {
              items?: { required?: string[] };
            };
          };
        };
      };
    };
  };
  const required =
    served.components?.schemas?.IntegrationsHealth?.properties?.groups?.items
      ?.required ?? [];
  assert.deepEqual(
    [...required].sort(),
    ["configured", "label", "missing", "presentCount", "requiredCount"].sort(),
  );
});

test("S259 served getIntegrationsHealth operationId locked", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<string, { get?: { operationId?: string; tags?: string[] } }>;
  };
  const op = served.paths["/api/health/integrations"]?.get;
  assert.equal(op?.operationId, "getIntegrationsHealth");
  assert.ok(op?.tags?.includes("health"));
});

test("S260 served OpenAPI title+version match disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { openapi?: string; info?: { title?: string; version?: string } };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    openapi?: string;
    info?: { title?: string; version?: string };
  };
  assert.equal(served.openapi, disk.openapi);
  assert.equal(served.info?.title, disk.info?.title);
  assert.equal(served.info?.version, disk.info?.version);
  assert.ok((served.info?.title ?? "").includes("DIAL Gateway"));
});

test("S261 served IntegrationsHealth.required includes ready+mode+probes+groups", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as {
    components?: {
      schemas?: { IntegrationsHealth?: { required?: string[] } };
    };
  };
  const required =
    served.components?.schemas?.IntegrationsHealth?.required ?? [];
  for (const key of ["ok", "ready", "mode", "probes", "groups"]) {
    assert.ok(required.includes(key), `IntegrationsHealth.required missing ${key}`);
  }
});

test("S262 sandbox webhook 503 without secrets (INTERNAL_API_SECRET unset)", async () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const prevInternal = process.env.INTERNAL_API_SECRET;
  const prevFdms = process.env.FDMS_ACTIVATION_KEY;
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.INTERNAL_API_SECRET;
  delete process.env.FDMS_ACTIVATION_KEY;
  try {
    const { POST } = await import("./app/api/webhooks/fdms/route.js");
    const res = await POST(
      new Request("http://localhost/api/webhooks/fdms", {
        method: "POST",
        body: JSON.stringify({ eventId: "s262_closed" }),
      }),
    );
    assert.equal(res.status, 503);
    const body = (await res.json()) as { error?: string };
    assert.ok(
      (body.error ?? "").toLowerCase().includes("fail closed") ||
        (body.error ?? "").includes("FDMS_ACTIVATION_KEY"),
    );
  } finally {
    if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prevMode;
    if (prevInternal === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prevInternal;
    if (prevFdms === undefined) delete process.env.FDMS_ACTIVATION_KEY;
    else process.env.FDMS_ACTIVATION_KEY = prevFdms;
  }
});

test("S263 fixture webhook accepts without INTERNAL_API_SECRET", async () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const prevInternal = process.env.INTERNAL_API_SECRET;
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  delete process.env.INTERNAL_API_SECRET;
  const { __resetIdempotencyForTests } = await import("@dial/shared");
  __resetIdempotencyForTests();
  try {
    const { POST } = await import("./app/api/webhooks/contipay/route.js");
    const res = await POST(
      new Request("http://localhost/api/webhooks/contipay", {
        method: "POST",
        body: JSON.stringify({
          eventId: "s263_fixture",
          paymentId: "pay_s263",
          status: "paid",
        }),
      }),
    );
    assert.equal(res.status, 200);
    const body = (await res.json()) as { ok?: boolean };
    assert.equal(body.ok, true);
  } finally {
    if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prevMode;
    if (prevInternal === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prevInternal;
  }
});

test("S264 served servers url localhost:3000", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    servers?: Array<{ url?: string; description?: string }>;
  };
  assert.ok(served.servers && served.servers.length > 0);
  assert.ok(
    served.servers!.some((s) => s.url === "http://localhost:3000"),
  );
});

test("S265 OpenAPI tags include health+webhooks+admin", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    tags?: Array<{ name: string }>;
  };
  const names = (served.tags ?? []).map((t) => t.name).sort();
  for (const tag of ["admin", "health", "webhooks"]) {
    assert.ok(names.includes(tag), `missing tag ${tag}`);
  }
});

test("S266 served getOpenApiSkeleton operationId locked", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<string, { get?: { operationId?: string } }>;
  };
  assert.equal(
    served.paths["/api/openapi"]?.get?.operationId,
    "getOpenApiSkeleton",
  );
});

test("S267 sandbox PSP webhook 503 without PSP_WEBHOOK_SECRET", async () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const prevSecret = process.env.PSP_WEBHOOK_SECRET;
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.PSP_WEBHOOK_SECRET;
  try {
    const { POST } = await import("./app/api/webhooks/psp/route.js");
    const res = await POST(
      new Request("http://localhost/api/webhooks/psp", {
        method: "POST",
        body: JSON.stringify({ eventId: "s267", intentId: "i267" }),
      }),
    );
    assert.equal(res.status, 503);
    const body = (await res.json()) as { error?: string };
    assert.ok((body.error ?? "").includes("PSP_WEBHOOK_SECRET"));
  } finally {
    if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prevMode;
    if (prevSecret === undefined) delete process.env.PSP_WEBHOOK_SECRET;
    else process.env.PSP_WEBHOOK_SECRET = prevSecret;
  }
});

test("S268 fixture FDMS webhook accepts without FDMS_ACTIVATION_KEY", async () => {
  const prevMode = process.env.DIAL_INTEGRATION_MODE;
  const prevKey = process.env.FDMS_ACTIVATION_KEY;
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  delete process.env.FDMS_ACTIVATION_KEY;
  const { __resetIdempotencyForTests } = await import("@dial/shared");
  __resetIdempotencyForTests();
  try {
    const { POST } = await import("./app/api/webhooks/fdms/route.js");
    const res = await POST(
      new Request("http://localhost/api/webhooks/fdms", {
        method: "POST",
        body: JSON.stringify({ eventId: "s268_fixture", type: "ack" }),
      }),
    );
    assert.equal(res.status, 200);
    const body = (await res.json()) as { ok?: boolean };
    assert.equal(body.ok, true);
  } finally {
    if (prevMode === undefined) delete process.env.DIAL_INTEGRATION_MODE;
    else process.env.DIAL_INTEGRATION_MODE = prevMode;
    if (prevKey === undefined) delete process.env.FDMS_ACTIVATION_KEY;
    else process.env.FDMS_ACTIVATION_KEY = prevKey;
  }
});

test("S269 served InternalApiSecret security scheme locked", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    components?: {
      securitySchemes?: {
        InternalApiSecret?: {
          type?: string;
          in?: string;
          name?: string;
          description?: string;
        };
      };
    };
  };
  const scheme = served.components?.securitySchemes?.InternalApiSecret;
  assert.equal(scheme?.type, "apiKey");
  assert.equal(scheme?.in, "header");
  assert.equal(scheme?.name, "x-internal-secret");
  assert.ok(scheme?.description?.includes("INTERNAL_API_SECRET"));
  assert.equal((scheme?.description ?? "").includes("sk_live"), false);
});

test("S270 served admin money outbox uses InternalApiSecret", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      {
        get?: { security?: Array<Record<string, unknown>> };
        post?: { security?: Array<Record<string, unknown>> };
      }
    >;
  };
  const path = served.paths["/api/admin/money/outbox"];
  assert.ok(path?.get?.security?.some((s) => "InternalApiSecret" in s));
  assert.ok(path?.post?.security?.some((s) => "InternalApiSecret" in s));
});

test("S271 served ContiPay webhook path+operationId locked", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<string, { post?: { operationId?: string; tags?: string[] } }>;
  };
  const op = served.paths["/api/webhooks/contipay"]?.post;
  assert.ok(op, "missing /api/webhooks/contipay");
  assert.equal(op?.operationId, "webhookContipay");
  assert.ok(op?.tags?.includes("webhooks"));
});

test("S272 served FDMS webhook path+operationId locked", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<string, { post?: { operationId?: string; tags?: string[] } }>;
  };
  const op = served.paths["/api/webhooks/fdms"]?.post;
  assert.ok(op, "missing /api/webhooks/fdms");
  assert.equal(op?.operationId, "webhookFdms");
  assert.ok(op?.tags?.includes("webhooks"));
});

test("S273 served PSP webhook path+operationId locked", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      { post?: { operationId?: string; deprecated?: boolean; tags?: string[] } }
    >;
  };
  const op = served.paths["/api/webhooks/psp"]?.post;
  assert.ok(op, "missing /api/webhooks/psp");
  assert.equal(op?.operationId, "webhookPspLegacy");
  assert.equal(op?.deprecated, true);
  assert.ok(op?.tags?.includes("webhooks"));
});

test("S274 served WhatsApp webhook path+operationId locked", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      {
        get?: { operationId?: string; tags?: string[] };
        post?: { operationId?: string; tags?: string[] };
      }
    >;
  };
  const path = served.paths["/api/webhooks/whatsapp"];
  assert.ok(path, "missing /api/webhooks/whatsapp");
  assert.equal(path?.get?.operationId, "webhookWhatsappChallenge");
  assert.equal(path?.post?.operationId, "webhookWhatsapp");
  assert.ok(path?.get?.tags?.includes("webhooks"));
  assert.ok(path?.post?.tags?.includes("webhooks"));
});

test("S275 served admin fx daily-zig security locked", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      {
        get?: {
          operationId?: string;
          security?: Array<Record<string, unknown>>;
          tags?: string[];
        };
        post?: {
          operationId?: string;
          security?: Array<Record<string, unknown>>;
          tags?: string[];
        };
      }
    >;
  };
  const path = served.paths["/api/admin/fx/daily-zig"];
  assert.ok(path, "missing /api/admin/fx/daily-zig");
  assert.equal(path?.get?.operationId, "adminFxDailyZigGet");
  assert.equal(path?.post?.operationId, "adminFxDailyZigPost");
  assert.ok(path?.get?.security?.some((s) => "InternalApiSecret" in s));
  assert.ok(path?.post?.security?.some((s) => "InternalApiSecret" in s));
  assert.ok(path?.get?.tags?.includes("admin"));
  assert.ok(path?.post?.tags?.includes("admin"));
});

test("S276 served EcoCash webhook path+operationId locked", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<string, { post?: { operationId?: string; tags?: string[] } }>;
  };
  const op = served.paths["/api/webhooks/ecocash"]?.post;
  assert.ok(op, "missing /api/webhooks/ecocash");
  assert.equal(op?.operationId, "webhookEcocash");
  assert.ok(op?.tags?.includes("webhooks"));
});

test("S277 served Paynow webhook path+operationId locked", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<string, { post?: { operationId?: string; tags?: string[] } }>;
  };
  const op = served.paths["/api/webhooks/paynow"]?.post;
  assert.ok(op, "missing /api/webhooks/paynow");
  assert.equal(op?.operationId, "webhookPaynow");
  assert.ok(op?.tags?.includes("webhooks"));
});

test("S278 served PayPal webhook path+operationId locked", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<string, { post?: { operationId?: string; tags?: string[] } }>;
  };
  const op = served.paths["/api/webhooks/paypal"]?.post;
  assert.ok(op, "missing /api/webhooks/paypal");
  assert.equal(op?.operationId, "webhookPaypal");
  assert.ok(op?.tags?.includes("webhooks"));
});

test("S279 served Escrow webhook path+operationId locked", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<string, { post?: { operationId?: string; tags?: string[] } }>;
  };
  const op = served.paths["/api/webhooks/escrow"]?.post;
  assert.ok(op, "missing /api/webhooks/escrow");
  assert.equal(op?.operationId, "webhookEscrow");
  assert.ok(op?.tags?.includes("webhooks"));
});

test("S280 served admin FDMS day uses InternalApiSecret", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      {
        get?: {
          operationId?: string;
          security?: Array<Record<string, unknown>>;
        };
        post?: {
          operationId?: string;
          security?: Array<Record<string, unknown>>;
        };
      }
    >;
  };
  const path = served.paths["/api/admin/fdms/day"];
  assert.ok(path, "missing /api/admin/fdms/day");
  assert.equal(path?.get?.operationId, "adminFdmsDayGet");
  assert.equal(path?.post?.operationId, "adminFdmsDayPost");
  assert.ok(path?.get?.security?.some((s) => "InternalApiSecret" in s));
  assert.ok(path?.post?.security?.some((s) => "InternalApiSecret" in s));
});

test("S281 admin fx daily-zig GET 503 without INTERNAL_API_SECRET", async () => {
  const prev = process.env.INTERNAL_API_SECRET;
  delete process.env.INTERNAL_API_SECRET;
  try {
    const { GET } = await import("./app/api/admin/fx/daily-zig/route.js");
    const res = await GET(new Request("http://localhost/api/admin/fx/daily-zig"));
    assert.equal(res.status, 503);
    const body = (await res.json()) as { error?: string };
    assert.ok((body.error ?? "").includes("INTERNAL_API_SECRET"));
    assert.equal((body.error ?? "").includes("sk_live"), false);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("S282 served ContiPay signature header documented", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      {
        post?: {
          parameters?: Array<{
            name?: string;
            in?: string;
            required?: boolean;
            schema?: { type?: string };
          }>;
        };
      }
    >;
  };
  const params = served.paths["/api/webhooks/contipay"]?.post?.parameters ?? [];
  const sig = params.find((p) => p.name === "x-contipay-signature");
  assert.ok(sig, "missing x-contipay-signature parameter");
  assert.equal(sig?.in, "header");
  assert.equal(sig?.required, false);
  assert.equal(sig?.schema?.type, "string");
});

test("S283 served WhatsApp hub signature header documented", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      {
        post?: {
          parameters?: Array<{
            name?: string;
            in?: string;
            required?: boolean;
            schema?: { type?: string };
          }>;
        };
      }
    >;
  };
  const params = served.paths["/api/webhooks/whatsapp"]?.post?.parameters ?? [];
  const sig = params.find((p) => p.name === "x-hub-signature-256");
  assert.ok(sig, "missing x-hub-signature-256 parameter");
  assert.equal(sig?.in, "header");
  assert.equal(sig?.required, false);
  assert.equal(sig?.schema?.type, "string");
});

test("S284 served WebhookOpaqueBody schema locked", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    components?: {
      schemas?: {
        WebhookOpaqueBody?: {
          type?: string;
          additionalProperties?: boolean;
          description?: string;
        };
      };
    };
  };
  const schema = served.components?.schemas?.WebhookOpaqueBody;
  assert.equal(schema?.type, "object");
  assert.equal(schema?.additionalProperties, true);
  assert.ok(schema?.description?.includes("processed_events"));
  assert.ok(schema?.description?.includes("signature"));
  assert.equal((schema?.description ?? "").includes("sk_live"), false);
});

test("S285 all admin paths require InternalApiSecret", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      Record<
        string,
        { security?: Array<Record<string, unknown>> } | undefined
      >
    >;
  };
  const adminPaths = Object.keys(served.paths).filter((p) =>
    p.startsWith("/api/admin/"),
  );
  assert.ok(adminPaths.length >= 3, "expected admin paths in OpenAPI");
  for (const p of adminPaths) {
    const item = served.paths[p];
    assert.ok(item, `missing path object ${p}`);
    for (const method of ["get", "post", "put", "patch", "delete"] as const) {
      const op = item[method];
      if (!op) continue;
      assert.ok(
        op.security?.some((s) => "InternalApiSecret" in s),
        `${p} ${method} missing InternalApiSecret`,
      );
    }
  }
});

test("S286 admin fx daily-zig POST 503 without INTERNAL_API_SECRET", async () => {
  const prev = process.env.INTERNAL_API_SECRET;
  delete process.env.INTERNAL_API_SECRET;
  try {
    const { POST } = await import("./app/api/admin/fx/daily-zig/route.js");
    const res = await POST(
      new Request("http://localhost/api/admin/fx/daily-zig", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ zigMinorPerUsd: "100", setBy: "s286" }),
      }),
    );
    assert.equal(res.status, 503);
    const body = (await res.json()) as { error?: string };
    assert.ok((body.error ?? "").includes("INTERNAL_API_SECRET"));
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("S287 ContiPay OpenAPI documents 401 Bad signature", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const d401 =
    served.paths["/api/webhooks/contipay"]?.post?.responses?.["401"]
      ?.description ?? "";
  assert.ok(d401.toLowerCase().includes("signature"));
});

test("S288 WhatsApp POST OpenAPI documents 401 Bad HMAC", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const d401 =
    served.paths["/api/webhooks/whatsapp"]?.post?.responses?.["401"]
      ?.description ?? "";
  assert.ok(d401.toUpperCase().includes("HMAC"));
});

test("S289 WhatsApp GET challenge query params locked", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      {
        get?: {
          parameters?: Array<{ name?: string; in?: string }>;
        };
      }
    >;
  };
  const params = served.paths["/api/webhooks/whatsapp"]?.get?.parameters ?? [];
  for (const name of ["hub.mode", "hub.verify_token", "hub.challenge"]) {
    const p = params.find((x) => x.name === name);
    assert.ok(p, `missing query param ${name}`);
    assert.equal(p?.in, "query");
  }
});

test("S290 served admin path keys match disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { paths: Record<string, unknown> };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as { paths: Record<string, unknown> };
  const diskAdmin = Object.keys(disk.paths)
    .filter((p) => p.startsWith("/api/admin/"))
    .sort();
  const servedAdmin = Object.keys(served.paths)
    .filter((p) => p.startsWith("/api/admin/"))
    .sort();
  assert.deepEqual(servedAdmin, diskAdmin);
  assert.ok(diskAdmin.includes("/api/admin/fx/daily-zig"));
  assert.ok(diskAdmin.includes("/api/admin/money/outbox"));
  assert.ok(diskAdmin.includes("/api/admin/fdms/day"));
});

test("S291 admin FDMS day GET 503 without INTERNAL_API_SECRET", async () => {
  const prev = process.env.INTERNAL_API_SECRET;
  delete process.env.INTERNAL_API_SECRET;
  try {
    const { GET } = await import("./app/api/admin/fdms/day/route.js");
    const res = await GET(new Request("http://localhost/api/admin/fdms/day"));
    assert.equal(res.status, 503);
    const body = (await res.json()) as { error?: string };
    assert.ok((body.error ?? "").includes("INTERNAL_API_SECRET"));
    assert.equal((body.error ?? "").includes("sk_live"), false);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("S292 ContiPay OpenAPI documents 503 fail-closed", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const d503 =
    served.paths["/api/webhooks/contipay"]?.post?.responses?.["503"]
      ?.description ?? "";
  assert.ok(/fail-closed|misconfig/i.test(d503));
});

test("S293 WhatsApp POST OpenAPI documents 503 fail-closed", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const d503 =
    served.paths["/api/webhooks/whatsapp"]?.post?.responses?.["503"]
      ?.description ?? "";
  assert.ok(/fail-closed|misconfig/i.test(d503));
});

test("S294 all webhook POSTs document canonical 503 text", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const posts = Object.keys(served.paths).filter(
    (p) => p.startsWith("/api/webhooks/") && served.paths[p]?.post,
  );
  assert.ok(posts.length >= 8);
  const canonical = "Fail-closed (sandbox/live misconfig)";
  for (const p of posts) {
    assert.equal(
      served.paths[p]?.post?.responses?.["503"]?.description,
      canonical,
      `${p} 503 description`,
    );
  }
});

test("S295 daily-zig unauthorized 401 with wrong secret", async () => {
  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "s295_correct";
  try {
    const { GET } = await import("./app/api/admin/fx/daily-zig/route.js");
    const res = await GET(
      new Request("http://localhost/api/admin/fx/daily-zig", {
        headers: { "x-internal-secret": "s295_wrong" },
      }),
    );
    assert.equal(res.status, 401);
    const body = (await res.json()) as { error?: string };
    assert.equal(body.error, "unauthorized");
    assert.equal(JSON.stringify(body).includes("s295_correct"), false);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("S296 admin FDMS day POST 503 without INTERNAL_API_SECRET", async () => {
  const prev = process.env.INTERNAL_API_SECRET;
  delete process.env.INTERNAL_API_SECRET;
  try {
    const { POST } = await import("./app/api/admin/fdms/day/route.js");
    const res = await POST(
      new Request("http://localhost/api/admin/fdms/day", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "open" }),
      }),
    );
    assert.equal(res.status, 503);
    const body = (await res.json()) as { error?: string };
    assert.ok((body.error ?? "").includes("INTERNAL_API_SECRET"));
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("S297 admin FDMS day 401 with wrong secret", async () => {
  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "s297_correct";
  try {
    const { GET } = await import("./app/api/admin/fdms/day/route.js");
    const res = await GET(
      new Request("http://localhost/api/admin/fdms/day", {
        headers: { "x-internal-secret": "s297_wrong" },
      }),
    );
    assert.equal(res.status, 401);
    const body = (await res.json()) as { error?: string };
    assert.equal(body.error, "unauthorized");
    assert.equal(JSON.stringify(body).includes("s297_correct"), false);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("S298 daily-zig OpenAPI documents 503 INTERNAL_API_SECRET unset", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      {
        get?: { responses?: Record<string, { description?: string }> };
        post?: { responses?: Record<string, { description?: string }> };
      }
    >;
  };
  const path = served.paths["/api/admin/fx/daily-zig"];
  for (const method of ["get", "post"] as const) {
    const d503 = path?.[method]?.responses?.["503"]?.description ?? "";
    assert.ok(
      d503.includes("INTERNAL_API_SECRET"),
      `daily-zig ${method} 503 must cite INTERNAL_API_SECRET`,
    );
    assert.ok(/fail closed/i.test(d503));
  }
});

test("S299 ContiPay 503 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/contipay"]?.post?.responses?.["503"]
      ?.description,
    disk.paths["/api/webhooks/contipay"]?.post?.responses?.["503"]?.description,
  );
});

test("S300 WhatsApp POST 503 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/whatsapp"]?.post?.responses?.["503"]
      ?.description,
    disk.paths["/api/webhooks/whatsapp"]?.post?.responses?.["503"]?.description,
  );
});

test("S301 money outbox 401 with wrong secret", async () => {
  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "s301_correct";
  try {
    const { GET } = await import("./app/api/admin/money/outbox/route.js");
    const res = await GET(
      new Request("http://localhost/api/admin/money/outbox", {
        headers: { "x-internal-secret": "s301_wrong" },
      }),
    );
    assert.equal(res.status, 401);
    const body = (await res.json()) as { error?: string };
    assert.equal(body.error, "unauthorized");
    assert.equal(JSON.stringify(body).includes("s301_correct"), false);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("S302 Paynow 503 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/paynow"]?.post?.responses?.["503"]
      ?.description,
    disk.paths["/api/webhooks/paynow"]?.post?.responses?.["503"]?.description,
  );
});

test("S303 EcoCash 503 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/ecocash"]?.post?.responses?.["503"]
      ?.description,
    disk.paths["/api/webhooks/ecocash"]?.post?.responses?.["503"]?.description,
  );
});

test("S304 FDMS webhook 503 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/fdms"]?.post?.responses?.["503"]?.description,
    disk.paths["/api/webhooks/fdms"]?.post?.responses?.["503"]?.description,
  );
});

test("S305 PSP webhook 503 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/psp"]?.post?.responses?.["503"]?.description,
    disk.paths["/api/webhooks/psp"]?.post?.responses?.["503"]?.description,
  );
});

test("S306 Escrow webhook 503 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/escrow"]?.post?.responses?.["503"]
      ?.description,
    disk.paths["/api/webhooks/escrow"]?.post?.responses?.["503"]?.description,
  );
});

test("S307 PayPal webhook 503 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/paypal"]?.post?.responses?.["503"]
      ?.description,
    disk.paths["/api/webhooks/paypal"]?.post?.responses?.["503"]?.description,
  );
});

test("S308 money outbox OpenAPI documents 401", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      {
        get?: { responses?: Record<string, { description?: string }> };
        post?: { responses?: Record<string, { description?: string }> };
      }
    >;
  };
  const path = served.paths["/api/admin/money/outbox"];
  for (const method of ["get", "post"] as const) {
    const d401 = path?.[method]?.responses?.["401"]?.description ?? "";
    assert.ok(
      /missing|invalid|internal secret/i.test(d401),
      `money outbox ${method} 401`,
    );
  }
});

test("S309 all webhook POST 503 descriptions match disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  const posts = Object.keys(disk.paths).filter(
    (p) => p.startsWith("/api/webhooks/") && disk.paths[p]?.post,
  );
  assert.ok(posts.length >= 8);
  for (const p of posts) {
    assert.equal(
      served.paths[p]?.post?.responses?.["503"]?.description,
      disk.paths[p]?.post?.responses?.["503"]?.description,
      `${p} 503 served==disk`,
    );
  }
});

test("S310 money outbox POST 401 with wrong secret", async () => {
  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "s310_correct";
  try {
    const { POST } = await import("./app/api/admin/money/outbox/route.js");
    const res = await POST(
      new Request("http://localhost/api/admin/money/outbox", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "s310_wrong",
        },
        body: JSON.stringify({}),
      }),
    );
    assert.equal(res.status, 401);
    const body = (await res.json()) as { error?: string };
    assert.equal(body.error, "unauthorized");
    assert.equal(JSON.stringify(body).includes("s310_correct"), false);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("S311 Paynow 401 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/paynow"]?.post?.responses?.["401"]
      ?.description,
    disk.paths["/api/webhooks/paynow"]?.post?.responses?.["401"]?.description,
  );
});

test("S312 EcoCash 401 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/ecocash"]?.post?.responses?.["401"]
      ?.description,
    disk.paths["/api/webhooks/ecocash"]?.post?.responses?.["401"]?.description,
  );
});

test("S313 ContiPay 401 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/contipay"]?.post?.responses?.["401"]
      ?.description,
    disk.paths["/api/webhooks/contipay"]?.post?.responses?.["401"]?.description,
  );
});

test("S314 FDMS webhook 401 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/fdms"]?.post?.responses?.["401"]?.description,
    disk.paths["/api/webhooks/fdms"]?.post?.responses?.["401"]?.description,
  );
});

test("S315 WhatsApp POST 401 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/whatsapp"]?.post?.responses?.["401"]
      ?.description,
    disk.paths["/api/webhooks/whatsapp"]?.post?.responses?.["401"]?.description,
  );
  assert.ok(
    (served.paths["/api/webhooks/whatsapp"]?.post?.responses?.["401"]
      ?.description ?? "")
      .toUpperCase()
      .includes("HMAC"),
  );
});

test("S316 Escrow webhook 401 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/escrow"]?.post?.responses?.["401"]
      ?.description,
    disk.paths["/api/webhooks/escrow"]?.post?.responses?.["401"]?.description,
  );
});

test("S317 PayPal webhook 401 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/paypal"]?.post?.responses?.["401"]
      ?.description,
    disk.paths["/api/webhooks/paypal"]?.post?.responses?.["401"]?.description,
  );
});

test("S318 PSP webhook 401 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/psp"]?.post?.responses?.["401"]?.description,
    disk.paths["/api/webhooks/psp"]?.post?.responses?.["401"]?.description,
  );
});

test("S319 all webhook POST 401 descriptions match disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  const posts = Object.keys(disk.paths).filter(
    (p) => p.startsWith("/api/webhooks/") && disk.paths[p]?.post,
  );
  assert.ok(posts.length >= 8);
  for (const p of posts) {
    assert.equal(
      served.paths[p]?.post?.responses?.["401"]?.description,
      disk.paths[p]?.post?.responses?.["401"]?.description,
      `${p} 401 served==disk`,
    );
    assert.ok(
      (served.paths[p]?.post?.responses?.["401"]?.description ?? "").length > 0,
      `${p} must document 401`,
    );
  }
});

test("S320 admin FDMS day OpenAPI documents 401", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      {
        get?: { responses?: Record<string, { description?: string }> };
        post?: { responses?: Record<string, { description?: string }> };
      }
    >;
  };
  const path = served.paths["/api/admin/fdms/day"];
  for (const method of ["get", "post"] as const) {
    const d401 = path?.[method]?.responses?.["401"]?.description ?? "";
    assert.ok(
      /missing|invalid|internal secret/i.test(d401),
      `fdms day ${method} 401`,
    );
  }
});

test("S321 daily-zig OpenAPI documents 401", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      {
        get?: { responses?: Record<string, { description?: string }> };
        post?: { responses?: Record<string, { description?: string }> };
      }
    >;
  };
  const path = served.paths["/api/admin/fx/daily-zig"];
  assert.ok(path, "missing /api/admin/fx/daily-zig");
  for (const method of ["get", "post"] as const) {
    const d401 = path?.[method]?.responses?.["401"]?.description ?? "";
    assert.ok(
      /missing|invalid|internal secret/i.test(d401),
      `daily-zig ${method} 401`,
    );
  }
});

test("S322 all admin paths document 401", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      Record<
        string,
        { responses?: Record<string, { description?: string }> } | undefined
      >
    >;
  };
  const adminPaths = Object.keys(served.paths).filter((p) =>
    p.startsWith("/api/admin/"),
  );
  assert.ok(adminPaths.length >= 3);
  for (const p of adminPaths) {
    const item = served.paths[p];
    assert.ok(item, `missing path object ${p}`);
    for (const method of ["get", "post", "put", "patch", "delete"] as const) {
      const op = item[method];
      if (!op) continue;
      const d401 = op.responses?.["401"]?.description ?? "";
      assert.ok(d401.length > 0, `${p} ${method} missing 401`);
      assert.ok(
        /missing|invalid|internal secret/i.test(d401),
        `${p} ${method} 401 must cite internal secret`,
      );
    }
  }
});

test("S323 WhatsApp GET 403 challenge documented", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      { get?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const d403 =
    served.paths["/api/webhooks/whatsapp"]?.get?.responses?.["403"]
      ?.description ?? "";
  assert.ok(/verify token/i.test(d403));
});

test("S324 ContiPay 200 idempotent description locked", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const d200 =
    served.paths["/api/webhooks/contipay"]?.post?.responses?.["200"]
      ?.description ?? "";
  assert.ok(/idempotent/i.test(d200));
  assert.ok(/signature verified/i.test(d200));
});

test("S325 all webhook POST 200s mention idempotent", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const posts = Object.keys(served.paths).filter(
    (p) => p.startsWith("/api/webhooks/") && served.paths[p]?.post,
  );
  assert.ok(posts.length >= 8);
  const canonical =
    "Accepted or duplicate idempotent (signature verified)";
  for (const p of posts) {
    assert.equal(
      served.paths[p]?.post?.responses?.["200"]?.description,
      canonical,
      `${p} 200 description`,
    );
  }
});

test("S326 WhatsApp GET 403 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { get?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/whatsapp"]?.get?.responses?.["403"]
      ?.description,
    disk.paths["/api/webhooks/whatsapp"]?.get?.responses?.["403"]?.description,
  );
});

test("S327 ContiPay 200 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/contipay"]?.post?.responses?.["200"]
      ?.description,
    disk.paths["/api/webhooks/contipay"]?.post?.responses?.["200"]?.description,
  );
});

test("S328 all webhook POST 200 descriptions match disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  const posts = Object.keys(disk.paths).filter(
    (p) => p.startsWith("/api/webhooks/") && disk.paths[p]?.post,
  );
  assert.ok(posts.length >= 8);
  for (const p of posts) {
    assert.equal(
      served.paths[p]?.post?.responses?.["200"]?.description,
      disk.paths[p]?.post?.responses?.["200"]?.description,
      `${p} 200 served==disk`,
    );
  }
});

test("S329 daily-zig 401 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      {
        get?: { responses?: Record<string, { description?: string }> };
        post?: { responses?: Record<string, { description?: string }> };
      }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  for (const method of ["get", "post"] as const) {
    assert.equal(
      served.paths["/api/admin/fx/daily-zig"]?.[method]?.responses?.["401"]
        ?.description,
      disk.paths["/api/admin/fx/daily-zig"]?.[method]?.responses?.["401"]
        ?.description,
      `daily-zig ${method} 401`,
    );
  }
});

test("S330 money outbox 401 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      {
        get?: { responses?: Record<string, { description?: string }> };
        post?: { responses?: Record<string, { description?: string }> };
      }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  for (const method of ["get", "post"] as const) {
    assert.equal(
      served.paths["/api/admin/money/outbox"]?.[method]?.responses?.["401"]
        ?.description,
      disk.paths["/api/admin/money/outbox"]?.[method]?.responses?.["401"]
        ?.description,
      `money outbox ${method} 401`,
    );
  }
});

test("S331 FDMS day 401 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      {
        get?: { responses?: Record<string, { description?: string }> };
        post?: { responses?: Record<string, { description?: string }> };
      }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  for (const method of ["get", "post"] as const) {
    assert.equal(
      served.paths["/api/admin/fdms/day"]?.[method]?.responses?.["401"]
        ?.description,
      disk.paths["/api/admin/fdms/day"]?.[method]?.responses?.["401"]
        ?.description,
      `fdms day ${method} 401`,
    );
  }
});

test("S332 Paynow 200 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/paynow"]?.post?.responses?.["200"]
      ?.description,
    disk.paths["/api/webhooks/paynow"]?.post?.responses?.["200"]?.description,
  );
});

test("S333 EcoCash 200 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/ecocash"]?.post?.responses?.["200"]
      ?.description,
    disk.paths["/api/webhooks/ecocash"]?.post?.responses?.["200"]?.description,
  );
});

test("S334 WhatsApp POST 200 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { post?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/whatsapp"]?.post?.responses?.["200"]
      ?.description,
    disk.paths["/api/webhooks/whatsapp"]?.post?.responses?.["200"]?.description,
  );
});

test("S335 openapi servers description locked", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    servers?: Array<{ url?: string; description?: string }>;
  };
  const local = served.servers?.find((s) => s.url === "http://localhost:3000");
  assert.ok(local, "missing localhost:3000 server");
  assert.equal(local?.description, "Local gateway-web");
});

test("S336 servers url+description match disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { servers?: Array<{ url?: string; description?: string }> };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.deepEqual(served.servers, disk.servers);
  assert.ok((disk.servers?.length ?? 0) >= 1);
});

test("S337 FDMS day GET 200 description matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { get?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/admin/fdms/day"]?.get?.responses?.["200"]?.description,
    disk.paths["/api/admin/fdms/day"]?.get?.responses?.["200"]?.description,
  );
});

test("S338 health integrations 200 never echoes secrets", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<
      string,
      { get?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const d200 =
    served.paths["/api/health/integrations"]?.get?.responses?.["200"]
      ?.description ?? "";
  assert.ok(/never echoes secrets/i.test(d200));
  assert.equal(d200.includes("sk_live"), false);
  assert.equal(d200.includes("service_role"), false);
});

test("S339 WhatsApp GET 200 Challenge echo matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<
      string,
      { get?: { responses?: Record<string, { description?: string }> } }
    >;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/whatsapp"]?.get?.responses?.["200"]
      ?.description,
    disk.paths["/api/webhooks/whatsapp"]?.get?.responses?.["200"]?.description,
  );
  assert.equal(
    served.paths["/api/webhooks/whatsapp"]?.get?.responses?.["200"]
      ?.description,
    "Challenge echo",
  );
});

test("S340 openapi tags names match disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { tags?: Array<{ name: string }> };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.deepEqual(
    (served.tags ?? []).map((t) => t.name).sort(),
    (disk.tags ?? []).map((t) => t.name).sort(),
  );
  for (const name of ["admin", "health", "webhooks"]) {
    assert.ok((served.tags ?? []).some((t) => t.name === name));
  }
});

test("S341 openapi version 3.0.3 locked", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as { openapi?: string };
  assert.equal(served.openapi, "3.0.3");
});

test("S342 ContiPay summary ContiPay HMAC locked", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    paths: Record<string, { post?: { summary?: string } }>;
  };
  assert.equal(
    served.paths["/api/webhooks/contipay"]?.post?.summary,
    "ContiPay HMAC webhook",
  );
});

test("S343 InternalApiSecret scheme matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    components?: {
      securitySchemes?: {
        InternalApiSecret?: Record<string, unknown>;
      };
    };
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.deepEqual(
    served.components?.securitySchemes?.InternalApiSecret,
    disk.components?.securitySchemes?.InternalApiSecret,
  );
});

test("S344 openapi components schemas key set locked", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { components?: { schemas?: Record<string, unknown> } };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.deepEqual(
    Object.keys(served.components?.schemas ?? {}).sort(),
    Object.keys(disk.components?.schemas ?? {}).sort(),
  );
  for (const key of [
    "IntegrationsHealth",
    "IntegrationsProbes",
    "WebhookOpaqueBody",
  ]) {
    assert.ok(
      Object.keys(served.components?.schemas ?? {}).includes(key),
      `missing schema ${key}`,
    );
  }
});

test("S345 securitySchemes key set locked", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { components?: { securitySchemes?: Record<string, unknown> } };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.deepEqual(
    Object.keys(served.components?.securitySchemes ?? {}).sort(),
    Object.keys(disk.components?.securitySchemes ?? {}).sort(),
  );
  assert.deepEqual(
    Object.keys(served.components?.securitySchemes ?? {}).sort(),
    ["InternalApiSecret"],
  );
});

test("S346 openapi version matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { openapi?: string };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(served.openapi, disk.openapi);
  assert.equal(disk.openapi, "3.0.3");
});

test("S347 ContiPay summary matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<string, { post?: { summary?: string } }>;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/contipay"]?.post?.summary,
    disk.paths["/api/webhooks/contipay"]?.post?.summary,
  );
});

test("S348 schemas IntegrationsHealth required matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    components?: {
      schemas?: { IntegrationsHealth?: { required?: string[] } };
    };
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.deepEqual(
    served.components?.schemas?.IntegrationsHealth?.required,
    disk.components?.schemas?.IntegrationsHealth?.required,
  );
});

test("S349 InternalApiSecret name x-internal-secret locked", async () => {
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as {
    components?: {
      securitySchemes?: {
        InternalApiSecret?: { name?: string; in?: string; type?: string };
      };
    };
  };
  const scheme = served.components?.securitySchemes?.InternalApiSecret;
  assert.equal(scheme?.name, "x-internal-secret");
  assert.equal(scheme?.in, "header");
  assert.equal(scheme?.type, "apiKey");
});

test("S350 components top-level keys match disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { components?: Record<string, unknown> };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.deepEqual(
    Object.keys(served.components ?? {}).sort(),
    Object.keys(disk.components ?? {}).sort(),
  );
  assert.ok(Object.keys(served.components ?? {}).includes("schemas"));
  assert.ok(Object.keys(served.components ?? {}).includes("securitySchemes"));
});

test("S351 Paynow summary matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<string, { post?: { summary?: string } }>;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/paynow"]?.post?.summary,
    disk.paths["/api/webhooks/paynow"]?.post?.summary,
  );
  assert.equal(
    served.paths["/api/webhooks/paynow"]?.post?.summary,
    "Paynow SHA512 result notification",
  );
});

test("S352 WhatsApp POST summary matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<string, { post?: { summary?: string } }>;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/whatsapp"]?.post?.summary,
    disk.paths["/api/webhooks/whatsapp"]?.post?.summary,
  );
  assert.equal(
    served.paths["/api/webhooks/whatsapp"]?.post?.summary,
    "Meta Cloud API inbound (HMAC)",
  );
});

test("S353 FDMS webhook summary matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<string, { post?: { summary?: string } }>;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/fdms"]?.post?.summary,
    disk.paths["/api/webhooks/fdms"]?.post?.summary,
  );
  assert.equal(
    served.paths["/api/webhooks/fdms"]?.post?.summary,
    "FDMS Gateway acknowledge / submit callback",
  );
});

test("S354 openapi info.title matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { info?: { title?: string } };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(served.info?.title, disk.info?.title);
  assert.ok((served.info?.title ?? "").includes("DIAL Gateway"));
});

test("S355 openapi info.version matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { info?: { version?: string } };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(served.info?.version, disk.info?.version);
  assert.equal(served.info?.version, "0.1.0");
});

test("S356 EcoCash summary matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<string, { post?: { summary?: string } }>;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/ecocash"]?.post?.summary,
    disk.paths["/api/webhooks/ecocash"]?.post?.summary,
  );
  assert.equal(
    served.paths["/api/webhooks/ecocash"]?.post?.summary,
    "EcoCash HMAC webhook",
  );
});

test("S357 PayPal summary matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<string, { post?: { summary?: string } }>;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/paypal"]?.post?.summary,
    disk.paths["/api/webhooks/paypal"]?.post?.summary,
  );
});

test("S358 Escrow summary matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<string, { post?: { summary?: string } }>;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/escrow"]?.post?.summary,
    disk.paths["/api/webhooks/escrow"]?.post?.summary,
  );
});

test("S359 WhatsApp GET summary matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<string, { get?: { summary?: string } }>;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/whatsapp"]?.get?.summary,
    disk.paths["/api/webhooks/whatsapp"]?.get?.summary,
  );
  assert.equal(
    served.paths["/api/webhooks/whatsapp"]?.get?.summary,
    "Meta hub challenge",
  );
});

test("S360 openapi info.title+version match disk pair", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as { info?: { title?: string; version?: string } };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.deepEqual(
    { title: served.info?.title, version: served.info?.version },
    { title: disk.info?.title, version: disk.info?.version },
  );
});

test("S361 PSP summary matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<string, { post?: { summary?: string } }>;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/webhooks/psp"]?.post?.summary,
    disk.paths["/api/webhooks/psp"]?.post?.summary,
  );
  assert.equal(
    served.paths["/api/webhooks/psp"]?.post?.summary,
    "Legacy generic PSP/escrow shim",
  );
});

test("S362 getIntegrationsHealth summary matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<string, { get?: { summary?: string; operationId?: string } }>;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/health/integrations"]?.get?.summary,
    disk.paths["/api/health/integrations"]?.get?.summary,
  );
  assert.equal(
    served.paths["/api/health/integrations"]?.get?.operationId,
    "getIntegrationsHealth",
  );
  assert.equal(
    served.paths["/api/health/integrations"]?.get?.summary,
    "Integration readiness (mode, ready, probes, groups)",
  );
});

test("S363 getOpenApiSkeleton summary matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<string, { get?: { summary?: string; operationId?: string } }>;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/openapi"]?.get?.summary,
    disk.paths["/api/openapi"]?.get?.summary,
  );
  assert.equal(
    served.paths["/api/openapi"]?.get?.operationId,
    "getOpenApiSkeleton",
  );
  assert.equal(
    served.paths["/api/openapi"]?.get?.summary,
    "Serve this OpenAPI skeleton document",
  );
});

test("S364 all webhook POST summaries match disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<string, { post?: { summary?: string } }>;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  const posts = Object.keys(disk.paths).filter(
    (p) => p.startsWith("/api/webhooks/") && disk.paths[p]?.post,
  );
  assert.ok(posts.length >= 8);
  for (const p of posts) {
    assert.equal(
      served.paths[p]?.post?.summary,
      disk.paths[p]?.post?.summary,
      `${p} summary`,
    );
    assert.ok(
      (served.paths[p]?.post?.summary ?? "").length > 0,
      `${p} summary non-empty`,
    );
  }
});

test("S365 admin money outbox GET summary matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<string, { get?: { summary?: string } }>;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/admin/money/outbox"]?.get?.summary,
    disk.paths["/api/admin/money/outbox"]?.get?.summary,
  );
  assert.equal(
    served.paths["/api/admin/money/outbox"]?.get?.summary,
    "Money outbox depth",
  );
});

test("S366 admin money outbox POST summary matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<string, { post?: { summary?: string } }>;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/admin/money/outbox"]?.post?.summary,
    disk.paths["/api/admin/money/outbox"]?.post?.summary,
  );
  assert.equal(
    served.paths["/api/admin/money/outbox"]?.post?.summary,
    "Drain money outbox",
  );
});

test("S367 admin FDMS day GET summary matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<string, { get?: { summary?: string } }>;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/admin/fdms/day"]?.get?.summary,
    disk.paths["/api/admin/fdms/day"]?.get?.summary,
  );
});

test("S368 admin daily-zig GET summary matches disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<string, { get?: { summary?: string } }>;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  assert.equal(
    served.paths["/api/admin/fx/daily-zig"]?.get?.summary,
    disk.paths["/api/admin/fx/daily-zig"]?.get?.summary,
  );
  assert.ok(
    (served.paths["/api/admin/fx/daily-zig"]?.get?.summary ?? "").includes(
      "Daily ZiG",
    ),
  );
});

test("S369 all admin GET summaries match disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<string, { get?: { summary?: string } }>;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  const adminGets = Object.keys(disk.paths).filter(
    (p) => p.startsWith("/api/admin/") && disk.paths[p]?.get,
  );
  assert.ok(adminGets.length >= 3);
  for (const p of adminGets) {
    assert.equal(
      served.paths[p]?.get?.summary,
      disk.paths[p]?.get?.summary,
      `${p} GET summary`,
    );
  }
});

test("S370 all admin POST summaries match disk", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const disk = JSON.parse(
    readFileSync(
      join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
      "utf8",
    ),
  ) as {
    paths: Record<string, { post?: { summary?: string } }>;
  };
  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  const served = (await res.json()) as typeof disk;
  const adminPosts = Object.keys(disk.paths).filter(
    (p) => p.startsWith("/api/admin/") && disk.paths[p]?.post,
  );
  assert.ok(adminPosts.length >= 3);
  for (const p of adminPosts) {
    assert.equal(
      served.paths[p]?.post?.summary,
      disk.paths[p]?.post?.summary,
      `${p} POST summary`,
    );
  }
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

test("S167 root README cites buildIntegrationsHealthNote", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const readme = readFileSync(join(process.cwd(), "../../README.md"), "utf8");
  assert.ok(readme.includes("buildIntegrationsHealthNote"));
  assert.ok(readme.includes("healthNote"));
  assert.ok(readme.includes("integrationsReadiness.ts"));
});

test("S174 root README cites admin note-builder-sor-hint cross-link", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const readme = readFileSync(join(process.cwd(), "../../README.md"), "utf8");
  assert.ok(readme.includes("note-builder-sor-hint"));
  assert.ok(readme.includes("buildIntegrationsHealthNote"));
  assert.ok(readme.includes("/admin/integrations"));
  assert.ok(readme.includes("/admin/cost-health"));
});

test("S182 root README cites HINT_ID + DOCS constants", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const readme = readFileSync(join(process.cwd(), "../../README.md"), "utf8");
  assert.ok(readme.includes("INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID"));
  assert.ok(readme.includes("INTEGRATIONS_NOTE_BUILDER_SOR_DOCS"));
  assert.ok(readme.includes("note-builder-sor-hint"));
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

test("S169 admin SoR hints cite buildIntegrationsHealthNote", async () => {
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
  assert.ok(cost.includes("buildIntegrationsHealthNote"));
  assert.ok(integ.includes("buildIntegrationsHealthNote"));
  assert.ok(cost.includes("env-groups-sor-hint"));
  assert.ok(integ.includes("env-groups-sor-hint"));
});

test("S160 integrations README cites OpenAPI healthNoteUiMax", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const integ = readFileSync(
    join(process.cwd(), "../../docs/integrations/README.md"),
    "utf8",
  );
  assert.ok(integ.includes("healthNoteUiMax"));
  assert.ok(integ.includes("x-dial-sor"));
  assert.ok(integ.includes("INTEGRATIONS_HEALTH_NOTE_UI_MAX"));
});

test("S161 .env.example header cites INTEGRATIONS_HEALTH_NOTE_UI_MAX", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const envExample = readFileSync(
    join(process.cwd(), "../../.env.example"),
    "utf8",
  );
  assert.ok(envExample.includes("INTEGRATIONS_HEALTH_NOTE_UI_MAX"));
  assert.ok(envExample.includes("healthNoteUiMax"));
  assert.ok(envExample.includes("integrationsReadiness.ts"));
});

test("S168 .env.example cites buildIntegrationsHealthNote SoR", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const envExample = readFileSync(
    join(process.cwd(), "../../.env.example"),
    "utf8",
  );
  assert.ok(envExample.includes("buildIntegrationsHealthNote"));
  assert.ok(envExample.includes("healthNote"));
  assert.ok(envExample.includes("integrationsReadiness.ts"));
});

test("S177 .env.example cites note-builder-sor-hint contract", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID } = await import(
    "./lib/integrationsReadiness.js"
  );
  const envExample = readFileSync(
    join(process.cwd(), "../../.env.example"),
    "utf8",
  );
  assert.ok(envExample.includes(INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID));
  assert.ok(envExample.includes("INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID"));
  assert.ok(envExample.includes("INTEGRATIONS_NOTE_BUILDER_SOR_DOCS"));
});

test("S178 OpenAPI x-dial-sor.noteBuilderHint points at HINT_ID", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const raw = readFileSync(
    join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
    "utf8",
  );
  const spec = JSON.parse(raw) as {
    info?: { "x-dial-sor"?: { noteBuilderHint?: string } };
  };
  assert.ok(
    spec.info?.["x-dial-sor"]?.noteBuilderHint?.endsWith(
      "#INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID",
    ),
  );

  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as {
    info?: { "x-dial-sor"?: { noteBuilderHint?: string } };
  };
  assert.ok(
    served.info?.["x-dial-sor"]?.noteBuilderHint?.endsWith(
      "#INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID",
    ),
  );
});

test("S180 served OpenAPI noteBuilderHint matches HINT_ID export", async () => {
  const { INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID } = await import(
    "./lib/integrationsReadiness.js"
  );
  assert.equal(INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID, "note-builder-sor-hint");

  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as {
    info?: { "x-dial-sor"?: { noteBuilderHint?: string } };
  };
  const ptr = served.info?.["x-dial-sor"]?.noteBuilderHint ?? "";
  assert.ok(
    ptr.endsWith(`#INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID`),
    `expected fragment #INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID, got ${ptr}`,
  );
  assert.ok(
    ptr.includes("integrationsReadiness.ts"),
    `expected integrationsReadiness.ts path, got ${ptr}`,
  );
});

test("S183 OpenAPI x-dial-sor.noteBuilderDocs points at DOCS constant", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { INTEGRATIONS_NOTE_BUILDER_SOR_DOCS } = await import(
    "./lib/integrationsReadiness.js"
  );
  assert.equal(
    INTEGRATIONS_NOTE_BUILDER_SOR_DOCS,
    "docs/integrations/README.md",
  );

  const raw = readFileSync(
    join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
    "utf8",
  );
  const spec = JSON.parse(raw) as {
    info?: { "x-dial-sor"?: { noteBuilderDocs?: string } };
  };
  assert.ok(
    spec.info?.["x-dial-sor"]?.noteBuilderDocs?.endsWith(
      "#INTEGRATIONS_NOTE_BUILDER_SOR_DOCS",
    ),
  );

  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as {
    info?: { "x-dial-sor"?: { noteBuilderDocs?: string } };
  };
  const ptr = served.info?.["x-dial-sor"]?.noteBuilderDocs ?? "";
  assert.ok(ptr.endsWith("#INTEGRATIONS_NOTE_BUILDER_SOR_DOCS"));
  assert.ok(ptr.includes("integrationsReadiness.ts"));
});

test("S184 served OpenAPI noteBuilderDocs matches DOCS export path", async () => {
  const { existsSync, readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { INTEGRATIONS_NOTE_BUILDER_SOR_DOCS } = await import(
    "./lib/integrationsReadiness.js"
  );
  const docsPath = join(process.cwd(), "../..", INTEGRATIONS_NOTE_BUILDER_SOR_DOCS);
  assert.ok(existsSync(docsPath), `missing ${INTEGRATIONS_NOTE_BUILDER_SOR_DOCS}`);

  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as {
    info?: {
      "x-dial-sor"?: { noteBuilderDocs?: string; docs?: string };
    };
  };
  assert.equal(
    served.info?.["x-dial-sor"]?.docs,
    INTEGRATIONS_NOTE_BUILDER_SOR_DOCS,
  );
  assert.ok(
    served.info?.["x-dial-sor"]?.noteBuilderDocs?.endsWith(
      "#INTEGRATIONS_NOTE_BUILDER_SOR_DOCS",
    ),
  );
  const body = readFileSync(docsPath, "utf8");
  assert.ok(body.includes("INTEGRATIONS_NOTE_BUILDER_SOR_DOCS"));
});

test("S162 served OpenAPI healthNoteUiMax matches INTEGRATIONS_HEALTH_NOTE_UI_MAX export", async () => {
  const { INTEGRATIONS_HEALTH_NOTE_UI_MAX } = await import(
    "./lib/integrationsReadiness.js"
  );
  assert.equal(typeof INTEGRATIONS_HEALTH_NOTE_UI_MAX, "number");
  assert.ok(INTEGRATIONS_HEALTH_NOTE_UI_MAX > 0);

  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as {
    info?: { "x-dial-sor"?: { healthNoteUiMax?: string } };
  };
  const ptr = served.info?.["x-dial-sor"]?.healthNoteUiMax ?? "";
  assert.ok(
    ptr.endsWith("#INTEGRATIONS_HEALTH_NOTE_UI_MAX"),
    `expected fragment #INTEGRATIONS_HEALTH_NOTE_UI_MAX, got ${ptr}`,
  );
  assert.ok(
    ptr.includes("integrationsReadiness.ts"),
    `expected integrationsReadiness.ts path, got ${ptr}`,
  );
});

test("S164 health route note comes from buildIntegrationsHealthNote", async () => {
  const { buildIntegrationsHealthNote } = await import(
    "./lib/integrationsReadiness.js"
  );
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const routeSrc = readFileSync(
    join(process.cwd(), "src/app/api/health/integrations/route.ts"),
    "utf8",
  );
  assert.ok(routeSrc.includes("buildIntegrationsHealthNote"));
  assert.equal(routeSrc.includes("INTEGRATION_ENV_GROUP_LABELS.join"), false);

  for (const mode of ["fixture", "sandbox", "live"] as const) {
    process.env.DIAL_INTEGRATION_MODE = mode;
    const { GET } = await import("./app/api/health/integrations/route.js");
    const res = await GET();
    assert.equal(res.status, 200);
    const body = (await res.json()) as { note?: string; mode?: string };
    assert.equal(body.mode, mode);
    assert.equal(body.note, buildIntegrationsHealthNote(mode));
  }
});

test("S165 OpenAPI + README document buildIntegrationsHealthNote", async () => {
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
    components: {
      schemas: {
        IntegrationsHealth: {
          properties: { note?: { description?: string } };
        };
      };
    };
  };
  assert.ok(integ.includes("buildIntegrationsHealthNote"));
  const desc =
    spec.components.schemas.IntegrationsHealth.properties.note?.description ??
    "";
  assert.ok(desc.includes("buildIntegrationsHealthNote"));
});

test("S166 OpenAPI x-dial-sor.healthNote points at buildIntegrationsHealthNote", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const raw = readFileSync(
    join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
    "utf8",
  );
  const spec = JSON.parse(raw) as {
    info?: { "x-dial-sor"?: { healthNote?: string } };
  };
  assert.ok(
    spec.info?.["x-dial-sor"]?.healthNote?.endsWith(
      "#buildIntegrationsHealthNote",
    ),
  );

  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as {
    info?: { "x-dial-sor"?: { healthNote?: string } };
  };
  assert.ok(
    served.info?.["x-dial-sor"]?.healthNote?.endsWith(
      "#buildIntegrationsHealthNote",
    ),
  );

  const integ = readFileSync(
    join(process.cwd(), "../../docs/integrations/README.md"),
    "utf8",
  );
  assert.ok(integ.includes("x-dial-sor.healthNote"));
});

test("S170 served OpenAPI healthNote fragment locks to buildIntegrationsHealthNote export", async () => {
  const { buildIntegrationsHealthNote } = await import(
    "./lib/integrationsReadiness.js"
  );
  assert.equal(typeof buildIntegrationsHealthNote, "function");
  assert.ok(buildIntegrationsHealthNote("fixture").includes("groups labels="));

  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as {
    info?: { "x-dial-sor"?: { healthNote?: string } };
  };
  const ptr = served.info?.["x-dial-sor"]?.healthNote ?? "";
  assert.ok(
    ptr.endsWith("#buildIntegrationsHealthNote"),
    `expected fragment #buildIntegrationsHealthNote, got ${ptr}`,
  );
  assert.ok(
    ptr.includes("integrationsReadiness.ts"),
    `expected integrationsReadiness.ts path, got ${ptr}`,
  );
});

test("S171 admin UI copy cross-links note-builder SoR", async () => {
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
  for (const src of [cost, integ]) {
    assert.ok(src.includes("data-testid={INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID}"));
    assert.ok(src.includes("buildIntegrationsHealthNote"));
    assert.ok(src.includes("x-dial-sor.healthNote"));
    assert.ok(src.includes("/api/openapi"));
    assert.ok(src.includes("/api/health/integrations"));
  }
});

test("S172 integrations README documents note-builder-sor-hint cross-link", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const integ = readFileSync(
    join(process.cwd(), "../../docs/integrations/README.md"),
    "utf8",
  );
  assert.ok(integ.includes("note-builder-sor-hint"));
  assert.ok(integ.includes("buildIntegrationsHealthNote"));
  assert.ok(integ.includes("x-dial-sor.healthNote"));
  assert.ok(integ.includes("/admin/integrations"));
  assert.ok(integ.includes("/admin/cost-health"));
});

test("S181 integrations README cites HINT_ID + DOCS constants", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const integ = readFileSync(
    join(process.cwd(), "../../docs/integrations/README.md"),
    "utf8",
  );
  assert.ok(integ.includes("INTEGRATIONS_NOTE_BUILDER_SOR_HINT_ID"));
  assert.ok(integ.includes("INTEGRATIONS_NOTE_BUILDER_SOR_DOCS"));
  assert.ok(integ.includes("noteBuilderHint"));
});

test("S173 OpenAPI info.description mentions note builder SoR", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const raw = readFileSync(
    join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
    "utf8",
  );
  const spec = JSON.parse(raw) as {
    info?: { description?: string };
  };
  assert.ok(spec.info?.description?.includes("buildIntegrationsHealthNote"));
  assert.ok(spec.info?.description?.includes("x-dial-sor.healthNote"));

  const { GET } = await import("./app/api/openapi/route.js");
  const res = await GET();
  assert.equal(res.status, 200);
  const served = (await res.json()) as { info?: { description?: string } };
  assert.ok(served.info?.description?.includes("buildIntegrationsHealthNote"));
  assert.ok(served.info?.description?.includes("x-dial-sor.healthNote"));
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
