#!/usr/bin/env node
/**
 * Idempotent Windows handshake patch for prime-agent 0.7.2 (D-61 harness).
 * PowerShell execFileSync in getProcessStartId blocks the daemon event loop,
 * so worker hello / worker_auth never complete (upstream #748 / #1077).
 * Uses WMIC first (powershell fallback) plus a short TTL cache.
 * No production data path. Does not vendor a Prime fork.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const MARKER = "DIAL_WIN_STARTID_PATCH";
const bundleDir = path.join(
  process.env.APPDATA ?? "",
  "npm",
  "node_modules",
  "prime-agent",
  "dist",
  "bundle",
);

if (!fs.existsSync(bundleDir)) {
  console.error(`prime-agent bundle not found at ${bundleDir}. Install: npm i -g prime-agent@0.7.2`);
  process.exit(1);
}

const oldWinOnly = `function getWindowsProcessStartId(pid, query = runProcessQuery) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return void 0;
  }
  try {
    const startTicks = query("powershell.exe", [
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      \`([System.Diagnostics.Process]::GetProcessById(\${pid})).StartTime.ToUniversalTime().Ticks\`
    ]).trim();
    return /^\\d+$/.test(startTicks) ? \`win:\${startTicks}\` : void 0;
  } catch {
    return void 0;
  }
}`;

const newWinOnly = `function getWindowsProcessStartId(pid, query = runProcessQuery) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return void 0;
  }
  try {
    const wmic = query("wmic", ["process", "where", \`processid=\${pid}\`, "get", "CreationDate", "/value"]);
    const match = String(wmic).match(/CreationDate=(\\S+)/);
    if (match) {
      return \`win:\${match[1]}\`;
    }
  } catch {
  }
  try {
    const startTicks = query("powershell.exe", [
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      \`([System.Diagnostics.Process]::GetProcessById(\${pid})).StartTime.ToUniversalTime().Ticks\`
    ]).trim();
    return /^\\d+$/.test(startTicks) ? \`win:\${startTicks}\` : void 0;
  } catch {
    return void 0;
  }
}
var processStartIdCache = /* @__PURE__ */ new Map();
var PROCESS_START_ID_CACHE_TTL_MS = 5e3;
var ${MARKER} = 1;`;

const oldGet = `function getProcessStartId(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return void 0;
  }
  if (process.platform === "win32") {
    return getWindowsProcessStartId(pid);
  }`;

const newGet = `function getProcessStartId(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return void 0;
  }
  const cachedStartId = processStartIdCache.get(pid);
  if (cachedStartId && Date.now() < cachedStartId.expiresAt) {
    return cachedStartId.value;
  }
  if (process.platform === "win32") {
    const value = getWindowsProcessStartId(pid);
    processStartIdCache.set(pid, { value, expiresAt: Date.now() + PROCESS_START_ID_CACHE_TTL_MS });
    return value;
  }`;

const files = fs.readdirSync(bundleDir).filter((name) => name.startsWith("chunk-") && name.endsWith(".js"));
let patched = 0;
for (const name of files) {
  const filePath = path.join(bundleDir, name);
  const text = fs.readFileSync(filePath, "utf8");
  if (text.includes(MARKER) && text.includes('query("wmic"')) {
    console.log(`Already patched: ${name}`);
    patched += 1;
    continue;
  }
  if (!text.includes(oldWinOnly)) {
    continue;
  }
  let next = text.replace(oldWinOnly, newWinOnly);
  if (!next.includes(oldGet)) {
    console.error(`getProcessStartId prelude missing after Windows fn replace in ${name}`);
    process.exit(1);
  }
  next = next.replace(oldGet, newGet);
  fs.writeFileSync(filePath, next, "utf8");
  console.log(`Patched ${name}`);
  patched += 1;
}

if (patched < 1) {
  console.error("Did not patch any prime-agent bundle chunks. Is prime-agent@0.7.2 installed?");
  process.exit(1);
}

if (process.platform === "win32") {
  const listed = spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-Command",
      "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -match 'prime-agent\\\\dist\\\\bundle\\\\cli\\.js' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; 'stopped ' + $_.ProcessId }",
    ],
    { encoding: "utf8" },
  );
  if (listed.stdout?.trim()) {
    console.log(listed.stdout.trim());
  }
}

console.log("Windows handshake patch applied.");
