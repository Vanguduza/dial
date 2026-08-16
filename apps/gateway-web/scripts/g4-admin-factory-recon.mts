/**
 * G4 admin Catalogue Factory + confirm-SLA recon (dial-webapp-recon).
 * Desktop screenshots under docs/ops/evidence/g4/. No helper-text audit.
 *
 * Prereq: gateway on :3000, INTERNAL_API_SECRET in .env (never logged).
 * Usage: pnpm --filter @dial/gateway-web exec node --import tsx scripts/g4-admin-factory-recon.mts
 */
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Page } from "playwright";

const base = process.env.G4_RECON_BASE_URL?.trim() || "http://127.0.0.1:3000";
const internalSecret = process.env.INTERNAL_API_SECRET?.trim() || "";
const evidenceDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "docs",
  "ops",
  "evidence",
  "g4",
);
mkdirSync(evidenceDir, { recursive: true });

const helperPatterns = [
  /helper text/i,
  /tip:/i,
  /note:/i,
  /how to use/i,
  /placeholder/i,
];

async function shot(page: Page, name: string) {
  const path = join(evidenceDir, name);
  await page.screenshot({ path, fullPage: true });
  return path;
}

function auditNoHelperText(pagePath: string, html: string): string[] {
  const violations: string[] = [];
  for (const pat of helperPatterns) {
    if (pat.test(html)) violations.push(`${pagePath}: matched ${pat}`);
  }
  return violations;
}

async function main() {
  const results: Record<string, unknown> = {
    base,
    secretConfigured: Boolean(internalSecret),
    screenshots: [] as string[],
    helperViolations: [] as string[],
    ok: false,
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  try {
    await page.goto(`${base}/admin/catalogue/factory`, {
      waitUntil: "networkidle",
    });
    results.screenshots.push(await shot(page, "factory-desktop-initial.png"));
    const factoryHtml = await page.content();
    results.helperViolations.push(
      ...auditNoHelperText("/admin/catalogue/factory", factoryHtml),
    );
    const title = await page.title();
    if (!title.trim()) {
      results.helperViolations.push("factory: empty document title");
    }
    await page.waitForSelector("h1");

    if (internalSecret) {
      await page.locator('input[type="password"]').fill(internalSecret);
      await page.getByRole("button", { name: /Refresh queue/i }).click();
      await page.waitForTimeout(800);
      results.screenshots.push(await shot(page, "factory-desktop-refreshed.png"));
    }

    await page.goto(`${base}/admin/suppliers/confirm-sla`, {
      waitUntil: "networkidle",
    });
    results.screenshots.push(await shot(page, "confirm-sla-desktop.png"));
    const slaHtml = await page.content();
    results.helperViolations.push(
      ...auditNoHelperText("/admin/suppliers/confirm-sla", slaHtml),
    );

    if (internalSecret) {
      await page.locator('input[type="password"]').fill(internalSecret);
      await page.getByRole("button", { name: /^Refresh$/i }).click();
      await page.waitForTimeout(800);
      results.screenshots.push(await shot(page, "confirm-sla-desktop-loaded.png"));
    }

    const factorySource = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../src/app/admin/catalogue/factory/page.tsx",
      ),
      "utf8",
    );
    if (/helper text/i.test(factorySource)) {
      results.helperViolations.push("factory/page.tsx source contains helper text");
    }

    results.ok =
      (results.screenshots as string[]).length >= 2 &&
      (results.helperViolations as string[]).length === 0;
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(results, null, 2));
  process.exit(results.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
