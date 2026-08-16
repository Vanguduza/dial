/**
 * Phase 3 — native-shaped Spare checkout probe (not G3).
 * Mirrors Android/iOS DialGatewayClient: dial_session cookie, no body userId/role,
 * Idempotency-Key prefixes android-* / ios-*, EcoCash|COD only.
 * Writes docs/ops/evidence/g3/native-client-checkout.json (no secret values).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const base =
  process.env.DIAL_GATEWAY_BASE_URL?.trim() ||
  process.env.G2_RECON_BASE_URL?.trim() ||
  "http://127.0.0.1:3000";
const email =
  process.env.DIAL_SANDBOX_AUTH_EMAIL?.trim() || "g2_spare_dogfood@example.com";
const password =
  process.env.DIAL_SANDBOX_AUTH_PASSWORD?.trim() || "DialSandbox1!";
const offerId = "off_filter_oil_kun26";

const evidenceDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../docs/ops/evidence/g3",
);

function loopback(url: string) {
  const lower = url.toLowerCase();
  return (
    lower.includes("127.0.0.1") ||
    lower.includes("localhost") ||
    lower.includes("10.0.2.2")
  );
}

async function checkout(cookieHeader: string, client: "android" | "ios", choice: "ecocash" | "cod") {
  const body = JSON.stringify({ offerId, choice, qty: 1 });
  if (body.includes("userId") || body.includes('"role"')) {
    throw new Error("identity leaked into checkout body");
  }
  const res = await fetch(`${base}/api/spare/checkout`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      cookie: cookieHeader,
      "Idempotency-Key": `${client}-${choice}-${offerId}-${Date.now()}`,
    },
    body,
  });
  const json = (await res.json()) as Record<string, unknown>;
  const durable = (json.durable ?? {}) as Record<string, unknown>;
  const providerRef = String(json.providerRef ?? "");
  return {
    client,
    choice,
    status: res.status,
    ok: json.ok === true,
    orderId_present: Boolean(json.orderId),
    currency: json.currency ?? null,
    imttOnCheckoutLines: json.imttOnCheckoutLines === true,
    providerRef_prefix: providerRef.slice(0, 8),
    providerRef_eco_sb: providerRef.startsWith("eco_sb_"),
    durable_order: durable.order ?? null,
    durable_snapshot: durable.snapshot ?? null,
    durable_jr: durable.jobReserve ?? null,
    journal: Boolean(json.journalId),
    fiscal: Array.isArray(json.fiscalIds) ? json.fiscalIds.length : 0,
    leaks: json.b2bInformalLeaks ?? null,
    error: json.error ?? null,
  };
}

const out: Record<string, unknown> = {
  g3Claimed: false,
  base_loopback: loopback(base),
  eco_keys_present: Boolean(
    process.env.ECOCASH_API_KEY?.trim() &&
      process.env.ECOCASH_MERCHANT_CODE?.trim() &&
      process.env.ECOCASH_WEBHOOK_SECRET?.trim(),
  ),
  sandbox_http: process.env.ECOCASH_SANDBOX_HTTP?.trim() === "1",
};

try {
  const signRes = await fetch(`${base}/api/auth/sign-in`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(15_000),
  });
  const setCookie = signRes.headers.getSetCookie?.() ?? [];
  const cookieHeader = setCookie
    .map((c) => c.split(";")[0])
    .filter(Boolean)
    .join("; ");
  const signJson = (await signRes.json()) as { ok?: boolean; error?: string };
  out.sign_status = signRes.status;
  out.sign_ok = signJson.ok === true;
  out.cookie_present = cookieHeader.includes("dial_session=");
  out.sign_err = signJson.error ?? null;

  if (!out.cookie_present) {
    out.gateway = "auth_failed";
  } else {
    const meRes = await fetch(`${base}/api/auth/me`, {
      headers: { cookie: cookieHeader, accept: "application/json" },
    });
    const meJson = (await meRes.json()) as { userId?: string; error?: string };
    out.me_status = meRes.status;
    out.me_user = Boolean(meJson.userId);

    out.android_cod = await checkout(cookieHeader, "android", "cod");
    out.android_ecocash = await checkout(cookieHeader, "android", "ecocash");
    out.ios_cod = await checkout(cookieHeader, "ios", "cod");
    out.ios_ecocash = await checkout(cookieHeader, "ios", "ecocash");
    out.gateway = "ok";
  }
} catch (e) {
  out.gateway = "unreachable";
  out.error = e instanceof Error ? e.name : "error";
}

const rails = [out.android_cod, out.android_ecocash, out.ios_cod, out.ios_ecocash] as Array<
  Record<string, unknown> | undefined
>;
const railsOk =
  rails.every(
    (r) =>
      r &&
      r.ok === true &&
      r.leaks === 0 &&
      r.imttOnCheckoutLines === false,
  ) &&
  (out.android_ecocash as { providerRef_eco_sb?: boolean } | undefined)?.providerRef_eco_sb ===
    true &&
  (out.ios_ecocash as { providerRef_eco_sb?: boolean } | undefined)?.providerRef_eco_sb === true;

out.native_contract_rails_ok = railsOk === true;
out.note =
  "Native HTTP contract against gateway. Loopback local ≠ G3 staging. Device screenshots + TestFlight/Play internal still required.";

mkdirSync(evidenceDir, { recursive: true });
const evidencePath = join(evidenceDir, "native-client-checkout.json");
writeFileSync(evidencePath, `${JSON.stringify(out, null, 2)}\n`, "utf8");
console.log(
  JSON.stringify(
    {
      g3Claimed: false,
      gateway: out.gateway,
      base_loopback: out.base_loopback,
      native_contract_rails_ok: out.native_contract_rails_ok,
      evidence: "docs/ops/evidence/g3/native-client-checkout.json",
    },
    null,
    2,
  ),
);

if (out.gateway === "unreachable") {
  process.exitCode = 2;
} else if (!railsOk) {
  process.exitCode = 1;
}
