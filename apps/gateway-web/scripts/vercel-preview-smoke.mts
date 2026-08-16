/**
 * Smoke the deployed preview: every public surface should answer, and the
 * fixture-mode money/WA/tax rails should still be fail-closed.
 *
 *   node --import tsx scripts/vercel-preview-smoke.mts <deployment-url>
 *
 * Deployment protection: pass the bypass secret in DIAL_VERCEL_BYPASS
 * (never committed, never printed).
 */
const base = (process.argv[2] ?? "").replace(/\/$/, "");
if (!base) throw new Error("usage: vercel-preview-smoke.mts <deployment-url>");

const bypass = process.env.DIAL_VERCEL_BYPASS?.trim();

const PAGES = [
  "/",
  "/sign-in",
  "/sign-up",
  "/home",
  "/spare",
  "/spare/entry",
  "/spare/garage",
  "/spare/cart",
  "/spare/checkout",
  "/spare/orders",
  "/spare/returns",
  "/grocery",
  "/grocery/search",
  "/grocery/collections",
  "/grocery/cart",
  "/grocery/checkout",
  "/grocery/slot",
  "/grocery/track",
  "/tech",
  "/tech/guide",
  "/tech/book",
  "/tech/emergency",
  "/tech/jobs",
  "/delivery/track",
  "/delivery/courier",
  "/supplier",
  "/account/profile",
  "/account/addresses",
  "/account/consent",
  "/account/promo",
  "/account/notifications",
];

const APIS = [
  "/api/health/live",
  "/api/health/integrations",
  "/api/home",
  "/api/search/spare?q=filter",
  "/api/search/grocery?q=milk",
  "/api/tech/services",
  "/api/grocery/collections",
];

async function hit(path: string) {
  const res = await fetch(base + path, {
    redirect: "manual",
    headers: bypass ? { "x-vercel-protection-bypass": bypass } : {},
  });
  return { path, status: res.status, type: res.headers.get("content-type") };
}

const results: Array<{ path: string; status: number; type: string | null }> = [];
for (const p of [...PAGES, ...APIS]) results.push(await hit(p));

const bad = results.filter((r) => r.status >= 500);
const redirected = results.filter((r) => r.status >= 300 && r.status < 400);
const ok = results.filter((r) => r.status < 300);

console.log(JSON.stringify({ base, ok: ok.length, redirected: redirected.length, bad }, null, 2));
for (const r of results) console.log(`${String(r.status).padEnd(4)} ${r.path}`);

if (bad.length) process.exitCode = 1;
