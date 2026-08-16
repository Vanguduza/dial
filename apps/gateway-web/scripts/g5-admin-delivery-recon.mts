/**
 * G5 admin delivery MapLibre + dispatch recon (dial-webapp-recon).
 * T+S+A = Track + Small viewport + Assignment (dispatch) evidence.
 * Desktop + tablet + mobile screenshots under docs/ops/evidence/g5/.
 *
 * Prereq: gateway on :3000; INTERNAL_API_SECRET + DIAL_SANDBOX_AUTH_EMAIL in .env (never logged).
 * Usage: pnpm --filter @dial/gateway-web exec node --import tsx scripts/g5-admin-delivery-recon.mts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type BrowserContext, type Page } from "playwright";

const envPath = join(process.cwd(), "..", "..", ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
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

const base = process.env.G5_RECON_BASE_URL?.trim() || "http://127.0.0.1:3000";
const internalSecret = process.env.INTERNAL_API_SECRET?.trim() || "";
const authEmail =
  process.env.DIAL_SANDBOX_AUTH_EMAIL?.trim() ||
  `g5_recon_${Date.now().toString(36)}@example.com`;
const authPassword =
  process.env.DIAL_SANDBOX_AUTH_PASSWORD?.trim() || "DialSandbox1!";
const authFromEnv = Boolean(process.env.DIAL_SANDBOX_AUTH_EMAIL?.trim());

const evidenceDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "docs",
  "ops",
  "evidence",
  "g5",
);
mkdirSync(evidenceDir, { recursive: true });

const helperPatterns = [
  /helper text/i,
  /how to use/i,
  /tip:/i,
  /note:/i,
];

const viewports = [
  { label: "desktop", width: 1280, height: 900 },
  { label: "tablet", width: 834, height: 1112 },
  { label: "small", width: 390, height: 844 },
] as const;

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

async function ensureSandboxUser(): Promise<void> {
  try {
    const { getSupabasePublicConfig, getSupabaseServerConfig, signUpWithPassword } =
      await import("@dial/identity");
    const pub = getSupabasePublicConfig();
    const server = getSupabaseServerConfig();
    try {
      await signUpWithPassword({ email: authEmail, password: authPassword });
    } catch {
      await fetch(`${pub.url.replace(/\/$/, "")}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
          apikey: server.serviceRoleKey,
          Authorization: `Bearer ${server.serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
          email_confirm: true,
        }),
      });
    }
  } catch {
    // Supabase unset — sign-in may still succeed if user exists from prior dogfood.
  }
}

async function establishSession(context: BrowserContext): Promise<{
  ok: boolean;
  note: string;
}> {
  if (!authFromEnv) {
    await ensureSandboxUser();
  }
  const res = await context.request.post(`${base}/api/auth/sign-in`, {
    data: { email: authEmail, password: authPassword, next: "/admin/delivery/track" },
    headers: { "content-type": "application/json" },
  });
  if (res.status() >= 400) {
    return { ok: false, note: `sign_in_http_${res.status()}` };
  }
  const body = (await res.json()) as { ok?: boolean };
  if (body.ok !== true) {
    return { ok: false, note: "sign_in_not_ok" };
  }
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

async function seedCourierPin(context: BrowserContext): Promise<{
  ok: boolean;
  pinCount: number;
  jobId?: string;
}> {
  const seed = await context.request.post(`${base}/api/delivery/courier`, {
    data: { action: "seed_offer", codUsdMinor: "2500" },
    headers: { "content-type": "application/json" },
  });
  if (seed.status() >= 400) {
    return { ok: false, pinCount: 0 };
  }
  const seeded = (await seed.json()) as {
    offer?: { id: string };
    job?: { id: string };
  };
  if (!seeded.offer?.id || !seeded.job?.id) {
    return { ok: false, pinCount: 0 };
  }
  await context.request.post(`${base}/api/delivery/courier`, {
    data: { action: "accept_offer", offerId: seeded.offer.id },
    headers: { "content-type": "application/json" },
  });
  await context.request.post(`${base}/api/delivery/courier`, {
    data: {
      action: "post_location",
      lat: -17.8252,
      lng: 31.0335,
      jobId: seeded.job.id,
    },
    headers: { "content-type": "application/json" },
  });
  const track = await context.request.get(`${base}/api/delivery/courier?view=track`);
  if (track.status() >= 400) {
    return { ok: false, pinCount: 0, jobId: seeded.job.id };
  }
  const trackJson = (await track.json()) as { locations?: unknown[] };
  return {
    ok: (trackJson.locations?.length ?? 0) >= 1,
    pinCount: trackJson.locations?.length ?? 0,
    jobId: seeded.job.id,
  };
}

async function seedDispatchBoard(context: BrowserContext): Promise<{
  ok: boolean;
  jobId?: string;
}> {
  if (!internalSecret) return { ok: false };
  const res = await context.request.post(`${base}/api/admin/delivery/dispatch`, {
    data: { action: "seed_offer_job" },
    headers: {
      "content-type": "application/json",
      "x-internal-secret": internalSecret,
    },
  });
  if (res.status() >= 400) return { ok: false };
  const body = (await res.json()) as { jobId?: string };
  return { ok: Boolean(body.jobId), jobId: body.jobId };
}

async function runViewport(vp: (typeof viewports)[number]) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
  });
  const page = await context.newPage();
  const shots: string[] = [];
  const violations: string[] = [];
  let authNote = "skipped";
  let pinCount = 0;
  let dispatchJobId: string | undefined;
  let assignmentSeedStatus = 0;
  let assignmentSeedError: string | undefined;

  try {
    const auth = await establishSession(context);
    authNote = auth.note;
    if (auth.ok) {
      const pin = await seedCourierPin(context);
      pinCount = pin.pinCount;
    }

    await page.goto(`${base}/admin/delivery/track`, {
      waitUntil: "networkidle",
      timeout: 60_000,
    });
    await page.waitForSelector("h1", { timeout: 15_000 });
    await page.waitForTimeout(1200);
    shots.push(await shot(page, `track-${vp.label}-initial.png`));
    violations.push(
      ...auditNoHelperText(
        `/admin/delivery/track (${vp.label})`,
        await page.content(),
      ),
    );

    const mapRoot = page.locator('[data-testid="dial-map"]');
    await mapRoot.waitFor({ state: "visible", timeout: 15_000 }).catch(() => undefined);
    const canvasVisible = await page
      .locator(".maplibregl-canvas")
      .first()
      .isVisible({ timeout: 20_000 })
      .catch(() => false);
    if (!canvasVisible) {
      violations.push(`track-${vp.label}: MapLibre GL canvas not visible (DialMap)`);
    }

    if (internalSecret) {
      await seedDispatchBoard(context);
      await page.goto(`${base}/admin/delivery/dispatch`, {
        waitUntil: "networkidle",
        timeout: 60_000,
      });
      await page.locator('input[type="password"]').fill(internalSecret);
      await page.getByRole("button", { name: /Refresh board/i }).click();
      await page.waitForTimeout(900);
      shots.push(await shot(page, `dispatch-${vp.label}-board.png`));
      violations.push(
        ...auditNoHelperText(
          `/admin/delivery/dispatch (${vp.label})`,
          await page.content(),
        ),
      );
      const dispatchCanvas = await page
        .locator(".maplibregl-canvas")
        .first()
        .isVisible({ timeout: 20_000 })
        .catch(() => false);
      if (!dispatchCanvas) {
        violations.push(
          `dispatch-${vp.label}: MapLibre GL canvas not visible (DialMap)`,
        );
      }

      const seedRes = await context.request.post(
        `${base}/api/admin/delivery/dispatch`,
        {
          data: { action: "seed_offer_job" },
          headers: {
            "content-type": "application/json",
            "x-internal-secret": internalSecret,
          },
        },
      );
      assignmentSeedStatus = seedRes.status();
      if (seedRes.status() < 400) {
        const seeded = (await seedRes.json()) as { jobId?: string; error?: string };
        dispatchJobId = seeded.jobId;
        if (!dispatchJobId) {
          assignmentSeedError = seeded.error ?? "missing jobId";
        }
        if (dispatchJobId) {
          const eventsProbe = await context.request.get(
            `${base}/api/admin/delivery/assignment-events?jobId=${encodeURIComponent(dispatchJobId)}`,
            { headers: { "x-internal-secret": internalSecret } },
          );
          const eventsJson = (await eventsProbe.json()) as {
            events?: unknown[];
          };
          if ((eventsJson.events?.length ?? 0) === 0) {
            await context.request.post(`${base}/api/admin/delivery/dispatch`, {
              data: {
                action: "manual_override_assign",
                jobId: dispatchJobId,
                courierId: "cour_ops_override",
                assignedBy: "g5_recon",
              },
              headers: {
                "content-type": "application/json",
                "x-internal-secret": internalSecret,
              },
            });
          }
          await page.locator('input[type="password"]').fill(internalSecret);
          await page
            .locator('input[placeholder="jobId"]')
            .fill(dispatchJobId);
          await page.getByRole("button", { name: /Load timeline/i }).click();
          for (let attempt = 0; attempt < 3; attempt++) {
            await page.waitForTimeout(600 + attempt * 400);
            const eventsList = page.locator('[data-testid="assignment-events-list"]');
            if ((await eventsList.locator("li").count()) > 0) break;
            if (attempt < 2) {
              await page.getByRole("button", { name: /Load timeline/i }).click();
            }
          }
          shots.push(await shot(page, `dispatch-${vp.label}-assignment.png`));
          const eventsList = page.locator('[data-testid="assignment-events-list"]');
          const domEvents = await eventsList.locator("li").count();
          const apiEvents = await context.request.get(
            `${base}/api/admin/delivery/assignment-events?jobId=${encodeURIComponent(dispatchJobId)}`,
            { headers: { "x-internal-secret": internalSecret } },
          );
          const apiJson = (await apiEvents.json()) as { events?: unknown[] };
          if (domEvents === 0 && (apiJson.events?.length ?? 0) === 0) {
            violations.push(
              `dispatch-${vp.label}: assignment events empty for ${dispatchJobId}`,
            );
          }
        }
      } else {
        const errBody = (await seedRes.json().catch(() => ({}))) as {
          error?: string;
        };
        assignmentSeedError = errBody.error ?? `http_${seedRes.status()}`;
      }
    }
  } finally {
    await browser.close();
  }

  return {
    viewport: vp.label,
    authNote,
    pinCount,
    dispatchJobId,
    assignmentSeedStatus,
    assignmentSeedError,
    screenshots: shots,
    helperViolations: violations,
    ok:
      shots.length >= 3 &&
      violations.length === 0 &&
      pinCount >= 1 &&
      Boolean(dispatchJobId),
  };
}

async function main() {
  const results: Record<string, unknown> = {
    base,
    secretConfigured: Boolean(internalSecret),
    authEmailFromEnv: authFromEnv,
    authEmailPresent: true,
    screenshots: [] as string[],
    viewports: [] as unknown[],
    helperViolations: [] as string[],
    not_G5: true,
    g5Claimed: false,
    ok: false,
  };

  if (!internalSecret) {
    (results.helperViolations as string[]).push(
      "INTERNAL_API_SECRET unset — dispatch recon partial",
    );
  }
  for (const vp of viewports) {
    const run = await runViewport(vp);
    (results.viewports as unknown[]).push(run);
    (results.screenshots as string[]).push(...run.screenshots);
    (results.helperViolations as string[]).push(...run.helperViolations);
  }

  const trackSource = readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      "../src/app/admin/delivery/track/page.tsx",
    ),
    "utf8",
  );
  const dispatchSource = readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      "../src/app/admin/delivery/dispatch/page.tsx",
    ),
    "utf8",
  );
  if (/helper text/i.test(trackSource) || /helper text/i.test(dispatchSource)) {
    (results.helperViolations as string[]).push(
      "admin delivery page source contains helper text",
    );
  }

  const allVpOk = (results.viewports as Array<{ ok: boolean }>).every((v) => v.ok);
  results.ok =
    allVpOk &&
    (results.screenshots as string[]).length >= 9 &&
    (results.helperViolations as string[]).length === 0;

  writeFileSync(
    join(evidenceDir, "g5-admin-delivery-recon.json"),
    JSON.stringify(results, null, 2),
  );

  console.log(JSON.stringify(results, null, 2));
  process.exit(results.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
