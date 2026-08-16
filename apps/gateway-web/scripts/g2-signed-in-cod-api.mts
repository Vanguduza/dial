/**
 * Debug: sign-in → /api/auth/me → /api/spare/checkout COD (no secret prints).
 */
const base = process.env.G2_RECON_BASE_URL?.trim() || "http://127.0.0.1:3000";
const email =
  process.env.DIAL_SANDBOX_AUTH_EMAIL?.trim() || "g2_spare_dogfood@example.com";
const password =
  process.env.DIAL_SANDBOX_AUTH_PASSWORD?.trim() || "DialSandbox1!";

const signRes = await fetch(`${base}/api/auth/sign-in`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const setCookie = signRes.headers.getSetCookie?.() ?? [];
const cookieHeader = setCookie
  .map((c) => c.split(";")[0])
  .filter(Boolean)
  .join("; ");
const signJson = (await signRes.json()) as { ok?: boolean; error?: string };
console.log(
  JSON.stringify({
    sign_status: signRes.status,
    sign_ok: signJson.ok === true,
    cookie_present: cookieHeader.includes("dial_session="),
    sign_err: signJson.error ?? null,
  }),
);

const meRes = await fetch(`${base}/api/auth/me`, {
  headers: { cookie: cookieHeader },
});
const meJson = (await meRes.json()) as { userId?: string; error?: string };
console.log(
  JSON.stringify({
    me_status: meRes.status,
    me_user: Boolean(meJson.userId),
    me_err: meJson.error ?? null,
  }),
);

const chkRes = await fetch(`${base}/api/spare/checkout`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    cookie: cookieHeader,
    "Idempotency-Key": `g2-api-cod-${Date.now()}`,
  },
  body: JSON.stringify({ offerId: "off_filter_oil_kun26", choice: "cod" }),
});
const chkJson = (await chkRes.json()) as Record<string, unknown>;
const durable = (chkJson.durable ?? {}) as Record<string, unknown>;
console.log(
  JSON.stringify({
    checkout_status: chkRes.status,
    checkout_ok: chkJson.ok === true,
    orderId_present: Boolean(chkJson.orderId),
    durable_order: durable.order ?? null,
    durable_snapshot: durable.snapshot ?? null,
    durable_jr: durable.jobReserve ?? null,
    journal: Boolean(chkJson.journalId),
    fiscal: Array.isArray(chkJson.fiscalIds) ? chkJson.fiscalIds.length : 0,
    leaks: chkJson.b2bInformalLeaks ?? null,
    error: chkJson.error ?? null,
  }),
);
