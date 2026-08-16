/**
 * G2 dial-webapp-recon style smoke — Spare browse → cart → checkout CTAs.
 * Anonymous: pay CTA → sign-in return URL (`/?next=…`).
 * Signed-in: when DIAL_SANDBOX_AUTH_EMAIL (+ optional PASSWORD) set, completes COD buy.
 * Does not invent EcoCash keys.
 *
 * Usage (gateway on :3000, Meili bootstrapped; load .env first):
 *   pnpm --filter @dial/gateway-web exec node --import tsx scripts/g2-spare-web-recon.mts
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type BrowserContext, type Page } from "playwright";

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

const authEmail = process.env.DIAL_SANDBOX_AUTH_EMAIL?.trim() || "";
const authPassword =
  process.env.DIAL_SANDBOX_AUTH_PASSWORD?.trim() || "DialSandbox1!";
const signedInMode = Boolean(authEmail);

async function shot(page: Page, name: string) {
  const path = join(evidenceDir, name);
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function establishSession(context: BrowserContext): Promise<{
  ok: boolean;
  note: string;
}> {
  if (!authEmail) {
    return { ok: false, note: "no_DIAL_SANDBOX_AUTH_EMAIL" };
  }
  const res = await context.request.post(`${base}/api/auth/sign-in`, {
    data: {
      email: authEmail,
      password: authPassword,
      next: "/spare",
    },
    headers: { "content-type": "application/json" },
  });
  const status = res.status();
  if (status >= 400) {
    return { ok: false, note: `sign_in_http_${status}` };
  }
  const body = (await res.json()) as { ok?: boolean };
  if (body.ok !== true) {
    return { ok: false, note: "sign_in_not_ok" };
  }
  // Explicit cookie jar — some Playwright builds do not auto-apply API Set-Cookie to pages.
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
  notes.push(`signed_in_mode=${signedInMode}`);
  notes.push(`auth_email_present=${Boolean(authEmail)}`);

  if (signedInMode) {
    const auth = await establishSession(context);
    notes.push(`auth=${auth.note}`);
    if (!auth.ok) {
      await shot(page, `spare-auth-fail-${label}.png`);
      await browser.close();
      return { label, notes };
    }
  }

  await page.goto(`${base}/spare`, { waitUntil: "networkidle", timeout: 60_000 });
  const browseText = await page.locator('[data-testid="spare-browse"]').innerText();
  const searchSource =
    /search\s+(meili|memory)/i.exec(browseText)?.[1]?.toLowerCase() ??
    (browseText.toLowerCase().includes("meili") ? "meili" : "unknown");
  notes.push(`browse_search_source=${searchSource}`);
  const browseShot = await shot(page, `spare-browse-${label}.png`);
  notes.push(`shot=${browseShot}`);

  // Prefer seeded Meili stub PDP; fall back to first offer link.
  let pdpOk = false;
  try {
    await page.goto(`${base}/spare/off_filter_oil_kun26`, {
      waitUntil: "networkidle",
      timeout: 60_000,
    });
    pdpOk = (await page.locator("text=Add to cart").count()) > 0;
  } catch {
    pdpOk = false;
  }
  if (!pdpOk) {
    await page.goto(`${base}/spare`, { waitUntil: "networkidle" });
    const first = page
      .locator('a[href^="/spare/"]')
      .filter({ hasNotText: /cart|orders|garage|returns|entry|home/i })
      .first();
    await first.click();
    await page.waitForLoadState("networkidle");
  }
  notes.push(`pdp_url=${page.url()}`);
  await shot(page, `spare-pdp-${label}.png`);

  await page.getByRole("button", { name: /Add to cart/i }).click();
  await page.waitForURL(/\/spare\/cart/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  const cartUrl = page.url();
  notes.push(`cart_url=${cartUrl}`);
  await shot(page, `spare-cart-${label}.png`);

  await page.getByRole("link", { name: /Checkout/i }).click();
  await page.waitForURL(/\/spare\/checkout/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  await page.locator('[data-testid="spare-checkout-cpa"]').waitFor({ timeout: 15_000 });
  const checkoutBody = await page.locator('[data-testid="spare-checkout-cpa"]').innerText();
  notes.push(`checkout_has_rate=${/Payable ZiG|fx_|g2_spare|Daily ZiG|ZWG/i.test(checkoutBody)}`);
  notes.push(`checkout_rate_missing=${/Daily ZiG rate not set/i.test(checkoutBody)}`);
  notes.push(`has_disclosure=${(await page.locator('[data-testid="cpa-disclosure-review"]').count()) > 0}`);
  await shot(page, `spare-checkout-before-ack-${label}.png`);
  if (/Daily ZiG rate not set/i.test(checkoutBody)) {
    await browser.close();
    return { label, notes };
  }
  // Client DisclosureReviewGate — wait for hydration then Playwright check().
  await page.waitForSelector('[data-testid="cpa-review-ack"]', { timeout: 15_000 });
  await page.locator('[data-testid="cpa-review-ack"]').check({ force: true });
  const unlocked = await page
    .locator('[data-testid="cpa-pay-unlocked"]')
    .waitFor({ state: "visible", timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  notes.push(`pay_unlocked=${unlocked}`);
  if (!unlocked) {
    notes.push(`checkout_snip=${checkoutBody.slice(0, 400).replace(/\s+/g, " ")}`);
    await shot(page, `spare-checkout-ack-fail-${label}.png`);
    await browser.close();
    return { label, notes };
  }
  const ecoVisible = await page.locator('[data-testid="pay-ecocash"]').isVisible();
  const codVisible = await page.locator('[data-testid="pay-cod"]').isVisible();
  notes.push(`pay_ecocash=${ecoVisible}`);
  notes.push(`pay_cod=${codVisible}`);
  await shot(page, `spare-checkout-ctas-${label}.png`);

  await page.locator('[data-testid="pay-cod"]').click();
  await Promise.race([
    page.waitForURL(/\/spare\/checkout\/done|[?&]next=|error=/, {
      timeout: 45_000,
    }),
    page.waitForTimeout(45_000),
  ]).catch(() => undefined);
  await page.waitForLoadState("networkidle").catch(() => undefined);
  const afterCod = page.url();
  const body = await page.locator("body").innerText();
  const donePage = /\/spare\/checkout\/done/.test(afterCod);
  const signInReturn =
    /[?&]next=/.test(afterCod) ||
    /^https?:\/\/[^/]+\/?(\?|$)/.test(afterCod);
  const checkoutError = /[?&]error=/.test(afterCod)
    ? decodeURIComponent((/[?&]error=([^&]+)/.exec(afterCod)?.[1] ?? "").replace(/\+/g, " "))
    : "";
  notes.push(`after_cod_url=${afterCod}`);
  notes.push(`cod_completed=${donePage}`);
  notes.push(`cod_sign_in_return=${signInReturn && !donePage}`);
  notes.push(`cod_needs_session=${!signedInMode && signInReturn && !donePage}`);
  if (checkoutError) notes.push(`checkout_error=${checkoutError.slice(0, 120)}`);
  if (donePage) {
    notes.push(`done_has_order=${/order|jr|journal|cod/i.test(body)}`);
  } else if (signedInMode) {
    notes.push(`body_snip=${body.slice(0, 240).replace(/\s+/g, " ")}`);
  }
  await shot(page, `spare-cod-after-${label}.png`);

  await browser.close();
  return { label, notes };
}

const desktop = await runViewport("desktop", 1280, 800);
const mobile = await runViewport("mobile", 390, 844);

console.log(
  JSON.stringify(
    {
      ok: true,
      base,
      evidenceDir,
      signedInMode,
      authEmailPresent: Boolean(authEmail),
      desktop,
      mobile,
      note: signedInMode
        ? "Signed-in COD path exercised when Auth succeeded; EcoCash still needs ECOCASH_* for G2 exit"
        : "Anonymous recon: expect sign-in return URL. Set DIAL_SANDBOX_AUTH_EMAIL for signed-in COD dogfood",
    },
    null,
    2,
  ),
);
