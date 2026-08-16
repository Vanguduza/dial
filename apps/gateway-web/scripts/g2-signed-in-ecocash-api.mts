/**
 * Signed-in EcoCash checkout probe (G2 eng-exception / pretend sandbox).
 * Expect eco_sb_* providerRef when Pack §6 ECOCASH_* set and ECOCASH_SANDBOX_HTTP unset.
 * Never prints secret values.
 */
const base = process.env.G2_RECON_BASE_URL?.trim() || "http://127.0.0.1:3000";
const email =
  process.env.DIAL_SANDBOX_AUTH_EMAIL?.trim() || "g2_spare_dogfood@example.com";
const password =
  process.env.DIAL_SANDBOX_AUTH_PASSWORD?.trim() || "DialSandbox1!";

const ecoKeysPresent =
  Boolean(process.env.ECOCASH_API_KEY?.trim()) &&
  Boolean(process.env.ECOCASH_MERCHANT_CODE?.trim()) &&
  Boolean(process.env.ECOCASH_WEBHOOK_SECRET?.trim());

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

const meRes = await fetch(`${base}/api/auth/me`, {
  headers: { cookie: cookieHeader },
});
const meJson = (await meRes.json()) as { userId?: string; error?: string };

const chkRes = await fetch(`${base}/api/spare/checkout`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    cookie: cookieHeader,
    "Idempotency-Key": `g2-api-eco-${Date.now()}`,
  },
  body: JSON.stringify({ offerId: "off_filter_oil_kun26", choice: "ecocash" }),
});
const chkJson = (await chkRes.json()) as Record<string, unknown>;
const durable = (chkJson.durable ?? {}) as Record<string, unknown>;
const providerRef = String(chkJson.providerRef ?? "");

console.log(
  JSON.stringify(
    {
      eco_keys_present: ecoKeysPresent,
      sandbox_http: process.env.ECOCASH_SANDBOX_HTTP?.trim() === "1",
      sign_status: signRes.status,
      sign_ok: signJson.ok === true,
      cookie_present: cookieHeader.includes("dial_session="),
      me_status: meRes.status,
      me_user: Boolean(meJson.userId),
      checkout_status: chkRes.status,
      checkout_ok: chkJson.ok === true,
      orderId_present: Boolean(chkJson.orderId),
      providerRef_prefix: providerRef.slice(0, 8),
      providerRef_eco_sb: providerRef.startsWith("eco_sb_"),
      durable_order: durable.order ?? null,
      durable_snapshot: durable.snapshot ?? null,
      durable_jr: durable.jobReserve ?? null,
      journal: Boolean(chkJson.journalId),
      fiscal: Array.isArray(chkJson.fiscalIds) ? chkJson.fiscalIds.length : 0,
      leaks: chkJson.b2bInformalLeaks ?? null,
      error: chkJson.error ?? null,
    },
    null,
    2,
  ),
);

if (!ecoKeysPresent) {
  process.exitCode = 2;
} else if (
  chkJson.ok !== true ||
  !providerRef.startsWith("eco_sb_") ||
  (chkJson.b2bInformalLeaks as number) !== 0
) {
  process.exitCode = 1;
}
