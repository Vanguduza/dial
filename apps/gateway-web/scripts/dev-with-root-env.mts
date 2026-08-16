/**
 * Start Next dev with monorepo root `.env` loaded (never logs values).
 * Usage: pnpm --filter @dial/gateway-web exec node --import tsx scripts/dev-with-root-env.mts
 */
import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

const child = spawn("pnpm", ["exec", "next", "dev", "--port", "3000"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
  cwd: join(dirname(fileURLToPath(import.meta.url)), ".."),
});

child.on("exit", (code) => process.exit(code ?? 0));
