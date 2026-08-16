/**
 * Read the deployment-protection bypass secret that `vercel curl` negotiates and
 * hand it to a child command as DIAL_VERCEL_BYPASS. The secret is never printed.
 *
 *   node scripts/vercel-preview-bypass.mjs <deployment-url> -- <command...>
 */
import { spawn, spawnSync } from "node:child_process";
import process from "node:process";

const sep = process.argv.indexOf("--");
if (sep === -1) throw new Error("usage: <deployment-url> -- <command...>");
const base = process.argv[2];
const command = process.argv.slice(sep + 1);
if (!base || command.length === 0) {
  throw new Error("usage: <deployment-url> -- <command...>");
}

const probe = spawnSync(
  "npx",
  ["vercel", "curl", `${base}/api/health/live`, "-v"],
  { encoding: "utf8", shell: process.platform === "win32" },
);

const haystack = `${probe.stdout ?? ""}${probe.stderr ?? ""}`;
const match = haystack.match(/x-vercel-protection-bypass:\s*([A-Za-z0-9]+)/i);
if (!match) {
  console.error("no bypass secret negotiated — deployment may be public");
}

const child = spawn(command[0], command.slice(1), {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, DIAL_VERCEL_BYPASS: match?.[1] ?? "" },
});
child.on("exit", (code) => process.exit(code ?? 0));
