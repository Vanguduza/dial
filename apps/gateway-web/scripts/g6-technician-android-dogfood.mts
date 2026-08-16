/**
 * Phase 6 — technician Android-shaped HTTP dogfood (not G6 device exit).
 * Mirrors DialTechnicianClient: sign-in → seed job → checklist complete → evidence
 * → camera queue flush → ITF263 upload/verify → Take-Home WHT breakdown.
 * Writes docs/ops/evidence/g6/technician-android-dogfood.json (no secret values).
 *
 * Prereq: gateway on :3000. Usage:
 * pnpm --filter @dial/gateway-web exec node --import tsx scripts/g6-technician-android-dogfood.mts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

const base =
  process.env.G6_RECON_BASE_URL?.trim() ||
  process.env.DIAL_GATEWAY_BASE_URL?.trim() ||
  "http://127.0.0.1:3000";
const email =
  process.env.DIAL_SANDBOX_AUTH_EMAIL?.trim() || "g2_spare_dogfood@example.com";
const password =
  process.env.DIAL_SANDBOX_AUTH_PASSWORD?.trim() || "DialSandbox1!";
const authFromEnv = Boolean(process.env.DIAL_SANDBOX_AUTH_EMAIL?.trim());

async function ensureSandboxUser(): Promise<void> {
  try {
    const { getSupabasePublicConfig, getSupabaseServerConfig, signUpWithPassword } =
      await import("@dial/identity");
    const pub = getSupabasePublicConfig();
    const server = getSupabaseServerConfig();
    try {
      await signUpWithPassword({ email, password });
    } catch {
      await fetch(`${pub.url.replace(/\/$/, "")}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
          apikey: server.serviceRoleKey,
          Authorization: `Bearer ${server.serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
        }),
      });
    }
  } catch {
    // Supabase unset — prior dogfood user may exist.
  }
}

const evidenceDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "docs",
  "ops",
  "evidence",
  "g6",
);
mkdirSync(evidenceDir, { recursive: true });

function loopback(url: string) {
  const lower = url.toLowerCase();
  return (
    lower.includes("127.0.0.1") ||
    lower.includes("localhost") ||
    lower.includes("10.0.2.2")
  );
}

function assertNoIdentity(body: string) {
  if (body.includes("userId") || body.includes('"role"')) {
    throw new Error("identity leaked into technician action body");
  }
}

async function techPost(cookie: string, jsonBody: Record<string, unknown>) {
  const body = JSON.stringify(jsonBody);
  assertNoIdentity(body);
  const res = await fetch(`${base}/api/tech/technician`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      cookie,
    },
    body,
    signal: AbortSignal.timeout(20_000),
  });
  const json = (await res.json()) as Record<string, unknown>;
  return { status: res.status, json };
}

const out: Record<string, unknown> = {
  g6Claimed: false,
  devicePngRequired: true,
  base_loopback: loopback(base),
  capabilityReview: "docs/agent-audits/ai-capability-G6-intake-2026-08-16.md",
  note:
    "Native HTTP contract against gateway — unit/instrumentation substitute when G3 signing blocks device PNG. Does not claim G6.",
};

try {
  if (!authFromEnv) {
    await ensureSandboxUser();
  }
  const signRes = await fetch(`${base}/api/auth/sign-in`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(15_000),
  });
  const setCookie = signRes.headers.getSetCookie?.() ?? [];
  const cookie = setCookie
    .map((c) => c.split(";")[0])
    .filter(Boolean)
    .join("; ");
  const signJson = (await signRes.json()) as { ok?: boolean; error?: string };
  out.sign_status = signRes.status;
  out.sign_ok = signJson.ok === true;
  out.cookie_present = cookie.includes("dial_session=");

  if (!out.cookie_present) {
    out.gateway = "auth_failed";
    out.sign_err = signJson.error ?? null;
  } else {
    const seed = await techPost(cookie, { action: "seed_assigned_job" });
    out.seed_status = seed.status;
    const job = seed.json.job as { id?: string; status?: string } | undefined;
    out.job_id = job?.id ?? null;
    out.job_status = job?.status ?? null;

    if (!job?.id) {
      out.gateway = "seed_failed";
    } else {
      const start = await techPost(cookie, {
        action: "start_checklist",
        jobId: job.id,
        checklistId: "automotive_basic",
      });
      out.start_status = start.status;
      const run = start.json.run as { runId?: string; status?: string } | undefined;
      out.run_id = run?.runId ?? null;

      let completed = run?.status === "completed";
      let advances = 0;
      while (run?.runId && !completed && advances < 12) {
        const adv = await techPost(cookie, {
          action: "advance_checklist",
          runId: run.runId,
        });
        const advRun = adv.json.run as { status?: string; stepIndex?: number } | undefined;
        completed = advRun?.status === "completed";
        advances += 1;
        out.last_step_index = advRun?.stepIndex ?? null;
      }
      out.checklist_advances = advances;
      out.checklist_completed = completed;

      const ev = await techPost(cookie, {
        action: "upload_evidence",
        jobId: job.id,
        kind: "photo",
        payloadRef: "data:image/jpeg;base64,g6fixture",
      });
      out.evidence_status = ev.status;
      out.evidence_ok = ev.json.ok === true;

      const cam = await techPost(cookie, {
        action: "capture_camera_evidence",
        jobId: job.id,
        payloadRef: "data:image/jpeg;base64,g6cam",
        overlayChecklistStep: "Photo of fault area (optional)",
        queuedOffline: true,
      });
      out.camera_status = cam.status;
      const camera = cam.json.camera as { flushStatus?: string } | undefined;
      out.camera_flush_status = camera?.flushStatus ?? null;

      const flush = await techPost(cookie, { action: "flush_evidence_queue" });
      out.flush_status = flush.status;
      out.flushed = flush.json.flushed ?? 0;

      const uploaded = await techPost(cookie, {
        action: "upload_itf263",
        documentRef: "fixture://g6-itf263.pdf",
      });
      out.itf_upload_status = uploaded.status;
      const itfUp = uploaded.json.itf263 as { status?: string } | undefined;
      out.itf_upload_status_value = itfUp?.status ?? null;

      const verified = await techPost(cookie, { action: "verify_itf263_fixture" });
      out.itf_verify_status = verified.status;
      const itfV = verified.json.itf263 as { status?: string } | undefined;
      out.itf_verify_status_value = itfV?.status ?? null;

      const breakdown = await techPost(cookie, {
        action: "take_home_breakdown",
        grossUsdMinor: "12000",
        dialFeeUsdMinor: "2000",
      });
      out.take_home_status = breakdown.status;
      const th = breakdown.json as {
        netPayoutMinor?: string;
        withholdMinor?: string;
        rateBps?: number;
        payableFromAi?: boolean;
        hasItf263?: boolean;
      };
      out.take_home_payable_from_ai = th.payableFromAi === false;
      out.take_home_has_itf263 = th.hasItf263 === true;
      out.take_home_rate_bps = th.rateBps ?? null;

      const preview = await techPost(cookie, {
        action: "take_home_preview",
        payoutUsdMinor: "10000",
        hasItf263: true,
      });
      out.preview_status = preview.status;
      out.preview_withhold =
        preview.json.withholdMinor != null ? String(preview.json.withholdMinor) : null;

      const intakeRes = await fetch(`${base}/api/ai/guided-intake`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          cookie,
        },
        body: JSON.stringify({
          customerText: "Car won't start, dashboard lights dim",
        }),
        signal: AbortSignal.timeout(15_000),
      });
      const intakeJson = (await intakeRes.json()) as {
        ok?: boolean;
        payableFromAi?: boolean;
        assessment?: { needsHumanQuote?: boolean };
      };
      out.intake_status = intakeRes.status;
      out.intake_payable_from_ai = intakeJson.payableFromAi === false;
      out.intake_needs_human_quote = intakeJson.assessment?.needsHumanQuote === true;

      out.gateway = "ok";
    }
  }
} catch (e) {
  out.gateway = "unreachable";
  out.error = e instanceof Error ? e.message : "error";
}

const pathOk =
  out.gateway === "ok" &&
  out.checklist_completed === true &&
  out.evidence_ok === true &&
  out.take_home_payable_from_ai === true &&
  out.intake_payable_from_ai === true &&
  out.itf_verify_status_value === "verified";

out.technician_android_contract_ok = pathOk === true;
out.device_blocked_honest =
  "G3 signing / device PNG still required for full G6 Android evidence (T+S only this run)";

const evidencePath = join(evidenceDir, "technician-android-dogfood.json");
writeFileSync(evidencePath, `${JSON.stringify(out, null, 2)}\n`, "utf8");
console.log(
  JSON.stringify(
    {
      g6Claimed: false,
      gateway: out.gateway,
      technician_android_contract_ok: out.technician_android_contract_ok,
      devicePngRequired: true,
      evidence: "docs/ops/evidence/g6/technician-android-dogfood.json",
    },
    null,
    2,
  ),
);

if (out.gateway === "unreachable") {
  process.exitCode = 2;
} else if (!pathOk) {
  process.exitCode = 1;
}
