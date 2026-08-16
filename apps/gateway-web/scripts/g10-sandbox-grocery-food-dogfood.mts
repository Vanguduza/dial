/**
 * G10 sandbox grocery food E2E dogfood — food only, liquor hidden.
 * Does not claim G10 (g10Claimed=false; G5 maps Tier-2 may still block full exit).
 * Never prints secret values.
 *
 * Usage (gateway on :3000; load .env first):
 *   pnpm --filter @dial/gateway-web exec node --import tsx scripts/g10-sandbox-grocery-food-dogfood.mts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type BrowserContext, type Page } from "playwright";
import {
  __resetGroceryForTests,
  assertGroceryPublishAllowed,
  countGroceryInformalB2bLeaks,
  searchGroceryOffers,
} from "@dial/catalogue";
import { setDailyZigRate } from "@dial/payments";
import { runG1GroceryFoodSandboxDogfood } from "../src/lib/grocery/g1Spine.js";

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

const base = process.env.G10_RECON_BASE_URL?.trim() || "http://127.0.0.1:3000";
const evidenceDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "docs",
  "ops",
  "evidence",
  "g10",
);
mkdirSync(evidenceDir, { recursive: true });

const authEmail =
  process.env.DIAL_SANDBOX_AUTH_EMAIL?.trim() || "g2_spare_dogfood@example.com";
const authPassword =
  process.env.DIAL_SANDBOX_AUTH_PASSWORD?.trim() || "DialSandbox1!";

async function shot(page: Page, name: string) {
  const path = join(evidenceDir, name);
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function seedFxRate(context: BrowserContext) {
  const secret = process.env.INTERNAL_API_SECRET?.trim();
  if (!secret) return { ok: false, note: "no_internal_secret" };
  const res = await context.request.post(`${base}/api/admin/fx/daily-zig`, {
    headers: { "content-type": "application/json", "x-internal-secret": secret },
    data: { zigMinorPerUsd: "250000", setBy: "g10_grocery_food_dogfood" },
  });
  if (res.status() >= 400) return { ok: false, note: `fx_http_${res.status()}` };
  const body = (await res.json()) as { ok?: boolean };
  return body.ok === true ? { ok: true, note: "fx_seeded" } : { ok: false, note: "fx_not_ok" };
}

async function establishSession(context: BrowserContext) {
  const res = await context.request.post(`${base}/api/auth/sign-in`, {
    data: { email: authEmail, password: authPassword, next: "/grocery" },
    headers: { "content-type": "application/json" },
  });
  if (res.status() >= 400) return { ok: false, note: `sign_in_${res.status()}` };
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
    return { ok: true, note: "session_ok" };
  }
  return { ok: false, note: "no_cookie" };
}

async function runSpineAndPod() {
  __resetGroceryForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "g10_spine" });

  const b2bLeaks = countGroceryInformalB2bLeaks("");
  const b2bHits = searchGroceryOffers("bread", { sessionRole: "b2b" });
  let liquorRejected = false;
  try {
    assertGroceryPublishAllowed({
      offerSource: "MARKETPLACE",
      vertical: "liquor",
      ageGateRequired: true,
    });
  } catch {
    liquorRejected = true;
  }

  const eco = await runG1GroceryFoodSandboxDogfood({
    offerId: "groc_milk_1l",
    payChoice: "ecocash",
  });

  return {
    g10Claimed: eco.g10Claimed,
    b2bLeaks,
    b2bFormalOnly: b2bHits.every((o) => o.supplierFormality === "formal"),
    liquorRejected,
    orderEco: {
      jobReserveId: eco.jobReserveId,
      deliveryJobId: eco.deliveryJobId,
      journal: Boolean(eco.journalId),
      webhook: eco.webhook,
    },
    pod: {
      status: eco.podStatus,
      codReconciled: eco.codReconciled,
    },
  };
}

async function prepCartViaApi(context: BrowserContext): Promise<{
  ok: boolean;
  note: string;
  cartId?: string;
}> {
  const cartRes = await context.request.post(`${base}/api/grocery/cart`, {
    headers: { "content-type": "application/json" },
    data: { offerId: "groc_milk_1l", qty: 1 },
  });
  if (cartRes.status() >= 400) {
    return { ok: false, note: `cart_http_${cartRes.status()}` };
  }
  const cartJson = (await cartRes.json()) as { cartId?: string; error?: string };
  const cartId = cartJson.cartId;
  if (!cartId) return { ok: false, note: "cart_id_missing" };

  const slotRes = await context.request.post(`${base}/api/grocery/slot`, {
    headers: { "content-type": "application/json" },
    data: { cartId, slotId: "slot_harare_am" },
  });
  if (slotRes.status() >= 400) {
    return { ok: false, note: `slot_http_${slotRes.status()}`, cartId };
  }
  return { ok: true, note: "cart_slot_ready", cartId };
}

async function runWebViewport(label: string, width: number, height: number) {
  const chromePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
  const browser = await chromium.launch({
    headless: true,
    ...(chromePath ? { executablePath: chromePath } : {}),
  });
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const notes: string[] = [];

  try {
    const auth = await establishSession(context);
    notes.push(`auth=${auth.note}`);
    const fx = await seedFxRate(context);
    notes.push(`fx=${fx.note}`);
    if (!auth.ok) {
      await shot(page, `grocery-auth-fail-${label}.png`);
      return { label, notes, ok: false };
    }

    const prep = await prepCartViaApi(context);
    notes.push(`prep=${prep.note}`);
    if (!prep.ok) {
      await shot(page, `grocery-prep-fail-${label}.png`);
      return { label, notes, ok: false };
    }

    await page.goto(`${base}/grocery`, { waitUntil: "networkidle", timeout: 60_000 });
    const browseText = await page.locator('[data-testid="grocery-browse"]').innerText();
    notes.push(`liquor_absent=${!/liquor/i.test(browseText)}`);
    notes.push(`food_pantry=${/Food & pantry/i.test(browseText)}`);
    await shot(page, `grocery-browse-${label}.png`);

    await page.goto(`${base}/grocery/cart`, { waitUntil: "networkidle" });
    await shot(page, `grocery-cart-${label}.png`);
    const cartEmpty = /Cart empty/i.test(await page.locator("body").innerText());
    notes.push(`cart_empty=${cartEmpty}`);
    if (cartEmpty) return { label, notes, ok: false };

    await page.goto(`${base}/grocery/slot`, { waitUntil: "networkidle" });
    await shot(page, `grocery-slot-${label}.png`);

    await page.goto(`${base}/grocery/checkout`, { waitUntil: "networkidle" });
    await shot(page, `grocery-checkout-before-ack-${label}.png`);
    const checkoutBody = await page.locator("body").innerText();
    if (/Choose a delivery slot/i.test(checkoutBody)) {
      notes.push(`slot_missing_on_checkout=true`);
      return { label, notes, ok: false };
    }

    await page.waitForSelector('[data-testid="cpa-review-ack"]', { timeout: 15_000 });
    await page.locator('[data-testid="cpa-review-ack"]').check({ force: true });
    await page.locator('[data-testid="cpa-pay-unlocked"]').waitFor({ state: "visible", timeout: 15_000 });
    await shot(page, `grocery-checkout-ctas-${label}.png`);

    await page.getByRole("button", { name: /^EcoCash$/i }).click();
    await Promise.race([
      page.waitForURL(/\/grocery\/track/, { timeout: 60_000 }),
      page.waitForTimeout(60_000),
    ]).catch(() => undefined);
    await page.waitForLoadState("networkidle").catch(() => undefined);

    const afterUrl = page.url();
    const body = await page.locator("body").innerText();
    const trackPage = /\/grocery\/track/.test(afterUrl);
    notes.push(`after_url=${afterUrl}`);
    notes.push(`track_page=${trackPage}`);
    notes.push(`track_has_order=${/order|delivery|track/i.test(body)}`);
    await shot(page, `grocery-track-${label}.png`);

    return { label, notes, ok: trackPage };
  } catch (e) {
    notes.push(`error=${e instanceof Error ? e.message.slice(0, 120) : "unknown"}`);
    await shot(page, `grocery-error-${label}.png`).catch(() => undefined);
    return { label, notes, ok: false };
  } finally {
    await browser.close();
  }
}

const spine = await runSpineAndPod();

let desktop: { label: string; notes: string[]; ok: boolean } = {
  label: "desktop",
  notes: ["skipped=playwright_unavailable"],
  ok: false,
};
let mobile: { label: string; notes: string[]; ok: boolean } = {
  label: "mobile",
  notes: ["skipped=playwright_unavailable"],
  ok: false,
};

if (process.env.G10_SKIP_WEB?.trim() !== "1") {
  try {
    desktop = await runWebViewport("desktop", 1280, 800);
    mobile = await runWebViewport("mobile", 390, 844);
  } catch (e) {
    const msg = e instanceof Error ? e.message.slice(0, 120) : "playwright_failed";
    desktop = { label: "desktop", notes: [`error=${msg}`], ok: false };
    mobile = { label: "mobile", notes: [`error=${msg}`], ok: false };
  }
}

const evidence = {
  date: new Date().toISOString().slice(0, 10),
  g10Claimed: false,
  not_G10: true,
  liquorHidden: spine.liquorRejected,
  b2bLeaks: spine.b2bLeaks,
  spine,
  desktop,
  mobile,
  residual: [
    "G5 ENH-013 maps Tier-2 may block full G10 exit",
    "Meili live grocery hits optional — memory spine exercised",
    "Temporal workflow history not required for this prep pass",
  ],
};

writeFileSync(
  join(evidenceDir, "g10-sandbox-grocery-food-dogfood.json"),
  JSON.stringify(evidence, null, 2),
);

const ok =
  spine.g10Claimed === false &&
  spine.liquorRejected &&
  spine.b2bLeaks === 0 &&
  spine.pod.status === "pod_captured" &&
  desktop.ok === true &&
  mobile.ok === true;

console.log(JSON.stringify({ ok, evidenceDir, ...evidence }, null, 2));
process.exitCode = ok ? 0 : 1;
