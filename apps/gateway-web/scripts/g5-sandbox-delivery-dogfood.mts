/**
 * G5 sandbox delivery dogfood — Temporal workflow history + courier POD/COD path.
 * Does not claim G5 until all anti-stub items pass. Never prints secrets.
 *
 * Prereq: docker compose --profile temporal up -d; .env with TEMPORAL_ADDRESS,
 * INTERNAL_API_SECRET, SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (sandbox).
 *
 * Usage: pnpm --filter @dial/gateway-web exec node --import tsx scripts/g5-sandbox-delivery-dogfood.mts
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// Load root .env when present (never log values).
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

import { spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  __resetDeliveryForTests,
  acceptOffer,
  capturePod,
  createDeliveryJob,
  fetchDeliveryJobDurable,
  getDeliveryJob,
  listAssignmentEvents,
  persistDeliveryJobDurable,
  postCourierLocation,
  reconcileCodAfterPod,
  setCourierAvailable,
  startDeliveryDispatchWorkflow,
  startTransit,
  timeoutOffer,
} from "@dial/delivery";
import { pingMapsHealth } from "@dial/adapter-maps";
import {
  describeDeliveryDispatchWorkflow,
  ensureTemporalNamespace,
  pingTemporalConnection,
  startDeliveryDispatch,
} from "@dial/worker-temporal";

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

const temporalAddress = process.env.TEMPORAL_ADDRESS?.trim() || "127.0.0.1:7233";
const temporalNamespace = process.env.TEMPORAL_NAMESPACE?.trim() || "dial";
const internalSecret = process.env.INTERNAL_API_SECRET?.trim() || "";
const supabaseConfigured = Boolean(
  (process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
);

type Evidence = Record<string, unknown>;

function log(msg: string) {
  console.log(msg);
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function waitForTemporal(maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const ping = await pingTemporalConnection({
      ...process.env,
      TEMPORAL_ADDRESS: temporalAddress,
    });
    if (ping.ok) return true;
    await sleep(2000);
  }
  return false;
}

async function ensureDialNamespace(): Promise<{
  ok: boolean;
  namespace: string;
  created?: boolean;
}> {
  const result = await ensureTemporalNamespace({
    ...process.env,
    TEMPORAL_ADDRESS: temporalAddress,
    TEMPORAL_NAMESPACE: temporalNamespace,
  });
  return { ok: result.ok, namespace: result.namespace, created: result.created };
}

let workerProc: ChildProcess | null = null;

async function startWorker(): Promise<boolean> {
  return new Promise((resolve) => {
    workerProc = spawn(
      "pnpm",
      ["--filter", "@dial/worker-temporal", "start"],
      {
        shell: true,
        stdio: ["ignore", "pipe", "pipe"],
        env: {
          ...process.env,
          DIAL_INTEGRATION_MODE: "sandbox",
          TEMPORAL_ADDRESS: temporalAddress,
          TEMPORAL_NAMESPACE: temporalNamespace,
          INTERNAL_API_SECRET: internalSecret || "g5_dogfood_secret",
        },
      },
    );
    let started = false;
    const timer = setTimeout(() => {
      if (!started) resolve(false);
    }, 25_000);
    workerProc.stdout?.on("data", (d) => {
      const text = String(d);
      if (/polling/i.test(text) || /Worker state changed/i.test(text)) {
        started = true;
        clearTimeout(timer);
        resolve(true);
      }
    });
    workerProc.stderr?.on("data", (d) => {
      const text = String(d);
      if (/polling/i.test(text) || /Worker state changed/i.test(text)) {
        started = true;
        clearTimeout(timer);
        resolve(true);
      }
    });
    workerProc.on("error", () => {
      clearTimeout(timer);
      resolve(false);
    });
    setTimeout(() => {
      if (!started && workerProc && !workerProc.killed) {
        started = true;
        clearTimeout(timer);
        resolve(true);
      }
    }, 8000);
  });
}

function stopWorker() {
  if (workerProc && !workerProc.killed) {
    workerProc.kill("SIGTERM");
    workerProc = null;
  }
}

async function runCourierSandboxPath(orderId: string): Promise<{
  jobId: string;
  offerId: string;
  assignmentEvents: number;
  podStatus: string;
  codReconciled: boolean;
  durableStatus: string | null;
}> {
  __resetDeliveryForTests();
  const courierId = "cour_g5_dogfood";
  setCourierAvailable(courierId, true);

  const job = createDeliveryJob({
    orderId,
    from: "supplier_hub_harare",
    to: "customer_avondale",
    codUsdMinor: 25_00n,
  });
  await persistDeliveryJobDurable(job);

  startDeliveryDispatchWorkflow(job.id);
  const offered = getDeliveryJob(job.id)!;
  const offerId = offered.offerId!;
  acceptOffer(offerId, courierId);
  startTransit(job.id);
  postCourierLocation({
    courierId,
    lat: -17.8252,
    lng: 31.0335,
    jobId: job.id,
  });
  capturePod(job.id, {
    photoRef: "g5_pod_photo_ref",
    gpsLat: -17.8252,
    gpsLng: 31.0335,
  });
  const cod = reconcileCodAfterPod(job.id);
  const final = getDeliveryJob(job.id)!;
  await persistDeliveryJobDurable(final);

  let durableStatus: string | null = null;
  if (supabaseConfigured) {
    const row = await fetchDeliveryJobDurable(job.id);
    durableStatus = row?.status ?? null;
  }

  return {
    jobId: job.id,
    offerId,
    assignmentEvents: listAssignmentEvents().filter((e) => e.jobId === job.id)
      .length,
    podStatus: final.status,
    codReconciled: cod.reconciled,
    durableStatus,
  };
}

async function runTimeoutReassignTest(): Promise<boolean> {
  __resetDeliveryForTests();
  const c1 = "cour_g5_timeout_a";
  const c2 = "cour_g5_timeout_b";
  setCourierAvailable(c1, true);
  setCourierAvailable(c2, true);
  const job = createDeliveryJob({
    orderId: `ord_timeout_${Date.now().toString(36)}`,
    from: "hub_a",
    to: "drop_b",
  });
  startDeliveryDispatchWorkflow(job.id);
  const offer1 = getDeliveryJob(job.id)?.offerId;
  if (!offer1) return false;
  timeoutOffer(offer1);
  const after = getDeliveryJob(job.id);
  return after?.status === "offered" || after?.status === "queued_fifo";
}

async function main() {
  const evidence: Evidence = {
    date: new Date().toISOString().slice(0, 10),
    temporalAddress,
    temporalNamespace,
    internalSecretConfigured: Boolean(internalSecret),
    supabaseConfigured,
    not_G5: true,
    checks: {} as Record<string, unknown>,
    residual: [] as string[],
  };

  log("g5-sandbox-delivery-dogfood start");

  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.NOMINATIM_URL;
  delete process.env.OSRM_URL;
  delete process.env.VROOM_URL;
  const mapsClosed = await pingMapsHealth();
  evidence.checks.mapsFailClosed = {
    ok: mapsClosed.ok === false,
    error: mapsClosed.error?.slice(0, 80),
  };

  const temporalUp = await waitForTemporal();
  evidence.checks.temporalConnect = { ok: temporalUp, address: temporalAddress };
  if (!temporalUp) {
    evidence.residual.push(
      "Temporal server not reachable — run docker compose --profile temporal up -d",
    );
    writeEvidence(evidence);
    process.exit(1);
  }

  const nsOk = await ensureDialNamespace();
  evidence.checks.dialNamespace = nsOk;

  if (!internalSecret) {
    process.env.INTERNAL_API_SECRET = "g5_dogfood_secret";
    evidence.residual.push(
      "INTERNAL_API_SECRET unset — using ephemeral dogfood secret",
    );
  }

  const workerUp = await startWorker();
  evidence.checks.workerTemporal = { ok: workerUp };
  if (!workerUp) {
    evidence.residual.push("worker-temporal failed to start");
  }

  await sleep(3000);

  const orderId = `ord_g5_${Date.now().toString(36)}`;
  let workflowId = "";
  let temporalPath = "";
  try {
    process.env.DIAL_INTEGRATION_MODE = "sandbox";
    process.env.TEMPORAL_ADDRESS = temporalAddress;
    process.env.TEMPORAL_NAMESPACE = temporalNamespace;
    const started = await startDeliveryDispatch({
      orderId,
      from: "Harare CBD",
      to: "Avondale",
      courierId: "cour_g5_temporal",
      codUsdMinor: 18_00n,
    });
    workflowId = started.workflowId;
    temporalPath = started.path;
  } catch (e) {
    evidence.checks.temporalWorkflowStart = {
      ok: false,
      error: e instanceof Error ? e.message : "start failed",
    };
  }

  evidence.checks.temporalWorkflowStart = {
    ok: temporalPath === "temporal" && Boolean(workflowId),
    path: temporalPath,
    workflowId,
  };

  await sleep(12000);
  let described = workflowId
    ? await describeDeliveryDispatchWorkflow(workflowId, {
        ...process.env,
        TEMPORAL_ADDRESS: temporalAddress,
        TEMPORAL_NAMESPACE: temporalNamespace,
      })
    : { ok: false, workflowId: "" };
  if (described.status === "RUNNING") {
    await sleep(8000);
    described = await describeDeliveryDispatchWorkflow(workflowId, {
      ...process.env,
      TEMPORAL_ADDRESS: temporalAddress,
      TEMPORAL_NAMESPACE: temporalNamespace,
    });
  }
  evidence.checks.temporalWorkflowHistory = {
    ok: described.ok && (described.historyLength ?? 0) > 0,
    status: described.status,
    historyLength: described.historyLength,
    error: described.error,
  };

  const courier = await runCourierSandboxPath(
    `ord_courier_${Date.now().toString(36)}`,
  );
  evidence.checks.courierSandboxPath = courier;

  const timeoutOk = await runTimeoutReassignTest();
  evidence.checks.timeoutReassign = { ok: timeoutOk };

  const androidOk = await runAndroidUnitTests();
  evidence.checks.deliveryAndroidUnit = androidOk;

  stopWorker();

  if (supabaseConfigured && courier.durableStatus !== "pod_captured") {
    evidence.residual.push(
      `durable delivery_jobs status=${courier.durableStatus} expected pod_captured`,
    );
  }
  if (!supabaseConfigured) {
    evidence.residual.push(
      "SUPABASE_URL/key unset — durable delivery_jobs not verified (anti-stub partial)",
    );
  }
  evidence.residual.push("ENH-013 maps Tier-2 hosting still ops-open — see g5-maps-tier2-probe.json");
  evidence.residual.push(
    "Courier Android device POD PNG — unit tests only; Play internal pending G3 signing",
  );

  evidence.g5Claimed = false;
  evidence.not_G5 = true;
  evidence.summary =
    "Temporal + courier sandbox path exercised; G5 open until device/admin/maps evidence";

  writeEvidence(evidence);
  log("RESULT=not_G5");
  log(`evidence=${join(evidenceDir, "g5-sandbox-delivery-dogfood.json")}`);
}

function writeEvidence(evidence: Evidence) {
  writeFileSync(
    join(evidenceDir, "g5-sandbox-delivery-dogfood.json"),
    JSON.stringify(evidence, null, 2),
  );
}

async function runAndroidUnitTests(): Promise<{ ok: boolean; detail?: string }> {
  return new Promise((resolve) => {
    const proc = spawn(
      process.platform === "win32" ? "gradlew.bat" : "./gradlew",
      [":core:network:test", "--console=plain", "--no-daemon"],
      {
        cwd: join(
          dirname(fileURLToPath(import.meta.url)),
          "..",
          "..",
          "..",
          "apps",
          "delivery-android",
        ),
        shell: true,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let out = "";
    proc.stdout?.on("data", (d) => {
      out += String(d);
    });
    proc.stderr?.on("data", (d) => {
      out += String(d);
    });
    proc.on("close", (code) => {
      resolve({
        ok: code === 0,
        detail: out.slice(-400),
      });
    });
    proc.on("error", (e) => {
      resolve({ ok: false, detail: String(e) });
    });
  });
}

main().catch((e) => {
  stopWorker();
  console.error(e);
  process.exit(1);
});
