/**
 * G2 signed-in EcoCash web done-page Playwright (eng-exception / pretend sandbox).
 * Complements COD web PNGs + API `eco_sb_*` probes — does not overwrite COD shots.
 * Never prints secret values.
 *
 * Usage (gateway on :3000, Meili bootstrapped; load .env first):
 *   pnpm --filter @dial/gateway-web exec node --import tsx scripts/g2-signed-in-ecocash-web.mts
 */
import { existsSync, readFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type BrowserContext, type Page } from "playwright";

const rootEnv = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", ".env");
if (existsSync(rootEnv)) {
  for (const line of readFileSync(rootEnv, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    if (!process.env[key]) {
      process.env[key] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
}

const base = process.env.G2_RECON_BASE_URL?.trim() || "http://127.0.0.1:3000";
const evidenceDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "docs",
  "ops",
  "evidence",
  "g2",
);
mkdirSync(evidenceDir, { recursive: true });

const authEmail =
  process.env.DIAL_SANDBOX_AUTH_EMAIL?.trim() || "g2_spare_dogfood@example.com";
const authPassword =
  process.env.DIAL_SANDBOX_AUTH_PASSWORD?.trim() || "DialSandbox1!";

const ecoKeysPresent =
  Boolean(process.env.ECOCASH_API_KEY?.trim()) &&
  Boolean(process.env.ECOCASH_MERCHANT_CODE?.trim()) &&
  Boolean(process.env.ECOCASH_WEBHOOK_SECRET?.trim());

async function shot(page: Page, name: string) {
  const path = join(evidenceDir, name);
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function seedFxRate(context: BrowserContext): Promise<{
  ok: boolean;
  note: string;
}> {
  const secret = process.env.INTERNAL_API_SECRET?.trim();
  if (!secret) return { ok: false, note: "no_internal_secret" };
  const res = await context.request.post(`${base}/api/admin/fx/daily-zig`, {
    headers: {
      "content-type": "application/json",
      "x-internal-secret": secret,
    },
    data: {
      zigMinorPerUsd: "250000",
      setBy: "g2_ecocash_web_dogfood",
    },
  });
  if (res.status() >= 400) return { ok: false, note: `fx_seed_http_${res.status()}` };
  const body = (await res.json()) as { ok?: boolean };
  return body.ok === true ? { ok: true, note: "fx_seeded" } : { ok: false, note: "fx_seed_not_ok" };
}

async function establishSession(context: BrowserContext): Promise<{
  ok: boolean;
  note: string;
}> {
  const res = await context.request.post(`${base}/api/auth/sign-in`, {
    data: { email: authEmail, password: authPassword, next: "/spare" },
    headers: { "content-type": "application/json" },
  });
  const status = res.status();
  if (status >= 400) return { ok: false, note: `sign_in_http_${status}` };
  const body = (await res.json()) as { ok?: boolean };
  if (body.ok !== true) return { ok: false, note: "sign_in_not_ok" };
  const rawCookies =
    typeof res.headersArray === "function"
      ? res
          .headersArray()
          .filter((h) => h.name.toLowerCase() === "set-cookie")
          .map((h) => h.value)
      : [];
  const dial = rawCookies
    .map((c) => c.split(";")[0] ?? "")
    .find((c) => c.startsWith("dial_session="));
  if (dial) {
    const value = dial.slice("dial_session=".length);
    const u = new URL(base);
    await context.addCookies([
      {
        name: "dial_session",
        value,
        domain: u.hostname,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    return { ok: true, note: "session_cookie_explicit" };
  }
  const jar = await context.cookies(base);
  if (jar.some((c) => c.name === "dial_session")) {
    return { ok: true, note: "session_cookie_jar" };
  }
  return { ok: false, note: "session_cookie_missing" };
}

async function runViewport(label: string, width: number, height: number) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const notes: string[] = [];
  notes.push(`eco_keys_present=${ecoKeysPresent}`);
  notes.push(`sandbox_http=${process.env.ECOCASH_SANDBOX_HTTP?.trim() === "1"}`);

  const auth = await establishSession(context);
  notes.push(`auth=${auth.note}`);
  const fx = await seedFxRate(context);
  notes.push(`fx=${fx.note}`);
  if (!auth.ok) {
    await shot(page, `spare-ecocash-auth-fail-${label}.png`);
    await browser.close();
    return { label, notes, ok: false };
  }

  await page.goto(`${base}/spare/off_filter_oil_kun26`, {
    waitUntil: "networkidle",
    timeout: 60_000,
  });
  const pdpOk = (await page.locator("text=Add to cart").count()) > 0;
  notes.push(`pdp_ok=${pdpOk}`);
  if (!pdpOk) {
    await shot(page, `spare-ecocash-pdp-fail-${label}.png`);
    await browser.close();
    return { label, notes, ok: false };
  }

  await page.getByRole("button", { name: /Add to cart/i }).click();
  await page.waitForURL(/\/spare\/cart/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  notes.push(`cart_url=${page.url()}`);

  await page.getByRole("link", { name: /Checkout/i }).click();
  await page.waitForURL(/\/spare\/checkout/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  await page.locator('[data-testid="spare-checkout-cpa"]').waitFor({ timeout: 15_000 });
  const checkoutBody = await page.locator('[data-testid="spare-checkout-cpa"]').innerText();
  notes.push(`checkout_rate_missing=${/Daily ZiG rate not set/i.test(checkoutBody)}`);
  await shot(page, `spare-ecocash-checkout-before-ack-${label}.png`);

  if (/Daily ZiG rate not set/i.test(checkoutBody)) {
    await browser.close();
    return { label, notes, ok: false };
  }

  await page.waitForSelector('[data-testid="cpa-review-ack"]', { timeout: 15_000 });
  await page.locator('[data-testid="cpa-review-ack"]').check({ force: true });
  const unlocked = await page
    .locator('[data-testid="cpa-pay-unlocked"]')
    .waitFor({ state: "visible", timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  notes.push(`pay_unlocked=${unlocked}`);
  if (!unlocked) {
    await shot(page, `spare-ecocash-ack-fail-${label}.png`);
    await browser.close();
    return { label, notes, ok: false };
  }

  const ecoVisible = await page.locator('[data-testid="pay-ecocash"]').isVisible();
  notes.push(`pay_ecocash=${ecoVisible}`);
  await shot(page, `spare-ecocash-checkout-ctas-${label}.png`);
  if (!ecoVisible) {
    await browser.close();
    return { label, notes, ok: false };
  }

  await page.locator('[data-testid="pay-ecocash"]').click();
  await Promise.race([
    page.waitForURL(/\/spare\/checkout\/done|[?&]error=/, { timeout: 60_000 }),
    page.waitForTimeout(60_000),
  ]).catch(() => undefined);
  await page.waitForLoadState("networkidle").catch(() => undefined);

  const afterUrl = page.url();
  const body = await page.locator("body").innerText();
  const donePage = /\/spare\/checkout\/done/.test(afterUrl);
  const methodEco = /method=ecocash/i.test(afterUrl);
  const checkoutError = /[?&]error=/.test(afterUrl)
    ? decodeURIComponent((/[?&]error=([^&]+)/.exec(afterUrl)?.[1] ?? "").replace(/\+/g, " "))
    : "";
  notes.push(`after_ecocash_url=${afterUrl}`);
  notes.push(`ecocash_done=${donePage}`);
  notes.push(`method_ecocash=${methodEco}`);
  if (checkoutError) notes.push(`checkout_error=${checkoutError.slice(0, 120)}`);
  if (donePage) {
    const doneTestId = (await page.locator('[data-testid="spare-checkout-done"]').count()) > 0;
    notes.push(`done_testid=${doneTestId}`);
    notes.push(`done_has_order=${/order|jr|journal|ecocash/i.test(body)}`);
    notes.push(`done_has_intent=${/intent/i.test(body)}`);
  } else {
    notes.push(`body_snip=${body.slice(0, 240).replace(/\s+/g, " ")}`);
  }
  await shot(page, `spare-ecocash-after-${label}.png`);

  await browser.close();
  return {
    label,
    notes,
    ok: donePage && methodEco && (await Promise.resolve(true)),
  };
}

const desktop = await runViewport("desktop", 1280, 800);
const mobile = await runViewport("mobile", 390, 844);

const ok =
  ecoKeysPresent &&
  desktop.ok === true &&
  mobile.ok === true;

console.log(
  JSON.stringify(
    {
      ok,
      base,
      evidenceDir,
      eco_keys_present: ecoKeysPresent,
      sandbox_http: process.env.ECOCASH_SANDBOX_HTTP?.trim() === "1",
      desktop,
      mobile,
      note: ok
        ? "G2 EcoCash web done-page evidenced (pretend eco_sb_* path)"
        : "EcoCash web done-page incomplete — see notes/screenshots",
    },
    null,
    2,
  ),
);

if (!ecoKeysPresent) process.exitCode = 2;
else if (!ok) process.exitCode = 1;
